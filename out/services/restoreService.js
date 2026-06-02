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
exports.RestoreService = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fileUtils_1 = require("../utils/fileUtils");
const pathUtils_1 = require("../utils/pathUtils");
class RestoreService {
    async restoreEntireBackup(backup) {
        const originalPath = backup.workspacePath;
        let destRoot = originalPath;
        if (!(await (0, fileUtils_1.pathExists)(originalPath))) {
            const picked = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                title: `Backup V-${backup.version}: original location not found. Choose a folder to restore to.`,
                defaultUri: vscode.workspace.workspaceFolders?.[0]?.uri,
            });
            if (!picked || picked.length === 0) {
                throw new Error('Restore cancelled — no destination folder selected.');
            }
            destRoot = picked[0].fsPath;
        }
        const { getFilesRecursive } = await Promise.resolve().then(() => __importStar(require('../utils/fileUtils')));
        const files = await getFilesRecursive(backup.path);
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Restoring V-${backup.version}...`,
            cancellable: true,
        }, async (progress, token) => {
            const total = files.length;
            for (let i = 0; i < files.length; i++) {
                if (token.isCancellationRequested)
                    break;
                const file = files[i];
                const srcPath = path.join(backup.path, (0, pathUtils_1.normalizePath)(file));
                const destPath = path.join(destRoot, file);
                await (0, fileUtils_1.copyFile)(srcPath, destPath);
                progress.report({ message: `${i + 1}/${total} files`, increment: 100 / total });
            }
        });
        vscode.window.showInformationMessage(`Backup V-${backup.version} restored to ${destRoot}`);
    }
    async restoreFile(backup, relativePath) {
        const srcPath = path.join(backup.path, (0, pathUtils_1.normalizePath)(relativePath));
        const destPath = path.join(backup.workspacePath, relativePath);
        if (!(await (0, fileUtils_1.pathExists)(srcPath))) {
            throw new Error(`File not found in backup: ${relativePath}`);
        }
        await (0, fileUtils_1.ensureDir)(path.dirname(destPath));
        await (0, fileUtils_1.copyFile)(srcPath, destPath);
    }
    async restoreFolder(backup, relativePath) {
        const srcPath = path.join(backup.path, (0, pathUtils_1.normalizePath)(relativePath));
        const destPath = path.join(backup.workspacePath, relativePath);
        if (!(await (0, fileUtils_1.pathExists)(srcPath))) {
            throw new Error(`Folder not found in backup: ${relativePath}`);
        }
        await (0, fileUtils_1.ensureDir)(destPath);
        await (0, fileUtils_1.copyDirectory)(srcPath, destPath);
    }
    async restoreFileTo(backup, relativePath, destRoot) {
        const srcPath = path.join(backup.path, (0, pathUtils_1.normalizePath)(relativePath));
        const destPath = path.join(destRoot, relativePath);
        if (!(await (0, fileUtils_1.pathExists)(srcPath))) {
            throw new Error(`File not found in backup: ${relativePath}`);
        }
        await (0, fileUtils_1.ensureDir)(path.dirname(destPath));
        await (0, fileUtils_1.copyFile)(srcPath, destPath);
    }
    async restoreFolderTo(backup, relativePath, destRoot) {
        const srcPath = path.join(backup.path, (0, pathUtils_1.normalizePath)(relativePath));
        const destPath = path.join(destRoot, relativePath);
        if (!(await (0, fileUtils_1.pathExists)(srcPath))) {
            throw new Error(`Folder not found in backup: ${relativePath}`);
        }
        await (0, fileUtils_1.ensureDir)(destPath);
        await (0, fileUtils_1.copyDirectory)(srcPath, destPath);
    }
    async restoreEntireBackupTo(backup, destRoot) {
        const { getFilesRecursive } = await Promise.resolve().then(() => __importStar(require('../utils/fileUtils')));
        const files = await getFilesRecursive(backup.path);
        const total = files.length;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const srcPath = path.join(backup.path, (0, pathUtils_1.normalizePath)(file));
            const destPath = path.join(destRoot, file);
            await (0, fileUtils_1.copyFile)(srcPath, destPath);
        }
    }
}
exports.RestoreService = RestoreService;
//# sourceMappingURL=restoreService.js.map