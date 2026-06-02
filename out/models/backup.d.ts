import * as vscode from 'vscode';
import { BackupMetadata, BackupTreeItemType } from '../types';
export declare class BackupTreeItem extends vscode.TreeItem {
    readonly label: string;
    readonly collapsibleState: vscode.TreeItemCollapsibleState;
    readonly itemType: BackupTreeItemType;
    readonly backupId?: string | undefined;
    readonly relativePath?: string | undefined;
    readonly metadata?: BackupMetadata | undefined;
    constructor(label: string, collapsibleState: vscode.TreeItemCollapsibleState, itemType: BackupTreeItemType, backupId?: string | undefined, relativePath?: string | undefined, metadata?: BackupMetadata | undefined);
    private getTooltip;
    private getDescription;
    private formatSize;
}
