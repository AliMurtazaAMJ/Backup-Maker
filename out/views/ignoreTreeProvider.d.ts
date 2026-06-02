import * as vscode from 'vscode';
import { IgnoreService } from '../services/ignoreService';
export declare class IgnoreTreeItem extends vscode.TreeItem {
    readonly label: string;
    readonly filePath: string;
    readonly isDir: boolean;
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, filePath: string, isDir: boolean);
}
export declare class IgnoreTreeProvider implements vscode.TreeDataProvider<IgnoreTreeItem> {
    private ignoreService;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<void | IgnoreTreeItem | undefined>;
    private rootNodes;
    private patterns;
    private workspaceRoot;
    private initialized;
    private loadedDirs;
    constructor(ignoreService: IgnoreService);
    private ensureInitialized;
    refresh(): Promise<void>;
    private scanRoot;
    private scanDirectory;
    private buildFlatTree;
    private sortNodes;
    getTreeItem(element: IgnoreTreeItem): vscode.TreeItem;
    getChildren(element?: IgnoreTreeItem): Promise<IgnoreTreeItem[]>;
    private findNode;
    private findInTree;
    private toTreeItem;
    private isIgnoredByPatterns;
    handleCheckboxChange(items: readonly [IgnoreTreeItem, vscode.TreeItemCheckboxState][]): Promise<void>;
    private addToPatterns;
    private removeFromPatterns;
    toggleAll(): Promise<void>;
    ignoreFile(filePath: string): Promise<void>;
    ignoreFolder(filePath: string): Promise<void>;
    ignoreExtension(filePath: string): Promise<void>;
    removeFromIgnore(filePath: string, isDir: boolean): Promise<void>;
    private autoSave;
}
