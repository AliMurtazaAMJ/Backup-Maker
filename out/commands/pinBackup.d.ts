import * as vscode from 'vscode';
import { MetadataService } from '../services/metadataService';
export declare function registerPinBackup(context: vscode.ExtensionContext, metadataService: MetadataService, refreshFn: () => void): void;
