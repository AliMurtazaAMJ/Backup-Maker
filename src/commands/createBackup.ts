import * as vscode from 'vscode';
import { BackupService } from '../services/backupService';

export function registerCreateBackup(
  context: vscode.ExtensionContext,
  backupService: BackupService,
  onAfterBackup?: () => void,
): void {
  const disposable = vscode.commands.registerCommand('backupManager.createBackup', async () => {
    try {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Creating backup...',
          cancellable: false,
        },
        async () => {
          const backup = await backupService.createBackup();
          const sizeStr = backup.totalSize > 1024 * 1024
            ? `${(backup.totalSize / (1024 * 1024)).toFixed(1)} MB`
            : `${(backup.totalSize / 1024).toFixed(1)} KB`;
          vscode.window.showInformationMessage(
            `V-${backup.version} created — ${backup.fileCount} files, ${sizeStr}`,
          );
        },
      );
      onAfterBackup?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      vscode.window.showErrorMessage(`Backup Manager: Failed to create backup — ${msg}`);
    }
  });

  context.subscriptions.push(disposable);
}
