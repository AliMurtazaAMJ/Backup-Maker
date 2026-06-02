import * as vscode from 'vscode';

export interface IBackupSettings {
  maxBackups: number;
}

export function getSettings(): IBackupSettings {
  const config = vscode.workspace.getConfiguration('backupManager');
  return {
    maxBackups: config.get<number>('maxBackups', 50),
  };
}
