import * as vscode from 'vscode';
import * as path from 'path';
import { IgnoreService } from './services/ignoreService';
import { StorageService } from './services/storageService';
import { MetadataService } from './services/metadataService';
import { BackupService } from './services/backupService';
import { RestoreService } from './services/restoreService';
import { BackupTreeProvider } from './views/backupTreeProvider';
import { AllBackupsTreeProvider } from './views/allBackupsTreeProvider';
import { IgnoreTreeProvider, IgnoreTreeItem } from './views/ignoreTreeProvider';
import { BackupTreeItemType } from './types';
import { registerCreateBackup } from './commands/createBackup';
import { registerRestoreBackup } from './commands/restoreBackup';
import { registerRestoreFile } from './commands/restoreFile';
import { registerRestoreFolder } from './commands/restoreFolder';
import { registerRestoreBackupTo } from './commands/restoreBackupTo';
import { registerRestoreFileTo } from './commands/restoreFileTo';
import { registerRestoreFolderTo } from './commands/restoreFolderTo';
import { registerDeleteBackup } from './commands/deleteBackup';
import { registerRefresh } from './commands/refresh';
import { registerOpenStorage } from './commands/openStorage';
import { registerCompareFile } from './commands/compareFile';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const ignoreService = new IgnoreService();
  const storageService = new StorageService(context);
  const metadataService = new MetadataService(storageService);
  const backupService = new BackupService(ignoreService, storageService, metadataService);
  const restoreService = new RestoreService();

  await storageService.initialize();
  await metadataService.load();

  // --- Backup Explorer (current project only) ---

  const treeProvider = new BackupTreeProvider(metadataService);
  const treeView = vscode.window.createTreeView('backupManager.explorer', {
    treeDataProvider: treeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(treeView);

  treeView.onDidChangeSelection((e) => {
    const item = e.selection[0];
    if (!item || item.itemType !== BackupTreeItemType.File) return;
    const metadata = item.metadata;
    const relPath = item.relativePath;
    if (!metadata || !relPath) return;
    const fullPath = path.join(metadata.path, relPath);
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
  });

  // --- All Backups (all projects, export-to-destination) ---

  const allBackupsProvider = new AllBackupsTreeProvider(metadataService);
  const allBackupsView = vscode.window.createTreeView('backupManager.allBackups', {
    treeDataProvider: allBackupsProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(allBackupsView);

  allBackupsView.onDidChangeSelection((e) => {
    const item = e.selection[0];
    if (!item || item.itemType !== BackupTreeItemType.File) return;
    const metadata = item.metadata;
    const relPath = item.relativePath;
    if (!metadata || !relPath) return;
    const fullPath = path.join(metadata.path, relPath);
    vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
  });

  // --- Commands (registered after all providers exist) ---

  const refreshTree = () => treeProvider.refresh();

  registerCreateBackup(context, backupService, () => {
    metadataService.invalidateFileListCache();
    treeProvider.refresh();
    allBackupsProvider.refresh();
  });
  registerRestoreBackup(context, restoreService);
  registerRestoreFile(context, restoreService);
  registerRestoreFolder(context, restoreService);
  registerRestoreBackupTo(context, restoreService);
  registerRestoreFileTo(context, restoreService);
  registerRestoreFolderTo(context, restoreService);
  registerDeleteBackup(context, metadataService, () => {
    treeProvider.refresh();
    allBackupsProvider.refresh();
  });
  registerRefresh(context, refreshTree);
  registerOpenStorage(context, storageService);
  registerCompareFile(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.refreshAllBackups', () => {
      allBackupsProvider.refresh();
    }),
  );

  // --- Auto-refresh via FileSystemWatcher (debounced) ---

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const debouncedRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      treeProvider.refresh();
      allBackupsProvider.refresh();
    }, 300);
  };

  const backupWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(storageService.storagePath, '**/*'),
  );
  backupWatcher.onDidChange(debouncedRefresh);
  backupWatcher.onDidCreate(debouncedRefresh);
  backupWatcher.onDidDelete(debouncedRefresh);
  context.subscriptions.push(backupWatcher);

  // --- Ignore Patterns Tree View ---

  const ignoreTreeProvider = new IgnoreTreeProvider(ignoreService);
  const ignoreTreeView = vscode.window.createTreeView('backupManager.ignoreExplorer', {
    treeDataProvider: ignoreTreeProvider,
    showCollapseAll: true,
  });
  context.subscriptions.push(ignoreTreeView);

  ignoreTreeView.onDidChangeCheckboxState((e) => {
    ignoreTreeProvider.handleCheckboxChange(e.items);
  });

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.refreshIgnore', () => {
      ignoreTreeProvider.refresh();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.saveIgnorePatterns', () => {
      // patterns are auto-saved on every toggle
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.toggleIgnoreAll', () => {
      ignoreTreeProvider.toggleAll();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.ignoreFile', (item: IgnoreTreeItem) => {
      if (!item) return;
      ignoreTreeProvider.ignoreFile(item.filePath);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.ignoreFolder', (item: IgnoreTreeItem) => {
      if (!item) return;
      ignoreTreeProvider.ignoreFolder(item.filePath);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.ignoreExtension', (item: IgnoreTreeItem) => {
      if (!item) return;
      ignoreTreeProvider.ignoreExtension(item.filePath);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('backupManager.removeFromIgnore', (item: IgnoreTreeItem) => {
      if (!item) return;
      ignoreTreeProvider.removeFromIgnore(item.filePath, item.isDir);
    }),
  );

  // --- Status Bar ---

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'backupManager.createBackup';
  statusBarItem.text = '$(archive) Create Backup';
  statusBarItem.tooltip = 'Create a backup of the current workspace';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate(): void {
}
