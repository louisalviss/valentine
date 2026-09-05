#!/usr/bin/env python3
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

if len(sys.argv) != 2:
    raise SystemExit('usage: python measure-interaction.py <reference-id>')

reference_id=sys.argv[1]
ref=Path.cwd()/'labs'/'references'/reference_id
interaction_dir=ref/'evidence'/'interaction'
capture=json.loads((interaction_dir/'interaction-capture.json').read_text())
if capture.get('version')!='2.0':
    raise SystemExit(f'{reference_id}: interaction capture protocol must be 2.0')


def image_score(a_path,b_path):
    a=np.asarray(Image.open(a_path).convert('RGB'),dtype=np.float32)
    b=np.asarray(Image.open(b_path).convert('RGB'),dtype=np.float32)
    if a.shape!=b.shape:
        return 0.0,{'error':f'dimension mismatch {a.shape} != {b.shape}'}
    ssim=float(structural_similarity(a,b,channel_axis=2,data_range=255))
    pixel=float(1.0-np.mean(np.abs(a-b))/255.0)
    return min(ssim,pixel)*100.0,{'ssim':ssim*100.0,'pixel_similarity':pixel*100.0}


def rect_error(a,b,width,height):
    if a is None and b is None: return 0.0
    if a is None or b is None: return 1.0
    scales={'x':width,'width':width,'y':height,'height':height}
    return max(abs(float(a[k])-float(b[k]))/max(1.0,scales[k]) for k in ('x','y','width','height'))


def normalized_signature(items):
    sig=[]
    for a in items:
        t=a.get('timing',{})
        duration=t.get('duration')
        if isinstance(duration,(int,float)): duration=round(float(duration),2)
        sig.append((a.get('target',{}).get('tag'),a.get('target',{}).get('role'),a.get('target',{}).get('ariaLabel'),round(float(t.get('delay',0) or 0),2),duration,round(float(t.get('endDelay',0) or 0),2),round(float(t.get('iterations',1) or 1),3),str(t.get('easing',''))))
    return sorted(sig,key=str)


def functional_side(side):
    before=side['before']; opened=side['opened']; closed=side['after_escape']
    before_ok=before['trigger']['expanded']=='false' and not before['dialog']['exists']
    open_ok=opened['trigger']['expanded']=='true' and opened['dialog']['exists'] and opened['close']['exists'] and opened['bodyOverflow']=='hidden'
    close_ok=closed['trigger']['expanded']=='false' and not closed['dialog']['exists'] and closed['bodyOverflow']!='hidden'
    return {'closed':before_ok,'open':open_ok,'escape_close':close_ok,'status':'pass' if before_ok and open_ok and close_ok else 'fail'}

results=[]
for vp in capture['viewports']:
    width,height=vp['width'],vp['height']
    baseline,local=vp['baseline'],vp['local']
    bf=functional_side(vp['functional']['baseline'])
    lf=functional_side(vp['functional']['local'])
    functional=bf['status']=='pass' and lf['status']=='pass'

    open_score,open_detail=image_score(ref/baseline['screenshots']['open_dialog'],ref/local['screenshots']['open_dialog'])
    open_geometry_error=max(
        rect_error(baseline['open']['dialog']['rect'],local['open']['dialog']['rect'],width,height),
        rect_error(baseline['open']['dialogImage']['rect'],local['open']['dialogImage']['rect'],width,height)
    )
    open_geometry_score=max(0.0,(1.0-open_geometry_error)*100.0)

    bt={x['t']:x['state'] for x in baseline['trajectory']}
    lt={x['t']:x['state'] for x in local['trajectory']}
    times=sorted(set(bt)&set(lt))
    samples=[]; errors=[]
    for t in times:
        b,l=bt[t],lt[t]
        presence=(b['dialog']['exists']==l['dialog']['exists'] and b['dialogImage']['exists']==l['dialogImage']['exists'])
        de=rect_error(b['dialog']['rect'],l['dialog']['rect'],width,height)
        ie=rect_error(b['dialogImage']['rect'],l['dialogImage']['rect'],width,height)
        te=rect_error(b['trigger']['rect'],l['trigger']['rect'],width,height)
        if not presence: errors.append(1.0)
        errors.extend([de,ie,te])
        samples.append({'t':t,'dialog_error':de,'image_error':ie,'trigger_error':te,'presence_match':presence})
    max_error=max(errors or [1.0])
    trajectory_score=max(0.0,(1.0-max_error)*100.0)
    signature_match=normalized_signature(baseline['animation_signature'])==normalized_signature(local['animation_signature'])

    scores=[open_score,open_geometry_score,trajectory_score,100.0 if functional else 0.0,100.0 if signature_match else 0.0]
    minimum=min(scores)
    status='pass' if minimum>=98.0 else 'fail'
    results.append({
        'viewport':vp['label'],'width':width,'height':height,
        'functional':{'baseline':bf,'local':lf,'status':'pass' if functional else 'fail'},
        'open_dialog_visual':{'score':round(open_score,4),**{k:round(v,4) if isinstance(v,float) else v for k,v in open_detail.items()}},
        'open_geometry':{'score':round(open_geometry_score,4),'max_normalized_error':round(open_geometry_error,6)},
        'trajectory':{'score':round(trajectory_score,4),'max_normalized_geometry_error':round(max_error,6),'samples':samples},
        'animation_signature':{'match':signature_match,'baseline_count':len(baseline['animation_signature']),'local_count':len(local['animation_signature'])},
        'minimum_score':round(minimum,4),'status':status
    })

overall='pass' if all(x['status']=='pass' for x in results) else 'fail'
minimum=min(x['minimum_score'] for x in results)
report={'version':'2.0','reference_id':reference_id,'scenario':capture['scenario'],'policy':{'dialog_visual_min':98.0,'open_geometry_min':98.0,'deterministic_trajectory_min':98.0,'functional_required':True,'interaction_animation_signature_match_required':True},'minimum_score':round(minimum,4),'status':overall,'viewports':results}
(interaction_dir/'interaction-fidelity.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'REFERENCE_INTERACTION_{overall.upper()} id={reference_id} min={minimum:.4f}')
for x in results:
    print(f" {x['viewport']} status={x['status']} dialog={x['open_dialog_visual']['score']:.4f} geometry={x['open_geometry']['score']:.4f} trajectory={x['trajectory']['score']:.4f} functional={x['functional']['status']} animations={x['animation_signature']['match']} counts={x['animation_signature']['baseline_count']}/{x['animation_signature']['local_count']}")
