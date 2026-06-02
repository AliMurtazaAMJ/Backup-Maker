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
exports.MetadataService = void 0;
class MetadataService {
    storageService;
    store = { backups: [] };
    fileListCache = new Map();
    constructor(storageService) {
        this.storageService = storageService;
    }
    async load() {
        const data = await this.storageService.readMetadata();
        this.store = data || { backups: [] };
    }
    async save() {
        await this.storageService.writeMetadata(this.store);
    }
    getAll() {
        return [...this.store.backups].sort((a, b) => b.version - a.version);
    }
    getAllByProject() {
        const map = new Map();
        for (const backup of this.store.backups) {
            const list = map.get(backup.projectName) || [];
            list.push(backup);
            map.set(backup.projectName, list);
        }
        for (const [, backups] of map) {
            backups.sort((a, b) => b.version - a.version);
        }
        return map;
    }
    getProjects() {
        const projects = new Set(this.store.backups.map((b) => b.projectName));
        return Array.from(projects).sort();
    }
    getById(id) {
        return this.store.backups.find((b) => b.id === id);
    }
    async getFileList(backupId) {
        const cached = this.fileListCache.get(backupId);
        if (cached)
            return cached;
        const backup = this.getById(backupId);
        if (!backup)
            return [];
        const { getFilesRecursive } = await Promise.resolve().then(() => __importStar(require('../utils/fileUtils')));
        const files = await getFilesRecursive(backup.path);
        this.fileListCache.set(backupId, files);
        return files;
    }
    invalidateFileListCache(backupId) {
        if (backupId) {
            this.fileListCache.delete(backupId);
        }
        else {
            this.fileListCache.clear();
        }
    }
    async add(backup) {
        this.store.backups.push(backup);
        await this.save();
    }
    async remove(id) {
        this.store.backups = this.store.backups.filter((b) => b.id !== id);
        this.fileListCache.delete(id);
        await this.save();
    }
    getNextVersion(projectName) {
        const projectBackups = this.store.backups.filter((b) => b.projectName === projectName);
        if (projectBackups.length === 0)
            return 1;
        return Math.max(...projectBackups.map((b) => b.version)) + 1;
    }
}
exports.MetadataService = MetadataService;
//# sourceMappingURL=metadataService.js.map