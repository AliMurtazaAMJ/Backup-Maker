import * as vscode from 'vscode';
import { BackupTreeItem } from '../models/backup';
import { MetadataService } from '../services/metadataService';
export declare class AllBackupsTreeProvider implements vscode.TreeDataProvider<BackupTreeItem> {
    private metadataService;
    private _onDidChangeTreeData;
    readonly onDidChangeTreeData: vscode.Event<void | BackupTreeItem | undefined>;
    constructor(metadataService: MetadataService);
    refresh(): void;
    getTreeItem(element: BackupTreeItem): vscode.TreeItem;
    getChildren(element?: BackupTreeItem): Promise<BackupTreeItem[]>;
    private getRootItems;
    private getBackupItemsForProject;
    private getFileTreeItems;
    private getDirectoryContents;
    private buildTree;
}
