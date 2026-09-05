#!/usr/bin/env python3
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

if len(sys.argv) != 2:
    raise SystemExit('usage: python measure-isolation.py <reference-id>')

reference_id = sys.argv[1]
root = Path.cwd()
ref_dir = root / 'labs' / 'references' / reference_id
local_capture_path = ref_dir / 'evidence' / 'local' / 'capture.json'
isolation_capture_path = ref_dir / 'evidence' / 'isolation' / 'capture.json'
if not local_capture_path.exists():
    raise SystemExit(f'{reference_id}: local capture missing; self-containment compares normal local runtime to isolated local runtime')
if not isolation_capture_path.exists():
    raise SystemExit(f'{reference_id}: isolation capture missing')

local_capture = json.loads(local_capture_path.read_text())
isolation_capture = json.loads(isolation_capture_path.read_text())
local_by_id = {state['id']: state for state in local_capture.get('states', [])}
isolation_by_id = {state['id']: state for state in isolation_capture.get('states', [])}

scores = []
for state_id, local_state in local_by_id.items():
    if state_id not in isolation_by_id:
        raise SystemExit(f'{reference_id}: missing isolated state {state_id}')
    local_path = ref_dir / local_state['screenshot']
    isolated_path = ref_dir / isolation_by_id[state_id]['screenshot']
    a = np.asarray(Image.open(local_path).convert('RGB'), dtype=np.float32)
    b = np.asarray(Image.open(isolated_path).convert('RGB'), dtype=np.float32)
    if a.shape != b.shape:
        raise SystemExit(f'{reference_id}:{state_id}: dimension mismatch {a.shape} != {b.shape}')
    ssim = float(structural_similarity(a, b, channel_axis=2, data_range=255))
    pixel_similarity = float(1.0 - np.mean(np.abs(a - b)) / 255.0)
    score = min(ssim, pixel_similarity) * 100.0
    scores.append({
        'id': state_id,
        'ssim': round(ssim * 100.0, 4),
        'pixel_similarity': round(pixel_similarity * 100.0, 4),
        'score': round(score, 4),
        'local': local_state['screenshot'],
        'isolated': isolation_by_id[state_id]['screenshot'],
    })

if not scores:
    raise SystemExit(f'{reference_id}: no local states to compare')
minimum = min(item['score'] for item in scores)
mean = sum(item['score'] for item in scores) / len(scores)
interactions = isolation_capture.get('interaction', [])
interaction_ok = bool(interactions) and all(item.get('ok') is True and int(item.get('animation_signature_count', 0)) > 0 for item in interactions)
network_clean = int(isolation_capture.get('blocked_request_count', 0)) == 0
status = 'pass' if minimum >= 98.0 and interaction_ok and network_clean else 'fail'
report = {
    'version': '2.0',
    'reference_id': reference_id,
    'policy': isolation_capture.get('isolation_policy'),
    'comparison_basis': 'normal local runtime vs the same local runtime with all non-local HTTP(S) requests aborted',
    'visual_pass_min': 98.0,
    'minimum_score': round(minimum, 4),
    'mean_score': round(mean, 4),
    'visual_status': 'pass' if minimum >= 98.0 else 'fail',
    'interaction_status': 'pass' if interaction_ok else 'fail',
    'network_status': 'pass' if network_clean else 'fail',
    'status': status,
    'blocked_request_count': isolation_capture.get('blocked_request_count', 0),
    'blocked_origins': isolation_capture.get('blocked_origins', []),
    'states': scores,
    'interaction': interactions,
}
report_path = ref_dir / 'evidence' / 'isolation' / 'self-containment.json'
report_path.write_text(json.dumps(report, indent=2) + '\n')
print(
    f"REFERENCE_SELF_CONTAINMENT_{status.upper()} id={reference_id} "
    f"visual_min={minimum:.4f} interaction={'pass' if interaction_ok else 'fail'} "
    f"network={'pass' if network_clean else 'fail'} blocked={report['blocked_request_count']}"
)
