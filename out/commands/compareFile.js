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
exports.registerCompareFile = registerCompareFile;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const types_1 = require("../types");
const fileUtils_1 = require("../utils/fileUtils");
function registerCompareFile(context) {
    const disposable = vscode.commands.registerCommand('backupManager.compareFile', async (item) => {
        try {
            if (!item || item.itemType !== types_1.BackupTreeItemType.File) {
                vscode.window.showErrorMessage('Please select a file to compare.');
                return;
            }
            const metadata = item.metadata;
            const relPath = item.relativePath;
            if (!metadata || !relPath) {
                vscode.window.showErrorMessage('Invalid backup item.');
                return;
            }
            const backupUri = vscode.Uri.file(path.join(metadata.path, relPath));
            const currentUri = vscode.Uri.file(path.join(metadata.workspacePath, relPath));
            const currentExists = await (0, fileUtils_1.pathExists)(currentUri.fsPath);
            if (!currentExists) {
                vscode.window.showWarningMessage(`Current file "${relPath}" not found in workspace. Opening backup copy only.`);
                await vscode.commands.executeCommand('vscode.open', backupUri);
                return;
            }
            const title = `${relPath} — V-${metadata.version} ↔ Current`;
            await vscode.commands.executeCommand('vscode.diff', backupUri, currentUri, title);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            vscode.window.showErrorMessage(`Compare failed — ${msg}`);
        }
    });
    context.subscriptions.push(disposable);
}
//# sourceMappingURL=compareFile.js.map