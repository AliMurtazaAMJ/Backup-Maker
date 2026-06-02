"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
class SearchService {
    metadataService;
    constructor(metadataService) {
        this.metadataService = metadataService;
    }
    search(criteria) {
        const query = criteria.query.toLowerCase().trim();
        if (!query)
            return this.metadataService.getAll();
        const backups = this.metadataService.getAll();
        return backups.filter((backup) => {
            if (criteria.searchByVersion !== false && query) {
                if (backup.version.toString().includes(query))
                    return true;
            }
            if (criteria.searchInNotes !== false && backup.note) {
                if (backup.note.toLowerCase().includes(query))
                    return true;
            }
            if (criteria.searchInDates !== false && backup.createdAt) {
                const dateStr = new Date(backup.createdAt).toLocaleDateString();
                if (dateStr.toLowerCase().includes(query))
                    return true;
                if (backup.createdAt.includes(query))
                    return true;
            }
            return false;
        });
    }
    searchByFileName(backup, fileNameQuery) {
        const { getFilesRecursive } = require('../utils/fileUtils');
        // This is handled by the tree provider when filtering
        return [];
    }
}
exports.SearchService = SearchService;
//# sourceMappingURL=searchService.js.map