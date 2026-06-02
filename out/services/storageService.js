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
exports.StorageService = void 0;
const fileUtils_1 = require("../utils/fileUtils");
const pathUtils_1 = require("../utils/pathUtils");
class StorageService {
    _storagePath;
    constructor(context) {
        this._storagePath = context.globalStorageUri.fsPath;
    }
    get storagePath() {
        return this._storagePath;
    }
    async initialize() {
        await (0, fileUtils_1.ensureDir)(this._storagePath);
        await (0, fileUtils_1.ensureDir)((0, pathUtils_1.getBackupsDir)(this._storagePath));
        const metaPath = this.metadataPath;
        if (!(await (0, fileUtils_1.pathExists)(metaPath))) {
            await this.writeMetadata({ backups: [] });
        }
    }
    get metadataPath() {
        return (0, pathUtils_1.getMetadataPath)(this._storagePath);
    }
    getBackupDir(projectName, version) {
        return (0, pathUtils_1.getBackupVersionDir)(this._storagePath, projectName, version);
    }
    getProjectDir(projectName) {
        return (0, pathUtils_1.getProjectDir)(this._storagePath, projectName);
    }
    async writeMetadata(data) {
        const { writeJsonFile } = await Promise.resolve().then(() => __importStar(require('../utils/fileUtils')));
        await writeJsonFile(this.metadataPath, data);
    }
    async readMetadata() {
        const { readJsonFile } = await Promise.resolve().then(() => __importStar(require('../utils/fileUtils')));
        return readJsonFile(this.metadataPath);
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=storageService.js.map