import { BackupMetadata } from '../types';
import { StorageService } from './storageService';
export declare class MetadataService {
    private storageService;
    private store;
    private fileListCache;
    constructor(storageService: StorageService);
    load(): Promise<void>;
    save(): Promise<void>;
    getAll(): BackupMetadata[];
    getAllByProject(): Map<string, BackupMetadata[]>;
    getProjects(): string[];
    getById(id: string): BackupMetadata | undefined;
    getFileList(backupId: string): Promise<string[]>;
    invalidateFileListCache(backupId?: string): void;
    add(backup: BackupMetadata): Promise<void>;
    remove(id: string): Promise<void>;
    getNextVersion(projectName: string): number;
}
