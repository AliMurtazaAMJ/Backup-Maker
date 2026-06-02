import { BackupMetadata } from '../types';
export declare class RestoreService {
    restoreEntireBackup(backup: BackupMetadata): Promise<void>;
    restoreFile(backup: BackupMetadata, relativePath: string): Promise<void>;
    restoreFolder(backup: BackupMetadata, relativePath: string): Promise<void>;
    restoreFileTo(backup: BackupMetadata, relativePath: string, destRoot: string): Promise<void>;
    restoreFolderTo(backup: BackupMetadata, relativePath: string, destRoot: string): Promise<void>;
    restoreEntireBackupTo(backup: BackupMetadata, destRoot: string): Promise<void>;
}
