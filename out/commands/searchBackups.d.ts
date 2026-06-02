import * as vscode from 'vscode';
import { SearchService } from '../services/searchService';
import { BackupMetadata } from '../types';
export declare function registerSearchBackups(context: vscode.ExtensionContext, searchService: SearchService, onSearchResults: (results: BackupMetadata[] | null) => void): void;
