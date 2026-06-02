# Backup Manager

**Create restore points for your workspace. Browse, restore files, folders, or entire backups.**

A VS Code extension for manual workspace backups — no Git required.

## Features

- **Create Backup** — One-click snapshot of your workspace
- **Backup Explorer** — Browse backups organized by project in the Activity Bar
- **Restore Anything** — Restore entire backups, folders, or individual files
- **Ignore Patterns** — Git-style rules via `backup-manager.json`
- **Project-based Storage** — Backups are grouped by project name

## Commands

| Command | Where | Description |
|---------|-------|-------------|
| **Create Backup** | View title (3-dot menu) | Create a new workspace backup |
| **Restore Backup** | Right-click a backup | Restore the entire backup |
| **Restore File** | Right-click a file | Restore a single file |
| **Restore Folder** | Right-click a folder | Restore a folder |
| **Delete Backup** | Right-click a backup | Delete a backup |
| **Refresh** | View title (icon) | Refresh the backup explorer |
| **Open Backup Storage** | View title (3-dot menu) | Open the backup folder |

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `backupManager.maxBackups` | number | `50` | Maximum number of backups to retain |

## Ignore Patterns

Create `backup-manager.json` in your workspace root:

```json
{
  "ignore": [
    "node_modules/**",
    "dist/**",
    ".git/**",
    "*.log",
    ".env"
  ]
}
```

Also respects `.gitignore` if present.

## Usage

1. Open a workspace folder
2. Click the **Backup Manager** icon in the Activity Bar
3. Click **Create Backup** from the `...` menu
4. Browse backups, expand to see files, right-click to restore


## License

MIT
