"""
Builds client/src/data/destinations.json for the /bangalore-to-{place}-cab route pages.

For each destination: coordinates (OpenStreetMap Nominatim), road distance, drive time and the
main roads used (OSRM route summary) from Bengaluru city centre (12.9716, 77.5946).
The 9 routes already in data/fares.json keep their checked coordinates.
Destinations are limited to the states the business serves (Karnataka, Tamil Nadu, Kerala,
Andhra Pradesh) plus Puducherry.

Usage: python scripts/build-routes.py [cache-folder]
"""
import json
import re
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

client = Path(__file__).resolve().parent.parent
cache_dir = Path(sys.argv[1]) if len(sys.argv) > 1 else client / '.cache'
cache_dir.mkdir(parents=True, exist_ok=True)
cache_file = cache_dir / 'destinations-geo.json'
cache = json.loads(cache_file.read_text(encoding='utf-8')) if cache_file.exists() else {}
CENTRE = (12.9716, 77.5946)
UA = {'User-Agent': 'route-page-builder/1.0 (one-off batch)'}

# name, nominatim query, state, kind, short factual note
DESTS = [
    ('Mysuru', 'Mysuru, Karnataka', 'Karnataka', 'heritage', 'The palace city: Mysore Palace, Chamundi Hills and Brindavan Gardens, with Srirangapatna on the way.'),
    ('Coorg', 'Madikeri, Karnataka', 'Karnataka', 'hills', 'Coffee estates and misty hills around Madikeri — Abbey Falls, Raja’s Seat and the Golden Temple at Bylakuppe en route.'),
    ('Chikkamagaluru', 'Chikkamagaluru, Karnataka', 'Karnataka', 'hills', 'Coffee country with Mullayanagiri, Karnataka’s highest peak, and Baba Budangiri nearby.'),
    ('Sakleshpur', 'Sakleshpur, Karnataka', 'Karnataka', 'hills', 'A quiet Western Ghats hill town of coffee and spice estates, with Manjarabad Fort close by.'),
    ('Kabini', 'Kabini, Karnataka', 'Karnataka', 'wildlife', 'Riverside lodges on the edge of Nagarhole National Park, known for jungle safaris.'),
    ('Bandipur', 'Bandipur, Karnataka', 'Karnataka', 'wildlife', 'Bandipur National Park on the Mysuru–Ooty road, a tiger reserve with forest safaris.'),
    ('Nandi Hills', 'Nandi Hills, Karnataka', 'Karnataka', 'hills', 'The closest hill escape to Bengaluru — sunrise views and the Bhoga Nandeeshwara temple at the foot.'),
    ('Hampi', 'Hampi, Karnataka', 'Karnataka', 'heritage', 'The ruins of the Vijayanagara capital, a UNESCO World Heritage Site on the Tungabhadra.'),
    ('Badami', 'Badami, Karnataka', 'Karnataka', 'heritage', 'Rock-cut cave temples, with Aihole and Pattadakal close by.'),
    ('Shivamogga', 'Shivamogga, Karnataka', 'Karnataka', 'city', 'Gateway to the Malnad region, Jog Falls and the Sakrebyle elephant camp.'),
    ('Jog Falls', 'Jog Falls, Karnataka', 'Karnataka', 'nature', 'One of India’s highest plunge waterfalls, on the Sharavathi river.'),
    ('Mangaluru', 'Mangaluru, Karnataka', 'Karnataka', 'beach', 'The coastal city of Karnataka — beaches, temples and the route down the Shiradi Ghat.'),
    ('Udupi', 'Udupi, Karnataka', 'Karnataka', 'temple', 'Home of the Sri Krishna Matha, with Malpe beach a short drive away.'),
    ('Gokarna', 'Gokarna, Karnataka', 'Karnataka', 'beach', 'Temple town and quiet beaches — Om Beach, Kudle and Half Moon.'),
    ('Murudeshwar', 'Murudeshwar, Karnataka', 'Karnataka', 'temple', 'Seaside temple town with one of the tallest Shiva statues in the world.'),
    ('Dharmasthala', 'Dharmasthala, Karnataka', 'Karnataka', 'temple', 'The Sri Manjunatha Swamy temple on the Netravati river.'),
    ('Kukke Subramanya', 'Subramanya, Karnataka', 'Karnataka', 'temple', 'The Kukke Subramanya temple in the Western Ghats, often paired with Dharmasthala.'),
    ('Sringeri', 'Sringeri, Karnataka', 'Karnataka', 'temple', 'The Sringeri Sharada Peetham on the banks of the Tunga.'),
    ('Horanadu', 'Horanadu, Karnataka', 'Karnataka', 'temple', 'The Annapoorneshwari temple deep in the Malnad hills.'),
    ('Hassan', 'Hassan, Karnataka', 'Karnataka', 'city', 'Base for the Hoysala temples of Belur and Halebidu.'),
    ('Belur', 'Belur, Hassan, Karnataka', 'Karnataka', 'heritage', 'The Chennakeshava temple, a masterpiece of Hoysala carving, with Halebidu nearby.'),
    ('Shravanabelagola', 'Shravanabelagola, Karnataka', 'Karnataka', 'heritage', 'The monolithic Gommateshwara (Bahubali) statue on Vindhyagiri hill.'),
    ('Chitradurga', 'Chitradurga, Karnataka', 'Karnataka', 'heritage', 'The stone fort of Chitradurga, on the way north to Hampi.'),
    ('Hubballi', 'Hubballi, Karnataka', 'Karnataka', 'city', 'North Karnataka’s commercial hub, twin city of Dharwad.'),
    ('Davanagere', 'Davanagere, Karnataka', 'Karnataka', 'city', 'Central Karnataka city on the NH 48 corridor.'),
    ('Tumakuru', 'Tumakuru, Karnataka', 'Karnataka', 'city', 'A short run up NH 48, home of the Siddaganga Matha.'),
    ('Kolar', 'Kolar, Karnataka', 'Karnataka', 'city', 'East of Bengaluru, with the Kolaramma temple and Antaragange caves.'),
    ('Ooty', 'Ooty, Tamil Nadu', 'Tamil Nadu', 'hills', 'The Nilgiris hill station — tea gardens, the lake, Doddabetta and the toy train.'),
    ('Kodaikanal', 'Kodaikanal, Tamil Nadu', 'Tamil Nadu', 'hills', 'The “princess of hill stations” — the lake, Coaker’s Walk and pine forests.'),
    ('Yercaud', 'Yercaud, Tamil Nadu', 'Tamil Nadu', 'hills', 'A small hill station in the Shevaroy Hills above Salem.'),
    ('Coimbatore', 'Coimbatore, Tamil Nadu', 'Tamil Nadu', 'city', 'Tamil Nadu’s industrial city, close to Isha Yoga Center and the Nilgiris.'),
    ('Chennai', 'Chennai, Tamil Nadu', 'Tamil Nadu', 'city', 'The Tamil Nadu capital, straight down the Bengaluru–Chennai highway.'),
    ('Madurai', 'Madurai, Tamil Nadu', 'Tamil Nadu', 'temple', 'The temple city of the Meenakshi Amman temple.'),
    ('Salem', 'Salem, Tamil Nadu', 'Tamil Nadu', 'city', 'On the way to Yercaud and the south of Tamil Nadu.'),
    ('Hosur', 'Hosur, Tamil Nadu', 'Tamil Nadu', 'city', 'Just across the state border on the Hosur Road industrial belt.'),
    ('Vellore', 'Vellore, Tamil Nadu', 'Tamil Nadu', 'city', 'Vellore Fort, CMC hospital and the Golden Temple at Sripuram.'),
    ('Kanchipuram', 'Kanchipuram, Tamil Nadu', 'Tamil Nadu', 'temple', 'The city of a thousand temples and silk sarees.'),
    ('Mahabalipuram', 'Mahabalipuram, Tamil Nadu', 'Tamil Nadu', 'heritage', 'The Shore Temple and Pallava rock carvings, a UNESCO site on the coast.'),
    ('Tiruvannamalai', 'Tiruvannamalai, Tamil Nadu', 'Tamil Nadu', 'temple', 'The Annamalaiyar temple and Arunachala hill.'),
    ('Tiruchirappalli', 'Tiruchirappalli, Tamil Nadu', 'Tamil Nadu', 'temple', 'Rockfort and Srirangam, one of the largest temple complexes in India.'),
    ('Thanjavur', 'Thanjavur, Tamil Nadu', 'Tamil Nadu', 'heritage', 'The Brihadeeswarar temple, a UNESCO World Heritage Site.'),
    ('Rameswaram', 'Rameswaram, Tamil Nadu', 'Tamil Nadu', 'temple', 'The Ramanathaswamy temple and the Pamban bridge.'),
    ('Kanyakumari', 'Kanyakumari, Tamil Nadu', 'Tamil Nadu', 'beach', 'India’s southern tip — the Vivekananda Rock Memorial and sunrise over three seas.'),
    ('Puducherry', 'Puducherry', 'Puducherry', 'beach', 'French Quarter streets, the promenade and Auroville.'),
    ('Wayanad', 'Kalpetta, Kerala', 'Kerala', 'hills', 'Green hills and plantations — Edakkal Caves, Banasura Sagar dam and Chembra Peak.'),
    ('Munnar', 'Munnar, Kerala', 'Kerala', 'hills', 'Kerala’s best-known tea hills, with Eravikulam National Park.'),
    ('Kochi', 'Kochi, Kerala', 'Kerala', 'city', 'Fort Kochi, Chinese fishing nets and the gateway to the backwaters.'),
    ('Alleppey', 'Alappuzha, Kerala', 'Kerala', 'nature', 'Houseboats on the Kerala backwaters.'),
    ('Thekkady', 'Thekkady, Kerala', 'Kerala', 'wildlife', 'Periyar Tiger Reserve and spice plantations.'),
    ('Kozhikode', 'Kozhikode, Kerala', 'Kerala', 'beach', 'Calicut’s beach, food and history on the Malabar coast.'),
    ('Guruvayur', 'Guruvayur, Kerala', 'Kerala', 'temple', 'The Guruvayur Sri Krishna temple near Thrissur.'),
    ('Palakkad', 'Palakkad, Kerala', 'Kerala', 'city', 'Kerala’s gateway through the Palakkad Gap, with the Palakkad Fort.'),
    ('Tirupati', 'Tirupati, Andhra Pradesh', 'Andhra Pradesh', 'temple', 'Gateway to the Sri Venkateswara temple at Tirumala.'),
    ('Srikalahasti', 'Srikalahasti, Andhra Pradesh', 'Andhra Pradesh', 'temple', 'The Srikalahasteeswara temple, often combined with Tirupati.'),
    ('Puttaparthi', 'Puttaparthi, Andhra Pradesh', 'Andhra Pradesh', 'temple', 'Prasanthi Nilayam, the ashram of Sri Sathya Sai Baba.'),
    ('Lepakshi', 'Lepakshi, Andhra Pradesh', 'Andhra Pradesh', 'heritage', 'The Veerabhadra temple with its hanging pillar and the giant Nandi.'),
    ('Anantapur', 'Anantapur, Andhra Pradesh', 'Andhra Pradesh', 'city', 'On NH 44 north of Bengaluru, towards Hyderabad.'),
]


