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
    private allFiles;
    private treeRoots;
    private patterns;
    private workspaceRoot;
    constructor(ignoreService: IgnoreService);
    refresh(): Promise<void>;
    private buildFileTree;
    getTreeItem(element: IgnoreTreeItem): vscode.TreeItem;
    getChildren(element?: IgnoreTreeItem): IgnoreTreeItem[];
    private findNode;
    private findInTree;
    private toTreeItem;
    private isIgnoredByPatterns;
    handleCheckboxChange(items: readonly [IgnoreTreeItem, vscode.TreeItemCheckboxState][]): void;
    private addToPatterns;
    private removeFromPatterns;
    toggleAll(): void;
    ignoreFile(filePath: string): void;
    ignoreFolder(filePath: string): void;
    ignoreExtension(filePath: string): void;
    removeFromIgnore(filePath: string, isDir: boolean): void;
    get hasChanges(): boolean;
    save(): Promise<void>;
}
