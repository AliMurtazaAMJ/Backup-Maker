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
exports.IgnoreService = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const ignore_1 = __importDefault(require("ignore"));
const CONFIG_FILENAME = 'backup-manager.json';
const DEFAULT_IGNORE = ['node_modules/**', 'dist/**', '*.log', '*.tmp', 'backup-manager.json', '.*'];
class IgnoreService {
    ign;
    patterns = [];
    configPath = '';
    constructor() {
        this.ign = (0, ignore_1.default)();
    }
    async load(workspaceRoot) {
        this.ign = (0, ignore_1.default)();
        this.configPath = path.join(workspaceRoot, CONFIG_FILENAME);
        this.patterns = [];
        await this.ensureConfigFile(workspaceRoot);
        try {
            const configContent = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configContent);
            if (config.ignore && Array.isArray(config.ignore)) {
                this.patterns = config.ignore;
                this.ign.add(config.ignore);
            }
        }
        catch {
            // fallback
        }
        this.ign.add('.git');
    }
    async ensureConfigFile(workspaceRoot) {
        try {
            await fs.access(this.configPath);
            return;
        }
        catch {
            // doesn't exist — create it
        }
        let patterns = [];
        const gitignorePath = path.join(workspaceRoot, '.gitignore');
        try {
            const content = await fs.readFile(gitignorePath, 'utf-8');
            patterns = content
                .split('\n')
                .map((l) => l.trim())
                .filter((l) => l && !l.startsWith('#'));
        }
        catch {
            patterns = [...DEFAULT_IGNORE];
        }
        if (patterns.length === 0) {
            patterns = [...DEFAULT_IGNORE];
        }
        const config = { ignore: patterns };
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    async getPatterns() {
        return [...this.patterns];
    }
    getGlobPatterns() {
        return this.patterns.map(p => p.includes('/') ? p : `**/${p}`);
    }
    async updatePatterns(newPatterns) {
        this.patterns = newPatterns;
        this.ign = (0, ignore_1.default)();
        this.ign.add('.git');
        this.ign.add(newPatterns);
        const config = { ignore: newPatterns };
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    }
    shouldIgnore(filePath) {
        if (!filePath || filePath.startsWith('.')) {
            return true;
        }
        return this.ign.ignores(filePath);
    }
    filterFiles(files) {
        return files.filter((f) => !this.shouldIgnore(f));
    }
}
exports.IgnoreService = IgnoreService;
//# sourceMappingURL=ignoreService.js.map