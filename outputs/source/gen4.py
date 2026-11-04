import re, sys
sys.path.insert(0, '.')
from texts4 import TEXTS
body = open('body4.bas', encoding='utf8').read()
used = set(re.findall(r'T\("(\w+)"\)', body)) | {f'help{i}' for i in range(1, 15)}
missing = used - set(TEXTS); assert not missing, missing
def crlf(s): return s.replace('\r\n', '\n').replace('\n', '\r\n').encode('ascii')
# ---- texts module, split into small functions (VBA limits procedure size)
groups, cur, size = [], [], 0
for k in sorted(TEXTS):
    h = ''.join(f'{ord(ch):04X}' for ch in TEXTS[k])
    if size + len(h) > 7000 and cur: groups.append(cur); cur, size = [], 0
    cur.append((k, h)); size += len(h)
groups.append(cur)
out = ['Attribute VB_Name = "PlanTexts"',
       "'=========================================================================",
       "' Teaching Plan - Admin Tool : Arabic texts (Unicode hex, 4 digits per char)",
       "' Import this module together with PlanAdmin. Do not edit by hand.",
       "'=========================================================================",
       'Option Explicit', '',
       'Public Function T(ByVal k As String) As String', '    Dim s As String']
for i in range(1, len(groups) + 1):
    out.append(f'    If Len(s) = 0 Then s = TX{i}(k)')
out += ['    T = s', 'End Function', '',
        'Private Function AR(ByVal h As String) As String', '    Dim i As Long, s As String',
        '    For i = 1 To Len(h) Step 4', '        s = s & ChrW(CLng("&H" & Mid$(h, i, 4)))', '    Next i',
        '    AR = s', 'End Function', '']
for i, g in enumerate(groups, 1):
    out += [f'Private Function TX{i}(ByVal k As String) As String', '    Dim s As String', '    Select Case k']
    for k, h in g:
        ch = [h[j:j + 400] for j in range(0, len(h), 400)]
        out.append(f'    Case "{k}"'); out.append(f'        s = AR("{ch[0]}")')
        for c in ch[1:]: out.append(f'        s = s & AR("{c}")')
    out += ['    End Select', f'    TX{i} = s', 'End Function', '']
texts = '\n'.join(out)
for name, code in (('AdminTool.bas', body), ('AdminTexts.bas', texts)):
    assert all(ord(c) < 128 for c in code), (name, [c for c in code if ord(c) >= 128][:5])
    open(name, 'wb').write(crlf(code))
print('ok groups', len(groups), 'max group', max(sum(len(h) for _, h in g) for g in groups), 'body bytes', len(body))
