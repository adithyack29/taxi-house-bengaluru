"""
Builds client/src/data/areas.json for the /taxi-service-in-{area} landing pages.

Inputs (kept next to this script's output in the scratch folder when regenerating):
  groups.json  {area name: [sub-areas merged into it]}
  geo.json     {area name: {lat, lng} | null}   (OpenStreetMap Nominatim)
Road distance/time come from the public OSRM table service, to: KIA airport, the city centre and
every outstation route in data/fares.json.

Usage: python scripts/build-areas.py <folder with groups.json + geo.json>
"""
import json
import math
import re
import sys
import time
import urllib.request
from pathlib import Path

src = Path(sys.argv[1])
client = Path(__file__).resolve().parent.parent
fares = json.loads((client / 'src/data/fares.json').read_text(encoding='utf-8'))
groups = json.loads((src / 'groups.json').read_text(encoding='utf-8'))
geo = json.loads((src / 'geo.json').read_text(encoding='utf-8'))

CENTRE = (12.9716, 77.5946)
AIRPORT = (13.1986, 77.7066)
DESTS = [('airport', AIRPORT), ('centre', CENTRE)] + [
    (r['slug'], tuple(map(float, r['coord'].split(',')))) for r in fares['routes']]


def slugify(name):
    s = name.lower().replace('&', ' and ').replace('.', ' ')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def hav(a, b):
    r = 6371.0
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


def bearing(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (a[0], a[1], b[0], b[1]))
    y = math.sin(lo2 - lo1) * math.cos(la2)
    x = math.cos(la1) * math.sin(la2) - math.sin(la1) * math.cos(la2) * math.cos(lo2 - lo1)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def zone(p):
    if hav(CENTRE, p) < 4.5:
        return 'central'
    b = bearing(CENTRE, p)
    return 'north' if b >= 315 or b < 45 else 'east' if b < 135 else 'south' if b < 225 else 'west'


areas, skipped, flagged = [], [], []
seen = {}
for name, subs in groups.items():
    g = geo.get(name)
    if not g:
        skipped.append(name)
        continue
    p = (g['lat'], g['lng'])
    key = (round(p[0], 4), round(p[1], 4))
    if key in seen:
        flagged.append(f'{name}: same point as {seen[key]}')
    seen[key] = name
    if hav(CENTRE, p) > 48:
        flagged.append(f'{name}: {hav(CENTRE, p):.0f} km from centre')
    areas.append({'slug': slugify(name), 'name': name, 'subs': subs, 'lat': p[0], 'lng': p[1], 'zone': zone(p)})

# OSRM table: areas (sources) x destinations, in chunks to stay under the public server's limits.
dest_str = ';'.join(f'{lng},{lat}' for _, (lat, lng) in DESTS)
CHUNK = 50
for i in range(0, len(areas), CHUNK):
    chunk = areas[i:i + CHUNK]
    coords = ';'.join(f"{a['lng']},{a['lat']}" for a in chunk) + ';' + dest_str
    n = len(chunk)
    url = (f'https://router.project-osrm.org/table/v1/driving/{coords}'
           f'?sources={";".join(map(str, range(n)))}'
           f'&destinations={";".join(map(str, range(n, n + len(DESTS))))}&annotations=distance,duration')
    req = urllib.request.Request(url, headers={'User-Agent': 'area-page-builder/1.0'})
    with urllib.request.urlopen(req, timeout=60) as r:
        t = json.load(r)
    assert t.get('code') == 'Ok', t
    for a, dist_row, dur_row in zip(chunk, t['distances'], t['durations']):
        a['routes'] = {}
        for (key, _), d, s in zip(DESTS, dist_row, dur_row):
            if d is None:
                continue
            val = {'km': round(d / 1000), 'min': round(s / 60)}
            if key in ('airport', 'centre'):
                a[key] = val
            else:
                a['routes'][key] = val
    time.sleep(1)

# Nearby areas: 6 closest by straight line.
for a in areas:
    others = sorted((hav((a['lat'], a['lng']), (b['lat'], b['lng'])), b['slug']) for b in areas if b is not a)
    a['nearby'] = [s for d, s in others[:6]]
    a['lat'] = round(a['lat'], 5)
    a['lng'] = round(a['lng'], 5)

areas = [a for a in areas if a.get('airport')]
slugs = [a['slug'] for a in areas]
assert len(slugs) == len(set(slugs)), 'duplicate slugs'
out = client / 'src/data/areas.json'
out.write_text(json.dumps(areas, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'wrote {len(areas)} areas to {out.relative_to(client)} ({out.stat().st_size // 1024} KB)')
print('zones:', {z: sum(1 for a in areas if a['zone'] == z) for z in ('central', 'north', 'east', 'south', 'west')})
print('skipped (no coordinates):', skipped)
print('check:', flagged)
