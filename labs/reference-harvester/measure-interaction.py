#!/usr/bin/env python3
import json
import math
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

if len(sys.argv) != 2:
    raise SystemExit('usage: python measure-interaction.py <reference-id>')

reference_id = sys.argv[1]
root = Path.cwd()
ref = root / 'labs' / 'references' / reference_id
interaction_dir = ref / 'evidence' / 'interaction'
capture = json.loads((interaction_dir / 'interaction-capture.json').read_text())


def image_score(a_path, b_path):
    a = np.asarray(Image.open(a_path).convert('RGB'), dtype=np.float32)
    b = np.asarray(Image.open(b_path).convert('RGB'), dtype=np.float32)
    if a.shape != b.shape:
        return 0.0, {'error': f'dimension mismatch {a.shape} != {b.shape}'}
    ssim = float(structural_similarity(a, b, channel_axis=2, data_range=255))
    pixel = float(1.0 - np.mean(np.abs(a - b)) / 255.0)
    return min(ssim, pixel) * 100.0, {'ssim': ssim * 100.0, 'pixel_similarity': pixel * 100.0}


def bool_contract(s):
    closed = (
        s['closed']['baseline']['trigger']['expanded'] == 'false' and
        s['closed']['local']['trigger']['expanded'] == 'false' and
        not s['closed']['baseline']['dialog']['exists'] and
        not s['closed']['local']['dialog']['exists']
    )
    opened = (
        s['open']['baseline']['trigger']['expanded'] == 'true' and
        s['open']['local']['trigger']['expanded'] == 'true' and
        s['open']['baseline']['dialog']['exists'] and
        s['open']['local']['dialog']['exists'] and
        s['open']['baseline']['close']['exists'] and
        s['open']['local']['close']['exists'] and
        s['open']['baseline']['bodyOverflow'] == 'hidden' and
        s['open']['local']['bodyOverflow'] == 'hidden'
    )
    closed_again = (
        s['after_close']['baseline']['trigger']['expanded'] == 'false' and
        s['after_close']['local']['trigger']['expanded'] == 'false' and
        not s['after_close']['baseline']['dialog']['exists'] and
        not s['after_close']['local']['dialog']['exists'] and
        s['after_close']['baseline']['bodyOverflow'] != 'hidden' and
        s['after_close']['local']['bodyOverflow'] != 'hidden'
    )
    return closed, opened, closed_again


def rect_error(a, b, width, height):
    if a is None and b is None:
        return 0.0
    if a is None or b is None:
        return 1.0
    scales = {'x': width, 'width': width, 'y': height, 'height': height}
    return max(abs(float(a[k]) - float(b[k])) / max(1.0, scales[k]) for k in ('x','y','width','height'))


def animation_signature(state):
    sig=[]
    for a in state.get('animations', []):
        t=a.get('timing', {})
        duration=t.get('duration')
        if isinstance(duration, (int,float)):
            duration=round(float(duration), 2)
        sig.append((
            a.get('target',{}).get('tag'),
            a.get('target',{}).get('role'),
            a.get('target',{}).get('ariaLabel'),
            round(float(t.get('delay',0) or 0),2),
            duration,
            round(float(t.get('endDelay',0) or 0),2),
            round(float(t.get('iterations',1) or 1),3),
            str(t.get('easing',''))
        ))
    return sorted(sig, key=str)

results=[]
for vp in capture['viewports']:
    width, height = vp['width'], vp['height']
    closed_ok, open_ok, close_ok = bool_contract(vp)
    open_score, open_detail = image_score(
        ref / vp['screenshots']['baseline_open'],
        ref / vp['screenshots']['local_open']
    )
    close_score, close_detail = image_score(
        ref / vp['screenshots']['baseline_after_close'],
        ref / vp['screenshots']['local_after_close']
    )

    errors=[]
    signature_matches=[]
    samples=[]
    for sample in vp['trajectory']:
        b=sample['baseline']; l=sample['local']
        dialog_err=rect_error(b['dialog']['rect'], l['dialog']['rect'], width, height)
        image_err=rect_error(b['dialogImage']['rect'], l['dialogImage']['rect'], width, height)
        trigger_err=rect_error(b['trigger']['rect'], l['trigger']['rect'], width, height)
        present_match=(b['dialog']['exists']==l['dialog']['exists'] and b['dialogImage']['exists']==l['dialogImage']['exists'])
        if not present_match:
            errors.append(1.0)
        errors.extend([dialog_err,image_err,trigger_err])
        sig_match=animation_signature(b)==animation_signature(l)
        signature_matches.append(sig_match)
        samples.append({'t':sample['t'],'dialog_error':dialog_err,'image_error':image_err,'trigger_error':trigger_err,'presence_match':present_match,'animation_signature_match':sig_match})

    max_error=max(errors or [1.0])
    trajectory_score=max(0.0, (1.0-max_error)*100.0)
    animation_match=all(signature_matches) if signature_matches else False
    functional=closed_ok and open_ok and close_ok
    visual_endpoint=min(open_score, close_score)
    status='pass' if functional and visual_endpoint>=98 and trajectory_score>=98 and animation_match else 'fail'
    results.append({
        'viewport':vp['label'], 'width':width, 'height':height,
        'functional':{'closed':closed_ok,'open':open_ok,'escape_close':close_ok,'status':'pass' if functional else 'fail'},
        'open_visual':{'score':round(open_score,4), **{k:round(v,4) if isinstance(v,float) else v for k,v in open_detail.items()}},
        'after_close_visual':{'score':round(close_score,4), **{k:round(v,4) if isinstance(v,float) else v for k,v in close_detail.items()}},
        'trajectory':{'score':round(trajectory_score,4),'max_normalized_geometry_error':round(max_error,6),'animation_signature_match':animation_match,'samples':samples},
        'status':status
    })

overall='pass' if all(x['status']=='pass' for x in results) else 'fail'
minimum=min(min(x['open_visual']['score'],x['after_close_visual']['score'],x['trajectory']['score']) for x in results)
report={
    'version':'1.0', 'reference_id':reference_id,
    'scenario':capture['scenario'],
    'policy':{'endpoint_visual_min':98.0,'trajectory_min':98.0,'functional_required':True,'animation_signature_match_required':True},
    'minimum_score':round(minimum,4), 'status':overall, 'viewports':results
}
(interaction_dir/'interaction-fidelity.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'REFERENCE_INTERACTION_{overall.upper()} id={reference_id} min={minimum:.4f}')
for x in results:
    print(f" {x['viewport']} status={x['status']} open={x['open_visual']['score']:.4f} close={x['after_close_visual']['score']:.4f} trajectory={x['trajectory']['score']:.4f} functional={x['functional']['status']} animation={x['trajectory']['animation_signature_match']}")
