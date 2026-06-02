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
exports.BackupTreeProvider = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const types_1 = require("../types");
const backup_1 = require("../models/backup");
class BackupTreeProvider {
    metadataService;
    _onDidChangeTreeData = new vscode.EventEmitter();
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    constructor(metadataService) {
        this.metadataService = metadataService;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    async getChildren(element) {
        if (!element) {
            return this.getRootItems();
        }
        if (element.itemType === types_1.BackupTreeItemType.Project) {
            return this.getBackupItemsForProject(element.label);
        }
        if (element.itemType === types_1.BackupTreeItemType.Backup && element.metadata) {
            return this.getFileTreeItems(element.metadata);
        }
        if (element.itemType === types_1.BackupTreeItemType.Directory && element.backupId && element.relativePath) {
            return this.getDirectoryContents(element.backupId, element.relativePath);
        }
        return [];
    }
    getRootItems() {
        const items = [];
        const currentProject = this.getCurrentProjectName();
        if (!currentProject)
            return items;
        const allByProject = this.metadataService.getAllByProject();
        if (allByProject.has(currentProject)) {
            items.push(new backup_1.BackupTreeItem(currentProject, vscode.TreeItemCollapsibleState.Expanded, types_1.BackupTreeItemType.Project));
        }
        return items;
    }
    getCurrentProjectName() {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0)
            return '';
        return path.basename(folders[0].uri.fsPath);
    }
    getBackupItemsForProject(projectName) {
        const byProject = this.metadataService.getAllByProject();
        const backups = byProject.get(projectName) || [];
        return backups.map((backup) => {
            const label = `V-${backup.version}`;
            return new backup_1.BackupTreeItem(label, vscode.TreeItemCollapsibleState.Collapsed, types_1.BackupTreeItemType.Backup, backup.id, undefined, backup);
        });
    }
    async getFileTreeItems(backup) {
        const files = await this.metadataService.getFileList(backup.id);
        const rootItems = this.buildTree(backup, files);
        return rootItems;
    }
    async getDirectoryContents(backupId, relativePath) {
        const backup = this.metadataService.getById(backupId);
        if (!backup)
            return [];
        const allFiles = await this.metadataService.getFileList(backupId);
        const prefix = relativePath ? relativePath + '/' : '';
        const dirFiles = allFiles.filter((f) => f.startsWith(prefix));
        const items = this.buildTree(backup, dirFiles, relativePath);
        return items;
    }
    buildTree(backup, files, parentPath = '') {
        const prefix = parentPath ? parentPath + '/' : '';
        const dirs = new Set();
        const fileItems = [];
        for (const file of files) {
            if (!file.startsWith(prefix))
                continue;
            const relative = file.slice(prefix.length);
            const parts = relative.split('/');
            if (parts.length === 1) {
                fileItems.push(new backup_1.BackupTreeItem(parts[0], vscode.TreeItemCollapsibleState.None, types_1.BackupTreeItemType.File, backup.id, file, backup));
            }
            else {
                dirs.add(parts[0]);
            }
        }
        const dirItems = [];
        for (const dirName of dirs) {
            const dirRelativePath = parentPath ? `${parentPath}/${dirName}` : dirName;
            dirItems.push(new backup_1.BackupTreeItem(dirName, vscode.TreeItemCollapsibleState.Collapsed, types_1.BackupTreeItemType.Directory, backup.id, dirRelativePath, backup));
        }
        dirItems.sort((a, b) => a.label.localeCompare(b.label));
        fileItems.sort((a, b) => a.label.localeCompare(b.label));
        return [...dirItems, ...fileItems];
    }
}
exports.BackupTreeProvider = BackupTreeProvider;
//# sourceMappingURL=backupTreeProvider.js.map