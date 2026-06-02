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
exports.IgnoreTreeProvider = exports.IgnoreTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fsp = __importStar(require("fs/promises"));
const fast_glob_1 = __importDefault(require("fast-glob"));
class IgnoreTreeItem extends vscode.TreeItem {
    label;
    filePath;
    isDir;
    constructor(label, collapsibleState, filePath, isDir) {
        super(label, collapsibleState);
        this.label = label;
        this.filePath = filePath;
        this.isDir = isDir;
        this.tooltip = filePath;
    }
}
exports.IgnoreTreeItem = IgnoreTreeItem;
class IgnoreTreeProvider {
    ignoreService;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    rootNodes = [];
    patterns = [];
    workspaceRoot = '';
    initialized = false;
    loadedDirs = new Set();
    constructor(ignoreService) {
        this.ignoreService = ignoreService;
    }
    async ensureInitialized() {
        if (this.initialized)
            return;
        this.initialized = true;
        await this.scanRoot();
        this._onDidChangeTreeData.fire();
    }
    async refresh() {
        this.initialized = false;
        this.loadedDirs.clear();
        await this.scanRoot();
        this._onDidChangeTreeData.fire();
    }
    async scanRoot() {
        const ws = vscode.workspace.workspaceFolders?.[0];
        if (!ws) {
            this.rootNodes = [];
            this.workspaceRoot = '';
            this.patterns = [];
            return;
        }
        this.workspaceRoot = ws.uri.fsPath;
        await this.ignoreService.load(this.workspaceRoot);
        this.patterns = await this.ignoreService.getPatterns();
        const entries = await fsp.readdir(this.workspaceRoot, { withFileTypes: true });
        this.rootNodes = [];
        for (const entry of entries) {
            this.rootNodes.push({
                name: entry.name,
                path: entry.name,
                isDirectory: entry.isDirectory(),
                children: [],
            });
        }
        this.sortNodes(this.rootNodes);
    }
    async scanDirectory(node) {
        if (this.loadedDirs.has(node.path))
            return;
        this.loadedDirs.add(node.path);
        const dirPath = path.join(this.workspaceRoot, node.path);
        const files = await (0, fast_glob_1.default)('**/*', {
            cwd: dirPath,
            dot: false,
            absolute: false,
            suppressErrors: true,
            followSymbolicLinks: false,
        });
        const subTree = this.buildFlatTree(files);
        const prefixPath = node.path;
        const fixPaths = (nodes) => {
            for (const n of nodes) {
                n.path = prefixPath + '/' + n.path;
                fixPaths(n.children);
            }
        };
        fixPaths(subTree);
        node.children = subTree;
    }
    buildFlatTree(files) {
        const roots = [];
        const map = new Map();
        for (const file of files) {
            const parts = file.split('/');
            let current = '';
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                current = current ? current + '/' + part : part;
                if (!map.has(current)) {
                    const isDir = i < parts.length - 1 || files.some(f => f !== current && f.startsWith(current + '/'));
                    const node = { name: part, path: current, isDirectory: isDir, children: [] };
                    map.set(current, node);
                    if (i === 0) {
                        roots.push(node);
                    }
                    else {
                        const parentPath = parts.slice(0, i).join('/');
                        const parent = map.get(parentPath);
                        if (parent) {
                            parent.children.push(node);
                        }
                    }
                }
            }
        }
        this.sortNodes(roots);
        return roots;
    }
    sortNodes(nodes) {
        const sortFn = (a, b) => {
            if (a.isDirectory && !b.isDirectory)
                return -1;
            if (!a.isDirectory && b.isDirectory)
                return 1;
            return a.name.localeCompare(b.name);
        };
        nodes.sort(sortFn);
        for (const n of nodes) {
            this.sortNodes(n.children);
        }
    }
    getTreeItem(element) {
        const node = this.findNode(element.filePath);
        if (node) {
            return this.toTreeItem(node);
        }
        return element;
    }
    async getChildren(element) {
        if (!element) {
            await this.ensureInitialized();
            return this.rootNodes.map(n => this.toTreeItem(n));
        }
        const node = this.findNode(element.filePath);
        if (!node || !node.isDirectory)
            return [];
        await this.scanDirectory(node);
        return node.children.map(n => this.toTreeItem(n));
    }
    findNode(filePath) {
        for (const root of this.rootNodes) {
            const found = this.findInTree(root, filePath);
            if (found)
                return found;
        }
        return undefined;
    }
    findInTree(node, filePath) {
        if (node.path === filePath)
            return node;
        if (node.isDirectory && !this.loadedDirs.has(node.path))
            return undefined;
        for (const child of node.children) {
            const found = this.findInTree(child, filePath);
            if (found)
                return found;
        }
        return undefined;
    }
    toTreeItem(node) {
        const collapsibleState = node.isDirectory
            ? vscode.TreeItemCollapsibleState.Collapsed
            : vscode.TreeItemCollapsibleState.None;
        const item = new IgnoreTreeItem(node.name, collapsibleState, node.path, node.isDirectory);
        item.contextValue = node.isDirectory ? 'ignoreDirectory' : 'ignoreFile';
        if (node.isDirectory) {
            const dirPattern = node.path + '/**';
            if (node.children.length === 0) {
                item.checkboxState = this.patterns.includes(dirPattern)
                    ? vscode.TreeItemCheckboxState.Unchecked
                    : vscode.TreeItemCheckboxState.Checked;
            }
            else {
                const allIncluded = node.children.every(c => !this.isIgnoredByPatterns(c.path));
                item.checkboxState = allIncluded
                    ? vscode.TreeItemCheckboxState.Checked
                    : vscode.TreeItemCheckboxState.Unchecked;
            }
        }
        else {
            item.checkboxState = this.isIgnoredByPatterns(node.path)
                ? vscode.TreeItemCheckboxState.Unchecked
                : vscode.TreeItemCheckboxState.Checked;
        }
        return item;
    }
    isIgnoredByPatterns(filePath) {
        if (this.patterns.includes('**/*') || this.patterns.includes('**'))
            return true;
        for (const p of this.patterns) {
            const cleanP = p.replace(/\/\*\*$/, '').replace(/\*\*$/, '');
            if (p.endsWith('**') && filePath.startsWith(cleanP))
                return true;
            if (p.startsWith('*.') && filePath.endsWith(p.slice(1)))
                return true;
            if (filePath === p)
                return true;
            if (!p.includes('/') && !p.includes('*') && (filePath === p || filePath.endsWith('/' + p)))
                return true;
        }
        return false;
    }
    async handleCheckboxChange(items) {
        const refreshed = new Set();
        for (const [item, state] of items) {
            const include = state === vscode.TreeItemCheckboxState.Checked;
            if (include) {
                this.removeFromPatterns(item.filePath, item.isDir);
            }
            else {
                this.addToPatterns(item.filePath, item.isDir);
            }
            const parentPath = item.filePath.includes('/')
                ? item.filePath.slice(0, item.filePath.lastIndexOf('/'))
                : undefined;
            if (parentPath && !refreshed.has(parentPath)) {
                refreshed.add(parentPath);
                this._onDidChangeTreeData.fire(this.toTreeItem(this.findNode(parentPath)));
            }
            if (!parentPath && !refreshed.has(item.filePath)) {
                refreshed.add(item.filePath);
                this._onDidChangeTreeData.fire();
            }
        }
        if (refreshed.size === 0) {
            this._onDidChangeTreeData.fire();
        }
        await this.autoSave();
    }
    addToPatterns(filePath, isDir) {
        if (isDir) {
            const pattern = filePath + '/**';
            if (!this.patterns.includes(pattern)) {
                this.patterns.push(pattern);
            }
        }
        else {
            if (!this.patterns.includes(filePath)) {
                this.patterns.push(filePath);
            }
        }
    }
    removeFromPatterns(filePath, isDir) {
        if (isDir) {
            this.patterns = this.patterns.filter(p => p !== filePath + '/**');
        }
        this.patterns = this.patterns.filter(p => p !== filePath);
        const ext = filePath.slice(filePath.lastIndexOf('.'));
        if (ext) {
            this.patterns = this.patterns.filter(p => p !== '*' + ext);
        }
    }
    async toggleAll() {
        const anyIncluded = this.rootNodes.length > 0 && this.rootNodes.some(n => !this.isIgnoredByPatterns(n.path));
        if (anyIncluded) {
            this.patterns = ['**/*'];
        }
        else {
            this.patterns = [];
        }
        this.loadedDirs.clear();
        this.rootNodes.forEach(n => n.children = []);
        this._onDidChangeTreeData.fire();
        await this.autoSave();
    }
    async ignoreFile(filePath) {
        this.addToPatterns(filePath, false);
        this._onDidChangeTreeData.fire();
        await this.autoSave();
    }
    async ignoreFolder(filePath) {
        this.addToPatterns(filePath, true);
        this._onDidChangeTreeData.fire();
        await this.autoSave();
    }
    async ignoreExtension(filePath) {
        const ext = filePath.slice(filePath.lastIndexOf('.'));
        if (!ext)
            return;
        const pattern = '*' + ext;
        if (!this.patterns.includes(pattern)) {
            this.patterns.push(pattern);
        }
        this._onDidChangeTreeData.fire();
        await this.autoSave();
    }
    async removeFromIgnore(filePath, isDir) {
        this.removeFromPatterns(filePath, isDir);
        this._onDidChangeTreeData.fire();
        await this.autoSave();
    }
    async autoSave() {
        await this.ignoreService.updatePatterns(this.patterns);
    }
}
exports.IgnoreTreeProvider = IgnoreTreeProvider;
//# sourceMappingURL=ignoreTreeProvider.js.map