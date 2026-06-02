import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import ignore, { Ignore } from 'ignore';

const CONFIG_FILENAME = '.backupmanagerignore';

export class IgnoreService {
  private ign: Ignore;
  private patterns: string[] = [];
  private configPath: string = '';

  constructor() {
    this.ign = ignore();
  }

  async load(workspaceRoot: string): Promise<void> {
    this.ign = ignore();
    this.configPath = path.join(workspaceRoot, CONFIG_FILENAME);
    this.patterns = [];

    await this.ensureConfigFile(workspaceRoot);

    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.patterns = content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
      this.ign.add(this.patterns);
    } catch {
      // fallback
    }

    this.ign.add('.git');
  }

  private async ensureConfigFile(workspaceRoot: string): Promise<void> {
    try {
      await fs.access(this.configPath);
      return;
    } catch {
      // doesn't exist — create it
    }

    let patterns: string[] = [];

    const gitignorePath = path.join(workspaceRoot, '.gitignore');
    try {
      const content = await fs.readFile(gitignorePath, 'utf-8');
      patterns = content
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'));
    } catch {
      // no .gitignore — start empty
    }

    await this.writeFile(patterns);
  }

  private async writeFile(patterns: string[]): Promise<void> {
    const lines = [
      '# Backup Manager ignore patterns',
      '# One pattern per line (.gitignore syntax)',
      '',
      ...patterns,
      '',
    ];
    await fs.writeFile(this.configPath, lines.join('\n'), 'utf-8');
  }

  async getPatterns(): Promise<string[]> {
    return [...this.patterns];
  }

  getGlobPatterns(): string[] {
    return this.patterns.map(p => p.includes('/') ? p : `**/${p}`);
  }

  async updatePatterns(newPatterns: string[]): Promise<void> {
    this.patterns = newPatterns;
    this.ign = ignore();
    this.ign.add('.git');
    this.ign.add(newPatterns);

    await this.writeFile(newPatterns);
  }

  shouldIgnore(filePath: string): boolean {
    if (filePath === '.backupmanagerignore') return true;
    if (!filePath) return true;
    return this.ign.ignores(filePath);
  }

  filterFiles(files: string[]): string[] {
    return files.filter((f) => !this.shouldIgnore(f));
  }
}
