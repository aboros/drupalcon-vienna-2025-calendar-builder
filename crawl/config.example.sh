# Copy to config.local.sh on the Pi and adjust paths.
# config.local.sh is gitignored.

# Clone of the GitHub Pages repo (must be a git checkout with push access).
REPO_DIR="/home/piri/projects/drupalcon-schedule-builder"

# Official schedule page to crawl.
SCHEDULE_URL="https://events.drupal.org/rotterdam2026/schedule"

# Git push target when data/events.json changes.
GIT_REMOTE="origin"
GIT_BRANCH="main"

# Optional: Python virtualenv for BeautifulSoup (recommended).
# Leave empty to use `python3` from PATH.
VENV_DIR=""

# HTTP User-Agent sent to events.drupal.org.
CRAWL_USER_AGENT="drupalcon-schedule-builder-crawl/1.0"
