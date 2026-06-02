import * as vscode from 'vscode';
import { RestoreService } from '../services/restoreService';
import { BackupTreeItem } from '../models/backup';
import { BackupTreeItemType } from '../types';

export function registerRestoreFileTo(
  context: vscode.ExtensionContext,
  restoreService: RestoreService,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.restoreFileTo',
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

        const picked = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
          title: `Select destination folder for "${item.label}"`,
          defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
        });
        if (!picked || picked.length === 0) return;

        const destRoot = picked[0].fsPath;
        await restoreService.restoreFileTo(backupMetadata, relativePath, destRoot);

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
