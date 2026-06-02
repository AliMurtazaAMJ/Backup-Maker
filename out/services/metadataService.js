"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetadataService = void 0;
class MetadataService {
    storageService;
    store = { backups: [] };
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
    async add(backup) {
        this.store.backups.push(backup);
        await this.save();
    }
    async remove(id) {
        this.store.backups = this.store.backups.filter((b) => b.id !== id);
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