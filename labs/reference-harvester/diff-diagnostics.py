#!/usr/bin/env python3
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

if len(sys.argv) != 2:
    raise SystemExit('usage: python diff-diagnostics.py <reference-id>')

reference_id = sys.argv[1]
root = Path.cwd()
ref_dir = root / 'labs' / 'references' / reference_id
capture = json.loads((ref_dir / 'evidence' / 'capture.json').read_text())
local_capture = json.loads((ref_dir / 'evidence' / 'local' / 'capture.json').read_text())
local_by_id = {s['id']: s for s in local_capture.get('states', [])}


def bbox(mask):
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return {
        'x0': int(xs.min()), 'y0': int(ys.min()),
        'x1': int(xs.max()) + 1, 'y1': int(ys.max()) + 1,
        'width': int(xs.max() - xs.min() + 1),
        'height': int(ys.max() - ys.min() + 1),
    }


def band_stats(per_pixel, axis, band=40):
    length = per_pixel.shape[axis]
    out = []
    for start in range(0, length, band):
        end = min(length, start + band)
        view = per_pixel[start:end, :] if axis == 0 else per_pixel[:, start:end]
        out.append({
            'start': start,
            'end': end,
            'mean_abs': round(float(view.mean()), 4),
            'changed_gt5_pct': round(float((view > 5).mean() * 100), 4),
            'changed_gt15_pct': round(float((view > 15).mean() * 100), 4),
            'changed_gt30_pct': round(float((view > 30).mean() * 100), 4),
        })
    return out


def best_translation(gray_a, gray_b, radius=8):
    # Measure whether the mismatch is mostly a small positional shift.
    best = None
    h, w = gray_a.shape
    for dy in range(-radius, radius + 1):
        for dx in range(-radius, radius + 1):
            ay0, ay1 = max(0, dy), min(h, h + dy)
            ax0, ax1 = max(0, dx), min(w, w + dx)
            by0, by1 = max(0, -dy), min(h, h - dy)
            bx0, bx1 = max(0, -dx), min(w, w - dx)
            if ay1 <= ay0 or ax1 <= ax0:
                continue
            a = gray_a[ay0:ay1, ax0:ax1]
            b = gray_b[by0:by1, bx0:bx1]
            mae = float(np.mean(np.abs(a - b)))
            if best is None or mae < best['mae']:
                best = {'dx': dx, 'dy': dy, 'mae': round(mae, 4)}
    return best


states = []
for original_state in capture.get('states', []):
    state_id = original_state['id']
    local_state = local_by_id.get(state_id)
    if not local_state:
        continue
    original_path = ref_dir / original_state['screenshot']
    local_path = ref_dir / local_state['screenshot']
    a = np.asarray(Image.open(original_path).convert('RGB'), dtype=np.float32)
    b = np.asarray(Image.open(local_path).convert('RGB'), dtype=np.float32)
    if a.shape != b.shape:
        states.append({'id': state_id, 'error': f'shape mismatch {a.shape} != {b.shape}'})
        continue

    delta = np.abs(a - b)
    per_pixel = delta.max(axis=2)
    gray_a = a.mean(axis=2)
    gray_b = b.mean(axis=2)

    thresholds = {}
    for threshold in (1, 5, 15, 30, 60):
        mask = per_pixel > threshold
        thresholds[str(threshold)] = {
            'changed_pct': round(float(mask.mean() * 100), 4),
            'bbox': bbox(mask),
        }

    rows = band_stats(per_pixel, 0, band=40)
    cols = band_stats(per_pixel, 1, band=40)
    rows_ranked = sorted(rows, key=lambda x: x['mean_abs'], reverse=True)[:8]
    cols_ranked = sorted(cols, key=lambda x: x['mean_abs'], reverse=True)[:8]

    states.append({
        'id': state_id,
        'shape': list(a.shape),
        'mean_abs_rgb': round(float(delta.mean()), 4),
        'mean_abs_max_channel': round(float(per_pixel.mean()), 4),
        'p95_abs_max_channel': round(float(np.percentile(per_pixel, 95)), 4),
        'p99_abs_max_channel': round(float(np.percentile(per_pixel, 99)), 4),
        'thresholds': thresholds,
        'hot_row_bands': rows_ranked,
        'hot_col_bands': cols_ranked,
        'best_translation_px': best_translation(gray_a, gray_b, radius=8),
    })

report = {
    'version': '1.0',
    'reference_id': reference_id,
    'purpose': 'Locate stable screenshot mismatch without changing fidelity thresholds.',
    'states': states,
}
out_path = ref_dir / 'evidence' / 'diff-diagnostics.json'
out_path.write_text(json.dumps(report, indent=2) + '\n')

for state in states:
    if 'error' in state:
        print('DIFF_DIAGNOSTIC', state['id'], state['error'])
        continue
    gt15 = state['thresholds']['15']
    print(
        'DIFF_DIAGNOSTIC', state['id'],
        f"mean={state['mean_abs_max_channel']}",
        f"gt15={gt15['changed_pct']}%",
        f"bbox15={gt15['bbox']}",
        f"shift={state['best_translation_px']}"
    )
