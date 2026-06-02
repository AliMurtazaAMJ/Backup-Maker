import { describe, it, expect } from 'vitest';

describe('File utility logic', () => {
  it('should normalize paths', () => {
    const normalizePath = (p: string) => p.replace(/\\/g, '/');
    expect(normalizePath('foo\\bar')).toBe('foo/bar');
    expect(normalizePath('foo/bar')).toBe('foo/bar');
  });

  it('should format file sizes correctly', () => {
    const formatSize = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      const units = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
    };
    expect(formatSize(0)).toBe('0 B');
    expect(formatSize(500)).toBe('500.0 B');
    expect(formatSize(1024)).toBe('1.0 KB');
    expect(formatSize(1048576)).toBe('1.0 MB');
    expect(formatSize(1073741824)).toBe('1.0 GB');
  });

  it('should format dates', () => {
    const formatDate = (isoString: string): string => {
      const d = new Date(isoString);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    expect(formatDate('2026-06-02T15:30:00Z')).toBe('2026-06-02');
  });
});
