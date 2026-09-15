# Schedule crawl (Pi / cron)

Fetches the official DrupalCon schedule HTML, converts it to `data/events.json`, and pushes to GitHub when the schedule changes. GitHub Pages continues to host the app; only the JSON file updates.

Full change log and Pi setup notes: [`docs/`](../docs/README.md).

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

1. **Deploy key and clone** — see [docs/pi-crawl-setup.md](../docs/pi-crawl-setup.md) for the live Pi configuration (`github-drupalcon` SSH host, paths under `~/projects/`).

2. **Clone** (if setting up a new machine):

   ```bash
   git clone git@github-drupalcon:aboros/drupalcon-schedule-builder.git \
     ~/projects/drupalcon-schedule-builder
   ```

3. **Configure** (same clone includes `crawl/`):

   ```bash
   cp ~/projects/drupalcon-schedule-builder/crawl/config.example.sh \
      ~/projects/drupalcon-schedule-builder/crawl/config.local.sh
   ```

   Set `REPO_DIR` to the clone root and `VENV_DIR` to e.g. `~/projects/drupalcon-schedule-builder/crawl/venv`.

4. **Run once manually**:

   ```bash
   chmod +x ~/projects/drupalcon-schedule-builder/crawl/crawl-and-publish.sh
   ~/projects/drupalcon-schedule-builder/crawl/crawl-and-publish.sh
   ```

   Confirm a commit on `main` and that GitHub Pages still serves the app with updated sessions.

5. **Cron every 15 minutes**:

   ```bash
   crontab -e
   ```

   ```cron
   */15 * * * * /home/piri/projects/drupalcon-schedule-builder/crawl/crawl-and-publish.sh >> /home/piri/projects/drupalcon-schedule-builder/crawl/crawl.log 2>&1
   ```

## Notes

- The job compares **generated JSON**, not raw HTML, so cosmetic page changes do not trigger commits.
- If the converter returns **0 events** (broken markup), the script exits without overwriting `data/events.json`.
- Point `SCHEDULE_URL` at another conference path when the event changes; the HTML structure is the same on events.drupal.org.
