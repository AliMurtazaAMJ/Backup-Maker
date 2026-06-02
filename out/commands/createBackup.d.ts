import * as vscode from 'vscode';
import { BackupService } from '../services/backupService';
export declare function registerCreateBackup(context: vscode.ExtensionContext, backupService: BackupService, onAfterBackup?: () => void): void;
