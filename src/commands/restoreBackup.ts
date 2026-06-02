import * as vscode from 'vscode';
import { RestoreService } from '../services/restoreService';
import { BackupTreeItem } from '../models/backup';

export function registerRestoreBackup(
  context: vscode.ExtensionContext,
  restoreService: RestoreService,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.restoreBackup',
    async (item?: BackupTreeItem) => {
      try {
        const metadata = item?.metadata;
        if (!metadata) {
          vscode.window.showErrorMessage('No backup selected.');
          return;
        }

        await restoreService.restoreEntireBackup(metadata);
        vscode.window.showInformationMessage(
          `V-${metadata.version} restored successfully.`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        vscode.window.showErrorMessage(`Restore failed — ${msg}`);
      }
    },
  );

  context.subscriptions.push(disposable);
}
