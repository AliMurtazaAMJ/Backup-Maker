import * as vscode from 'vscode';
import { BackupMetadata } from '../types';

export function validateWorkspace(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return 'No workspace folder is open. Please open a workspace first.';
  }
  return null;
}

export function getWorkspaceRoot(): string | null {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return null;
  }
  return workspaceFolders[0].uri.fsPath;
}

export function validateBackup(backup: BackupMetadata | null | undefined): string | null {
  if (!backup) {
    return 'Backup not found. It may have been deleted or the metadata is corrupted.';
  }
  return null;
}
