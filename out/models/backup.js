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
exports.BackupTreeItem = void 0;
const vscode = __importStar(require("vscode"));
const types_1 = require("../types");
class BackupTreeItem extends vscode.TreeItem {
    label;
    collapsibleState;
    itemType;
    backupId;
    relativePath;
    metadata;
    constructor(label, collapsibleState, itemType, backupId, relativePath, metadata) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.itemType = itemType;
        this.backupId = backupId;
        this.relativePath = relativePath;
        this.metadata = metadata;
        this.tooltip = this.getTooltip();
        this.description = this.getDescription();
        switch (itemType) {
            case types_1.BackupTreeItemType.Project:
                this.contextValue = 'project';
                this.iconPath = new vscode.ThemeIcon('repo');
                break;
            case types_1.BackupTreeItemType.Backup:
                this.contextValue = 'backup';
                this.iconPath = new vscode.ThemeIcon('archive');
                break;
            case types_1.BackupTreeItemType.Directory:
                this.contextValue = 'directory';
                this.iconPath = new vscode.ThemeIcon('folder');
                break;
            case types_1.BackupTreeItemType.File:
                this.contextValue = 'file';
                this.iconPath = new vscode.ThemeIcon('file');
                break;
        }
    }
    getTooltip() {
        if (this.itemType === types_1.BackupTreeItemType.Backup && this.metadata) {
            const lines = [
                `V-${this.metadata.version}`,
                `Created: ${this.metadata.createdAt}`,
                `Files: ${this.metadata.fileCount}`,
                `Size: ${this.formatSize(this.metadata.totalSize)}`,
            ];
            return lines.join('\n');
        }
        return this.label;
    }
    getDescription() {
        if (this.itemType === types_1.BackupTreeItemType.Backup && this.metadata) {
            const date = new Date(this.metadata.createdAt);
            const formatted = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const size = this.formatSize(this.metadata.totalSize);
            return `${formatted} — ${this.metadata.fileCount} files, ${size}`;
        }
        return '';
    }
    formatSize(bytes) {
        if (bytes === 0)
            return '0 B';
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
    }
}
exports.BackupTreeItem = BackupTreeItem;
//# sourceMappingURL=backup.js.map