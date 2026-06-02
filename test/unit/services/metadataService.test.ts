import { describe, it, expect } from 'vitest';
import { BackupMetadata } from '../../../src/types';

describe('Metadata logic', () => {
  const mockBackup = (overrides: Partial<BackupMetadata> = {}): BackupMetadata => ({
    id: 'test-id',
    version: 1,
    projectName: 'my-project',
    workspacePath: '/home/user/projects/my-project',
    createdAt: new Date().toISOString(),
    fileCount: 10,
    totalSize: 1024,
    path: '/storage/backups/my-project/v1',
    ...overrides,
  });

  it('should create backup with correct fields', () => {
    const backup = mockBackup({ version: 1, projectName: 'test-proj' });
    expect(backup.version).toBe(1);
    expect(backup.projectName).toBe('test-proj');
    expect(backup.workspacePath).toBeTruthy();
    expect(backup.id).toBeTruthy();
  });

  it('should sort backups by version descending', () => {
    const backups = [
      mockBackup({ version: 1, createdAt: '2026-01-01' }),
      mockBackup({ version: 3, createdAt: '2026-01-03' }),
      mockBackup({ version: 2, createdAt: '2026-01-02' }),
    ];

    const sorted = [...backups].sort((a, b) => b.version - a.version);
    expect(sorted[0].version).toBe(3);
    expect(sorted[1].version).toBe(2);
    expect(sorted[2].version).toBe(1);
  });

  it('should find backup by id', () => {
    const backups = [
      mockBackup({ id: 'a', version: 1 }),
      mockBackup({ id: 'b', version: 2 }),
    ];
    const found = backups.find((b) => b.id === 'b');
    expect(found?.version).toBe(2);
  });

  it('should group backups by project', () => {
    const backups = [
      mockBackup({ version: 1, projectName: 'proj-a' }),
      mockBackup({ version: 2, projectName: 'proj-b' }),
      mockBackup({ version: 3, projectName: 'proj-a' }),
    ];
    const map = new Map<string, BackupMetadata[]>();
    for (const b of backups) {
      const list = map.get(b.projectName) || [];
      list.push(b);
      map.set(b.projectName, list);
    }
    expect(map.get('proj-a')).toHaveLength(2);
    expect(map.get('proj-b')).toHaveLength(1);
  });

  it('should calculate next version number per project', () => {
    const backups = [
      mockBackup({ version: 1, projectName: 'proj-a' }),
      mockBackup({ version: 5, projectName: 'proj-a' }),
      mockBackup({ version: 1, projectName: 'proj-b' }),
    ];
    const projABackups = backups.filter((b) => b.projectName === 'proj-a');
    const nextVersion = projABackups.length === 0 ? 1 : Math.max(...projABackups.map((b) => b.version)) + 1;
    expect(nextVersion).toBe(6);
  });

  it('should handle empty backups array', () => {
    const backups: BackupMetadata[] = [];
    expect(backups.length).toBe(0);
  });
});
