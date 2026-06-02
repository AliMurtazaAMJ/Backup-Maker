"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulerService = void 0;
const vscode = __importStar(require("vscode"));
const settings_1 = require("../models/settings");
class SchedulerService {
    backupService;
    timer = null;
    disposables = [];
    constructor(backupService) {
        this.backupService = backupService;
    }
    start() {
        this.stop();
        const settings = (0, settings_1.getSettings)();
        if (!settings.autoBackup)
            return;
        const intervalMs = settings.autoBackupInterval * 60 * 1000;
        this.timer = setInterval(async () => {
            try {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0)
                    return;
                await this.backupService.createBackup('Scheduled auto-backup');
                vscode.window.showInformationMessage('Backup Manager: Automatic backup created.');
            }
            catch (err) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                vscode.window.showErrorMessage(`Backup Manager: Auto-backup failed — ${msg}`);
            }
        }, intervalMs);
        // Listen for config changes to restart scheduler
        this.disposables.push(vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('backupManager')) {
                this.start();
            }
        }));
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    dispose() {
        this.stop();
        for (const d of this.disposables) {
            d.dispose();
        }
        this.disposables = [];
    }
    isRunning() {
        return this.timer !== null;
    }
}
exports.SchedulerService = SchedulerService;
//# sourceMappingURL=schedulerService.js.map