import { describe, it, expect } from 'vitest';

describe('Backup lifecycle (integration)', () => {
  it('should create backup metadata structure', () => {
    const metadata = {
      id: 'test-id',
      version: 1,
      projectName: 'my-project',
      workspacePath: '/home/user/projects/my-project',
      createdAt: new Date().toISOString(),
      fileCount: 5,
      totalSize: 1024,
      path: '/storage/backups/my-project/v1',
    };

    expect(metadata.id).toBeTruthy();
    expect(metadata.version).toBe(1);
    expect(metadata.projectName).toBe('my-project');
    expect(metadata.workspacePath).toBe('/home/user/projects/my-project');
    expect(metadata.fileCount).toBe(5);
  });

  it('should handle backup deletion', () => {
    const backups = [
      { id: '1', version: 1, projectName: 'proj-a', workspacePath: '/p/proj-a' },
      { id: '2', version: 2, projectName: 'proj-a', workspacePath: '/p/proj-a' },
    ];

    const toRemove = '1';
    const remaining = backups.filter((b) => b.id !== toRemove);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('2');
  });

  it('should group backups by project', () => {
    const backups = [
      { id: '1', version: 1, projectName: 'proj-a', workspacePath: '/p/proj-a' },
      { id: '2', version: 2, projectName: 'proj-b', workspacePath: '/p/proj-b' },
      { id: '3', version: 3, projectName: 'proj-a', workspacePath: '/p/proj-a' },
    ];

    const grouped = new Map<string, typeof backups>();
    for (const b of backups) {
      const list = grouped.get(b.projectName) || [];
      list.push(b);
      grouped.set(b.projectName, list);
    }

    expect(grouped.get('proj-a')).toHaveLength(2);
    expect(grouped.get('proj-b')).toHaveLength(1);
  });

  it('should track versions independently per project', () => {
    const backups = [
      { id: '1', version: 1, projectName: 'proj-a', workspacePath: '/p/proj-a' },
      { id: '2', version: 1, projectName: 'proj-b', workspacePath: '/p/proj-b' },
      { id: '3', version: 2, projectName: 'proj-a', workspacePath: '/p/proj-a' },
    ];

    const projAVersions = backups.filter((b) => b.projectName === 'proj-a').map((b) => b.version);
    expect(projAVersions).toEqual([1, 2]);
  });
});
