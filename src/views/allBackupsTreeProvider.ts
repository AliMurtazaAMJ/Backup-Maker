import * as vscode from 'vscode';
import * as path from 'path';
import { BackupMetadata, BackupTreeItemType } from '../types';
import { BackupTreeItem } from '../models/backup';
import { MetadataService } from '../services/metadataService';

export class AllBackupsTreeProvider implements vscode.TreeDataProvider<BackupTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<BackupTreeItem | undefined | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private metadataService: MetadataService) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: BackupTreeItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: BackupTreeItem): Promise<BackupTreeItem[]> {
    if (!element) {
      return this.getRootItems();
    }

    if (element.itemType === BackupTreeItemType.Project) {
      return this.getBackupItemsForProject(element.label);
    }

    if (element.itemType === BackupTreeItemType.Backup && element.metadata) {
      return this.getFileTreeItems(element.metadata);
    }

    if (element.itemType === BackupTreeItemType.Directory && element.backupId && element.relativePath) {
      return this.getDirectoryContents(element.backupId, element.relativePath);
    }

    return [];
  }

  private getRootItems(): BackupTreeItem[] {
    const items: BackupTreeItem[] = [];
    const projects = this.metadataService.getProjects();

    for (const projectName of projects) {
      items.push(
        new BackupTreeItem(
          projectName,
          vscode.TreeItemCollapsibleState.Collapsed,
          BackupTreeItemType.Project,
        ),
      );
    }

    return items;
  }

  private getBackupItemsForProject(projectName: string): BackupTreeItem[] {
    const byProject = this.metadataService.getAllByProject();
    const backups = byProject.get(projectName) || [];

    return backups.map((backup) => {
      const label = `V-${backup.version}`;
      return new BackupTreeItem(
        label,
        vscode.TreeItemCollapsibleState.Collapsed,
        BackupTreeItemType.Backup,
        backup.id,
        undefined,
        backup,
      );
    });
  }

  private async getFileTreeItems(backup: BackupMetadata): Promise<BackupTreeItem[]> {
    const { getFilesRecursive } = await import('../utils/fileUtils');
    const files = await getFilesRecursive(backup.path);

    return this.buildTree(backup, files);
  }

  private async getDirectoryContents(backupId: string, relativePath: string): Promise<BackupTreeItem[]> {
    const backup = this.metadataService.getById(backupId);
    if (!backup) return [];

    const { getFilesRecursive } = await import('../utils/fileUtils');
    const allFiles = await getFilesRecursive(backup.path);

    const prefix = relativePath ? relativePath + '/' : '';
    const dirFiles = allFiles.filter((f) => f.startsWith(prefix));

    return this.buildTree(backup, dirFiles, relativePath);
  }

  private buildTree(backup: BackupMetadata, files: string[], parentPath: string = ''): BackupTreeItem[] {
    const prefix = parentPath ? parentPath + '/' : '';
    const dirs = new Set<string>();
    const fileItems: BackupTreeItem[] = [];

    for (const file of files) {
      if (!file.startsWith(prefix)) continue;
      const relative = file.slice(prefix.length);
      const parts = relative.split('/');

      if (parts.length === 1) {
        fileItems.push(
          new BackupTreeItem(
            parts[0],
            vscode.TreeItemCollapsibleState.None,
            BackupTreeItemType.File,
            backup.id,
            file,
            backup,
          ),
        );
      } else {
        dirs.add(parts[0]);
      }
    }

    const dirItems: BackupTreeItem[] = [];
    for (const dirName of dirs) {
      const dirRelativePath = parentPath ? `${parentPath}/${dirName}` : dirName;
      dirItems.push(
        new BackupTreeItem(
          dirName,
          vscode.TreeItemCollapsibleState.Collapsed,
          BackupTreeItemType.Directory,
          backup.id,
          dirRelativePath,
          backup,
        ),
      );
    }

    dirItems.sort((a, b) => a.label.localeCompare(b.label));
    fileItems.sort((a, b) => a.label.localeCompare(b.label));

    return [...dirItems, ...fileItems];
  }
}
