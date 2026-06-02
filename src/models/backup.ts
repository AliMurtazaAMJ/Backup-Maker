import * as vscode from 'vscode';
import { BackupMetadata, BackupTreeItemType } from '../types';

export class BackupTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly itemType: BackupTreeItemType,
    public readonly backupId?: string,
    public readonly relativePath?: string,
    public readonly metadata?: BackupMetadata,
  ) {
    super(label, collapsibleState);

    this.tooltip = this.getTooltip();
    this.description = this.getDescription();

    switch (itemType) {
      case BackupTreeItemType.Project:
        this.contextValue = 'project';
        this.iconPath = new vscode.ThemeIcon('repo');
        break;
      case BackupTreeItemType.Backup:
        this.contextValue = 'backup';
        this.iconPath = new vscode.ThemeIcon('archive');
        break;
      case BackupTreeItemType.Directory:
        this.contextValue = 'directory';
        this.iconPath = new vscode.ThemeIcon('folder');
        break;
      case BackupTreeItemType.File:
        this.contextValue = 'file';
        this.iconPath = new vscode.ThemeIcon('file');
        break;
    }
  }

  private getTooltip(): string {
    if (this.itemType === BackupTreeItemType.Backup && this.metadata) {
      const lines: string[] = [
        `V-${this.metadata.version}`,
        `Created: ${this.metadata.createdAt}`,
        `Files: ${this.metadata.fileCount}`,
        `Size: ${this.formatSize(this.metadata.totalSize)}`,
      ];
      return lines.join('\n');
    }
    return this.label;
  }

  private getDescription(): string {
    if (this.itemType === BackupTreeItemType.Backup && this.metadata) {
      const date = new Date(this.metadata.createdAt);
      const formatted = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const size = this.formatSize(this.metadata.totalSize);
      return `${formatted} — ${this.metadata.fileCount} files, ${size}`;
    }
    return '';
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  }
}
