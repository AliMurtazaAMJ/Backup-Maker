import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import ignore, { Ignore } from 'ignore';

const CONFIG_FILENAME = 'backup-manager.json';
const DEFAULT_IGNORE = ['node_modules/**', 'dist/**', '.git/**', '*.log', '*.tmp', '.env', '.vscode/**', 'backup-manager.json'];

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
      const configContent = await fs.readFile(this.configPath, 'utf-8');
      const config = JSON.parse(configContent);
      if (config.ignore && Array.isArray(config.ignore)) {
        this.patterns = config.ignore;
        this.ign.add(config.ignore);
      }
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
      patterns = [...DEFAULT_IGNORE];
    }

    if (patterns.length === 0) {
      patterns = [...DEFAULT_IGNORE];
    }

    const config = { ignore: patterns };
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  async getPatterns(): Promise<string[]> {
    return [...this.patterns];
  }

  async updatePatterns(newPatterns: string[]): Promise<void> {
    this.patterns = newPatterns;
    this.ign = ignore();
    this.ign.add('.git');
    this.ign.add(newPatterns);

    const config = { ignore: newPatterns };
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
  }

  shouldIgnore(filePath: string): boolean {
    if (!filePath || filePath.startsWith('.')) {
      return true;
    }
    return this.ign.ignores(filePath);
  }

  filterFiles(files: string[]): string[] {
    return files.filter((f) => !this.shouldIgnore(f));
  }
}
