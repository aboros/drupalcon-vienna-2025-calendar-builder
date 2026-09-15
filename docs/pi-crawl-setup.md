# Raspberry Pi crawl setup

This documents the **production** crawl environment on the home Pi (`ssh pi`, user `piri`). GitHub Pages hosting is unchanged; the Pi only updates `data/events.json` in the repo when the official schedule changes.

## Layout

| Path | Description |
|------|-------------|
| `~/projects/drupalcon-schedule-builder` | Git clone of [aboros/drupalcon-schedule-builder](https://github.com/aboros/drupalcon-schedule-builder) |
| `…/crawl/crawl-and-publish.sh` | Cron-ready entry point |
| `…/crawl/config.local.sh` | Local config (not in git) |
| `…/crawl/venv/` | Python venv with BeautifulSoup |
| `…/crawl/crawl.log` | Optional log file (create via cron redirect) |

## GitHub authentication

The Pi’s default GitHub key (`~/.ssh/id_ed25519_github`) is tied to another GitHub account and **cannot** push to `aboros/drupalcon-schedule-builder`.

A **deploy key** was added instead:

- **Key file:** `~/.ssh/id_ed25519_drupalcon_schedule`
- **GitHub title:** `pi-drupalcon-schedule-crawl` (write access)
- **SSH config** (`~/.ssh/config`):

  ```
  Host github-drupalcon
      HostName github.com
      User git
      IdentityFile ~/.ssh/id_ed25519_drupalcon_schedule
      IdentitiesOnly yes
  ```

- **Remote URL** in the clone:

  ```bash
  git remote -v
  # origin  git@github-drupalcon:aboros/drupalcon-schedule-builder.git
  ```

No `GIT_SSH_COMMAND` is required in cron when using this remote.

## Local configuration

`~/projects/drupalcon-schedule-builder/crawl/config.local.sh`:

```bash
REPO_DIR="/home/piri/projects/drupalcon-schedule-builder"
SCHEDULE_URL="https://events.drupal.org/rotterdam2026/schedule"
GIT_REMOTE="origin"
GIT_BRANCH="main"
VENV_DIR="/home/piri/projects/drupalcon-schedule-builder/crawl/venv"
CRAWL_USER_AGENT="drupalcon-schedule-builder-crawl/1.0"
```

Copy from [`crawl/config.example.sh`](../crawl/config.example.sh) if you need to recreate it.

## Manual run

```bash
ssh pi '~/projects/drupalcon-schedule-builder/crawl/crawl-and-publish.sh'
```

Expected outcomes:

- **No changes:** log line `No changes (N events); skipping git push`
- **Schedule updated on events.drupal.org:** new commit on `main`, GitHub Pages rebuilds

After pulling script updates from GitHub on the Pi:

```bash
cd ~/projects/drupalcon-schedule-builder
git pull origin main
```

Preserve `crawl/config.local.sh` and `crawl/venv/` (both outside git).

## Cron (not installed yet)

When ready, as user `piri`:

```bash
crontab -e
```

```cron
*/15 * * * * /home/piri/projects/drupalcon-schedule-builder/crawl/crawl-and-publish.sh >> /home/piri/projects/drupalcon-schedule-builder/crawl/crawl.log 2>&1
```

## Rotating or replacing the deploy key

1. Generate a new key on the Pi.
2. Add the public key as a deploy key on the GitHub repo (write access).
3. Update `IdentityFile` under `Host github-drupalcon` if the path changes.
4. Remove the old deploy key in GitHub repo settings.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `0 events` / script exits 1 | Schedule HTML structure changed; update `convert_schedule.py` selectors or regex |
| `Permission denied` on push | Wrong SSH key or deploy key removed from GitHub |
| `git pull` conflicts in `crawl/` | Untracked files from an old rsync; remove `crawl/` and pull again, restore `config.local.sh` |
| Stale page title in browser tab | Hard refresh or clear site data after deploy |

See also [rotterdam-schedule-crawl.md](./rotterdam-schedule-crawl.md) for the overall design and file changes.
