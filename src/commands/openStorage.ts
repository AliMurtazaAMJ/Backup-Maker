import * as vscode from 'vscode';
import { StorageService } from '../services/storageService';

export function registerOpenStorage(
  context: vscode.ExtensionContext,
  storageService: StorageService,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.openStorage',
    async () => {
      try {
        const uri = vscode.Uri.file(storageService.storagePath);
        await vscode.commands.executeCommand('revealFileInOS', uri);
      } catch {
        // fallback: open folder
        const uri = vscode.Uri.file(storageService.storagePath);
        await vscode.commands.executeCommand('vscode.openFolder', uri, { forceNewWindow: true });
      }
    },
  );

  context.subscriptions.push(disposable);
}
