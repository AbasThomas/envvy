# envvy

> Securely back up, version, and share environment variables across teams and projects.

The official CLI for [envvy.pxxl.pro](https://envvy.pxxl.pro).

## Installation

```bash
# Install globally to use anywhere
npm install -g envvy-cli

# Or use it with npx without installing
npx envvy-cli --help
```

You can also use the alias `envii`:
```bash
npm install -g envvy-cli
envii login
```

## Quick Start

1. **Login** to your envvy account:
   ```bash
   envvy login
   ```

2. **Initialize** your project:
   ```bash
   envvy init
   ```

3. **Backup** your `.env`:
   ```bash
   envvy backup -m "Initial backup"
   ```

4. **Restore** on another machine:
   ```bash
   envvy restore
   ```

## All Commands

| Command | Description |
| --- | --- |
| `login` | Authenticate with your envvy account |
| `init` | Link current directory to a repo |
| `backup` | Push current .env to envvy |
| `restore` | Pull the latest version into .env |
| `list` | List all your repositories |
| `push` | Sync local .env using staged message |
| `pull` | Download latest snapshot |
| `watch` | Watch .env changes and auto-prompt for backup |
| `fork <slug>` | Fork a public repository |
| `star <slug>` | Star a public repository |

## Features

- **Encrypted Snapshots**: AES-256-GCM encryption for all your secrets.
- **Version History**: Roll back to any previous state easily.
- **Team Sharing**: Share environment sets with your team securely.
- **Auto-Watch**: Let the CLI detect changes and keep your remote in sync.

## Security

- Zero-knowledge encryption: Use `-k` or `--key` to encrypt locally before sending to our servers.
- Secure token storage: Tokens are saved in `~/.envvy/config.json` with appropriate permissions.

## License

MIT © [envvy](https://envvy.pxxl.pro)
