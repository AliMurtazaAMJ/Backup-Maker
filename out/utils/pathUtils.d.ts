export declare function normalizePath(filePath: string): string;
export declare function getRelativePath(absolutePath: string, rootPath: string): string;
export declare function joinAndNormalize(...segments: string[]): string;
export declare function getProjectDir(storagePath: string, projectName: string): string;
export declare function getBackupVersionDir(storagePath: string, projectName: string, version: number): string;
export declare function getMetadataPath(storagePath: string): string;
export declare function getBackupsDir(storagePath: string): string;
