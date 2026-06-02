import * as vscode from 'vscode';
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

  private allFiles: string[] = [];
  private treeRoots: FileNode[] = [];
  private patterns: string[] = [];
  private workspaceRoot: string = '';
  private initialized = false;

  constructor(private ignoreService: IgnoreService) {}

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;
    await this.refreshInternal();
  }

  async refresh(): Promise<void> {
    this.initialized = false;
    await this.refreshInternal();
  }

  private async refreshInternal(): Promise<void> {
    const ws = vscode.workspace.workspaceFolders?.[0];
    if (!ws) {
      this.allFiles = [];
      this.treeRoots = [];
      this.workspaceRoot = '';
      this._onDidChangeTreeData.fire();
      return;
    }

    this.workspaceRoot = ws.uri.fsPath;
    await this.ignoreService.load(this.workspaceRoot);
    this.patterns = await this.ignoreService.getPatterns();

    this.allFiles = await fg('**/*', {
      cwd: this.workspaceRoot,
      dot: false,
      absolute: false,
      suppressErrors: true,
      followSymbolicLinks: false,
      ignore: ['**/.*'],
    });

    this.treeRoots = this.buildFileTree(this.allFiles);
    this._onDidChangeTreeData.fire();
  }

  private buildFileTree(files: string[]): FileNode[] {
    const roots: FileNode[] = [];
    const map = new Map<string, FileNode>();

    for (const file of files) {
      const parts = file.split('/');
      let current = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        current = current ? current + '/' + part : part;
        if (!map.has(current)) {
          const isDir = i < parts.length - 1 ||
            files.some(f => f !== current && (f.startsWith(current + '/') || f === current));
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

    const sortFn = (a: FileNode, b: FileNode) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    };

    const sortTree = (nodes: FileNode[]) => {
      nodes.sort(sortFn);
      for (const n of nodes) {
        sortTree(n.children);
      }
    };
    sortTree(roots);

    return roots;
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
      return this.treeRoots.map(n => this.toTreeItem(n));
    }
    const node = this.findNode(element.filePath);
    if (!node) return [];
    return node.children.map(n => this.toTreeItem(n));
  }

  private findNode(filePath: string): FileNode | undefined {
    for (const root of this.treeRoots) {
      const found = this.findInTree(root, filePath);
      if (found) return found;
    }
    return undefined;
  }

  private findInTree(node: FileNode, filePath: string): FileNode | undefined {
    if (node.path === filePath) return node;
    for (const child of node.children) {
      const found = this.findInTree(child, filePath);
      if (found) return found;
    }
    return undefined;
  }

  private toTreeItem(node: FileNode): IgnoreTreeItem {
    const collapsibleState = node.isDirectory
      ? (node.children.length > 0 ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
      : vscode.TreeItemCollapsibleState.None;

    const item = new IgnoreTreeItem(
      node.name,
      collapsibleState,
      node.path,
      node.isDirectory,
    );

    item.contextValue = node.isDirectory ? 'ignoreDirectory' : 'ignoreFile';

    if (node.isDirectory) {
      const allIgnored = node.children.length > 0 &&
        node.children.every(c => this.isIgnoredByPatterns(c.path));
      const allIncluded = node.children.length > 0 &&
        node.children.every(c => !this.isIgnoredByPatterns(c.path));
      if (allIncluded) {
        item.checkboxState = vscode.TreeItemCheckboxState.Checked;
      } else {
        item.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
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

  handleCheckboxChange(items: readonly [IgnoreTreeItem, vscode.TreeItemCheckboxState][]): void {
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
        const parent = this.findNode(parentPath);
        if (parent) {
          this._onDidChangeTreeData.fire(this.toTreeItem(parent));
        }
      }
      if (!parentPath && !refreshed.has(item.filePath)) {
        refreshed.add(item.filePath);
        this._onDidChangeTreeData.fire();
      }
    }
    if (refreshed.size === 0) {
      this._onDidChangeTreeData.fire();
    }
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
      const pattern = filePath + '/**';
      this.patterns = this.patterns.filter(p => p !== pattern);
      const dirFiles = this.allFiles.filter(f => f.startsWith(filePath + '/') || f === filePath);
      for (const f of dirFiles) {
        this.patterns = this.patterns.filter(p => p !== f);
        const ext = f.slice(f.lastIndexOf('.'));
        if (ext) {
          this.patterns = this.patterns.filter(p => p !== '*' + ext);
        }
      }
    } else {
      this.patterns = this.patterns.filter(p => p !== filePath);
      const ext = filePath.slice(filePath.lastIndexOf('.'));
      if (ext) {
        this.patterns = this.patterns.filter(p => p !== '*' + ext);
      }
    }
  }

  toggleAll(): void {
    const anyIncluded = this.allFiles.some(f => !this.isIgnoredByPatterns(f));
    if (anyIncluded) {
      this.patterns = ['**/*'];
    } else {
      this.patterns = [];
    }
    this._onDidChangeTreeData.fire();
  }

  ignoreFile(filePath: string): void {
    this.addToPatterns(filePath, false);
    this._onDidChangeTreeData.fire();
  }

  ignoreFolder(filePath: string): void {
    this.addToPatterns(filePath, true);
    this._onDidChangeTreeData.fire();
  }

  ignoreExtension(filePath: string): void {
    const ext = filePath.slice(filePath.lastIndexOf('.'));
    if (!ext) return;
    const pattern = '*' + ext;
    if (!this.patterns.includes(pattern)) {
      this.patterns.push(pattern);
    }
    this._onDidChangeTreeData.fire();
  }

  removeFromIgnore(filePath: string, isDir: boolean): void {
    this.removeFromPatterns(filePath, isDir);
    this._onDidChangeTreeData.fire();
  }

  get hasChanges(): boolean {
    return true;
  }

  async save(): Promise<void> {
    await this.ignoreService.updatePatterns(this.patterns);
  }
}
