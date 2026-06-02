import * as vscode from 'vscode';
import { RestoreService } from '../services/restoreService';
import { BackupTreeItem } from '../models/backup';
import { BackupTreeItemType } from '../types';

export function registerRestoreFolder(
  context: vscode.ExtensionContext,
  restoreService: RestoreService,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.restoreFolder',
    async (item?: BackupTreeItem) => {
      try {
        if (!item || item.itemType !== BackupTreeItemType.Directory) {
          vscode.window.showErrorMessage('Please select a folder to restore.');
          return;
        }

        const backupMetadata = item.metadata;
        const relativePath = item.relativePath;
        if (!backupMetadata || !relativePath) {
          vscode.window.showErrorMessage('Invalid backup item.');
          return;
        }

        await restoreService.restoreFolder(backupMetadata, relativePath);
        vscode.window.showInformationMessage(
          `Folder "${item.label}" restored from V-${backupMetadata.version}.`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        vscode.window.showErrorMessage(`Folder restore failed — ${msg}`);
      }
    },
  );

  context.subscriptions.push(disposable);
}
