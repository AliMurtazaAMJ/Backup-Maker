import * as vscode from 'vscode';
import * as path from 'path';
import { BackupMetadata } from '../types';
import { copyFile, copyDirectory, pathExists, ensureDir } from '../utils/fileUtils';
import { normalizePath } from '../utils/pathUtils';

export class RestoreService {
  async restoreEntireBackup(backup: BackupMetadata): Promise<void> {
    const originalPath = backup.workspacePath;

    let destRoot = originalPath;
    if (!(await pathExists(originalPath))) {
      const picked = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        title: `Backup V-${backup.version}: original location not found. Choose a folder to restore to.`,
        defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
      });
      if (!picked || picked.length === 0) {
        throw new Error('Restore cancelled — no destination folder selected.');
      }
      destRoot = picked[0].fsPath;
    }

    const { getFilesRecursive } = await import('../utils/fileUtils');
    const files = await getFilesRecursive(backup.path);

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Restoring V-${backup.version}...`,
        cancellable: true,
      },
      async (progress, token) => {
        const total = files.length;
        for (let i = 0; i < files.length; i++) {
          if (token.isCancellationRequested) break;
          const file = files[i];
          const srcPath = path.join(backup.path, normalizePath(file));
          const destPath = path.join(destRoot, file);
          await copyFile(srcPath, destPath);
          progress.report({ message: `${i + 1}/${total} files`, increment: 100 / total });
        }
      },
    );

    vscode.window.showInformationMessage(
      `Backup V-${backup.version} restored to ${destRoot}`,
    );
  }

  async restoreFile(backup: BackupMetadata, relativePath: string): Promise<void> {
    const srcPath = path.join(backup.path, normalizePath(relativePath));
    const destPath = path.join(backup.workspacePath, relativePath);

    if (!(await pathExists(srcPath))) {
      throw new Error(`File not found in backup: ${relativePath}`);
    }

    await ensureDir(path.dirname(destPath));
    await copyFile(srcPath, destPath);
  }

  async restoreFolder(backup: BackupMetadata, relativePath: string): Promise<void> {
    const srcPath = path.join(backup.path, normalizePath(relativePath));
    const destPath = path.join(backup.workspacePath, relativePath);

    if (!(await pathExists(srcPath))) {
      throw new Error(`Folder not found in backup: ${relativePath}`);
    }

    await ensureDir(destPath);
    await copyDirectory(srcPath, destPath);
  }

  async restoreFileTo(backup: BackupMetadata, relativePath: string, destRoot: string): Promise<void> {
    const srcPath = path.join(backup.path, normalizePath(relativePath));
    const destPath = path.join(destRoot, relativePath);

    if (!(await pathExists(srcPath))) {
      throw new Error(`File not found in backup: ${relativePath}`);
    }

    await ensureDir(path.dirname(destPath));
    await copyFile(srcPath, destPath);
  }

  async restoreFolderTo(backup: BackupMetadata, relativePath: string, destRoot: string): Promise<void> {
    const srcPath = path.join(backup.path, normalizePath(relativePath));
    const destPath = path.join(destRoot, relativePath);

    if (!(await pathExists(srcPath))) {
      throw new Error(`Folder not found in backup: ${relativePath}`);
    }

    await ensureDir(destPath);
    await copyDirectory(srcPath, destPath);
  }

  async restoreEntireBackupTo(backup: BackupMetadata, destRoot: string): Promise<void> {
    const { getFilesRecursive } = await import('../utils/fileUtils');
    const files = await getFilesRecursive(backup.path);

    const total = files.length;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const srcPath = path.join(backup.path, normalizePath(file));
      const destPath = path.join(destRoot, file);
      await copyFile(srcPath, destPath);
    }
  }
}
