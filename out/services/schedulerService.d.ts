import * as vscode from 'vscode';
import { BackupService } from './backupService';
export declare class SchedulerService implements vscode.Disposable {
    private backupService;
    private timer;
    private disposables;
    constructor(backupService: BackupService);
    start(): void;
    stop(): void;
    dispose(): void;
    isRunning(): boolean;
}
