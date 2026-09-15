# Schedule crawl (Pi / cron)

Fetches the official DrupalCon schedule HTML, converts it to `data/events.json`, and pushes to GitHub when the schedule changes. GitHub Pages continues to host the app; only the JSON file updates.

## Files

| File | Purpose |
|------|---------|
| `crawl-and-publish.sh` | Main job: curl → convert → git commit/push |
| `convert_schedule.py` | HTML → JSON (same shape as the Vienna app) |
| `config.example.sh` | Template; copy to `config.local.sh` on the Pi |
| `requirements.txt` | BeautifulSoup for the converter |

## One-off test (any machine)

```bash
cd crawl
python3 -m venv venv && ./venv/bin/pip install -r requirements.txt
curl -fsSL -A "drupalcon-schedule-builder-crawl/1.0" \
  -o /tmp/schedule.html \
  "https://events.drupal.org/rotterdam2026/schedule"
./venv/bin/python convert_schedule.py -i /tmp/schedule.html -o /tmp/events.json
```

## Pi deployment (GitHub Pages unchanged)

1. **SSH deploy key on GitHub**  
   On the Pi: `ssh-keygen -t ed25519 -f ~/.ssh/drupalcon_schedule -N ""`  
   Add `~/.ssh/drupalcon_schedule.pub` as a **deploy key** on the repo (write access):  
   `aboros/drupalcon-vienna-2025-calendar-builder`

2. **Clone the site repo** (separate from this monorepo if needed):

   ```bash
   GIT_SSH_COMMAND='ssh -i ~/.ssh/drupalcon_schedule -o IdentitiesOnly=yes' \
     git clone git@github.com:aboros/drupalcon-vienna-2025-calendar-builder.git \
     ~/drupalcon-vienna-2025-calendar-builder
   ```

3. **Configure** (same clone includes `crawl/`):

   ```bash
   cp ~/drupalcon-vienna-2025-calendar-builder/crawl/config.example.sh \
      ~/drupalcon-vienna-2025-calendar-builder/crawl/config.local.sh
   ```

   Set `REPO_DIR` to the clone root and `VENV_DIR` to e.g. `~/drupalcon-vienna-2025-calendar-builder/crawl/venv`.

4. **Run once manually**:

   ```bash
   chmod +x ~/drupalcon-vienna-2025-calendar-builder/crawl/crawl-and-publish.sh
   ~/drupalcon-vienna-2025-calendar-builder/crawl/crawl-and-publish.sh
   ```

   Confirm a commit on `main` and that GitHub Pages still serves the app with updated sessions.

5. **Cron every 15 minutes**:

   ```bash
   crontab -e
   ```

   ```cron
   */15 * * * * GIT_SSH_COMMAND='ssh -i /home/pi/.ssh/drupalcon_schedule -o IdentitiesOnly=yes' /home/pi/drupalcon-vienna-2025-calendar-builder/crawl/crawl-and-publish.sh >> /home/pi/drupalcon-vienna-2025-calendar-builder/crawl/crawl.log 2>&1
   ```

## Notes

- The job compares **generated JSON**, not raw HTML, so cosmetic page changes do not trigger commits.
- If the converter returns **0 events** (broken markup), the script exits without overwriting `data/events.json`.
- Point `SCHEDULE_URL` at another conference path when the event changes; the HTML structure is the same on events.drupal.org.
