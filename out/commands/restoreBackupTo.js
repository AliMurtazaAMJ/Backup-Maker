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
exports.registerRestoreBackupTo = registerRestoreBackupTo;
const vscode = __importStar(require("vscode"));
function registerRestoreBackupTo(context, restoreService) {
    const disposable = vscode.commands.registerCommand('backupManager.restoreBackupTo', async (item) => {
        try {
            const metadata = item?.metadata;
            if (!metadata) {
                vscode.window.showErrorMessage('No backup selected.');
                return;
            }
            const picked = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                title: `Select destination folder for V-${metadata.version}`,
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
            });
            if (!picked || picked.length === 0)
                return;
            const destRoot = picked[0].fsPath;
            await restoreService.restoreEntireBackupTo(metadata, destRoot);
            vscode.window.showInformationMessage(`V-${metadata.version} restored to ${destRoot}`);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            vscode.window.showErrorMessage(`Restore failed — ${msg}`);
        }
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=restoreBackupTo.js.map