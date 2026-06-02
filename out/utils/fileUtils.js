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
exports.ensureDir = ensureDir;
exports.copyFile = copyFile;
exports.copyDirectory = copyDirectory;
exports.removeDirectory = removeDirectory;
exports.getFileSize = getFileSize;
exports.getDirectorySize = getDirectorySize;
exports.pathExists = pathExists;
exports.readJsonFile = readJsonFile;
exports.writeJsonFile = writeJsonFile;
exports.getFilesRecursive = getFilesRecursive;
const fsp = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
async function ensureDir(dirPath) {
    await fsp.mkdir(dirPath, { recursive: true });
}
async function copyFile(src, dest) {
    await ensureDir(path.dirname(dest));
    await fsp.copyFile(src, dest);
    try {
        const stat = await fsp.stat(src);
        await fsp.utimes(dest, stat.atime, stat.mtime);
    }
    catch {
        // timestamp preservation is best-effort
    }
}
async function copyDirectory(src, dest) {
    await ensureDir(dest);
    const entries = await fsp.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDirectory(srcPath, destPath);
        }
        else if (entry.isFile()) {
            await copyFile(srcPath, destPath);
        }
    }
}
async function removeDirectory(dirPath) {
    await fsp.rm(dirPath, { recursive: true, force: true });
}
async function getFileSize(filePath) {
    const stat = await fsp.stat(filePath);
    return stat.size;
}
async function getDirectorySize(dirPath) {
    let total = 0;
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            total += await getDirectorySize(fullPath);
        }
        else if (entry.isFile()) {
            total += await getFileSize(fullPath);
        }
    }
    return total;
}
async function pathExists(filePath) {
    try {
        await fsp.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
async function readJsonFile(filePath) {
    try {
        const content = await fsp.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
async function writeJsonFile(filePath, data) {
    await ensureDir(path.dirname(filePath));
    await fsp.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
async function getFilesRecursive(dirPath, basePath = '') {
    const files = [];
    const entries = await fsp.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const relPath = basePath ? `${basePath}/${entry.name}` : entry.name;
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            const subFiles = await getFilesRecursive(fullPath, relPath);
            files.push(...subFiles);
        }
        else if (entry.isFile()) {
            files.push(relPath);
        }
    }
    return files;
}
//# sourceMappingURL=fileUtils.js.map