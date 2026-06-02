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
exports.normalizePath = normalizePath;
exports.getRelativePath = getRelativePath;
exports.joinAndNormalize = joinAndNormalize;
exports.getProjectDir = getProjectDir;
exports.getBackupVersionDir = getBackupVersionDir;
exports.getMetadataPath = getMetadataPath;
exports.getBackupsDir = getBackupsDir;
const path = __importStar(require("path"));
function normalizePath(filePath) {
    return filePath.replace(/\\/g, '/');
}
function getRelativePath(absolutePath, rootPath) {
    const rel = path.relative(rootPath, absolutePath);
    return normalizePath(rel);
}
function joinAndNormalize(...segments) {
    return normalizePath(path.join(...segments));
}
function getProjectDir(storagePath, projectName) {
    return path.join(storagePath, 'backups', sanitizeProjectName(projectName));
}
function getBackupVersionDir(storagePath, projectName, version) {
    return path.join(getProjectDir(storagePath, projectName), `v${version}`);
}
function getMetadataPath(storagePath) {
    return path.join(storagePath, 'metadata.json');
}
function getBackupsDir(storagePath) {
    return path.join(storagePath, 'backups');
}
function sanitizeProjectName(name) {
    return name.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '-').toLowerCase();
}
//# sourceMappingURL=pathUtils.js.map