import * as vscode from 'vscode';
import * as path from 'path';
import * as crypto from 'crypto';
import fg from 'fast-glob';
import { BackupMetadata } from '../types';
import { IgnoreService } from './ignoreService';
import { StorageService } from './storageService';
import { MetadataService } from './metadataService';
import { copyFile, ensureDir, getDirectorySize } from '../utils/fileUtils';
import { normalizePath } from '../utils/pathUtils';
import { getWorkspaceRoot } from '../utils/validationUtils';

export class BackupService {
  constructor(
    private ignoreService: IgnoreService,
    private storageService: StorageService,
    private metadataService: MetadataService,
  ) {}

  async createBackup(): Promise<BackupMetadata> {
    const workspaceRoot = getWorkspaceRoot();
    if (!workspaceRoot) {
      throw new Error('No workspace folder is open.');
    }

    const projectName = path.basename(workspaceRoot);
    await this.ignoreService.load(workspaceRoot);

    const version = this.metadataService.getNextVersion(projectName);
    const backupDir = this.storageService.getBackupDir(projectName, version);
    await ensureDir(backupDir);

    const id = crypto.randomUUID();

    const rawFiles = await fg('**/*', {
      cwd: workspaceRoot,
      dot: false,
      absolute: false,
      markDirectories: false,
      suppressErrors: true,
      followSymbolicLinks: false,
    });

    const filteredFiles = this.ignoreService.filterFiles(rawFiles);
    let fileCount = 0;

    for (const file of filteredFiles) {
      const srcPath = path.join(workspaceRoot, file);
      const destPath = path.join(backupDir, normalizePath(file));
      try {
        await copyFile(srcPath, destPath);
        fileCount++;
      } catch {
        // skip files that can't be copied
      }
    }

    const totalSize = await getDirectorySize(backupDir);

    const backup: BackupMetadata = {
      id,
      version,
      projectName,
      workspacePath: workspaceRoot,
      createdAt: new Date().toISOString(),
      fileCount,
      totalSize,
      path: backupDir,
    };

    await this.metadataService.add(backup);
    return backup;
  }
}
