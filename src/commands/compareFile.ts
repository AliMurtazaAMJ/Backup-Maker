import * as vscode from 'vscode';
import * as path from 'path';
import { BackupTreeItem } from '../models/backup';
import { BackupTreeItemType } from '../types';
import { pathExists } from '../utils/fileUtils';

export function registerCompareFile(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.compareFile',
    async (item?: BackupTreeItem) => {
      try {
        if (!item || item.itemType !== BackupTreeItemType.File) {
          vscode.window.showErrorMessage('Please select a file to compare.');
          return;
        }

        const metadata = item.metadata;
        const relPath = item.relativePath;
        if (!metadata || !relPath) {
          vscode.window.showErrorMessage('Invalid backup item.');
          return;
        }

        const backupUri = vscode.Uri.file(path.join(metadata.path, relPath));
        const currentUri = vscode.Uri.file(path.join(metadata.workspacePath, relPath));

        const currentExists = await pathExists(currentUri.fsPath);
        if (!currentExists) {
          vscode.window.showWarningMessage(
            `Current file "${relPath}" not found in workspace. Opening backup copy only.`,
          );
          await vscode.commands.executeCommand('vscode.open', backupUri);
          return;
        }

        const title = `${relPath} — V-${metadata.version} ↔ Current`;
        await vscode.commands.executeCommand('vscode.diff', backupUri, currentUri, title);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        vscode.window.showErrorMessage(`Compare failed — ${msg}`);
      }
    },
  );

  context.subscriptions.push(disposable);
}
