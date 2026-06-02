import * as vscode from 'vscode';
import { RestoreService } from '../services/restoreService';
import { BackupTreeItem } from '../models/backup';

export function registerRestoreBackupTo(
  context: vscode.ExtensionContext,
  restoreService: RestoreService,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.restoreBackupTo',
    async (item?: BackupTreeItem) => {
      try {
        const metadata = item?.metadata;
        if (!metadata) {
          vscode.window.showErrorMessage('No backup selected.');
          return;
        }

        const picked = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
          title: `Select destination folder for V-${metadata.version}`,
          defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
        });
        if (!picked || picked.length === 0) return;

        const destRoot = picked[0].fsPath;
        await restoreService.restoreEntireBackupTo(metadata, destRoot);

        vscode.window.showInformationMessage(
          `V-${metadata.version} restored to ${destRoot}`,
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        vscode.window.showErrorMessage(`Restore failed — ${msg}`);
      }
    },
  );

  context.subscriptions.push(disposable);
}
