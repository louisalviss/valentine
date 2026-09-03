#!/usr/bin/env python3
import json
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

scores = []
for state in original_capture.get('states', []):
    state_id = state['id']
    if state_id not in local_by_id:
        raise SystemExit(f'{reference_id}: missing local state {state_id}')
    original_path = ref_dir / state['screenshot']
    local_path = ref_dir / local_by_id[state_id]['screenshot']
    a = np.asarray(Image.open(original_path).convert('RGB'), dtype=np.float32)
    b = np.asarray(Image.open(local_path).convert('RGB'), dtype=np.float32)
    if a.shape != b.shape:
        raise SystemExit(f'{reference_id}:{state_id}: dimension mismatch {a.shape} != {b.shape}')

    # SSIM captures structure/perceptual layout; pixel similarity exposes broad tone/media drift.
    ssim = float(structural_similarity(a, b, channel_axis=2, data_range=255))
    pixel_similarity = float(1.0 - np.mean(np.abs(a - b)) / 255.0)
    # The acceptance score is deliberately conservative: neither metric may hide the other.
    score = min(ssim, pixel_similarity) * 100.0
    scores.append({
        'id': state_id,
        'ssim': round(ssim * 100.0, 4),
        'pixel_similarity': round(pixel_similarity * 100.0, 4),
        'score': round(score, 4),
        'original': state['screenshot'],
        'local': local_by_id[state_id]['screenshot'],
    })

if not scores:
    raise SystemExit(f'{reference_id}: no states to compare')

minimum = min(item['score'] for item in scores)
mean = sum(item['score'] for item in scores) / len(scores)
status = 'pass' if minimum >= 98.0 else ('review' if minimum >= 95.0 else 'fail')
report = {
    'version': '1.0',
    'reference_id': reference_id,
    'method': 'min(SSIM, pixel_similarity) per state; aggregate=min(state score)',
    'visual_pass_min': 98.0,
    'minimum_score': round(minimum, 4),
    'mean_score': round(mean, 4),
    'status': status,
    'states': scores,
}
report_path = ref_dir / 'evidence' / 'fidelity.json'
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(f'REFERENCE_FIDELITY_{status.upper()} id={reference_id} min={minimum:.4f} mean={mean:.4f}')
