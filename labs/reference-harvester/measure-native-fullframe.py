#!/usr/bin/env python3
import json
from pathlib import Path
import numpy as np
from PIL import Image
from skimage.metrics import structural_similarity

root=Path.cwd()
ref=root/'labs'/'references'/'native-content'
original=json.loads((ref/'evidence'/'capture.json').read_text())
local=json.loads((ref/'evidence'/'local'/'capture.json').read_text())
local_by={s['id']:s for s in local.get('states',[])}
rows=[]
for state in original.get('states',[]):
    sid=state['id']
    if sid not in local_by: raise SystemExit(f'missing local state {sid}')
    a=np.asarray(Image.open(ref/state['screenshot']).convert('RGB'),dtype=np.float32)
    b=np.asarray(Image.open(ref/local_by[sid]['screenshot']).convert('RGB'),dtype=np.float32)
    if a.shape!=b.shape: raise SystemExit(f'{sid}: shape mismatch {a.shape} != {b.shape}')
    ssim=float(structural_similarity(a,b,channel_axis=2,data_range=255))
    pixel=float(1.0-np.mean(np.abs(a-b))/255.0)
    score=min(ssim,pixel)*100.0
    rows.append({'id':sid,'score':round(score,4),'ssim':round(ssim*100,4),'pixel_similarity':round(pixel*100,4)})
report={
  'version':'1.0','reference_id':'native-content',
  'method':'raw full-frame min(SSIM,pixel similarity); informational only because source commercial footage is intentionally not copied',
  'acceptance_role':'informational-rights-exception',
  'minimum_score':round(min(x['score'] for x in rows),4),
  'mean_score':round(sum(x['score'] for x in rows)/len(rows),4),
  'states':rows
}
(ref/'evidence'/'native-fullframe.json').write_text(json.dumps(report,indent=2)+'\n')
print('NATIVE_CONTENT_FULLFRAME_REPORTED',report['minimum_score'],report['mean_score'])
