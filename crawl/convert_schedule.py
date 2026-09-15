#!/usr/bin/env python3
"""Convert DrupalCon schedule HTML (events.drupal.org) to events.json format."""
from __future__ import annotations

import argparse
import json
import os
import re
from datetime import datetime

from bs4 import BeautifulSoup

WHEN_FULL = re.compile(
    r"(\w+, \w+ \d+, \d+) - (\d{1,2}:\d{2}) to (\w+, \w+ \d+, \d+) - (\d{1,2}:\d{2})"
)
WHEN_SHORT = re.compile(r"(\w+, \w+ \d+, \d+) - (\d{1,2}:\d{2}) to (\d{1,2}:\d{2})")
DATE_FMT = "%A, %B %d, %Y"


def parse_when(when_text: str) -> tuple[datetime, datetime] | None:
    when_text = " ".join(when_text.split())

    match = WHEN_FULL.search(when_text)
    if match:
        start_date = datetime.strptime(match.group(1), DATE_FMT)
        end_date = datetime.strptime(match.group(3), DATE_FMT)
        start_dt = datetime.strptime(
            f"{start_date.strftime('%Y-%m-%d')} {match.group(2)}", "%Y-%m-%d %H:%M"
        )
        end_dt = datetime.strptime(
            f"{end_date.strftime('%Y-%m-%d')} {match.group(4)}", "%Y-%m-%d %H:%M"
        )
        return start_dt, end_dt

    match = WHEN_SHORT.search(when_text)
    if match:
        date_obj = datetime.strptime(match.group(1), DATE_FMT)
        day = date_obj.strftime("%Y-%m-%d")
        start_dt = datetime.strptime(f"{day} {match.group(2)}", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{day} {match.group(3)}", "%Y-%m-%d %H:%M")
        return start_dt, end_dt

    return None


def format_duration(start_dt: datetime, end_dt: datetime) -> str | None:
    delta = end_dt - start_dt
    if delta.total_seconds() <= 0:
        return None
    total_minutes = int(delta.total_seconds() // 60)
    hours = total_minutes // 60
    minutes = total_minutes % 60
    if hours > 0 and minutes > 0:
        return f"PT{hours}H{minutes}M"
    if hours > 0:
        return f"PT{hours}H"
    return f"PT{minutes}M"


def parse_schedule(input_file: str, output_file: str) -> list[dict]:
    with open(input_file, encoding="utf-8") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    events = []

    for session in soup.find_all("div", class_="node--type-session"):
        title_div = session.find("div", class_="field--name-node-title")
        if not title_div:
            continue
        title_link = title_div.find("a")
        title = title_link.get_text(strip=True) if title_link else ""
        link = title_link.get("href") if title_link else ""
        if link and not link.startswith("http"):
            link = f"https://events.drupal.org{link}"

        location = ""
        location_div = session.find("div", class_="field--name-field-location")
        if location_div:
            loc_item = location_div.find("div", class_="field__item")
            if loc_item:
                location = loc_item.get_text(strip=True)

        when_div = session.find("div", class_="field--name-field-when")
        if not when_div:
            continue
        when_item = when_div.find("div", class_="field__item")
        if not when_item:
            continue
        when_text = when_item.get_text(strip=True)

        parsed = parse_when(when_text)
        if not parsed:
            continue
        start_dt, end_dt = parsed
        duration = format_duration(start_dt, end_dt)
        if not duration:
            continue

        speakers = ""
        speakers_div = session.find("div", class_="field--name-field-speakers")
        if speakers_div:
            speakers = speakers_div.get_text(strip=True).replace("Speakers", "").strip()

        track = ""
        track_div = session.find("div", class_="field--name-field-track")
        if track_div:
            track_title_div = track_div.find("div", class_="field--name-taxonomy-term-title")
            if track_title_div:
                track_item = track_title_div.find("div", class_="field__item")
                if track_item:
                    track = track_item.get_text(strip=True)

        events.append(
            {
                "startTime": start_dt.isoformat(),
                "endTime": end_dt.isoformat(),
                "duration": duration,
                "summary": title,
                "location": location,
                "description": speakers,
                "link": link,
                "track": track,
            }
        )

    output = {"events": events}
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)
        f.write("\n")

    print(f"Converted {len(events)} events successfully!")
    print(f"Output saved to: {output_file}")
    return events


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.join(script_dir, "..")

    parser = argparse.ArgumentParser(description="Convert DrupalCon schedule HTML to JSON")
    parser.add_argument(
        "-i",
        "--input",
        required=True,
        help="Input HTML file path",
    )
    parser.add_argument(
        "-o",
        "--output",
        default=os.path.join(project_root, "data", "events.json"),
        help="Output JSON file path (default: data/events.json)",
    )

    args = parser.parse_args()

    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}")
        raise SystemExit(1)

    output_dir = os.path.dirname(args.output)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    parse_schedule(args.input, args.output)
