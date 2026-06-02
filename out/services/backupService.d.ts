import { BackupMetadata } from '../types';
import { IgnoreService } from './ignoreService';
import { StorageService } from './storageService';
import { MetadataService } from './metadataService';
export declare class BackupService {
    private ignoreService;
    private storageService;
    private metadataService;
    constructor(ignoreService: IgnoreService, storageService: StorageService, metadataService: MetadataService);
    createBackup(): Promise<BackupMetadata>;
}
