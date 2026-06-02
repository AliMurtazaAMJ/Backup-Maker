import { BackupMetadata } from '../types';
import { MetadataService } from './metadataService';
export interface SearchCriteria {
    query: string;
    searchInNotes?: boolean;
    searchInDates?: boolean;
    searchByVersion?: boolean;
    searchByFileName?: boolean;
}
export declare class SearchService {
    private metadataService;
    constructor(metadataService: MetadataService);
    search(criteria: SearchCriteria): BackupMetadata[];
    searchByFileName(backup: BackupMetadata, fileNameQuery: string): string[];
}
