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
exports.registerCreateBackup = registerCreateBackup;
const vscode = __importStar(require("vscode"));
function registerCreateBackup(context, backupService, onAfterBackup) {
    const disposable = vscode.commands.registerCommand('backupManager.createBackup', async () => {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Creating backup...',
                cancellable: false,
            }, async () => {
                const backup = await backupService.createBackup();
                const sizeStr = backup.totalSize > 1024 * 1024
                    ? `${(backup.totalSize / (1024 * 1024)).toFixed(1)} MB`
                    : `${(backup.totalSize / 1024).toFixed(1)} KB`;
                vscode.window.showInformationMessage(`V-${backup.version} created — ${backup.fileCount} files, ${sizeStr}`);
            });
            onAfterBackup?.();
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            vscode.window.showErrorMessage(`Backup Manager: Failed to create backup — ${msg}`);
        }
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=createBackup.js.map