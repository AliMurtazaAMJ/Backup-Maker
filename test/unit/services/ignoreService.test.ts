import { describe, it, expect, beforeEach } from 'vitest';
import ignore from 'ignore';

// Inline test since we can't easily import VS Code in unit tests
// We test the ignore logic in isolation
describe('IgnoreService logic', () => {
  let ign: ReturnType<typeof ignore>;

  beforeEach(() => {
    ign = ignore();
    ign.add('.git');
  });

  it('should ignore .git by default', () => {
    expect(ign.ignores('.git')).toBe(true);
    expect(ign.ignores('.git/config')).toBe(true);
  });

  it('should respect custom ignore patterns', () => {
    ign.add('node_modules/**');
    expect(ign.ignores('node_modules/express/index.js')).toBe(true);
  });

  it('should not ignore non-matching files', () => {
    expect(ign.ignores('src/index.ts')).toBe(false);
  });

  it('should handle wildcards', () => {
    ign.add('*.log');
    expect(ign.ignores('debug.log')).toBe(true);
    expect(ign.ignores('app.ts')).toBe(false);
  });

  it('should handle directory wildcards', () => {
    ign.add('dist/**');
    expect(ign.ignores('dist/bundle.js')).toBe(true);
    expect(ign.ignores('src/bundle.js')).toBe(false);
  });

  it('should filter array of files', () => {
    ign.add('*.tmp');
    const files = ['a.ts', 'b.tmp', 'c.js', 'd.tmp'];
    const filtered = files.filter((f) => !ign.ignores(f));
    expect(filtered).toEqual(['a.ts', 'c.js']);
  });

  it('should handle .env ignore', () => {
    ign.add('.env');
    expect(ign.ignores('.env')).toBe(true);
  });
});
