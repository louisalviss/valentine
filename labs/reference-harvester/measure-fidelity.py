#!/usr/bin/env python3
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

if len(sys.argv) != 2:
    raise SystemExit('usage: python measure-fidelity.py <reference-id>')

reference_id = sys.argv[1]
root = Path.cwd()
ref_dir = root / 'labs' / 'references' / reference_id
original_capture = json.loads((ref_dir / 'evidence' / 'capture.json').read_text())
local_capture = json.loads((ref_dir / 'evidence' / 'local' / 'capture.json').read_text())
local_by_id = {state['id']: state for state in local_capture.get('states', [])}
exclusion_definitions = original_capture.get('visual_exclusion_definitions', []) or []
MASK_PADDING_PX = 6
MAX_EXCLUDED_FRACTION = 0.10


def metric_pair(a, b, valid_mask=None):
    full_ssim, ssim_map = structural_similarity(a, b, channel_axis=2, data_range=255, full=True)
    if ssim_map.ndim == 3:
        ssim_map = np.mean(ssim_map, axis=2)
    pixel_error = np.mean(np.abs(a - b), axis=2)
    if valid_mask is None:
        ssim = float(full_ssim)
        pixel_similarity = float(1.0 - np.mean(pixel_error) / 255.0)
    else:
        if not np.any(valid_mask):
            raise SystemExit(f'{reference_id}: rights mask excludes the entire frame')
        ssim = float(np.mean(ssim_map[valid_mask]))
        pixel_similarity = float(1.0 - np.mean(pixel_error[valid_mask]) / 255.0)
    score = min(ssim, pixel_similarity) * 100.0
    return ssim * 100.0, pixel_similarity * 100.0, score


def visible_rects(exclusions):
    result = []
    for exclusion in exclusions or []:
        for item in exclusion.get('rects', []) or []:
            rect = item.get('clipped_rect') or {}
            if item.get('visible') and float(rect.get('width', 0)) > 0 and float(rect.get('height', 0)) > 0:
                result.append({
                    'id': exclusion.get('id'),
                    'selector': exclusion.get('selector'),
                    'reason': exclusion.get('reason'),
                    'rights_status': exclusion.get('rights_status'),
                    'rect': rect,
                })
    return result


def build_rights_mask(shape, original_state, local_state):
    height, width = shape[:2]
    mask = np.zeros((height, width), dtype=bool)
    rects = visible_rects(original_state.get('visual_exclusions')) + visible_rects(local_state.get('visual_exclusions'))
    normalized = []
    seen = set()
    for item in rects:
        rect = item['rect']
        x0 = max(0, int(math.floor(float(rect.get('x', 0)))) - MASK_PADDING_PX)
        y0 = max(0, int(math.floor(float(rect.get('y', 0)))) - MASK_PADDING_PX)
        x1 = min(width, int(math.ceil(float(rect.get('x', 0)) + float(rect.get('width', 0)))) + MASK_PADDING_PX)
        y1 = min(height, int(math.ceil(float(rect.get('y', 0)) + float(rect.get('height', 0)))) + MASK_PADDING_PX)
        if x1 <= x0 or y1 <= y0:
            continue
        key = (item.get('id'), x0, y0, x1, y1)
        if key in seen:
            continue
        seen.add(key)
        mask[y0:y1, x0:x1] = True
        normalized.append({**item, 'mask_rect': {'x': x0, 'y': y0, 'width': x1 - x0, 'height': y1 - y0}})
    fraction = float(np.mean(mask))
    if fraction > MAX_EXCLUDED_FRACTION:
        raise SystemExit(f'{reference_id}:{original_state["id"]}: rights mask {fraction:.4%} exceeds {MAX_EXCLUDED_FRACTION:.0%} cap')
    return mask, normalized, fraction


scores = []
for state in original_capture.get('states', []):
    state_id = state['id']
    if state_id not in local_by_id:
        raise SystemExit(f'{reference_id}: missing local state {state_id}')
    local_state = local_by_id[state_id]
    original_path = ref_dir / state['screenshot']
    local_path = ref_dir / local_state['screenshot']
    a = np.asarray(Image.open(original_path).convert('RGB'), dtype=np.float32)
    b = np.asarray(Image.open(local_path).convert('RGB'), dtype=np.float32)
    if a.shape != b.shape:
        raise SystemExit(f'{reference_id}:{state_id}: dimension mismatch {a.shape} != {b.shape}')

    full_ssim, full_pixel, full_score = metric_pair(a, b)
    mask, mask_rects, excluded_fraction = build_rights_mask(a.shape, state, local_state)
    if np.any(mask):
        accepted_ssim, accepted_pixel, accepted_score = metric_pair(a, b, ~mask)
    else:
        accepted_ssim, accepted_pixel, accepted_score = full_ssim, full_pixel, full_score

    scores.append({
        'id': state_id,
        'score': round(accepted_score, 4),
        'ssim': round(accepted_ssim, 4),
        'pixel_similarity': round(accepted_pixel, 4),
        'full_frame': {
            'score': round(full_score, 4),
            'ssim': round(full_ssim, 4),
            'pixel_similarity': round(full_pixel, 4),
        },
        'rights_mask': {
            'applied': bool(mask_rects),
            'padding_px': MASK_PADDING_PX,
            'excluded_fraction': round(excluded_fraction, 6),
            'rects': mask_rects,
        },
        'original': state['screenshot'],
        'local': local_state['screenshot'],
    })

if not scores:
    raise SystemExit(f'{reference_id}: no states to compare')

minimum = min(item['score'] for item in scores)
mean = sum(item['score'] for item in scores) / len(scores)
full_frame_minimum = min(item['full_frame']['score'] for item in scores)
full_frame_mean = sum(item['full_frame']['score'] for item in scores) / len(scores)
status = 'pass' if minimum >= 98.0 else ('review' if minimum >= 95.0 else 'fail')
report = {
    'version': '2.0',
    'reference_id': reference_id,
    'method': 'accepted surface: min(SSIM-map mean, pixel_similarity) outside explicit DOM-derived rights masks; full-frame metrics are retained separately',
    'visual_pass_min': 98.0,
    'rights_mask_policy': {
        'allowed_reason': 'only explicitly declared third-party media whose independent reuse rights are not established',
        'geometry_source': 'union of original and local DOM client rects per captured state',
        'padding_px': MASK_PADDING_PX,
        'max_excluded_fraction_per_state': MAX_EXCLUDED_FRACTION,
        'threshold_is_not_lowered': True,
    },
    'visual_exclusions': exclusion_definitions,
    'minimum_score': round(minimum, 4),
    'mean_score': round(mean, 4),
    'full_frame_minimum_score': round(full_frame_minimum, 4),
    'full_frame_mean_score': round(full_frame_mean, 4),
    'status': status,
    'states': scores,
}
report_path = ref_dir / 'evidence' / 'fidelity.json'
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(
    f'REFERENCE_FIDELITY_{status.upper()} id={reference_id} '
    f'accepted_min={minimum:.4f} full_min={full_frame_minimum:.4f} accepted_mean={mean:.4f}'
)
