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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const ignoreService_1 = require("./services/ignoreService");
const storageService_1 = require("./services/storageService");
const metadataService_1 = require("./services/metadataService");
const backupService_1 = require("./services/backupService");
const restoreService_1 = require("./services/restoreService");
const backupTreeProvider_1 = require("./views/backupTreeProvider");
const allBackupsTreeProvider_1 = require("./views/allBackupsTreeProvider");
const ignoreTreeProvider_1 = require("./views/ignoreTreeProvider");
const types_1 = require("./types");
const createBackup_1 = require("./commands/createBackup");
const restoreBackup_1 = require("./commands/restoreBackup");
const restoreFile_1 = require("./commands/restoreFile");
const restoreFolder_1 = require("./commands/restoreFolder");
const restoreBackupTo_1 = require("./commands/restoreBackupTo");
const restoreFileTo_1 = require("./commands/restoreFileTo");
const restoreFolderTo_1 = require("./commands/restoreFolderTo");
const deleteBackup_1 = require("./commands/deleteBackup");
const refresh_1 = require("./commands/refresh");
const openStorage_1 = require("./commands/openStorage");
const compareFile_1 = require("./commands/compareFile");
async function activate(context) {
    const ignoreService = new ignoreService_1.IgnoreService();
    const storageService = new storageService_1.StorageService(context);
    const metadataService = new metadataService_1.MetadataService(storageService);
    const backupService = new backupService_1.BackupService(ignoreService, storageService, metadataService);
    const restoreService = new restoreService_1.RestoreService();
    await storageService.initialize();
    await metadataService.load();
    // --- Backup Explorer (current project only) ---
    const treeProvider = new backupTreeProvider_1.BackupTreeProvider(metadataService);
    const treeView = vscode.window.createTreeView('backupManager.explorer', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
    });
    context.subscriptions.push(treeView);
    treeView.onDidChangeSelection((e) => {
        const item = e.selection[0];
        if (!item || item.itemType !== types_1.BackupTreeItemType.File)
            return;
        const metadata = item.metadata;
        const relPath = item.relativePath;
        if (!metadata || !relPath)
            return;
        const fullPath = path.join(metadata.path, relPath);
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
    });
    // --- All Backups (all projects, export-to-destination) ---
    const allBackupsProvider = new allBackupsTreeProvider_1.AllBackupsTreeProvider(metadataService);
    const allBackupsView = vscode.window.createTreeView('backupManager.allBackups', {
        treeDataProvider: allBackupsProvider,
        showCollapseAll: true,
    });
    context.subscriptions.push(allBackupsView);
    allBackupsView.onDidChangeSelection((e) => {
        const item = e.selection[0];
        if (!item || item.itemType !== types_1.BackupTreeItemType.File)
            return;
        const metadata = item.metadata;
        const relPath = item.relativePath;
        if (!metadata || !relPath)
            return;
        const fullPath = path.join(metadata.path, relPath);
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(fullPath));
    });
    // --- Commands (registered after all providers exist) ---
    const refreshTree = () => treeProvider.refresh();
    (0, createBackup_1.registerCreateBackup)(context, backupService, () => {
        metadataService.invalidateFileListCache();
        treeProvider.refresh();
        allBackupsProvider.refresh();
    });
    (0, restoreBackup_1.registerRestoreBackup)(context, restoreService);
    (0, restoreFile_1.registerRestoreFile)(context, restoreService);
    (0, restoreFolder_1.registerRestoreFolder)(context, restoreService);
    (0, restoreBackupTo_1.registerRestoreBackupTo)(context, restoreService);
    (0, restoreFileTo_1.registerRestoreFileTo)(context, restoreService);
    (0, restoreFolderTo_1.registerRestoreFolderTo)(context, restoreService);
    (0, deleteBackup_1.registerDeleteBackup)(context, metadataService, () => {
        treeProvider.refresh();
        allBackupsProvider.refresh();
    });
    (0, refresh_1.registerRefresh)(context, refreshTree);
    (0, openStorage_1.registerOpenStorage)(context, storageService);
    (0, compareFile_1.registerCompareFile)(context);
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.refreshAllBackups', () => {
        allBackupsProvider.refresh();
    }));
    // --- Auto-refresh via FileSystemWatcher (debounced) ---
    let debounceTimer;
    const debouncedRefresh = () => {
        if (debounceTimer)
            clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            treeProvider.refresh();
            allBackupsProvider.refresh();
        }, 300);
    };
    const backupWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(storageService.storagePath, '**/*'));
    backupWatcher.onDidChange(debouncedRefresh);
    backupWatcher.onDidCreate(debouncedRefresh);
    backupWatcher.onDidDelete(debouncedRefresh);
    context.subscriptions.push(backupWatcher);
    // --- Ignore Patterns Tree View ---
    const ignoreTreeProvider = new ignoreTreeProvider_1.IgnoreTreeProvider(ignoreService);
    const ignoreTreeView = vscode.window.createTreeView('backupManager.ignoreExplorer', {
        treeDataProvider: ignoreTreeProvider,
        showCollapseAll: true,
    });
    context.subscriptions.push(ignoreTreeView);
    ignoreTreeView.onDidChangeCheckboxState((e) => {
        ignoreTreeProvider.handleCheckboxChange(e.items);
    });
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.refreshIgnore', () => {
        ignoreTreeProvider.refresh();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.saveIgnorePatterns', async () => {
        await ignoreTreeProvider.save();
        vscode.window.showInformationMessage('Ignore patterns saved.');
    }));
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.toggleIgnoreAll', () => {
        ignoreTreeProvider.toggleAll();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.ignoreFile', (item) => {
        if (!item)
            return;
        ignoreTreeProvider.ignoreFile(item.filePath);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.ignoreFolder', (item) => {
        if (!item)
            return;
        ignoreTreeProvider.ignoreFolder(item.filePath);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.ignoreExtension', (item) => {
        if (!item)
            return;
        ignoreTreeProvider.ignoreExtension(item.filePath);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('backupManager.removeFromIgnore', (item) => {
        if (!item)
            return;
        ignoreTreeProvider.removeFromIgnore(item.filePath, item.isDir);
    }));
    // --- Status Bar ---
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.command = 'backupManager.createBackup';
    statusBarItem.text = '$(archive) Create Backup';
    statusBarItem.tooltip = 'Create a backup of the current workspace';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
}
function deactivate() {
}
//# sourceMappingURL=extension.js.map