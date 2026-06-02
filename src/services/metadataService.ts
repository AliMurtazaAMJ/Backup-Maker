import { BackupMetadata, MetadataStore } from '../types';
import { StorageService } from './storageService';

export class MetadataService {
  private store: MetadataStore = { backups: [] };

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

  async add(backup: BackupMetadata): Promise<void> {
    this.store.backups.push(backup);
    await this.save();
  }

  async remove(id: string): Promise<void> {
    this.store.backups = this.store.backups.filter((b) => b.id !== id);
    await this.save();
  }

  getNextVersion(projectName: string): number {
    const projectBackups = this.store.backups.filter((b) => b.projectName === projectName);
    if (projectBackups.length === 0) return 1;
    return Math.max(...projectBackups.map((b) => b.version)) + 1;
  }
}
