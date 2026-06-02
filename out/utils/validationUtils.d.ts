import { BackupMetadata } from '../types';
export declare function validateWorkspace(): string | null;
export declare function getWorkspaceRoot(): string | null;
export declare function validateBackup(backup: BackupMetadata | null | undefined): string | null;
