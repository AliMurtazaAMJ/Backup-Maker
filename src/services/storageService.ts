import * as vscode from 'vscode';
import * as path from 'path';
import { ensureDir, pathExists } from '../utils/fileUtils';
import { getBackupVersionDir, getMetadataPath, getBackupsDir, getProjectDir } from '../utils/pathUtils';
import { BackupMetadata } from '../types';

export class StorageService {
  private _storagePath: string;

  constructor(context: vscode.ExtensionContext) {
    this._storagePath = context.globalStorageUri.fsPath;
  }

  get storagePath(): string {
    return this._storagePath;
  }

  async initialize(): Promise<void> {
    await ensureDir(this._storagePath);
    await ensureDir(getBackupsDir(this._storagePath));
    const metaPath = this.metadataPath;
    if (!(await pathExists(metaPath))) {
      await this.writeMetadata({ backups: [] });
    }
  }

  get metadataPath(): string {
    return getMetadataPath(this._storagePath);
  }

  getBackupDir(projectName: string, version: number): string {
    return getBackupVersionDir(this._storagePath, projectName, version);
  }

  getProjectDir(projectName: string): string {
    return getProjectDir(this._storagePath, projectName);
  }

  async writeMetadata(data: { backups: BackupMetadata[] }): Promise<void> {
    const { writeJsonFile } = await import('../utils/fileUtils');
    await writeJsonFile(this.metadataPath, data);
  }

  async readMetadata(): Promise<{ backups: BackupMetadata[] } | null> {
    const { readJsonFile } = await import('../utils/fileUtils');
    return readJsonFile<{ backups: BackupMetadata[] }>(this.metadataPath);
  }
}
