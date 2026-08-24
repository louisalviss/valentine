from pathlib import Path
from itertools import combinations
from PIL import Image, ImageOps
import json

ROOT = Path('flow-ab/qa/output')
SCREENS = ROOT / 'screens'
variants = list('ABCDEFGH')
views = ['mobile', 'desktop']

# Mean absolute grayscale difference after aggressive thumbnail reduction.
# Higher = more visually different. This is a flagging heuristic only.
def vector(path):
    im = Image.open(path).convert('L')
    im = ImageOps.autocontrast(im)
    im.thumbnail((64, 64))
    canvas = Image.new('L', (64, 64), 255)
    x = (64 - im.width) // 2
    y = (64 - im.height) // 2
    canvas.paste(im, (x, y))
    return list(canvas.getdata())

def mad(a, b):
    return sum(abs(x-y) for x,y in zip(a,b)) / len(a)

report = {'views': {}, 'flag_threshold': 18.0}
flags = []
for view in views:
    vecs = {k: vector(SCREENS / f'{k}-{view}.png') for k in variants}
    pairs = []
    for a,b in combinations(variants, 2):
        d = round(mad(vecs[a], vecs[b]), 2)
        pairs.append({'pair': f'{a}-{b}', 'difference': d})
        if d < report['flag_threshold']:
            flags.append({'view': view, 'pair': f'{a}-{b}', 'difference': d})
    pairs.sort(key=lambda x: x['difference'])
    report['views'][view] = {
        'closest_pairs': pairs[:10],
        'all_pairs': pairs
    }
report['flags'] = flags
(ROOT / 'silhouette-report.json').write_text(json.dumps(report, indent=2))

lines = ['# A-H silhouette QA', '', f"Heuristic flag threshold: MAD < {report['flag_threshold']}", '',
         'This score is only a review trigger. Human judgment remains authoritative.', '']
for view in views:
    lines += [f'## {view}', '', '| Pair | Difference |', '|---|---:|']
    for row in report['views'][view]['closest_pairs']:
        lines.append(f"| {row['pair']} | {row['difference']:.2f} |")
    lines.append('')
if flags:
    lines += ['## Flagged for human review', '']
    for f in flags:
        lines.append(f"- {f['view']} {f['pair']}: {f['difference']:.2f}")
else:
    lines += ['## Flagged for human review', '', '- None below heuristic threshold.']
(ROOT / 'silhouette-report.md').write_text('\n'.join(lines) + '\n')
print('\n'.join(lines))
