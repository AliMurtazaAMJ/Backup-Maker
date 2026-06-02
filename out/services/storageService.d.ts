import * as vscode from 'vscode';
import { BackupMetadata } from '../types';
export declare class StorageService {
    private _storagePath;
    constructor(context: vscode.ExtensionContext);
    get storagePath(): string;
    initialize(): Promise<void>;
    get metadataPath(): string;
    getBackupDir(projectName: string, version: number): string;
    getProjectDir(projectName: string): string;
    writeMetadata(data: {
        backups: BackupMetadata[];
    }): Promise<void>;
    readMetadata(): Promise<{
        backups: BackupMetadata[];
    } | null>;
}
