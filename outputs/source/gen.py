import re, sys
sys.path.insert(0, '.')
from texts import TEXTS
body = open('body.bas', encoding='utf8').read()
used = set(re.findall(r'T\("(\w+)"\)', body)) | {f'help{i}' for i in range(1, 11)} | {f'ix{i}' for i in range(1, 11)}
missing = used - set(TEXTS); assert not missing, missing
out = ["Private Function T(ByVal k As String) As String", "    Dim s As String", "    Select Case k"]
for k in sorted(TEXTS):
    h = ''.join(f'{ord(ch):04X}' for ch in TEXTS[k])
    chunks = [h[i:i+400] for i in range(0, len(h), 400)]
    out.append(f'    Case "{k}"')
    out.append(f'        s = AR("{chunks[0]}")')
    for c in chunks[1:]: out.append(f'        s = s & AR("{c}")')
out += ["    End Select", "    T = s", "End Function", ""]
code = body.rstrip() + "\n\n" + "\n".join(out)
assert all(ord(ch) < 128 for ch in code), [ch for ch in code if ord(ch) >= 128][:5]
open('AdminTool.bas', 'wb').write(code.replace('\r\n', '\n').replace('\n', '\r\n').encode('ascii'))
print('ok', len(code.splitlines()), 'lines; unused texts:', sorted(set(TEXTS) - used))
