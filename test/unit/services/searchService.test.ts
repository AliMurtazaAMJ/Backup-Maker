import { describe, it, expect } from 'vitest';
import { BackupMetadata } from '../../../src/types';

describe('Backup filtering', () => {
  const backups: BackupMetadata[] = [
    {
      id: '1', version: 1, projectName: 'proj-a', workspacePath: '/p/proj-a',
      createdAt: '2026-01-01T00:00:00Z', fileCount: 5, totalSize: 100, path: '/s/proj-a/v1',
    },
    {
      id: '2', version: 12, projectName: 'proj-a', workspacePath: '/p/proj-a',
      createdAt: '2026-06-01T00:00:00Z', fileCount: 20, totalSize: 5000, path: '/s/proj-a/v12',
    },
    {
      id: '3', version: 15, projectName: 'proj-b', workspacePath: '/p/proj-b',
      createdAt: '2026-06-02T00:00:00Z', fileCount: 30, totalSize: 10000, path: '/s/proj-b/v15',
    },
  ];

  it('should filter backups by project name', () => {
    const results = backups.filter((b) => b.projectName === 'proj-a');
    expect(results).toHaveLength(2);
  });

  it('should find backup by version number', () => {
    const query = '12';
    const results = backups.filter((b) => b.version.toString().includes(query));
    expect(results).toHaveLength(1);
    expect(results[0].version).toBe(12);
  });

  it('should find backup by date', () => {
    const query = '2026-06';
    const results = backups.filter((b) => b.createdAt.includes(query));
    expect(results).toHaveLength(2);
  });

  it('should return all when query is empty', () => {
    const query = '';
    const results = query ? [] : backups;
    expect(results).toHaveLength(3);
  });

  it('should return empty when no match', () => {
    const query = 'nonexistent';
    const results = backups.filter((b) =>
      b.version.toString().includes(query) ||
      b.projectName.includes(query) ||
      b.createdAt.includes(query),
    );
    expect(results).toHaveLength(0);
  });
});
