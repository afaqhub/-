"""يولّد audio/manifest.js من ملفات الصوت الموجودة في مجلد audio (s01.mp3 ... s12.mp3).
يحتاج ffprobe (يأتي مع ffmpeg) لقراءة مدة كل ملف. بدونه اكتب المدد يدويًا في manifest.js.
التشغيل:  python make_manifest.py
"""
import os, json, subprocess, shutil
here = os.path.dirname(os.path.abspath(__file__)); a = os.path.join(here, 'audio')
ids = ['s%02d' % i for i in range(1, 13)]
out = {}
for i in ids:
    for ext in ('mp3', 'wav', 'm4a', 'ogg'):
        f = os.path.join(a, f'{i}.{ext}')
        if os.path.exists(f):
            d = None
            if shutil.which('ffprobe'):
                try: d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode().strip())
                except Exception: d = None
            out[i] = {'src': f'{i}.{ext}'}
            if d: out[i]['duration'] = round(d, 2)
            break
open(os.path.join(a, 'manifest.js'), 'w', encoding='utf8').write('window.MONTAGE_AUDIO = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print('تم: ', len(out), 'مشهد فيه صوت')
