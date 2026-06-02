import * as vscode from 'vscode';
import { MetadataService } from '../services/metadataService';
import { BackupTreeItem } from '../models/backup';
import { removeDirectory } from '../utils/fileUtils';

export function registerDeleteBackup(
  context: vscode.ExtensionContext,
  metadataService: MetadataService,
  refreshFn: () => void,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.deleteBackup',
    async (item?: BackupTreeItem) => {
      try {
        const metadata = item?.metadata;
        if (!metadata) {
          vscode.window.showErrorMessage('No backup selected.');
          return;
        }

        await vscode.window.withProgress(
          { location: vscode.ProgressLocation.Notification, title: `Deleting V-${metadata.version}...` },
          async () => {
            await removeDirectory(metadata.path);
            await metadataService.remove(metadata.id);
          },
        );

        vscode.window.showInformationMessage(`V-${metadata.version} deleted.`);
        refreshFn();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        vscode.window.showErrorMessage(`Delete failed — ${msg}`);
      }
    },
  );

  context.subscriptions.push(disposable);
}
