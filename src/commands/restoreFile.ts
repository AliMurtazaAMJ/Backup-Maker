import * as vscode from 'vscode';
import { RestoreService } from '../services/restoreService';
import { BackupTreeItem } from '../models/backup';
import { BackupTreeItemType } from '../types';

export function registerRestoreFile(
  context: vscode.ExtensionContext,
  restoreService: RestoreService,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.restoreFile',
    async (item?: BackupTreeItem) => {
      try {
        if (!item || item.itemType !== BackupTreeItemType.File) {
          vscode.window.showErrorMessage('Please select a file to restore.');
          return;
        }

        const backupMetadata = item.metadata;
        const relativePath = item.relativePath;
        if (!backupMetadata || !relativePath) {
          vscode.window.showErrorMessage('Invalid backup item.');
          return;
        }

        await restoreService.restoreFile(backupMetadata, relativePath);
        vscode.window.showInformationMessage(
          `"${item.label}" restored from V-${backupMetadata.version}.`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        vscode.window.showErrorMessage(`File restore failed — ${msg}`);
      }
    },
  );

  context.subscriptions.push(disposable);
}
