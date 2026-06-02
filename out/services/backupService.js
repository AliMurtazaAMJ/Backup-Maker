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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = void 0;
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const fast_glob_1 = __importDefault(require("fast-glob"));
const fileUtils_1 = require("../utils/fileUtils");
const pathUtils_1 = require("../utils/pathUtils");
const validationUtils_1 = require("../utils/validationUtils");
class BackupService {
    ignoreService;
    storageService;
    metadataService;
    constructor(ignoreService, storageService, metadataService) {
        this.ignoreService = ignoreService;
        this.storageService = storageService;
        this.metadataService = metadataService;
    }
    async createBackup() {
        const workspaceRoot = (0, validationUtils_1.getWorkspaceRoot)();
        if (!workspaceRoot) {
            throw new Error('No workspace folder is open.');
        }
        const projectName = path.basename(workspaceRoot);
        await this.ignoreService.load(workspaceRoot);
        const version = this.metadataService.getNextVersion(projectName);
        const backupDir = this.storageService.getBackupDir(projectName, version);
        await (0, fileUtils_1.ensureDir)(backupDir);
        const id = crypto.randomUUID();
        const globIgnore = this.ignoreService.getGlobPatterns();
        const rawFiles = await (0, fast_glob_1.default)('**/*', {
            cwd: workspaceRoot,
            dot: false,
            absolute: false,
            markDirectories: false,
            suppressErrors: true,
            followSymbolicLinks: false,
            ignore: globIgnore,
        });
        const filteredFiles = this.ignoreService.filterFiles(rawFiles);
        let fileCount = 0;
        for (const file of filteredFiles) {
            const srcPath = path.join(workspaceRoot, file);
            const destPath = path.join(backupDir, (0, pathUtils_1.normalizePath)(file));
            try {
                await (0, fileUtils_1.copyFile)(srcPath, destPath);
                fileCount++;
            }
            catch {
                // skip files that can't be copied
            }
        }
        const totalSize = await (0, fileUtils_1.getDirectorySize)(backupDir);
        const backup = {
            id,
            version,
            projectName,
            workspacePath: workspaceRoot,
            createdAt: new Date().toISOString(),
            fileCount,
            totalSize,
            path: backupDir,
        };
        await this.metadataService.add(backup);
        return backup;
    }
}
exports.BackupService = BackupService;
//# sourceMappingURL=backupService.js.map