import * as vscode from 'vscode';
import { MetadataService } from '../services/metadataService';
export declare function registerDeleteBackup(context: vscode.ExtensionContext, metadataService: MetadataService, refreshFn: () => void): void;
