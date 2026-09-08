"""Deterministic public projection of the owner's mos.ru CSV archive; no network."""
import argparse
import csv
import hashlib
import io
import json
import re
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'apps/web/content/year-schedule.generated.json'
DAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']


def require(condition, message):
    if not condition:
        raise ValueError(message)


def number(raw, field):
    if raw == '':
        return None
    require(bool(re.fullmatch(r'\d+', raw)), 'Invalid nonnegative integer: ' + field)
    return int(raw)


def iso(raw):
    require(bool(re.fullmatch(r'\d{4}-\d{2}-\d{2}', raw)), 'Invalid date')
    date.fromisoformat(raw)
    return raw


def clock(raw):
    require(bool(re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', raw)), 'Invalid lesson time')
    return raw


def index(rows, key):
    result = {}
    for row in rows:
        value = key(row)
        require(value not in result, 'Duplicate source key')
        result[value] = row
    return result


def project(tables, digest):
    cards = index(tables['cards'], lambda r: r['listing_id'])
    groups = index(tables['groups'], lambda r: r['group_code'])
    locations = index(tables['locations'], lambda r: (r['school'], r['address']))
    require(len({r['location_id'] for r in locations.values()}) == len(locations), 'Duplicate location ID')
    slots = {key: [] for key in groups}
    seen = set()
    for row in tables['schedule']:
        group = groups.get(row['group_code'])
        require(group is not None, 'Orphan schedule group')
        for field in ['listing_id', 'school', 'address', 'course_start', 'course_end']:
            require(row[field] == group[field], 'Schedule/group conflict: ' + field)
        require(row['weekday'] in DAYS, 'Unknown weekday')
        start, end = clock(row['start_time']), clock(row['end_time'])
        require(start < end, 'Invalid time range')
        key = (row['group_code'], row['weekday'], start, end)
        require(key not in seen, 'Duplicate weekly slot')
        seen.add(key)
        slots[row['group_code']].append({'weekday': row['weekday'], 'start': start, 'end': end})
    public_groups = []
    for code, row in groups.items():
        card = cards.get(row['listing_id'])
        require(card is not None, 'Orphan listing')
        require(bool(re.fullmatch(r'\d+', row['listing_id'])), 'Invalid listing ID')
        require(card['school'] == row['school'], 'Card/group school conflict')
        require(card['course_title'] == row['course_title'], 'Card/group title conflict')
        require(re.search(r'школа\s+молодого', card['course_title'], re.I) is not None, 'Unmapped programme; owner mapping required')
        location = locations.get((row['school'], row['address']))
        require(location is not None, 'Unknown exact school/address')
        require(slots[code], 'Missing weekly schedule')
        start, end = iso(row['course_start']), iso(row['course_end'])
        require(start <= end, 'Invalid course period')
        require(row['status'] in ['Идет прием', 'Прием закрыт'], 'Unknown reception status')
        for field in ['search_url', 'direct_card_id', 'direct_url']:
            require(row[field] == card[field], 'Card/group link conflict: ' + field)
        search = 'https://www.mos.ru/pgu2/activity/groups?keyword=' + row['listing_id']
        require(row['search_url'] == search, 'Unsafe or mismatched search URL')
        direct_id = row['direct_card_id']
        require(not direct_id or re.fullmatch(r'\d+', direct_id), 'Invalid direct card ID')
        direct = 'https://www.mos.ru/pgu2/activity/card/' + direct_id if direct_id else None
        require((row['direct_url'] or None) == direct, 'Unsafe or mismatched direct URL')
        total, free, occupied = [number(row[f], f) for f in ['total_seats', 'free_seats', 'occupied_seats']]
        require(total is not None and free is not None and occupied is not None, 'Missing seat counts')
        require(free <= total and free + occupied == total, 'Inconsistent seat counts')
        minimum, maximum = number(row['age_min'], 'age_min'), number(row['age_max'], 'age_max')
        require((minimum is None and maximum is None) or (minimum is not None and maximum is not None and minimum <= maximum), 'Invalid age range')
        synthetic = code.startswith('listing:')
        require(not synthetic or code == 'listing:' + row['listing_id'], 'Invalid synthetic key')
        # Do not republish registry-derived teacher names or inferred capacities.
        teacher = None if synthetic or 'реестр' in row['teacher_basis'].lower() else row['teacher_preferred'] or None
        title = re.sub(r'^\(26-27\)\s*\d+\s*БНК\s*', '', row['course_title'])
        title = re.sub(r'\.\s*Педагог:.*$', '', title).strip()
        public_groups.append({
            'id': code, 'groupCode': None if synthetic else code, 'listingId': row['listing_id'],
            'programme': 'shmi', 'title': title, 'locationId': location['location_id'],
            'teacher': teacher, 'status': 'open' if row['status'] == 'Идет прием' else 'closed',
            'totalSeats': None if synthetic else total, 'freeSeats': None if synthetic else free,
            'ageMin': minimum, 'ageMax': maximum,
            'lessonPrice': number(row['lesson_price_rub'], 'lesson_price_rub'),
            'coursePrice': number(row['course_price_rub'], 'course_price_rub'),
            'courseStart': start, 'courseEnd': end,
            'slots': sorted(slots[code], key=lambda s: (DAYS.index(s['weekday']), s['start'])),
            'link': direct or search, 'linkKind': 'card' if direct else 'search',
            'limitedSource': synthetic,
        })
    used = {g['locationId'] for g in public_groups}
    require(used == {r['location_id'] for r in locations.values()}, 'Unused source location')
    require(set(cards) == {g['listingId'] for g in public_groups}, 'Unused source card')
    return {
        'version': 1, 'asOf': '2026-09-08', 'sourceSha256': digest,
        'locations': [{'id': r['location_id'], 'school': r['school'], 'address': r['address'], 'metro': r['metro'] or None}
                      for r in sorted(locations.values(), key=lambda x: x['location_id'])],
        'groups': sorted(public_groups, key=lambda g: (g['locationId'], DAYS.index(g['slots'][0]['weekday']), g['slots'][0]['start'], g['id'])),
    }


def read_archive(path):
    require(path.stat().st_size <= 5_000_000, 'Archive too large')
    with zipfile.ZipFile(path) as archive:
        require(sum(i.file_size for i in archive.infolist()) <= 10_000_000, 'Expanded archive too large')
        tables = {}
        # Deliberately never read applications_1517.csv into the importer.
        for name in ['cards', 'groups', 'locations', 'schedule']:
            require(archive.namelist().count(name + '.csv') == 1, 'Missing/duplicate CSV member')
            tables[name] = list(csv.DictReader(io.StringIO(archive.read(name + '.csv').decode('utf-8-sig'))))
            require(0 < len(tables[name]) <= 10000, 'Empty or oversized CSV')
        return project(tables, hashlib.sha256(path.read_bytes()).hexdigest())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    action = parser.add_mutually_exclusive_group(required=True)
    action.add_argument('--write', action='store_true')
    action.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = read_archive(args.archive)
    content = json.dumps(result, ensure_ascii=False, indent=2) + '\n'
    if args.check:
        require(OUTPUT.read_text() == content, 'Generated projection drift')
    else:
        OUTPUT.write_text(content, encoding='utf-8')
    print(json.dumps({'groups': len(result['groups']), 'slots': sum(len(g['slots']) for g in result['groups']),
                      'locations': len(result['locations']), 'open': sum(g['status'] == 'open' for g in result['groups']),
                      'mode': 'check' if args.check else 'write', 'sourceSha256': result['sourceSha256']}))


if __name__ == '__main__':
    main()
