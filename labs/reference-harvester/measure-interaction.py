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
if capture.get('version')!='3.1':
    raise SystemExit(f'{reference_id}: interaction capture protocol must be 3.1')


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


def rect_vector(rect,width,height):
    if rect is None: return None
    return np.asarray([
        float(rect['x'])/max(1.0,width),
        float(rect['y'])/max(1.0,height),
        float(rect['width'])/max(1.0,width),
        float(rect['height'])/max(1.0,height),
    ],dtype=np.float64)


def scalar_progress(rect,start,end,width,height):
    c=rect_vector(rect,width,height); s=rect_vector(start,width,height); e=rect_vector(end,width,height)
    if c is None or s is None or e is None: return None
    d=e-s
    denom=float(np.dot(d,d))
    if denom<1e-12: return 1.0
    return float(np.dot(c-s,d)/denom)


def lerp_rect(a,b,f):
    if a is None or b is None: return None
    return {k:float(a[k])+(float(b[k])-float(a[k]))*f for k in ('x','y','width','height')}


def progress_points(side,width,height):
    closed=side['closed']; opened=side['open']; raw=side['runtime_trajectory']
    points=[]
    for item in raw:
        p=scalar_progress(item['state']['dialog']['rect'],closed['trigger']['rect'],opened['dialog']['rect'],width,height)
        if p is not None:
            points.append((float(item['t']),float(p),item))
    return points


def state_at_progress(side,milestone,width,height):
    points=[(p,item) for _,p,item in progress_points(side,width,height)]
    if not points:
        return None

    # Motion layout projection may overshoot slightly. Compare the first forward
    # crossing of each spatial milestone so path shape is phase-independent.
    for (p0,a),(p1,b) in zip(points,points[1:]):
        if p1>=p0 and p0<=milestone<=p1 and abs(p1-p0)>1e-9:
            f=(milestone-p0)/(p1-p0)
            sa,sb=a['state'],b['state']
            return {
                'dialog':lerp_rect(sa['dialog']['rect'],sb['dialog']['rect'],f),
                'image':lerp_rect(sa['dialogImage']['rect'],sb['dialogImage']['rect'],f),
                'trigger':lerp_rect(sa['trigger']['rect'],sb['trigger']['rect'],f),
                'source_t':float(a['t'])+(float(b['t'])-float(a['t']))*f,
                'progress':milestone,
                'crossing':True,
            }

    # Nearest-frame fallback is useful for spatial geometry only. Timing evidence
    # must use actual forward crossings so the first sampled frame cannot become
    # a fake clock origin.
    p,item=min(points,key=lambda x:abs(x[0]-milestone))
    state=item['state']
    return {
        'dialog':state['dialog']['rect'],
        'image':state['dialogImage']['rect'],
        'trigger':state['trigger']['rect'],
        'source_t':float(item['t']),
        'progress':float(p),
        'crossing':False,
    }


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


