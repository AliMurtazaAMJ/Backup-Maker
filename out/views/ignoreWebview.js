"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgnoreWebview = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fast_glob_1 = __importDefault(require("fast-glob"));
class IgnoreWebview {
    panel;
    static currentPanel;
    static async createOrShow(extensionUri, ignoreService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (IgnoreWebview.currentPanel) {
            IgnoreWebview.currentPanel.panel.reveal(column);
            await IgnoreWebview.currentPanel.refresh(ignoreService);
            return;
        }
        const panel = vscode.window.createWebviewPanel('backupManagerIgnoreConfig', 'Configure Ignore Patterns', column || vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [],
        });
        IgnoreWebview.currentPanel = new IgnoreWebview(panel);
        await IgnoreWebview.currentPanel.refresh(ignoreService);
        panel.onDidDispose(() => {
            IgnoreWebview.currentPanel = undefined;
        });
        panel.webview.onDidReceiveMessage(async (message) => {
            const ws = vscode.workspace.workspaceFolders?.[0];
            if (!ws)
                return;
            switch (message.command) {
                case 'save': {
                    await ignoreService.updatePatterns(message.patterns);
                    vscode.window.showInformationMessage('Ignore patterns saved.');
                    break;
                }
                case 'refresh': {
                    await IgnoreWebview.currentPanel?.refresh(ignoreService);
                    break;
                }
            }
        });
    }
    constructor(panel) {
        this.panel = panel;
    }
    async refresh(ignoreService) {
        const ws = vscode.workspace.workspaceFolders?.[0];
        if (!ws) {
            this.panel.webview.html = '<html><body><p>No workspace open.</p></body></html>';
            return;
        }
        await ignoreService.load(ws.uri.fsPath);
        const patterns = await ignoreService.getPatterns();
        const allFiles = await (0, fast_glob_1.default)('**/*', {
            cwd: ws.uri.fsPath,
            dot: false,
            absolute: false,
            suppressErrors: true,
            followSymbolicLinks: false,
        });
        this.panel.title = 'Configure Ignore Patterns';
        const nonce = this.getNonce();
        this.panel.webview.html = this.getHtml(ws.uri.fsPath, allFiles, patterns, nonce);
    }
    getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 64; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    getHtml(workspacePath, allFiles, patterns, nonce) {
        const projectName = path.basename(workspacePath);
        const ignoredSet = new Set();
        for (const file of allFiles) {
            const parts = file.split('/');
            for (let i = 1; i <= parts.length; i++) {
                const prefix = parts.slice(0, i).join('/');
                for (const p of patterns) {
                    const cleanP = p.replace(/\/\*\*$/, '').replace(/\*\*$/, '');
                    if (prefix === cleanP || prefix.startsWith(cleanP + '/')) {
                        ignoredSet.add(file);
                    }
                    if (p.endsWith('**') && file.startsWith(p.replace('/**', '').replace('**', ''))) {
                        ignoredSet.add(file);
                    }
                    if (!p.includes('/') && !p.includes('*')) {
                        if (file === p || file.endsWith('/' + p)) {
                            ignoredSet.add(file);
                        }
                    }
                    if (p.startsWith('*.') && file.endsWith(p.slice(1))) {
                        ignoredSet.add(file);
                    }
                }
            }
        }
        const patternsJson = JSON.stringify(patterns);
        const filesJson = JSON.stringify(allFiles);
        const ignoredJson = JSON.stringify(Array.from(ignoredSet));
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <title>Configure Ignore</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      padding: 0;
      overflow: hidden;
      font-size: 13px;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-editor-inactiveSelectionBackground);
    }
    .toolbar input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid var(--vscode-input-border);
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border-radius: 2px;
      outline: none;
    }
    .toolbar button {
      padding: 4px 12px;
      border: none;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-radius: 2px;
      cursor: pointer;
    }
    .toolbar button:hover { opacity: 0.9; }
    .toolbar .info {
      font-size: 11px;
      opacity: 0.7;
    }
    .tree {
      height: calc(100vh - 48px);
      overflow-y: auto;
      padding: 4px 0;
    }
    .tree-item { display: block; }
    .tree-item.ignored { opacity: 0.5; }
    .tree-item-row {
      display: flex;
      align-items: center;
      padding: 2px 8px 2px 4px;
      cursor: default;
      user-select: none;
      white-space: nowrap;
    }
    .tree-item-row:hover { background: var(--vscode-list-hoverBackground); }
    .tree-item .indent { display: inline-block; }
    .tree-item .checkbox {
      width: 16px; height: 16px;
      display: inline-flex; align-items: center; justify-content: center;
      margin-right: 4px; flex-shrink: 0;
      cursor: pointer;
      border: 1px solid var(--vscode-checkbox-border);
      background: var(--vscode-checkbox-background);
      border-radius: 2px;
      font-size: 10px;
    }
    .tree-item .checkbox.checked {
      background: var(--vscode-checkbox-selectBackground);
      border-color: var(--vscode-focusBorder);
    }
    .tree-item .checkbox.partial {
      background: var(--vscode-checkbox-selectBackground);
      border-color: var(--vscode-focusBorder);
      opacity: 0.6;
    }
    .tree-item .icon { margin-right: 4px; width: 16px; text-align: center; flex-shrink: 0; }
    .tree-item .folder-icon { color: var(--vscode-icon-foreground); }
    .tree-item .file-icon { opacity: 0.7; }
    .tree-item .name { overflow: hidden; text-overflow: ellipsis; }
    .tree-item .ext { font-size: 10px; margin-left: 4px; opacity: 0.5; }
    .tree-item .context-btn {
      margin-left: auto;
      padding: 0 6px;
      cursor: pointer;
      opacity: 0.3;
      font-size: 14px;
      visibility: hidden;
    }
    .tree-item:hover .context-btn { visibility: visible; }
    .tree-item .context-btn:hover { opacity: 1; }
    .context-menu {
      position: fixed;
      background: var(--vscode-menu-background);
      border: 1px solid var(--vscode-menu-border);
      border-radius: 4px;
      padding: 4px 0;
      min-width: 200px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 1000;
    }
    .context-menu .item {
      padding: 6px 16px;
      cursor: pointer;
    }
    .context-menu .item:hover { background: var(--vscode-menu-selectionBackground); color: var(--vscode-menu-selectionForeground); }
    .summary { padding: 8px 12px; border-top: 1px solid var(--vscode-panel-border); font-size: 11px; opacity: 0.7; display: flex; justify-content: space-between; }
    .pattern-tags { padding: 4px 8px; display: flex; flex-wrap: wrap; gap: 4px; border-bottom: 1px solid var(--vscode-panel-border); }
    .pattern-tag {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 8px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 10px;
      font-size: 11px;
    }
    .pattern-tag .remove {
      cursor: pointer; font-size: 12px; opacity: 0.7;
    }
    .pattern-tag .remove:hover { opacity: 1; }
  </style>