FARES = json.loads((client / 'src/data/fares.json').read_text(encoding='utf-8'))
KNOWN = {r['slug']: tuple(map(float, r['coord'].split(','))) for r in FARES['routes']}


def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def geocode(q):
    if q in cache:
        return cache[q]
    url = 'https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': q, 'format': 'jsonv2', 'limit': 1, 'countrycodes': 'in'})
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as r:
        res = json.load(r)
    time.sleep(1.1)
    cache[q] = {'lat': float(res[0]['lat']), 'lng': float(res[0]['lon']), 'osm': res[0]['display_name'][:120]} if res else None
    cache_file.write_text(json.dumps(cache, indent=1, ensure_ascii=False), encoding='utf-8')
    return cache[q]


def route(lat, lng):
    url = (f'https://router.project-osrm.org/route/v1/driving/{CENTRE[1]},{CENTRE[0]};{lng},{lat}'
           '?overview=false&steps=false')
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
        d = json.load(r)
    time.sleep(0.5)
    assert d['code'] == 'Ok', d
    rt = d['routes'][0]
    return round(rt['distance'] / 1000), round(rt['duration'] / 60), rt['legs'][0].get('summary', '')


out, problems = [], []
for name, q, state, kind, about in DESTS:
    known = KNOWN.get(slugify(name))
    g = {'lat': known[0], 'lng': known[1]} if known else geocode(q)
    if not g:
        problems.append(f'no coordinates: {name}')
        continue
    km, mins, _ = route(g['lat'], g['lng'])
    out.append({'slug': slugify(name), 'name': name, 'state': state, 'kind': kind, 'about': about,
                'lat': round(g['lat'], 5), 'lng': round(g['lng'], 5), 'km': km, 'min': mins,
                'drop': f'{name}, {state}'})
    print(f'{name:18} {km:4} km {mins:4} min{"  (site coord)" if known else ""}')

out.sort(key=lambda d: d['km'])
dest = client / 'src/data/destinations.json'
dest.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print(f'wrote {len(out)} destinations; problems: {problems}')