spatial_milestones=[0.10,0.25,0.50,0.75,0.90]
timing_milestones=[0.25,0.50,0.75,0.90]
phase_budget_ms=16.7
nominal_transition_ms=250.0

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

    path_samples=[]; path_errors=[]; crossing_by_progress={}
    for progress in spatial_milestones:
        b=state_at_progress(baseline,progress,width,height)
        l=state_at_progress(local,progress,width,height)
        if b is None or l is None:
            path_errors.append(1.0)
            path_samples.append({'progress':progress,'presence_match':False})
            continue
        de=rect_error(b['dialog'],l['dialog'],width,height)
        ie=rect_error(b['image'],l['image'],width,height)
        te=rect_error(b['trigger'],l['trigger'],width,height)
        path_errors.extend([de,ie,te])
        path_samples.append({
            'progress':progress,
            'dialog_error':de,
            'image_error':ie,
            'trigger_error':te,
            'baseline_t':round(b['source_t'],3),
            'local_t':round(l['source_t'],3),
            'baseline_crossing':bool(b['crossing']),
            'local_crossing':bool(l['crossing']),
            'presence_match':True,
        })
        crossing_by_progress[progress]=(b,l)
    path_max_error=max(path_errors or [1.0])
    trajectory_score=max(0.0,(1.0-path_max_error)*100.0)

    # Baseline and local pages are captured independently, so their requestAnimationFrame
    # clocks can begin on different display phases. Compare the time required to cross
    # the SAME spatial milestones, subtract one constant phase offset, and score only
    # the residual curve shape. A phase offset larger than one 60 Hz frame is invalid.
    raw_timing=[]
    for progress in timing_milestones:
        pair=crossing_by_progress.get(progress)
        if not pair:
            continue
        b,l=pair
        if not b['crossing'] or not l['crossing']:
            continue
        delta=float(l['source_t'])-float(b['source_t'])
        raw_timing.append({
            'progress':progress,
            'baseline_t':float(b['source_t']),
            'local_t':float(l['source_t']),
            'raw_delta_ms':delta,
        })

    timing_measured=len(raw_timing)==len(timing_milestones)
    if timing_measured:
        phase_offset=float(np.median([x['raw_delta_ms'] for x in raw_timing]))
        residuals=[x['raw_delta_ms']-phase_offset for x in raw_timing]
        rmse_residual=float(np.sqrt(np.mean(np.square(residuals))))
        max_abs_residual=max(abs(x) for x in residuals)
        phase_within_budget=abs(phase_offset)<=phase_budget_ms
        timing_curve_score=max(0.0,(1.0-rmse_residual/nominal_transition_ms)*100.0) if phase_within_budget else 0.0
        timing_samples=[]
        for item,residual in zip(raw_timing,residuals):
            timing_samples.append({
                'progress':item['progress'],
                'baseline_t':round(item['baseline_t'],3),
                'local_t':round(item['local_t'],3),
                'raw_delta_ms':round(item['raw_delta_ms'],3),
                'phase_aligned_residual_ms':round(residual,3),
            })
    else:
        phase_offset=None
        rmse_residual=None
        max_abs_residual=None
        phase_within_budget=False
        timing_curve_score=0.0
        timing_samples=raw_timing

    baseline_signature=baseline.get('animation_signature') or []
    local_signature=local.get('animation_signature') or []
    signature_measured=len(baseline_signature)>0 and len(local_signature)>0
    signature_match=signature_measured and normalized_signature(baseline_signature)==normalized_signature(local_signature)
    mount_latency_delta=abs(float(baseline.get('click_to_dialog_ms',0))-float(local.get('click_to_dialog_ms',0)))

    scores=[
        open_score,
        open_geometry_score,
        trajectory_score,
        timing_curve_score,
        100.0 if functional else 0.0,
        100.0 if signature_match else 0.0,
    ]
    minimum=min(scores)
    status='pass' if minimum>=98.0 else 'fail'
    results.append({
        'viewport':vp['label'],'width':width,'height':height,
        'functional':{'baseline':bf,'local':lf,'status':'pass' if functional else 'fail'},
        'open_dialog_visual':{'score':round(open_score,4),**{k:round(v,4) if isinstance(v,float) else v for k,v in open_detail.items()}},
        'open_geometry':{'score':round(open_geometry_score,4),'max_normalized_error':round(open_geometry_error,6)},
        'trajectory':{
            'score':round(trajectory_score,4),
            'max_normalized_geometry_error':round(path_max_error,6),
            'basis':'spatial progress milestones; scheduler phase excluded',
            'milestones':path_samples,
        },
        'timing_curve':{
            'score':round(timing_curve_score,4),
            'measured':timing_measured,
            'phase_offset_ms':round(phase_offset,3) if phase_offset is not None else None,
            'phase_budget_ms':phase_budget_ms,
            'phase_within_budget':phase_within_budget,
            'rmse_phase_aligned_residual_ms':round(rmse_residual,3) if rmse_residual is not None else None,
            'max_abs_phase_aligned_residual_ms':round(max_abs_residual,3) if max_abs_residual is not None else None,
            'nominal_transition_ms':nominal_transition_ms,
            'basis':'same-spatial-progress crossing times with one bounded constant rAF phase offset removed; residual timing/easing curve is scored',
            'milestones':timing_samples,
        },
        'timing_diagnostic':{'click_to_dialog_delta_ms':round(mount_latency_delta,3)},
        'animation_signature':{
            'measured':signature_measured,
            'match':signature_match,
            'baseline_count':len(baseline_signature),
            'local_count':len(local_signature),
            'baseline_capture_t_ms':baseline.get('animation_signature_capture_t_ms'),
            'local_capture_t_ms':local.get('animation_signature_capture_t_ms'),
        },
        'minimum_score':round(minimum,4),'status':status
    })

overall='pass' if all(x['status']=='pass' for x in results) else 'fail'
minimum=min(x['minimum_score'] for x in results)
report={
    'version':'3.2',
    'capture_protocol':'3.1',
    'reference_id':reference_id,
    'scenario':capture['scenario'],
    'policy':{
        'dialog_visual_min':98.0,
        'open_geometry_min':98.0,
        'spatial_trajectory_min':98.0,
        'runtime_timing_curve_min':98.0,
        'runtime_phase_budget_ms':phase_budget_ms,
        'functional_required':True,
        'interaction_animation_signature_measured_required':True,
        'interaction_animation_signature_match_required':True,
    },
    'minimum_score':round(minimum,4),
    'status':overall,
    'viewports':results,
}
(interaction_dir/'interaction-fidelity.json').write_text(json.dumps(report,indent=2)+'\n')
print(f'REFERENCE_INTERACTION_{overall.upper()} id={reference_id} protocol=v3.2 min={minimum:.4f}')
for x in results:
    tc=x['timing_curve']; sig=x['animation_signature']
    print(f" {x['viewport']} status={x['status']} dialog={x['open_dialog_visual']['score']:.4f} geometry={x['open_geometry']['score']:.4f} spatial={x['trajectory']['score']:.4f} timing={tc['score']:.4f} phase_ms={tc['phase_offset_ms']} residual_rms_ms={tc['rmse_phase_aligned_residual_ms']} functional={x['functional']['status']} animations_measured={sig['measured']} animations_match={sig['match']} counts={sig['baseline_count']}/{sig['local_count']} mount_delta_ms={x['timing_diagnostic']['click_to_dialog_delta_ms']}")