</head>
<body>
  <div class="toolbar">
    <input id="search" type="text" placeholder="Filter files..." oninput="filterFiles()">
    <button onclick="toggleAll()">Toggle All</button>
    <button onclick="save()">Save</button>
    <span class="info" id="stats"></span>
  </div>
  <div class="pattern-tags" id="patternTags"></div>
  <div class="tree" id="tree"></div>
  <div class="summary">
    <span id="countLabel"></span>
    <span>Right-click any item for ignore options</span>
  </div>
  <div id="contextMenu" class="context-menu" style="display:none"></div>

  <script nonce="${nonce}">
    const allFiles = ${filesJson};
    const ignoredFiles = new Set(${ignoredJson});
    let patterns = ${patternsJson};
    let searchQuery = '';
    let checkedMap = new Map();
    let contextTarget = null;

    function getExt(name) {
      const i = name.lastIndexOf('.');
      return i > 0 ? name.slice(i) : '';
    }

    function isDir(path) {
      const parts = path.split('/');
      return allFiles.some(f => f.startsWith(path + '/') && f !== path);
    }

    function isIgnored(filePath) {
      if (ignoredFiles.has(filePath)) return true;
      for (const p of patterns) {
        if (p.endsWith('**') && filePath.startsWith(p.replace('/**', '').replace('**', ''))) return true;
        if (p.startsWith('*.') && filePath.endsWith(p.slice(1))) return true;
        if (filePath === p) return true;
      }
      return false;
    }

    function buildTree() {
      const files = searchQuery
        ? allFiles.filter(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
        : allFiles;

      const tree = {};
      for (const file of files) {
        const parts = file.split('/');
        let node = tree;
        for (const part of parts) {
          if (!node[part]) node[part] = {};
          node = node[part];
        }
        node._file = file;
      }

      return tree;
    }

    function renderTree() {
      const tree = buildTree();
      const container = document.getElementById('tree');
      container.innerHTML = '';
      const sorted = Object.keys(tree).sort();
      for (const key of sorted) {
        renderNode(key, tree[key], container, 0, '');
      }
      updateStats();
      renderPatternTags();
    }

    function renderNode(name, node, parent, depth, prefix) {
      const isLeaf = node._file !== undefined;
      const fullPath = node._file || (prefix ? prefix + '/' + name : name);
      const isDirectory = !isLeaf;
      const ignored = isDirectory
        ? allFiles.filter(f => f.startsWith(fullPath + '/') || f === fullPath).every(f => isIgnored(f))
        : isIgnored(fullPath);

      const div = document.createElement('div');
      div.className = 'tree-item' + (ignored ? ' ignored' : '');

      const row = document.createElement('div');
      row.className = 'tree-item-row';
      row.style.paddingLeft = (depth * 16 + 4) + 'px';

      const cb = document.createElement('span');
      cb.className = 'checkbox' + (ignored ? '' : ' checked');
      cb.textContent = ignored ? '' : '✓';
      cb.onclick = (e) => {
        e.stopPropagation();
        toggleFile(fullPath, isDirectory);
      };
      row.appendChild(cb);

      const icon = document.createElement('span');
      icon.className = 'icon';
      if (isDirectory) {
        icon.textContent = depth === 0 ? '📁' : '📂';
        icon.className += ' folder-icon';
      } else {
        icon.textContent = '📄';
        icon.className += ' file-icon';
      }
      row.appendChild(icon);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'name';
      nameSpan.textContent = name;
      row.appendChild(nameSpan);

      if (!isDirectory) {
        const ext = document.createElement('span');
        ext.className = 'ext';
        ext.textContent = getExt(name);
        row.appendChild(ext);
      }

      div.appendChild(row);

      if (isDirectory) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'tree-children';
        const children = Object.keys(node).filter(k => k !== '_file').sort();
        for (const child of children) {
          renderNode(child, node[child], childrenContainer, depth + 1, fullPath);
        }
        if (children.length > 0) {
          div.appendChild(childrenContainer);
        }
      }

      div.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        showContextMenu(e.clientX, e.clientY, fullPath, isDirectory);
      });

      parent.appendChild(div);
    }

    function toggleFile(filePath, isDir) {
      if (isDir) {
        const files = allFiles.filter(f => f.startsWith(filePath + '/') || f === filePath);
        const allIgnored = files.every(f => checkedMap.get(f) === false);
        const newState = allIgnored;
        for (const f of files) {
          checkedMap.set(f, newState);
        }
      } else {
        const current = checkedMap.get(filePath);
        checkedMap.set(filePath, current === undefined ? true : !current);
      }
      renderTree();
    }

    function toggleAll() {
      const allChecked = allFiles.every(f => checkedMap.get(f) !== false);
      for (const f of allFiles) {
        checkedMap.set(f, !allChecked);
      }
      renderTree();
    }

    function updateStats() {
      const ignored = allFiles.filter(f => isIgnored(f)).length;
      document.getElementById('stats').textContent = allFiles.length + ' files';
      document.getElementById('countLabel').textContent = (allFiles.length - ignored) + ' included, ' + ignored + ' ignored';
    }

    function renderPatternTags() {
      const container = document.getElementById('patternTags');
      container.innerHTML = '';
      for (const p of patterns) {
        const tag = document.createElement('span');
        tag.className = 'pattern-tag';
        tag.innerHTML = '<span>' + p + '</span><span class="remove" onclick="removePattern(\'' + p.replace(/'/g, "\\'") + '\')">×</span>';
        container.appendChild(tag);
      }
    }

    function removePattern(pattern) {
      patterns = patterns.filter(p => p !== pattern);
      renderTree();
    }

    function showContextMenu(x, y, target, isDir) {
      const menu = document.getElementById('contextMenu');
      menu.style.display = 'block';
      menu.style.left = x + 'px';
      menu.style.top = y + 'px';

      const items = [];
      if (isDir) {
        items.push({ label: 'Ignore this folder', action: () => addPattern(target + '/**') });
        items.push({ label: 'Ignore folder (all subfolders)', action: () => addPattern('**/' + target.split('/').pop() + '/**') });
      } else {
        items.push({ label: 'Ignore this file', action: () => addPattern(target) });
        const ext = getExt(target);
        if (ext) {
          items.push({ label: 'Ignore all *' + ext + ' files', action: () => addPattern('*' + ext) });
        }
      }
      items.push({ label: 'Remove from ignore', action: () => removePatternByFile(target, isDir) });

      menu.innerHTML = '';
      for (const item of items) {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = item.label;
        div.onclick = () => { item.action(); menu.style.display = 'none'; };
        menu.appendChild(div);
      }
    }

    document.addEventListener('click', () => {
      document.getElementById('contextMenu').style.display = 'none';
    });

    function addPattern(pattern) {
      if (!patterns.includes(pattern)) {
        patterns.push(pattern);
      }
      renderTree();
    }

    function removePatternByFile(filePath, isDir) {
      if (isDir) {
        const dirPattern = filePath + '/**';
        patterns = patterns.filter(p => p !== dirPattern && p !== filePath);
        const dirName = filePath.split('/').pop();
        patterns = patterns.filter(p => p !== '**/' + dirName + '/**');
      } else {
        patterns = patterns.filter(p => p !== filePath);
        const ext = getExt(filePath);
        if (ext) {
          patterns = patterns.filter(p => p !== '*' + ext);
        }
      }
      renderTree();
    }

    function filterFiles() {
      searchQuery = document.getElementById('search').value;
      renderTree();
    }

    function save() {
      const vscode = acquireVsCodeApi();
      vscode.postMessage({ command: 'save', patterns: patterns });
    }

    renderTree();
  </script>
</body>
</html>`;
    }
}
exports.IgnoreWebview = IgnoreWebview;
//# sourceMappingURL=ignoreWebview.js.map