import { BackupMetadata, MetadataStore } from '../types';
import { StorageService } from './storageService';

export class MetadataService {
  private store: MetadataStore = { backups: [] };
  private fileListCache = new Map<string, string[]>();

  constructor(private storageService: StorageService) {}

  async load(): Promise<void> {
    const data = await this.storageService.readMetadata();
    this.store = data || { backups: [] };
  }

  async save(): Promise<void> {
    await this.storageService.writeMetadata(this.store);
  }

  getAll(): BackupMetadata[] {
    return [...this.store.backups].sort((a, b) => b.version - a.version);
  }

  getAllByProject(): Map<string, BackupMetadata[]> {
    const map = new Map<string, BackupMetadata[]>();
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

  getProjects(): string[] {
    const projects = new Set(this.store.backups.map((b) => b.projectName));
    return Array.from(projects).sort();
  }

  getById(id: string): BackupMetadata | undefined {
    return this.store.backups.find((b) => b.id === id);
  }

  async getFileList(backupId: string): Promise<string[]> {
    const cached = this.fileListCache.get(backupId);
    if (cached) return cached;

    const backup = this.getById(backupId);
    if (!backup) return [];

    const { getFilesRecursive } = await import('../utils/fileUtils');
    const files = await getFilesRecursive(backup.path);
    this.fileListCache.set(backupId, files);
    return files;
  }

  invalidateFileListCache(backupId?: string): void {
    if (backupId) {
      this.fileListCache.delete(backupId);
    } else {
      this.fileListCache.clear();
    }
  }

  async add(backup: BackupMetadata): Promise<void> {
    this.store.backups.push(backup);
    await this.save();
  }

  async remove(id: string): Promise<void> {
    this.store.backups = this.store.backups.filter((b) => b.id !== id);
    this.fileListCache.delete(id);
    await this.save();
  }

  getNextVersion(projectName: string): number {
    const projectBackups = this.store.backups.filter((b) => b.projectName === projectName);
    if (projectBackups.length === 0) return 1;
    return Math.max(...projectBackups.map((b) => b.version)) + 1;
  }
}
