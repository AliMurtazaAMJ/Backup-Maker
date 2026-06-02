import * as vscode from 'vscode';

export function registerRefresh(
  context: vscode.ExtensionContext,
  refreshFn: () => void,
): void {
  const disposable = vscode.commands.registerCommand(
    'backupManager.refresh',
    () => {
      refreshFn();
    },
  );

  context.subscriptions.push(disposable);
}
