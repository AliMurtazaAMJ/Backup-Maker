export interface BackupMetadata {
  id: string;
  version: number;
  projectName: string;
  workspacePath: string;
  createdAt: string;
  fileCount: number;
  totalSize: number;
  path: string;
}

export interface MetadataStore {
  backups: BackupMetadata[];
}

export interface IgnoreConfig {
  ignore: string[];
}

export enum BackupTreeItemType {
  Project = 'project',
  Backup = 'backup',
  Directory = 'directory',
  File = 'file',
}
