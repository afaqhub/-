import base64, re
fd='fontsource-cairo-5.3.0/package/files/' if False else None
import glob
base=glob.glob('fontsource-cairo-*/package/files/')[0]
faces=[]
def face(w,sub,rng):
    b=base64.b64encode(open(f'{base}cairo-{sub}-{w}-normal.woff2','rb').read()).decode()
    return f'@font-face{{font-family:"CairoM";font-weight:{w};font-style:normal;src:url(data:font/woff2;base64,{b}) format("woff2");unicode-range:{rng}}}'
AR='U+0600-06FF,U+0750-077F,U+08A0-08FF,U+FB50-FDFF,U+FE70-FEFF,U+200C-200F,U+2010-2011,U+204F,U+2E41,U+0660-0669'
LA='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
fonts=''.join(face(w,'arabic',AR)+face(w,'latin',LA) for w in (400,700,800))
fonts=fonts.replace('font-weight:400','font-weight:400')
html=f'''<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>الاستخدام اليومي لمنصة متابعة التدريس</title>
<style>{fonts}
{open('montage.css',encoding='utf8').read()}</style></head>
<body>
<div id="viewport"><div id="stage"></div></div>
<script src="audio/manifest.js" onerror="void 0"></script>
<script>{open('montage.js',encoding='utf8').read()}</script>
</body></html>'''
open('teaching_montage.html','w',encoding='utf8').write(html)
print(len(html))
