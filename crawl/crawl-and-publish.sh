#!/usr/bin/env bash
# Fetch schedule HTML, convert to data/events.json, commit and push if changed.
set -euo pipefail

CRAWL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_LOCAL="${CRAWL_DIR}/config.local.sh"
CONFIG_EXAMPLE="${CRAWL_DIR}/config.example.sh"

if [[ -f "${CONFIG_LOCAL}" ]]; then
  # shellcheck source=/dev/null
  source "${CONFIG_LOCAL}"
elif [[ -f "${CONFIG_EXAMPLE}" ]]; then
  # shellcheck source=/dev/null
  source "${CONFIG_EXAMPLE}"
else
  echo "Missing config: create ${CONFIG_LOCAL} from config.example.sh" >&2
  exit 1
fi

: "${REPO_DIR:?Set REPO_DIR in config.local.sh}"
: "${SCHEDULE_URL:?Set SCHEDULE_URL in config.local.sh}"
GIT_REMOTE="${GIT_REMOTE:-origin}"
GIT_BRANCH="${GIT_BRANCH:-main}"
CRAWL_USER_AGENT="${CRAWL_USER_AGENT:-drupalcon-schedule-builder-crawl/1.0}"
VENV_DIR="${VENV_DIR:-}"

if [[ ! -d "${REPO_DIR}/.git" ]]; then
  echo "REPO_DIR is not a git checkout: ${REPO_DIR}" >&2
  exit 1
fi

EVENTS_JSON="${REPO_DIR}/data/events.json"
CONVERTER="${CRAWL_DIR}/convert_schedule.py"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

TMP_HTML="${TMP_DIR}/schedule.html"
TMP_JSON="${TMP_DIR}/events.json"

log() {
  echo "[$(date -Iseconds)] $*"
}

PYTHON="python3"
if [[ -n "${VENV_DIR}" ]]; then
  if [[ ! -x "${VENV_DIR}/bin/python" ]]; then
    log "Creating venv at ${VENV_DIR}"
    python3 -m venv "${VENV_DIR}"
    "${VENV_DIR}/bin/pip" install -q -r "${CRAWL_DIR}/requirements.txt"
  fi
  PYTHON="${VENV_DIR}/bin/python"
fi

log "Fetching ${SCHEDULE_URL}"
curl -fsSL \
  --compressed \
  -A "${CRAWL_USER_AGENT}" \
  -o "${TMP_HTML}" \
  "${SCHEDULE_URL}"

log "Converting HTML to JSON"
"${PYTHON}" "${CONVERTER}" -i "${TMP_HTML}" -o "${TMP_JSON}"

EVENT_COUNT="$("${PYTHON}" -c "import json; print(len(json.load(open('${TMP_JSON}'))['events']))")"
if [[ "${EVENT_COUNT}" -eq 0 ]]; then
  log "ERROR: converter produced 0 events; refusing to update ${EVENTS_JSON}" >&2
  exit 1
fi

if [[ -f "${EVENTS_JSON}" ]] && cmp -s "${TMP_JSON}" "${EVENTS_JSON}"; then
  log "No changes (${EVENT_COUNT} events); skipping git push"
  exit 0
fi

mkdir -p "$(dirname "${EVENTS_JSON}")"
cp "${TMP_JSON}" "${EVENTS_JSON}"

cd "${REPO_DIR}"
git add data/events.json

if git diff --staged --quiet; then
  log "No staged changes after copy; skipping commit"
  exit 0
fi

COMMIT_MSG="Update schedule data from events.drupal.org ($(date -u +%Y-%m-%dT%H:%MZ))"

log "Committing and pushing (${EVENT_COUNT} events)"
git commit -m "${COMMIT_MSG}"
git push "${GIT_REMOTE}" "${GIT_BRANCH}"

log "Done — GitHub Pages will rebuild from ${GIT_BRANCH}"
