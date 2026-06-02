import * as path from 'path';

export function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

export function getRelativePath(absolutePath: string, rootPath: string): string {
  const rel = path.relative(rootPath, absolutePath);
  return normalizePath(rel);
}

export function joinAndNormalize(...segments: string[]): string {
  return normalizePath(path.join(...segments));
}

export function getProjectDir(storagePath: string, projectName: string): string {
  return path.join(storagePath, 'backups', sanitizeProjectName(projectName));
}

export function getBackupVersionDir(storagePath: string, projectName: string, version: number): string {
  return path.join(getProjectDir(storagePath, projectName), `v${version}`);
}

export function getMetadataPath(storagePath: string): string {
  return path.join(storagePath, 'metadata.json');
}

export function getBackupsDir(storagePath: string): string {
  return path.join(storagePath, 'backups');
}

function sanitizeProjectName(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '-').toLowerCase();
}
