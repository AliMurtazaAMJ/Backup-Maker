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
exports.StatisticsWebview = void 0;
const vscode = __importStar(require("vscode"));
const formatUtils_1 = require("../utils/formatUtils");
class StatisticsWebview {
    panel;
    static currentPanel;
    static createOrShow(extensionUri, metadataService) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (StatisticsWebview.currentPanel) {
            StatisticsWebview.currentPanel.panel.reveal(column);
            StatisticsWebview.currentPanel.update(metadataService);
            return;
        }
        const panel = vscode.window.createWebviewPanel('backupManagerStatistics', 'Backup Manager Statistics', column || vscode.ViewColumn.One, {
            enableScripts: false,
            retainContextWhenHidden: true,
        });
        StatisticsWebview.currentPanel = new StatisticsWebview(panel);
        StatisticsWebview.currentPanel.update(metadataService);
        panel.onDidDispose(() => {
            StatisticsWebview.currentPanel = undefined;
        });
    }
    constructor(panel) {
        this.panel = panel;
    }
    update(metadataService) {
        const stats = this.computeStats(metadataService);
        this.panel.title = 'Backup Manager Statistics';
        this.panel.webview.html = this.getHtml(stats);
    }
    computeStats(metadataService) {
        const backups = metadataService.getAll();
        if (backups.length === 0) {
            return {
                totalBackups: 0,
                storageUsed: 0,
                largestBackup: null,
                averageSize: 0,
                oldestBackup: null,
                newestBackup: null,
                pinnedCount: 0,
            };
        }
        const sorted = [...backups].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        const totalSize = backups.reduce((sum, b) => sum + b.totalSize, 0);
        const largest = [...backups].sort((a, b) => b.totalSize - a.totalSize)[0];
        const pinned = backups.filter((b) => b.pinned).length;
        return {
            totalBackups: backups.length,
            storageUsed: totalSize,
            largestBackup: largest,
            averageSize: Math.round(totalSize / backups.length),
            oldestBackup: sorted[0],
            newestBackup: sorted[sorted.length - 1],
            pinnedCount: pinned,
        };
    }
    getHtml(stats) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Backup Manager Statistics</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      padding: 20px;
    }
    h1 {
      font-size: 1.5em;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--vscode-panel-border);
      padding-bottom: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .card {
      background: var(--vscode-editor-inactiveSelectionBackground);
      border-radius: 8px;
      padding: 16px;
    }
    .card .value {
      font-size: 1.8em;
      font-weight: bold;
      margin: 8px 0;
    }
    .card .label {
      font-size: 0.85em;
      opacity: 0.8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card .detail {
      font-size: 0.9em;
      margin-top: 4px;
      opacity: 0.7;
    }
    .empty {
      text-align: center;
      padding: 40px;
      opacity: 0.6;
    }
    .full-width {
      grid-column: 1 / -1;
    }
  </style>
</head>
<body>
  <h1>Backup Manager Statistics</h1>${stats.totalBackups === 0 ? `
  <div class="empty">
    <p>No backups yet. Create your first backup to see statistics.</p>
  </div>` : `
  <div class="grid">
    <div class="card">
      <div class="label">Total Backups</div>
      <div class="value">${stats.totalBackups}</div>
    </div>
    <div class="card">
      <div class="label">Storage Used</div>
      <div class="value">${(0, formatUtils_1.formatSize)(stats.storageUsed)}</div>
    </div>
    <div class="card">
      <div class="label">Largest Backup</div>
      <div class="value">${stats.largestBackup ? (0, formatUtils_1.formatSize)(stats.largestBackup.totalSize) : 'N/A'}</div>
      <div class="detail">${stats.largestBackup ? `Backup ${stats.largestBackup.version}` : ''}</div>
    </div>
    <div class="card">
      <div class="label">Average Size</div>
      <div class="value">${(0, formatUtils_1.formatSize)(stats.averageSize)}</div>
    </div>
    <div class="card">
      <div class="label">Oldest Backup</div>
      <div class="value">${stats.oldestBackup ? `#${stats.oldestBackup.version}` : 'N/A'}</div>
      <div class="detail">${stats.oldestBackup ? (0, formatUtils_1.formatDate)(stats.oldestBackup.createdAt) : ''}</div>
    </div>
    <div class="card">
      <div class="label">Newest Backup</div>
      <div class="value">${stats.newestBackup ? `#${stats.newestBackup.version}` : 'N/A'}</div>
      <div class="detail">${stats.newestBackup ? (0, formatUtils_1.formatDate)(stats.newestBackup.createdAt) : ''}</div>
    </div>
    <div class="card">
      <div class="label">Pinned Backups</div>
      <div class="value">${stats.pinnedCount}</div>
    </div>
  </div>`}
</body>
</html>`;
    }
}
exports.StatisticsWebview = StatisticsWebview;
//# sourceMappingURL=statisticsWebview.js.map