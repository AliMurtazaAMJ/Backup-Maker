import * as vscode from 'vscode';
import * as path from 'path';
import * as fsp from 'fs/promises';
import fg from 'fast-glob';
import { IgnoreService } from '../services/ignoreService';

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
}

export class IgnoreTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly filePath: string,
    public readonly isDir: boolean,
  ) {
    super(label, collapsibleState);
    this.tooltip = filePath;
  }
}

export class IgnoreTreeProvider implements vscode.TreeDataProvider<IgnoreTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<IgnoreTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private rootNodes: FileNode[] = [];
  private patterns: string[] = [];
  private workspaceRoot: string = '';
  private initialized = false;
  private loadedDirs = new Set<string>();

  constructor(private ignoreService: IgnoreService) {}

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.scanRoot();
    this._onDidChangeTreeData.fire();
  }

  async refresh(): Promise<void> {
    this.initialized = false;
    this.loadedDirs.clear();
    await this.scanRoot();
    this._onDidChangeTreeData.fire();
  }

  private async scanRoot(): Promise<void> {
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

  private async scanDirectory(node: FileNode): Promise<void> {
    if (this.loadedDirs.has(node.path)) return;
    this.loadedDirs.add(node.path);

    const dirPath = path.join(this.workspaceRoot, node.path);

    const files = await fg('**/*', {
      cwd: dirPath,
      dot: false,
      absolute: false,
      suppressErrors: true,
      followSymbolicLinks: false,
    });

    const subTree = this.buildFlatTree(files);
    const prefixPath = node.path;
    const fixPaths = (nodes: FileNode[]) => {
      for (const n of nodes) {
        n.path = prefixPath + '/' + n.path;
        fixPaths(n.children);
      }
    };
    fixPaths(subTree);

    node.children = subTree;
  }

  private buildFlatTree(files: string[]): FileNode[] {
    const roots: FileNode[] = [];
    const map = new Map<string, FileNode>();

    for (const file of files) {
      const parts = file.split('/');
      let current = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        current = current ? current + '/' + part : part;
        if (!map.has(current)) {
          const isDir = i < parts.length - 1 || files.some(f => f !== current && f.startsWith(current + '/'));
          const node: FileNode = { name: part, path: current, isDirectory: isDir, children: [] };
          map.set(current, node);
          if (i === 0) {
            roots.push(node);
          } else {
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

  private sortNodes(nodes: FileNode[]): void {
    const sortFn = (a: FileNode, b: FileNode) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    };
    nodes.sort(sortFn);
    for (const n of nodes) {
      this.sortNodes(n.children);
    }
  }

  getTreeItem(element: IgnoreTreeItem): vscode.TreeItem {
    const node = this.findNode(element.filePath);
    if (node) {
      return this.toTreeItem(node);
    }
    return element;
  }

  async getChildren(element?: IgnoreTreeItem): Promise<IgnoreTreeItem[]> {
    if (!element) {
      await this.ensureInitialized();
      return this.rootNodes.map(n => this.toTreeItem(n));
    }

    const node = this.findNode(element.filePath);
    if (!node || !node.isDirectory) return [];

    await this.scanDirectory(node);

    return node.children.map(n => this.toTreeItem(n));
  }

  private findNode(filePath: string): FileNode | undefined {
    for (const root of this.rootNodes) {
      const found = this.findInTree(root, filePath);
      if (found) return found;
    }
    return undefined;
  }

  private findInTree(node: FileNode, filePath: string): FileNode | undefined {
    if (node.path === filePath) return node;
    if (node.isDirectory && !this.loadedDirs.has(node.path)) return undefined;
    for (const child of node.children) {
      const found = this.findInTree(child, filePath);
      if (found) return found;
    }
    return undefined;
  }

  private toTreeItem(node: FileNode): IgnoreTreeItem {
    const collapsibleState = node.isDirectory
      ? vscode.TreeItemCollapsibleState.Collapsed
      : vscode.TreeItemCollapsibleState.None;

    const item = new IgnoreTreeItem(
      node.name,
      collapsibleState,
      node.path,
      node.isDirectory,
    );

    item.contextValue = node.isDirectory ? 'ignoreDirectory' : 'ignoreFile';

    if (node.isDirectory) {
      const dirPattern = node.path + '/**';
      if (node.children.length === 0) {
        item.checkboxState = this.patterns.includes(dirPattern)
          ? vscode.TreeItemCheckboxState.Unchecked
          : vscode.TreeItemCheckboxState.Checked;
      } else {
        const allIncluded = node.children.every(c => !this.isIgnoredByPatterns(c.path));
        item.checkboxState = allIncluded
          ? vscode.TreeItemCheckboxState.Checked
          : vscode.TreeItemCheckboxState.Unchecked;
      }
    } else {
      item.checkboxState = this.isIgnoredByPatterns(node.path)
        ? vscode.TreeItemCheckboxState.Unchecked
        : vscode.TreeItemCheckboxState.Checked;
    }

    return item;
  }

  private isIgnoredByPatterns(filePath: string): boolean {
    if (this.patterns.includes('**/*') || this.patterns.includes('**')) return true;
    for (const p of this.patterns) {
      const cleanP = p.replace(/\/\*\*$/, '').replace(/\*\*$/, '');
      if (p.endsWith('**') && filePath.startsWith(cleanP)) return true;
      if (p.startsWith('*.') && filePath.endsWith(p.slice(1))) return true;
      if (filePath === p) return true;
      if (!p.includes('/') && !p.includes('*') && (filePath === p || filePath.endsWith('/' + p))) return true;
    }
    return false;
  }

  async handleCheckboxChange(items: readonly [IgnoreTreeItem, vscode.TreeItemCheckboxState][]): Promise<void> {
    const refreshed = new Set<string>();
    for (const [item, state] of items) {
      const include = state === vscode.TreeItemCheckboxState.Checked;
      if (include) {
        this.removeFromPatterns(item.filePath, item.isDir);
      } else {
        this.addToPatterns(item.filePath, item.isDir);
      }
      const parentPath = item.filePath.includes('/')
        ? item.filePath.slice(0, item.filePath.lastIndexOf('/'))
        : undefined;
      if (parentPath && !refreshed.has(parentPath)) {
        refreshed.add(parentPath);
        this._onDidChangeTreeData.fire(this.toTreeItem(this.findNode(parentPath)!));
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

  private addToPatterns(filePath: string, isDir: boolean): void {
    if (isDir) {
      const pattern = filePath + '/**';
      if (!this.patterns.includes(pattern)) {
        this.patterns.push(pattern);
      }
    } else {
      if (!this.patterns.includes(filePath)) {
        this.patterns.push(filePath);
      }
    }
  }

  private removeFromPatterns(filePath: string, isDir: boolean): void {
    if (isDir) {
      this.patterns = this.patterns.filter(p => p !== filePath + '/**');
    }
    this.patterns = this.patterns.filter(p => p !== filePath);
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    if (ext) {
      this.patterns = this.patterns.filter(p => p !== '*' + ext);
    }
  }

  async toggleAll(): Promise<void> {
    const anyIncluded = this.rootNodes.length > 0 && this.rootNodes.some(n => !this.isIgnoredByPatterns(n.path));
    if (anyIncluded) {
      this.patterns = ['**/*'];
    } else {
      this.patterns = [];
    }
    this.loadedDirs.clear();
    this.rootNodes.forEach(n => n.children = []);
    this._onDidChangeTreeData.fire();
    await this.autoSave();
  }

  async ignoreFile(filePath: string): Promise<void> {
    this.addToPatterns(filePath, false);
    this._onDidChangeTreeData.fire();
    await this.autoSave();
  }

  async ignoreFolder(filePath: string): Promise<void> {
    this.addToPatterns(filePath, true);
    this._onDidChangeTreeData.fire();
    await this.autoSave();
  }

  async ignoreExtension(filePath: string): Promise<void> {
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    if (!ext) return;
    const pattern = '*' + ext;
    if (!this.patterns.includes(pattern)) {
      this.patterns.push(pattern);
    }
    this._onDidChangeTreeData.fire();
    await this.autoSave();
  }

  async removeFromIgnore(filePath: string, isDir: boolean): Promise<void> {
    this.removeFromPatterns(filePath, isDir);
    this._onDidChangeTreeData.fire();
    await this.autoSave();
  }

  private async autoSave(): Promise<void> {
    await this.ignoreService.updatePatterns(this.patterns);
  }
}
