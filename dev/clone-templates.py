#!/usr/bin/env python3
"""يصنع خلفيات قوالب «مستنسخة» من تصاميم جاهزة: يمسح النصوص المطبوعة فيها (بتنعيم الألوان من حواف المستطيل)
فتبقى الزخارف والصور، ثم تُكتب النصوص من المنصة في المواضع المحددة في dev/clone-config.json.
الاستعمال:  python3 dev/clone-templates.py [--debug]   (يكتب templates/ و templates/manifest.json)"""
import json, os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFilter
ROOT=os.path.join(os.path.dirname(__file__),'..')
cfg=json.load(open(os.path.join(os.path.dirname(__file__),'clone-config.json'),encoding='utf-8'))
os.makedirs(os.path.join(ROOT,'templates'),exist_ok=True)
debug='--debug' in sys.argv

def erase(arr,r,pad=0,seed=1):
    x0,y0,x1,y1=[int(v) for v in r]; h,w=arr.shape[:2]
    x0=max(1,x0); y0=max(1,y0); x1=min(w-2,x1); y1=min(h-2,y1)
    band=3
    top=arr[y0-band:y0,x0:x1].mean(axis=0); bot=arr[y1:y1+band,x0:x1].mean(axis=0)
    lef=arr[y0:y1,x0-band:x0].mean(axis=1); rig=arr[y0:y1,x1:x1+band].mean(axis=1)
    # تنعيم الحواف لإزالة أي بقايا من أطراف الحروف
    def sm(a,k=9):
        pad=k//2; p=np.pad(a,((pad,pad),(0,0)),mode='edge'); return np.stack([np.convolve(p[:,c],np.ones(k)/k,mode='valid') for c in range(3)],axis=1)
    top,bot,lef,rig=sm(top),sm(bot),sm(lef),sm(rig)
    H=y1-y0; W=x1-x0
    s=np.linspace(0,1,W)[None,:,None]; t=np.linspace(0,1,H)[:,None,None]
    vert=(1-t)*top[None,:,:]+t*bot[None,:,:]
    hor=(1-s)*lef[:,None,:]+s*rig[:,None,:]
    c00,c10,c01,c11=top[0],top[-1],bot[0],bot[-1]
    corner=((1-t)*(1-s))*c00+((1-t)*s)*c10+(t*(1-s))*c01+(t*s)*c11
    patch=vert+hor-corner
    rng=np.random.default_rng(seed); patch=patch+rng.normal(0,1.1,patch.shape)
    arr[y0:y1,x0:x1]=np.clip(patch,0,255)

def erase_full(arr,r,seed=1):
    """يمسح المستطيل كله (لوحة/أيقونة/دائرة) ويملؤه بترميم ناعم من محيطه ثم يضيف حُبيبات خفيفة."""
    x0,y0,x1,y1=[int(v) for v in r]; h,w=arr.shape[:2]; m=14
    X0,Y0,X1,Y1=max(0,x0-m),max(0,y0-m),min(w,x1+m),min(h,y1+m)
    reg=arr[Y0:Y1,X0:X1].astype(np.uint8).copy(); mask=np.zeros(reg.shape[:2],np.uint8); mask[y0-Y0:y1-Y0,x0-X0:x1-X0]=255
    small=cv2.resize(reg,None,fx=.25,fy=.25,interpolation=cv2.INTER_AREA); ms=cv2.resize(mask,(small.shape[1],small.shape[0]),interpolation=cv2.INTER_NEAREST)
    fill=cv2.inpaint(small,ms,5,cv2.INPAINT_NS); fill=cv2.GaussianBlur(fill,(0,0),3)
    big=cv2.resize(fill,(reg.shape[1],reg.shape[0]),interpolation=cv2.INTER_CUBIC).astype(np.float64)
    big+=np.random.default_rng(seed).normal(0,1.0,big.shape)
    sub=mask>0; out=reg.astype(np.float64); out[sub]=np.clip(big[sub],0,255)
    arr[Y0:Y1,X0:X1]=out

def erase_text(arr,r,thr=9):
    """يمسح الحروف فقط (لا اللوحة): يكشف البكسلات المخالفة للخلفية المحلية ثم يرمّمها."""
    x0,y0,x1,y1=[int(v) for v in r]; h,w=arr.shape[:2]; x0=max(0,x0); y0=max(0,y0); x1=min(w,x1); y1=min(h,y1)
    reg=arr[y0:y1,x0:x1].astype(np.uint8).copy()
    bg=cv2.medianBlur(reg,0|61 if min(reg.shape[:2])>61 else 21)
    diff=np.abs(reg.astype(np.int16)-bg.astype(np.int16)).max(axis=2)
    mask=(diff>thr).astype(np.uint8)*255
    mask=cv2.dilate(mask,np.ones((5,5),np.uint8),iterations=2)
    out=cv2.inpaint(reg,mask,6,cv2.INPAINT_TELEA)
    arr[y0:y1,x0:x1]=out

for d in cfg['designs']:
    im=Image.open(os.path.join(os.path.dirname(__file__),'designs',d['src'])).convert('RGB')
    if d.get('resize'): im=im.resize(tuple(d['resize']),Image.LANCZOS)
    arr=np.asarray(im).astype(np.float64)
    for i,r in enumerate(d['erase']):
        if isinstance(r,dict):
            (erase_text(arr,r['r'],**({'thr':r['thr']} if 'thr' in r else {})) if r.get('mode','text')=='text' else erase_full(arr,r['r'],seed=i+3))
        else: erase_text(arr,r)
    out=Image.fromarray(arr.astype(np.uint8))
    if debug:
        dr=ImageDraw.Draw(out)
        for r in d['erase']: dr.rectangle(r['r'] if isinstance(r,dict) else r,outline=(255,0,0),width=2)
        for k in ('body',):
            if k in d['layout']:
                L=d['layout'][k]
                if 'w' in L and 'h' in L: dr.rectangle([L['x'],L['y'],L['x']+L['w'],L['y']+L['h']],outline=(0,0,255),width=2)
        out.save(os.path.join(ROOT,'templates','_debug_'+d['id']+'.png'))
    else:
        out.save(os.path.join(ROOT,'templates',d['id']+'.jpg'),quality=84,optimize=True,progressive=True)
if not debug:
    man=[{'id':d['id'],'name':d['name'],'file':d['id']+'.jpg','w':d.get('resize',[None])[0] or Image.open(os.path.join(os.path.dirname(__file__),'designs',d['src'])).size[0],
          'h':d.get('resize',[None,None])[1] or Image.open(os.path.join(os.path.dirname(__file__),'designs',d['src'])).size[1],'layout':d['layout']} for d in cfg['designs']]
    json.dump({'version':1,'templates':man},open(os.path.join(ROOT,'templates','manifest.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
    print('تم:',len(man),'قوالب')
