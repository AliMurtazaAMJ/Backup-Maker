export declare class IgnoreService {
    private ign;
    private patterns;
    private configPath;
    constructor();
    load(workspaceRoot: string): Promise<void>;
    private ensureConfigFile;
    getPatterns(): Promise<string[]>;
    getGlobPatterns(): string[];
    updatePatterns(newPatterns: string[]): Promise<void>;
    shouldIgnore(filePath: string): boolean;
    filterFiles(files: string[]): string[];
}
