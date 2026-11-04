"""Teachers' workbook v4 (no macros): lessons classes, Quran classes, settings, weeks."""
import sys, random, datetime as dt
import openpyxl
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side, Protection
from openpyxl.formatting.rule import FormulaRule
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.workbook.defined_name import DefinedName
from openpyxl.worksheet.properties import PageSetupProperties
from openpyxl.utils import get_column_letter as CL

OUT = sys.argv[1]
TEST = len(sys.argv) > 2 and sys.argv[2] == 'test'
SRC = '/tmp/x/f.xlsx'
old = openpyxl.load_workbook(SRC)
oldn = old['نموذج']

# ------------------------------------------------------------------ palette
FONT = 'Sakkal Majalla'
INK = '0E4D45'      # deep green (titles, headers)
PRI = '17695E'      # teal green (sub headers)
GOLD = 'B08D3C'     # accent
GOLD_L = 'F3E7C6'   # light gold
SAND = 'F7F2E8'     # sand (info values)
MINT = 'E3F0EA'     # mint (summary values)
INPUT = 'FFF7E0'    # input cells
DONE = 'D7ECDF'; DONE_T = '2E7D4F'
WARN = 'F6D5C8'; WARN_T = '9C3D24'
ALERT = 'FCEFC7'
MUTED = '8A8A8A'; MUTED_L = 'EFEDE8'
LINE = 'D9D2C3'
BOOKS = {'العقيدة (المتوسط)': 'E3EEF6', 'العقيدة (النهائي)': 'E4F0E6', 'الفقه': 'FBF0DA'}

def f(b=False, s=13, c='1F1F1F', i=False, u=None): return Font(name=FONT, bold=b, size=s, color=c, italic=i, underline=u)
def fill(c): return PatternFill('solid', start_color=c, end_color=c)
thin = Side(style='thin', color=LINE)
box = Border(left=thin, right=thin, top=thin, bottom=thin)
goldline = Border(bottom=Side(style='medium', color=GOLD))
ctr = Alignment(horizontal='center', vertical='center', wrap_text=True)
rgt = Alignment(horizontal='right', vertical='center', wrap_text=True, indent=1)
DF = 'yyyy/mm/dd'; DFZ = 'yyyy/mm/dd;;'

DASH, DATA, CAT, SUR, HOL, TEA, LST, GUIDE, SET = ('الصفحة الأساسية', 'بيانات_الفصول', 'فهرس الدروس', 'قائمة السور',
                                                   'الإجازات', 'أسماء المدرسين', 'القوائم', 'دليل الإدارة', 'الإعدادات')
q = lambda s: f"'{s}'"
D, C, T, L, H, S, ST = q(DATA), q(CAT), q(TEA), q(LST), q(HOL), q(SUR), q(SET)
TPL_L, TPL_Q = 'نموذج', 'نموذج قرآن'
ST_ACT, ST_ARC, ST_DEL, ST_FIN = 'نشط', 'للأرشفة', 'للحذف', 'منتهٍ'
TY_L, TY_Q = 'مناهج', 'قرآن'
ABS = 'غائب'
DROWS = 300

wb = Workbook()
sheets = {}
for nm in (DASH, DATA, CAT, SUR, HOL, TEA, SET, LST, GUIDE):
    sheets[nm] = wb.active if not sheets else wb.create_sheet(nm)
sheets[DASH].title = DASH
for w in wb.worksheets: w.sheet_view.rightToLeft = True; w.sheet_view.showGridLines = False

def name(n, ref): wb.defined_names[n] = DefinedName(n, attr_text=ref)
def hdr(ws, row, c1, c2, color=INK, size=13, fc='FFFFFF'):
    for c in range(c1, c2 + 1):
        x = ws.cell(row, c); x.font = f(True, size, fc); x.fill = fill(color); x.alignment = ctr; x.border = box
def title(ws, rng, text, size=22, h=40):
    a = rng.split(':')[0]; ws.merge_cells(rng); ws[a] = text
    for row in ws[rng]:
        for x in row: x.fill = fill(INK); x.border = goldline
    ws[a].font = f(True, size, 'FFFFFF'); ws[a].alignment = Alignment(horizontal='right', vertical='center', indent=1)
    ws.row_dimensions[ws[a].row].height = h
def note(ws, a, text, color='6B6B6B', size=12):
    ws[a] = text; ws[a].font = f(False, size, color); ws[a].alignment = Alignment(horizontal='right', vertical='top', wrap_text=True)
def protect(ws, filt=False):
    p = ws.protection; p.sheet = True; p.selectLockedCells = False; p.formatColumns = False; p.formatRows = False
    if filt: p.autoFilter = False; p.sort = True

# ------------------------------------------------------------------ lists (system)
ws = sheets[LST]
lists = {1: ('الحالة', [ST_ACT, ST_ARC, ST_DEL, ST_FIN]), 2: ('النوع', [TY_L, TY_Q]),
         3: ('أيام الحصص', ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']), 4: ('رقم اليوم', [1, 2, 3, 4, 5]),
         5: ('رمز الغياب', [ABS]), 6: ('نعم/لا', ['نعم', 'لا'])}
for c, (h, vals) in lists.items():
    ws.cell(1, c, h)
    for i, v in enumerate(vals, 2):
        x = ws.cell(i, c, v); x.font = f(); x.border = box; x.alignment = ctr
hdr(ws, 1, 1, 6, PRI)
ws['H1'] = 'إصدار الملف'; ws['H2'] = '4.0'; hdr(ws, 1, 8, 8, PRI); ws['H2'].font = f(True); ws['H2'].alignment = ctr
note(ws, 'A9', 'تستعملها معادلات الملف وأداة الإدارة. لا تغيّر ترتيبها ولا تحذف منها.', WARN_T)
ws.merge_cells('A9:H10')
for col in 'ABCDEFH': ws.column_dimensions[col].width = 14
protect(ws)
name('LST_Status', f"{L}!$A$2:$A$5"); name('LST_Type', f"{L}!$B$2:$B$3"); name('LST_Days', f"{L}!$C$2:$C$6")
name('LST_Absent', f"{L}!$E$2"); name('LST_YesNo', f"{L}!$F$2:$F$3"); name('APP_Version', f"{L}!$H$2")

# ------------------------------------------------------------------ settings
ws = sheets[SET]
title(ws, 'B1:E1', 'الإعدادات العامة')
ws.column_dimensions['A'].width = 2; ws.column_dimensions['B'].width = 46; ws.column_dimensions['C'].width = 16; ws.column_dimensions['D'].width = 2; ws.column_dimensions['E'].width = 60
rows = [
    (3, 'بداية الأسبوع التدريبي الأول (يوم أحد)', dt.datetime(2026, 8, 30), 'CFG_Week1', DF, 'تُحسب منها أرقام الأسابيع. ويمكن عندها كتابة فترة الفصل بالأسابيع بدل التواريخ.'),
    (4, 'الأسبوع التدريبي الحالي (تلقائي)', '=IF(ISNUMBER($C$3),INT((TODAY()-$C$3)/7)+1,"")', 'CFG_WeekNow', '0', ''),
    (6, 'حد التقييم في القرآن (يتلوّن ما دونه)', 70, 'CFG_Pass', '0', 'المعدل الذي دونه يظهر بلون التنبيه في الكشوف وفي الصفحة الأساسية.'),
    (7, 'تنبيه التأخر عن الخطة عند (حصة)', 2, 'CFG_Behind', '0', 'إذا نقص المنفذ عن المتوقع حتى اليوم بهذا العدد أو أكثر.'),
    (8, 'تنبيه انقطاع الحصص بعد (يوم)', 14, 'CFG_Stale', '0', 'إذا مضت هذه المدة دون أي حصة مسجلة والفصل ما زال في فترته.'),
    (9, 'تنبيه أوراق المراجعة قبل الاختبار بـ (يوم)', 7, 'CFG_ReviewDays', '0', 'يذكّر بتسليم أوراق مراجعة العقيدة أو الفقه قبل موعد الاختبار.'),
]
for r, lab, val, nm, fmt, nt in rows:
    ws.cell(r, 2, lab).font = f(True, 14, INK); ws.cell(r, 2).alignment = rgt; ws.cell(r, 2).border = box; ws.cell(r, 2).fill = fill(SAND)
    x = ws.cell(r, 3, val); x.font = f(True, 15, INK); x.alignment = ctr; x.border = box; x.number_format = fmt
    x.fill = fill(MINT if nm == 'CFG_WeekNow' else INPUT); x.protection = Protection(locked=nm == 'CFG_WeekNow')
    if nt: note(ws, f'E{r}', nt)
    ws.row_dimensions[r].height = 30
    name(nm, f"{ST}!$C${r}")
dv = DataValidation(type='date', operator='between', formula1='36526', formula2='73415', allow_blank=True, showErrorMessage=True, error='أدخل تاريخًا صحيحًا')
dv.add('C3'); ws.add_data_validation(dv)
dv = DataValidation(type='whole', operator='between', formula1='0', formula2='365', allow_blank=False, showErrorMessage=True, error='أدخل رقمًا صحيحًا')
dv.add('C6:C9'); ws.add_data_validation(dv)
protect(ws)

# ------------------------------------------------------------------ teachers
ws = sheets[TEA]
ws['A1'] = 'اسم المدرس'; hdr(ws, 1, 1, 1)
names = [old['أسماء المدرسين'].cell(r, 1).value for r in range(3, 19)]
for i in range(2, 302):
    x = ws.cell(i, 1, names[i - 2] if i - 2 < len(names) else None); x.font = f(); x.alignment = rgt
ws.conditional_formatting.add('A2:A301', FormulaRule(formula=['$A2<>""'], border=box, fill=fill(SAND)))
ws.column_dimensions['A'].width = 32; ws.column_dimensions['C'].width = 60
note(ws, 'C1', 'أضِف الاسم الجديد في آخر القائمة، فيظهر في كل القوائم المنسدلة (المدرس والمنفذ).')
ws.freeze_panes = 'A2'
name('Teachers', f"OFFSET({T}!$A$2,0,0,MAX(1,COUNTA({T}!$A$2:$A$300)),1)")

# ------------------------------------------------------------------ holidays
ws = sheets[HOL]
for i, h in enumerate(['من تاريخ', 'إلى تاريخ (اختياري)', 'السبب', 'إلى (تلقائي)'], 1): ws.cell(1, i, h)
hdr(ws, 1, 1, 3); hdr(ws, 1, 4, 4, MUTED)
ws['F1'] = 'أيام الإجازة (تلقائي)'; hdr(ws, 1, 6, 7, MUTED, 11)
ws.cell(2, 1, dt.datetime(2026, 11, 22)); ws.cell(2, 2, dt.datetime(2026, 11, 26)); ws.cell(2, 3, 'إجازة (مثال، عدّلها)')
for r in range(2, 202):
    for c in (1, 2, 3, 4):
        x = ws.cell(r, c); x.font = f(); x.alignment = ctr
        if c != 3: x.number_format = DF
        x.protection = Protection(locked=c == 4)
    ws.cell(r, 4).value = f'=IF(A{r}="","",IF(B{r}="",A{r},MAX(A{r},B{r})))'; ws.cell(r, 4).font = f(False, 12, MUTED)
ws.conditional_formatting.add('A2:D201', FormulaRule(formula=['$A2<>""'], border=box, fill=fill(SAND)))
ws.conditional_formatting.add('A2:C201', FormulaRule(formula=['$A2=""'], fill=fill(INPUT)))
ws['F2'] = '=IF(A2="",0,A2)'; ws['G2'] = 1
for r in range(3, 802):
    p = r - 1
    ws.cell(r, 6).value = (f'=IF(F{p}=0,0,IF(F{p}<INDEX($D$2:$D$201,G{p}),F{p}+1,'
                           f'IF(INDEX($A$2:$A$201,G{p}+1)="",0,INDEX($A$2:$A$201,G{p}+1))))')
    ws.cell(r, 7).value = f'=IF(F{p}=0,G{p},IF(F{p}<INDEX($D$2:$D$201,G{p}),G{p},G{p}+1))'
for r in range(2, 802):
    ws.cell(r, 6).number_format = DFZ; ws.cell(r, 6).font = f(False, 11, MUTED); ws.cell(r, 7).font = f(False, 9, 'C8C8C8')
for col, w in zip('ABCDEFG', (15, 17, 34, 14, 2, 14, 5)): ws.column_dimensions[col].width = w
note(ws, 'I1', 'اكتب كل إجازة في صف («إلى» فارغ = يوم واحد)، متتالية دون صفوف فارغة بينها.'); ws.column_dimensions['I'].width = 60
note(ws, 'I2', 'تُستبعد من الحصص المتوقعة ومن تعبئة التواريخ، ولا يقبل الملف تاريخ حصة فيها.')
dv = DataValidation(type='date', operator='between', formula1='36526', formula2='73415', allow_blank=True, showErrorMessage=True, error='أدخل تاريخًا صحيحًا')
dv.add('A2:B201'); ws.add_data_validation(dv)
ws.freeze_panes = 'A2'; protect(ws)
name('HOL_From', f"{H}!$A$2:$A$201"); name('HOL_To', f"{H}!$D$2:$D$201"); name('HOL_Days', f"{H}!$F$2:$F$801"); name('DB_Holidays', f"{H}!$A$1:$D$201")

# ------------------------------------------------------------------ catalog
ws = sheets[CAT]
for i, h in enumerate(['الكتاب', 'الأسبوع', 'الحصة', 'الموضوع', 'الصفحات (= اسم ملف الـPDF)'], 1): ws.cell(1, i, h)
hdr(ws, 1, 1, 5)
for r in range(5, 52):
    cr = r - 3
    a, wk, ses, top, pg = (oldn.cell(r, 1).value, oldn.cell(r, 3).value, oldn.cell(r, 4).value, oldn.cell(r, 5).value, oldn.cell(r, 16).value)
    if r == 32: a, ses, top, pg = 'العقيدة', 'مراجعة', 'المراجعة النهائية والاختبار (العقيدة)', None
    if r == 51: a, ses, top, pg, wk = 'الفقه', 'مراجعة', 'المراجعة النهائية والاختبار (الفقه)', None, 10
    for c, v in enumerate([a, wk, ses, top, pg], 1): ws.cell(cr, c, v)
for r in range(2, 62):
    for c in range(1, 6):
        x = ws.cell(r, c); x.font = f(); x.alignment = rgt if c == 4 else ctr
    ws.cell(r, 5).number_format = '@'
ws.conditional_formatting.add('A2:E61', FormulaRule(formula=['$D2<>""'], border=box))
for bk, col in BOOKS.items(): ws.conditional_formatting.add('A2:A61', FormulaRule(formula=[f'$A2="{bk}"'], fill=fill(col)))
ws.conditional_formatting.add('A2:E61', FormulaRule(formula=['$C2="مراجعة"'], fill=fill(GOLD_L), font=Font(name=FONT, bold=True)))
for col, w in zip('ABCDE', (18, 9, 10, 62, 24)): ws.column_dimensions[col].width = w
ws['G1'] = 'مسار مجلد ملفات PDF'; ws['G1'].font = f(True, 14, INK)
ws['G2'] = '=IFERROR(LEFT(CELL("filename",$A$1),FIND("[",CELL("filename",$A$1))-1)&"PDF_Lessons\\","")'
ws['G2'].font = f(False, 12); ws['G2'].fill = fill(SAND); ws['G2'].border = box
note(ws, 'G3', 'الأصل: مجلد PDF_Lessons بجوار هذا الملف. ويمكن كتابة مسار ثابت بدل المعادلة، مثل \\\\server\\share\\PDF_Lessons\\')
note(ws, 'G5', 'دروس المنهج تُعرَّف هنا مرة واحدة وتقرؤها كل أوراق الفصول. لحصة المراجعة اكتب في «الحصة»: مراجعة. السعة 60 صفًا متتالية.')
ws.column_dimensions['G'].width = 62; ws.row_dimensions[3].height = 36; ws.row_dimensions[5].height = 50
ws.freeze_panes = 'A2'
name('CFG_PdfPath', f"{C}!$G$2")

# ------------------------------------------------------------------ surah segments
ws = sheets[SUR]
for i, h in enumerate(['المقطع (تلقائي)', 'السورة', 'رقم المقطع', 'من آية', 'إلى آية', 'ملاحظة'], 1): ws.cell(1, i, h)
hdr(ws, 1, 1, 1, MUTED); hdr(ws, 1, 2, 6)
segs = [('الأحزاب', [(1, 8), (9, 20), (21, 27), (28, 35), (36, 44), (45, 52), (53, 62), (63, 73)]),
        ('الفتح', [(1, 10), (11, 17), (18, 24), (25, 29)]), ('الحشر', [(1, 7), (8, 14), (15, 24)])]
r = 2
for s_, parts in segs:
    for k, (a, b) in enumerate(parts, 1):
        ws.cell(r, 2, s_); ws.cell(r, 3, k); ws.cell(r, 4, a); ws.cell(r, 5, b)
        if r == 2: ws.cell(r, 6, 'تقسيم مثال: عدّله كما تشاء')
        r += 1
for r in range(2, 501):
    ws.cell(r, 1).value = f'=IF(B{r}="","",B{r}&" "&C{r}&" ("&D{r}&"-"&E{r}&")")'
    for c in range(1, 7):
        x = ws.cell(r, c); x.font = f(c == 1, 13, INK if c == 1 else '1F1F1F'); x.alignment = ctr
ws.conditional_formatting.add('A2:F500', FormulaRule(formula=['$B2<>""'], border=box))
ws.conditional_formatting.add('A2:A500', FormulaRule(formula=['$B2<>""'], fill=fill(MINT)))
ws.conditional_formatting.add('B2:B500', FormulaRule(formula=['AND($B2<>"",$B2<>$B1)'], fill=fill(GOLD_L), font=Font(name=FONT, bold=True)))
for col, w in zip('ABCDEF', (30, 16, 11, 9, 9, 30)): ws.column_dimensions[col].width = w
note(ws, 'H1', 'قسّم كل سورة إلى مقاطع كما تريد (مقطع لكل حصة غالبًا). هذا الترتيب هو ترتيب المقاطع في كل كشوف القرآن.')
note(ws, 'H2', 'لتخصيص فصل معيّن: ألغِ حماية كشفه واختر المقطع من القائمة في صف «المقطع».'); ws.column_dimensions['H'].width = 60
ws.freeze_panes = 'A2'
name('LST_Segments', f"{S}!$A$2:$A$500"); name('LST_SegList', f"OFFSET({S}!$A$2,0,0,MAX(1,COUNTA({S}!$B$2:$B$500)),1)")

# ------------------------------------------------------------------ class data
ws = sheets[DATA]
cols = ['رقم الفصل (= اسم الورقة)', 'النوع', 'المدرس', 'رقم الدورة', 'الجزء (البلس)', 'بداية الفصل (تاريخ)', 'نهاية الفصل (تاريخ)',
        'أو: من أسبوع', 'إلى أسبوع', 'يوم الحصة 1', 'يوم الحصة 2', 'يوم الحصة 3', 'اختبار العقيدة', 'اختبار الفقه', 'عدد الطلاب',
        'الفصل التالي (اختياري)', 'تاريخ الانتقال', 'الحالة',
        'الورقة', 'ترتيب', 'البداية', 'النهاية', 'أيام', 'حصص متوقعة', 'الأسبوع']
for i, h in enumerate(cols, 1): ws.cell(1, i, h)
hdr(ws, 1, 1, 18); hdr(ws, 1, 19, 25, MUTED, 11)
ws.row_dimensions[1].height = 40
seed = [
 ('AGE-CG-01', TY_L, 'عامر الهاجري', 143, 'P31', dt.datetime(2025, 9, 14), dt.datetime(2026, 5, 31), None, None, 'الأحد', 'الاثنين', None, dt.datetime(2026, 1, 11), dt.datetime(2026, 5, 17), 12, None, None, ST_ARC),
 ('SMS 163', TY_L, 'جهاد جمال', 144, 'P37', dt.datetime(2026, 9, 20), dt.datetime(2027, 1, 31), None, None, 'الأربعاء', 'الخميس', None, dt.datetime(2026, 11, 15), dt.datetime(2027, 1, 31), 13, None, None, ST_ACT),
 ('FLOP 049', TY_L, 'جهاد جمال', 144, 'P37', None, None, 4, 22, 'الأحد', 'الثلاثاء', None, dt.datetime(2026, 11, 15), dt.datetime(2027, 1, 31), 13, None, None, ST_ACT),
 ('FLOP-CG-02', TY_L, 'عامر الهاجري', 144, 'P37', dt.datetime(2026, 9, 20), dt.datetime(2027, 1, 31), None, None, 'الأحد', 'الاثنين', None, dt.datetime(2026, 11, 15), dt.datetime(2027, 1, 31), 12, None, None, ST_ACT),
 ('CC-25-5', TY_Q, 'جهاد جمال', 145, 'P40', dt.datetime(2026, 10, 18), dt.datetime(2026, 12, 24), None, None, 'الأحد', 'الثلاثاء', None, None, None, None, 'SMS 170', dt.datetime(2026, 12, 27), ST_ACT),
]
for i, row in enumerate(seed, 2):
    for c, v in enumerate(row, 1): ws.cell(i, c, v)
MON_SUN = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
for r in range(2, DROWS + 2):
    for c in range(1, 26):
        x = ws.cell(r, c); x.font = f(c in (1, 18), 13); x.alignment = ctr
        if c >= 19: x.font = f(c == 19, 12, MUTED if c != 19 else '1F1F1F')
    for c in (6, 7, 13, 14, 17, 21, 22): ws.cell(r, c).number_format = DF
    act = f'OR(R{r}="",R{r}="{ST_ACT}")'
    ws.cell(r, 19).value = (f'=IF(A{r}="","",IF(ISERROR(INDIRECT("\'"&A{r}&"\'!A1")),IF({act},"ناقصة","—"),'
                            f'IF({act},"✓",R{r})))')
    ws.cell(r, 20).value = f'=IF(AND(A{r}<>"",{act}),MAX(T$1:T{r-1})+1,"")'
    ws.cell(r, 21).value = f'=IF(A{r}="","",IF(ISNUMBER(F{r}),F{r},IF(AND(ISNUMBER(H{r}),ISNUMBER(CFG_Week1)),CFG_Week1+(H{r}-1)*7,"")))'
    ws.cell(r, 22).value = f'=IF(A{r}="","",IF(ISNUMBER(G{r}),G{r},IF(AND(ISNUMBER(I{r}),ISNUMBER(CFG_Week1)),CFG_Week1+(I{r}-1)*7+4,"")))'
    mask = '&'.join(f'IF(COUNTIF(J{r}:L{r},"{d}")>0,"0","1")' for d in MON_SUN)
    ws.cell(r, 23).value = f'=IF(A{r}="","",{mask})'
    ws.cell(r, 24).value = (f'=IF(OR(A{r}="",NOT(ISNUMBER(U{r})),W{r}="1111111"),"",IF(U{r}>TODAY(),0,'
                            f'NETWORKDAYS.INTL(U{r},MIN(TODAY(),IF(ISNUMBER(V{r}),V{r},TODAY())),W{r},HOL_Days)))')
    ws.cell(r, 25).value = (f'=IF(OR(A{r}="",NOT(ISNUMBER(U{r})),NOT(ISNUMBER(V{r}))),"",IF(TODAY()<U{r},"لم يبدأ",'
                            f'IF(TODAY()>V{r},"انتهت المدة",(INT((TODAY()-U{r})/7)+1)&" / "&ROUNDUP((V{r}-U{r}+1)/7,0))))')
for col, w in zip([CL(i) for i in range(1, 26)], (22, 9, 18, 9, 10, 13, 13, 9, 9, 10, 10, 10, 13, 13, 8, 15, 13, 10, 9, 6, 12, 12, 9, 9, 11)):
    ws.column_dimensions[col].width = w
ws.freeze_panes = 'B2'
for t_, fo, rg in [('list', '=Teachers', 'C'), ('list', '=LST_Type', 'B'), ('list', '=LST_Status', 'R')]:
    dv = DataValidation(type=t_, formula1=fo, allow_blank=True); dv.add(f'{rg}2:{rg}{DROWS+1}'); ws.add_data_validation(dv)
dv = DataValidation(type='list', formula1='=LST_Days', allow_blank=True); dv.add(f'J2:L{DROWS+1}'); ws.add_data_validation(dv)
dv = DataValidation(type='custom', showErrorMessage=True, errorTitle='رقم فصل غير صالح',
                    formula1=f'=AND(COUNTIF($A$2:$A${DROWS+1},A2)=1,LEN(A2)<=31,ISERROR(FIND("[",A2)),ISERROR(FIND("]",A2)),ISERROR(FIND("/",A2)),ISERROR(FIND("\\",A2)),ISERROR(FIND("?",A2)),ISERROR(FIND("*",A2)),ISERROR(FIND(":",A2)))',
                    error='الاسم مكرر، أو أطول من 31 حرفًا، أو فيه أحد الرموز ( [ ] / \\ ? * : ).')
dv.add(f'A2:A{DROWS+1}'); ws.add_data_validation(dv)
dv = DataValidation(type='date', operator='between', formula1='36526', formula2='73415', allow_blank=True, showErrorMessage=True, error='أدخل تاريخًا صحيحًا')
for rg in (f'F2:G{DROWS+1}', f'M2:N{DROWS+1}', f'Q2:Q{DROWS+1}'): dv.add(rg)
ws.add_data_validation(dv)
dv = DataValidation(type='whole', operator='between', formula1='1', formula2='60', allow_blank=True, showErrorMessage=True, error='رقم أسبوع من 1 إلى 60')
dv.add(f'H2:I{DROWS+1}'); ws.add_data_validation(dv)
N = DROWS + 1; cf = ws.conditional_formatting
cf.add(f'A2:R{N}', FormulaRule(formula=['$A2<>""'], border=box))
cf.add(f'A2:R{N}', FormulaRule(formula=[f'OR($R2="{ST_ARC}",$R2="{ST_DEL}",$R2="{ST_FIN}")'], fill=fill(MUTED_L), font=Font(name=FONT, color=MUTED), stopIfTrue=True))
cf.add(f'A2:A{N}', FormulaRule(formula=[f'AND($A2<>"",COUNTIF($A$2:$A${N},$A2)>1)'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
cf.add(f'B2:B{N}', FormulaRule(formula=[f'$B2="{TY_Q}"'], fill=fill(DONE)))
cf.add(f'A2:R{N}', FormulaRule(formula=['$A2=""'], fill=fill('FFFCF3')))
cf.add(f'S2:S{N}', FormulaRule(formula=['$S2="ناقصة"'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
cf.add(f'S2:S{N}', FormulaRule(formula=['$S2="✓"'], font=Font(name=FONT, bold=True, color=DONE_T)))
cf.add(f'F2:I{N}', FormulaRule(formula=['AND($A2<>"",NOT(ISNUMBER($U2)))'], fill=fill(ALERT)))
note(ws, 'AA1', 'أضِف الفصل في أول صف فارغ. فصول CC نوعها «قرآن»، ويمكن تحديد «الفصل التالي» وتاريخ الانتقال.')
note(ws, 'AA2', 'الفترة: اكتب التاريخين، أو رقمي الأسبوعين (من الإعدادات). الأعمدة الرمادية تلقائية.')
note(ws, 'AA3', 'الحالة: «نشط» يظهر في الصفحة الأساسية. «منتهٍ» يختفي منها وتبقى ورقته. «للأرشفة» و«للحذف» تنفّذهما أداة الإدارة.')
ws.column_dimensions['AA'].width = 90
name('DB_Classes', f"{D}!$A$1:$Y${DROWS+1}")

# ------------------------------------------------------------------ class sheets common
def lk(c, text=False):
    v = f'VLOOKUP($A$3,{D}!$A:$Y,{c},FALSE)'
    return f'=IFERROR({v}&"","")' if text else f'=IFERROR(IF({v}="","",{v}),"")'
NAME_F = '=MID(CELL("filename",$A$1),FIND("]",CELL("filename",$A$1))+1,255)'
WARN_F = f'=IF(OR(LEFT($A$3,5)="نموذج",COUNTIF({D}!$A:$A,$A$3)>0),"","⚠ اسم هذه الورقة غير مسجَّل في بيانات_الفصول")'
BACK = f'=HYPERLINK("#\'{DASH}\'!A1","◀  الصفحة الأساسية")'
_wk = f'VLOOKUP($A$3,{D}!$A:$Y,25,FALSE)&""'
WEEK = f'=IFERROR(IF(ISNUMBER(SEARCH("/",{_wk})),"الأسبوع "&SUBSTITUTE({_wk}," / "," من "),{_wk}),"")'

def put(ws, spec, style):
    for rng, val in spec:
        a = rng.split(':')[0]
        if ':' in rng: ws.merge_cells(rng)
        ws[a] = val
        for row in (ws[rng] if ':' in rng else [[ws[rng]]]):
            for x in row: style(x)
def s_lab(color):
    def st(x): x.font = f(True, 12, 'FFFFFF'); x.fill = fill(color); x.alignment = ctr; x.border = box
    return st
def s_val(bg):
    def st(x): x.font = f(True, 14, INK); x.fill = fill(bg); x.alignment = ctr; x.border = box
    return st

def top(ws, title_text, warn_rng, week_rng, width_cols):
    ws['A1'] = BACK; ws.merge_cells('A1:B1')
    for x in (ws['A1'], ws['B1']): x.fill = fill(GOLD); x.border = box
    ws['A1'].font = f(True, 13, 'FFFFFF'); ws['A1'].alignment = ctr
    ws['C1'] = title_text; ws.merge_cells('C1:D1')
    for x in (ws['C1'], ws['D1']): x.fill = fill(INK); x.border = goldline
    ws['C1'].font = f(True, 22, 'FFFFFF'); ws['C1'].alignment = Alignment(horizontal='right', vertical='center', indent=1)
    a = warn_rng.split(':')[0]; ws[a] = WARN_F; ws.merge_cells(warn_rng)
    for row in ws[warn_rng]:
        for x in row: x.fill = fill(INK); x.border = goldline
    ws[a].font = f(True, 12, 'FFD9C7'); ws[a].alignment = ctr
    b = week_rng.split(':')[0]; ws[b] = WEEK; ws.merge_cells(week_rng)
    for row in ws[week_rng]:
        for x in row: x.fill = fill(INK); x.border = goldline
    ws[b].font = f(True, 14, GOLD_L); ws[b].alignment = ctr
    ws.row_dimensions[1].height = 42

def date_dv(ws, rng, s_cell, e_cell, first):
    fo = (f'=AND(ISNUMBER({first}),WEEKDAY({first},1)<=5,OR({s_cell}="",{first}>={s_cell}),'
          f'OR({e_cell}="",{first}<={e_cell}),COUNTIFS(HOL_From,"<="&{first},HOL_To,">="&{first})=0)')
    dv = DataValidation(type='custom', formula1=fo, allow_blank=True, showErrorMessage=True, errorTitle='تاريخ غير مقبول',
                        error='يجب أن يكون التاريخ من الأحد إلى الخميس، وداخل فترة الفصل، وليس في إجازة.',
                        showInputMessage=True, promptTitle='تاريخ التنفيذ', prompt='اكتب تاريخ الحصة، مثل 2026/10/25')
    dv.add(rng); ws.add_data_validation(dv)
def exec_dv(ws, rng):
    dv = DataValidation(type='list', formula1='=Teachers', allow_blank=True, showErrorMessage=True, errorTitle='اسم غير موجود',
                        error='اختر الاسم من القائمة (لإضافة مدرس: ورقة أسماء المدرسين).',
                        showInputMessage=True, promptTitle='المنفذ', prompt='من درّس الحصة؟ (قد يكون بديلًا عن مدرس الفصل)')
    dv.add(rng); ws.add_data_validation(dv)
def finish(ws, land, titles, freeze):
    ws.freeze_panes = freeze; protect(ws)
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.orientation = 'landscape' if land else 'portrait'
    ws.page_setup.fitToHeight = 0; ws.page_setup.fitToWidth = 1; ws.print_title_rows = titles
    ws.page_margins.left = ws.page_margins.right = 0.4

# ------------------------------------------------------------------ lessons sheet
R0, R1 = 8, 67
def make_lessons(ws, nm=None, rec=None):
    ws.sheet_view.rightToLeft = True; ws.sheet_view.showGridLines = False
    for k, v in dict(A=17, B=8, C=9, D=60, E=13, F=14, G=20, H=15, I=15, J=15).items(): ws.column_dimensions[k].width = v
    top(ws, 'سجل متابعة الدروس', 'E1:G1', 'H1:J1', 10)
    put(ws, [('A2', 'رقم الفصل'), ('B2:C2', 'الدورة'), ('D2', 'المدرس'), ('E2', 'الجزء'), ('F2', 'الطلاب'),
             ('G2', 'اختبار العقيدة'), ('H2', 'اختبار الفقه'), ('I2', 'بداية الفصل'), ('J2', 'نهاية الفصل')], s_lab(PRI))
    put(ws, [('A3', nm if (TEST and nm) else NAME_F), ('B3:C3', lk(4)), ('D3', lk(3, True)), ('E3', lk(5, True)),
             ('F3', lk(15)), ('G3', lk(13)), ('H3', lk(14)), ('I3', lk(21)), ('J3', lk(22))], s_val(SAND))
    for a in ('G3', 'H3', 'I3', 'J3'): ws[a].number_format = DF
    Fr, Dr, Cr, Gr, Hr, Ar = (f'${c}${R0}:${c}${R1}' for c in 'FDCGHA')
    MX = f'_xlfn.AGGREGATE(14,6,{Fr}/({Fr}<=TODAY()),1)'
    K = f'LOOKUP(2,1/({Fr}=$E$5),ROW({Fr})-{R0-1})'
    def sub(c): return f'INDEX(${c}${R0}:${c}${R1},1):INDEX(${c}${R0}:${c}${R1},{K})'
    put(ws, [('A4', 'المنفَّذ'), ('B4:C4', 'دروس متخطاة'), ('D4', 'آخر درس منفذ'), ('E4', 'تاريخه'), ('F4', 'بديل؟'),
             ('G4', 'بواسطة'), ('H4', 'مراجعة العقيدة'), ('I4:J4', 'مراجعة الفقه')], s_lab(GOLD))
    put(ws, [
        ('A5', f'=COUNTIF({Fr},"<="&TODAY())&" / "&COUNTIF({Dr},"?*")'),
        ('B5:C5', f'=IF($E$5="",0,COUNTIFS({sub("F")},"",{sub("D")},"?*",{sub("C")},"<>مراجعة"))'),
        ('D5', f'=IF($E$5="","لم يُقدَّم درس",INDEX({Dr},{K}))'),
        ('E5', f'=IFERROR({MX},"")'),
        ('F5', '=IF(OR($G$5="",$G$5="(لم يُسجَّل)",$D$3=""),"",IF($G$5<>$D$3,"بديل",""))'),
        ('G5', f'=IF($E$5="","",IF(INDEX({Gr},{K})="","(لم يُسجَّل)",INDEX({Gr},{K})))'),
        ('H5', f'=IF(COUNTIFS({Ar},"العقيدة*",{Cr},"مراجعة",{Hr},"نعم")>0,"نعم","لا")'),
        ('I5:J5', f'=IF(COUNTIFS({Ar},"الفقه*",{Cr},"مراجعة",{Hr},"نعم")>0,"نعم","لا")'),
    ], s_val(MINT))
    ws['E5'].number_format = DF; ws['D5'].alignment = Alignment(horizontal='right', vertical='center', wrap_text=True, indent=1)
    ws.row_dimensions[2].height = 24; ws.row_dimensions[3].height = 28; ws.row_dimensions[4].height = 24; ws.row_dimensions[5].height = 38
    ws.row_dimensions[6].height = 8
    for i, h in enumerate(['الكتاب', 'الأسبوع', 'الحصة', 'الموضوع', 'الصفحة', 'تاريخ التنفيذ', 'المنفذ', 'سُلّمت أوراق المراجعة؟'], 1): ws.cell(7, i, h)
    hdr(ws, 7, 1, 8, INK, 13); ws.row_dimensions[7].height = 34
    for x in ws[7]:
        if x.column <= 8: x.border = Border(left=thin, right=thin, top=thin, bottom=Side(style='medium', color=GOLD))
    for r in range(R0, R1 + 1):
        cr = r - 6
        for c, col in zip((1, 2, 3, 4), 'ABCD'): ws.cell(r, c).value = f'=IF({C}!{col}{cr}="","",{C}!{col}{cr})'
        ws.cell(r, 5).value = f'=IF({C}!E{cr}="","",HYPERLINK(CFG_PdfPath&{C}!E{cr}&".pdf",{C}!E{cr}))'
        for c in range(1, 9):
            x = ws.cell(r, c); x.font = f(c == 4 and False, 13); x.alignment = rgt if c == 4 else ctr; x.protection = Protection(locked=c < 6)
        ws.cell(r, 5).font = f(True, 13, '1F6FA8', u='single')
        ws.cell(r, 6).number_format = DF; ws.row_dimensions[r].height = 30
    if rec:
        for r, (d_, who) in rec.items():
            if d_: ws.cell(r, 6, d_)
            if who: ws.cell(r, 7, who)
    date_dv(ws, f'F{R0}:F{R1}', '$I$3', '$J$3', f'F{R0}'); exec_dv(ws, f'G{R0}:G{R1}')
    dvr = DataValidation(type='list', formula1='=LST_YesNo', allow_blank=True); dvr.add(f'H{R0}:H{R1}'); ws.add_data_validation(dvr)
    c = ws.conditional_formatting
    c.add(f'F{R0}:H{R1}', FormulaRule(formula=[f'AND($F{R0}="",$D{R0}<>"",$C{R0}<>"مراجعة",COUNTIF($F{R0+1}:$F${R1+1},"<="&TODAY())>0)'], fill=fill(WARN), stopIfTrue=True))
    c.add(f'G{R0}:G{R1}', FormulaRule(formula=[f'AND($F{R0}<>"",$G{R0}="")'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T), stopIfTrue=True))
    c.add(f'F{R0}:F{R1}', FormulaRule(formula=[f'AND($F{R0}<>"",$F{R0}<MAX($F$7:$F{R0-1}))'], fill=fill(ALERT), stopIfTrue=True))
    c.add(f'H{R0}:H{R1}', FormulaRule(formula=[f'AND($D{R0}<>"",$C{R0}<>"مراجعة")'], fill=fill(MUTED_L), stopIfTrue=True))
    c.add(f'F{R0}:H{R1}', FormulaRule(formula=[f'$F{R0}<>""'], fill=fill(DONE)))
    c.add(f'F{R0}:H{R1}', FormulaRule(formula=[f'$D{R0}<>""'], fill=fill(INPUT)))
    c.add(f'A{R0}:H{R1}', FormulaRule(formula=[f'$D{R0}<>""'], border=box))
    for bk, col in BOOKS.items(): c.add(f'A{R0}:A{R1}', FormulaRule(formula=[f'$A{R0}="{bk}"'], fill=fill(col)))
    c.add(f'A{R0}:E{R1}', FormulaRule(formula=[f'$C{R0}="مراجعة"'], fill=fill(GOLD_L), font=Font(name=FONT, bold=True, color=INK)))
    c.add(f'A{R0}:E{R1}', FormulaRule(formula=[f'AND($F{R0}<>"",$F{R0}<=TODAY())'], font=Font(name=FONT, color=DONE_T)))
    c.add('B5:C5', FormulaRule(formula=['AND(ISNUMBER($B$5),$B$5>0)'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
    c.add('F5', FormulaRule(formula=['$F$5="بديل"'], fill=fill(ALERT)))
    c.add('H5:J5', FormulaRule(formula=['H5="نعم"'], fill=fill(DONE), font=Font(name=FONT, bold=True, color=DONE_T)))
    finish(ws, False, '7:7', 'A8')

# ------------------------------------------------------------------ quran sheet
Q0, Q1 = 5, 44; S0, S1 = 11, 70
QA, QZ = CL(Q0), CL(Q1)
def make_quran(ws, nm=None, students=None):
    ws.sheet_view.rightToLeft = True; ws.sheet_view.showGridLines = False
    for k, v in dict(A=5, B=15, C=30, D=11).items(): ws.column_dimensions[k].width = v
    for c in range(Q0, Q1 + 1): ws.column_dimensions[CL(c)].width = 11.5
    top(ws, 'كشف تقييم التلاوة', 'E1:K1', 'L1:O1', 15)
    put(ws, [('A2:B2', 'رقم الفصل'), ('C2', 'المدرس'), ('D2:E2', 'الجزء (البلس)'), ('F2:G2', 'عدد الطلاب'),
             ('H2:I2', 'بداية الفصل'), ('J2:K2', 'نهاية الفصل'), ('L2:M2', 'الفصل التالي'), ('N2:O2', 'تاريخ الانتقال')], s_lab(PRI))
    put(ws, [('A3:B3', nm if (TEST and nm) else NAME_F), ('C3', lk(3, True)), ('D3:E3', lk(5, True)),
             ('F3:G3', f'=COUNTA($B${S0}:$B${S1})'), ('H3:I3', lk(21)), ('J3:K3', lk(22)), ('L3:M3', lk(16, True)), ('N3:O3', lk(17))], s_val(SAND))
    for a in ('H3', 'J3', 'N3'): ws[a].number_format = DF
    Dt, Lb, Ex = (f'${QA}${r}:${QZ}${r}' for r in (8, 7, 9)); Av = f'$D${S0}:$D${S1}'
    MX = f'_xlfn.AGGREGATE(14,6,{Dt}/({Dt}<=TODAY()),1)'
    K = f'LOOKUP(2,1/({Dt}=$D$5),COLUMN({Dt})-{Q0-1})'
    def sub(r): return f'INDEX(${QA}${r}:${QZ}${r},1):INDEX(${QA}${r}:${QZ}${r},{K})'
    put(ws, [('A4:B4', 'المقاطع المنفذة'), ('C4', 'آخر مقطع منفذ'), ('D4:E4', 'تاريخه'), ('F4:G4', 'بواسطة'),
             ('H4:I4', 'بديل؟'), ('J4:K4', 'متخطاة'), ('L4:M4', 'معدل الفصل'), ('N4:O4', 'دون الحد')], s_lab(GOLD))
    put(ws, [
        ('A5:B5', f'=COUNTIF({Dt},"<="&TODAY())&" / "&COUNTIF({Lb},"?*")'),
        ('C5', f'=IF($D$5="","لم يُرصد",INDEX({Lb},{K}))'),
        ('D5:E5', f'=IFERROR({MX},"")'),
        ('F5:G5', f'=IF($D$5="","",IF(INDEX({Ex},{K})="","(لم يُسجَّل)",INDEX({Ex},{K})))'),
        ('H5:I5', '=IF(OR($F$5="",$F$5="(لم يُسجَّل)",$C$3=""),"",IF($F$5<>$C$3,"بديل",""))'),
        ('J5:K5', f'=IF($D$5="",0,COUNTIFS({sub(8)},"",{sub(7)},"?*"))'),
        ('L5:M5', f'=IFERROR(ROUND(AVERAGE({Av}),0),"")'),
        ('N5:O5', f'=COUNTIF({Av},"<"&CFG_Pass)'),
    ], s_val(MINT))
    ws['D5'].number_format = DF
    ws.row_dimensions[2].height = 24; ws.row_dimensions[3].height = 28; ws.row_dimensions[4].height = 24; ws.row_dimensions[5].height = 38
    ws.row_dimensions[6].height = 8
    ws.merge_cells('A7:C9')
    ws['A7'] = 'الصق الأرقام الأكاديمية والأسماء في العمودين B و C.\nالدرجة من 10 (تقبل الكسور)، أو اختر «غائب».\nالفارغ و«غائب» لا يدخلان في المعدل.'
    ws['A7'].font = f(False, 12, '5A5A5A'); ws['A7'].alignment = Alignment(wrap_text=True, vertical='center', horizontal='right', indent=1)
    for row in ws['A7:C9']:
        for x in row: x.fill = fill(SAND); x.border = box
    for r, t_ in ((7, 'المقطع'), (8, 'تاريخ التنفيذ'), (9, 'المنفذ')):
        x = ws.cell(r, 4, t_); x.font = f(True, 12, 'FFFFFF'); x.fill = fill(PRI); x.alignment = ctr; x.border = box
    ws.row_dimensions[7].height = 52; ws.row_dimensions[8].height = 24; ws.row_dimensions[9].height = 24
    for i, h in enumerate(['م', 'الرقم الأكاديمي', 'الاسم (Cadet Name)', 'المعدل /100'], 1): ws.cell(10, i, h)
    hdr(ws, 10, 1, 4); ws.row_dimensions[10].height = 32
    for c in range(Q0, Q1 + 1):
        col = CL(c); k = c - Q0 + 1
        ws.cell(7, c).value = f'=IFERROR(INDEX(LST_Segments,{k})&"","")'
        ws.cell(7, c).font = f(True, 12, INK); ws.cell(7, c).alignment = ctr
        for r in (8, 9):
            x = ws.cell(r, c); x.font = f(False, 12); x.alignment = ctr; x.protection = Protection(locked=False)
        ws.cell(8, c).number_format = DF
        ws.cell(10, c).value = f'=IF({col}7="","",{k})'
        x = ws.cell(10, c); x.font = f(True, 13, 'FFFFFF'); x.fill = fill(INK); x.alignment = ctr; x.border = box
    for x in ws[10]: x.border = Border(left=thin, right=thin, top=thin, bottom=Side(style='medium', color=GOLD))
    for r in range(S0, S1 + 1):
        ws.cell(r, 1).value = f'=IF($B{r}="","",ROW()-{S0-1})'
        ws.cell(r, 4).value = (f'=IF(COUNT(${QA}{r}:${QZ}{r})=0,"",ROUNDUP(ROUND(SUM(${QA}{r}:${QZ}{r})/COUNT(${QA}{r}:${QZ}{r})*10,6),0))')
        for c in range(1, Q1 + 1):
            x = ws.cell(r, c); x.font = f(c == 4, 13 if c != 4 else 14, INK if c == 4 else '1F1F1F')
            x.alignment = ctr if c != 3 else Alignment(horizontal='left', vertical='center', indent=1)
            x.protection = Protection(locked=c in (1, 4))
        ws.cell(r, 2).number_format = '@'; ws.row_dimensions[r].height = 24
    if students:
        for i, (sid, sn, grades) in enumerate(students):
            r = S0 + i; ws.cell(r, 2, sid); ws.cell(r, 3, sn)
            for j, g in enumerate(grades):
                if g is not None: ws.cell(r, Q0 + j, g)
    date_dv(ws, f'{QA}8:{QZ}8', '$H$3', '$J$3', f'{QA}8'); exec_dv(ws, f'{QA}9:{QZ}9')
    dvg = DataValidation(type='list', formula1='=LST_Absent', allow_blank=True, showErrorMessage=False,
                         showInputMessage=True, promptTitle='الدرجة', prompt='اكتب الدرجة من 10، أو اختر «غائب» (لا يؤثر في المعدل).')
    dvg.add(f'{QA}{S0}:{QZ}{S1}'); ws.add_data_validation(dvg)
    dvs_ = DataValidation(type='list', formula1='=LST_SegList', allow_blank=True); dvs_.add(f'{QA}7:{QZ}7'); ws.add_data_validation(dvs_)
    c = ws.conditional_formatting; G = f'{QA}{S0}:{QZ}{S1}'
    c.add(G, FormulaRule(formula=[f'{QA}{S0}="{ABS}"'], fill=fill(MUTED_L), font=Font(name=FONT, italic=True, color=MUTED), stopIfTrue=True))
    c.add(G, FormulaRule(formula=[f'AND({QA}{S0}<>"",OR(NOT(ISNUMBER({QA}{S0})),{QA}{S0}<0,{QA}{S0}>10))'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T), stopIfTrue=True))
    c.add(G, FormulaRule(formula=[f'AND(ISNUMBER({QA}{S0}),{QA}{S0}<CFG_Pass/10)'], font=Font(name=FONT, bold=True, color=WARN_T)))
    c.add(G, FormulaRule(formula=[f'AND({QA}$7<>"",$B{S0}<>"",ISNUMBER({QA}{S0}))'], fill=fill('F4FAF6'), border=box))
    c.add(G, FormulaRule(formula=[f'AND({QA}$7<>"",$B{S0}<>"")'], fill=fill(INPUT), border=box))
    c.add(f'A{S0}:D{S1}', FormulaRule(formula=[f'$B{S0}<>""'], border=box))
    c.add(f'A{S0}:C{S1}', FormulaRule(formula=[f'AND($B{S0}<>"",MOD(ROW(),2)=0)'], fill=fill('FAF7F0')))
    c.add(f'D{S0}:D{S1}', FormulaRule(formula=[f'AND(ISNUMBER($D{S0}),$D{S0}<CFG_Pass)'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
    c.add(f'D{S0}:D{S1}', FormulaRule(formula=[f'AND(ISNUMBER($D{S0}),$D{S0}>=90)'], fill=fill(DONE), font=Font(name=FONT, bold=True, color=DONE_T)))
    c.add(f'D{S0}:D{S1}', FormulaRule(formula=[f'ISNUMBER($D{S0})'], fill=fill(MINT)))
    c.add(f'{QA}8:{QZ}8', FormulaRule(formula=[f'AND({QA}8="",COUNTA({QA}{S0}:{QA}{S1})>0)'], fill=fill(WARN), stopIfTrue=True))
    c.add(f'{QA}9:{QZ}9', FormulaRule(formula=[f'AND({QA}8<>"",{QA}9="")'], fill=fill(WARN), stopIfTrue=True))
    c.add(f'{QA}7:{QZ}9', FormulaRule(formula=[f'AND({QA}$7<>"",ISNUMBER({QA}$8))'], fill=fill(DONE), border=box))
    c.add(f'{QA}7:{QZ}9', FormulaRule(formula=[f'{QA}$7<>""'], fill=fill(INPUT), border=box))
    c.add(f'{QA}10:{QZ}10', FormulaRule(formula=[f'{QA}$7=""'], fill=fill(MUTED_L), font=Font(name=FONT, color='C8C8C8')))
    c.add('J5:K5', FormulaRule(formula=['AND(ISNUMBER($J$5),$J$5>0)'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
    c.add('N5:O5', FormulaRule(formula=['AND(ISNUMBER($N$5),$N$5>0)'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
    c.add('H5:I5', FormulaRule(formula=['$H$5="بديل"'], fill=fill(ALERT)))
    finish(ws, True, '7:10', f'{QA}{S0}')

# ------------------------------------------------------------------ class sheets
t1 = wb.create_sheet(TPL_L); make_lessons(t1, TPL_L); t1.sheet_properties.tabColor = MUTED
t2 = wb.create_sheet(TPL_Q); make_quran(t2, TPL_Q); t2.sheet_properties.tabColor = MUTED
name('TPL_Lessons', f"'{TPL_L}'!$A$1"); name('TPL_Quran', f"'{TPL_Q}'!$A$1")
for nm in ('FLOP-CG-02', 'SMS 163'):
    src = old[nm]; rec = {}
    for r in range(5, 52):
        if r in (32, 51): continue
        d_, who = src.cell(r, 7).value, src.cell(r, 8).value
        rec[r + 3] = (d_, None if who == 'اسم المدرس' else who)
    w = wb.create_sheet(nm); make_lessons(w, nm, rec); w.sheet_properties.tabColor = PRI
random.seed(7)
studs = []
for i in range(1, 13):
    studs.append([f'25{40000 + i}', f'Cadet {i:02d} (example)', [random.choice([10, 9.5, 9, 8.5, 8, 7, 10]) for _ in range(4)]])
studs[2][2][1] = ABS; studs[5][2] = [5, 6, 0, 4.5]; studs[8][2][3] = None
wq = wb.create_sheet('CC-25-5'); make_quran(wq, 'CC-25-5', studs); wq.sheet_properties.tabColor = GOLD
for j, d_ in enumerate([dt.datetime(2026, 10, 18), dt.datetime(2026, 10, 20), dt.datetime(2026, 10, 25), dt.datetime(2026, 10, 27)]):
    wq.cell(8, Q0 + j, d_); wq.cell(9, Q0 + j, 'جهاد جمال' if j != 2 else 'عامر الهاجري')

# ------------------------------------------------------------------ dashboard
ws = sheets[DASH]
title(ws, 'A1:S1', 'متابعة تنفيذ الدروس', 24, 46)
cards = [('B', 'C', 'الفصول النشطة', f'=MAX({D}!$T:$T)'), ('E', 'F', 'فصول القرآن', f'=COUNTIF($C$7:$C$306,"{TY_Q}")'),
         ('H', 'I', 'الأسبوع التدريبي', '=IF(CFG_WeekNow="","—",CFG_WeekNow)'), ('L', 'L', 'أوراق ناقصة', '=COUNTIF($S$7:$S$306,"ناقصة")'),
         ('N', 'O', 'فصول عليها تنبيه', '=COUNTIF($M$7:$M$306,"*⚠*")')]
for la, va, t_, fo in cards:
    if la == 'L':
        ws['K3'] = t_; ws['L3'] = fo; la, va = 'K', 'L'
    else:
        ws[f'{la}3'] = t_; ws[f'{va}3'] = fo
    lx, vx = ws[f'{la}3'], ws[f'{va}3']
    lx.font = f(True, 13, 'FFFFFF'); lx.fill = fill(PRI); lx.alignment = ctr; lx.border = box
    vx.font = f(True, 20, INK); vx.fill = fill(GOLD_L); vx.alignment = ctr; vx.border = box
ws.row_dimensions[2].height = 8; ws.row_dimensions[3].height = 36
note(ws, 'A4', 'اضغط اسم الفصل للدخول إلى ورقته. ويمكن التصفية من أسهم العناوين (النوع، البلس، المدرس...).', '6B6B6B', 12)
ws.merge_cells('A4:S4'); ws.row_dimensions[4].height = 20; ws.row_dimensions[5].height = 6
dh = ['#', 'الفصل', 'النوع', 'البلس', 'المدرس', 'الدورة', 'آخر درس / مقطع منفذ', 'تاريخه', 'بواسطة', 'المنفذ',
      'الأسبوع', 'المعدل', 'تنبيه', 'اختبار العقيدة', 'اختبار الفقه', 'الطلاب', 'دون الحد', 'الفصل التالي', 'الورقة']
for i, h in enumerate(dh, 1): ws.cell(6, i, h)
hdr(ws, 6, 1, 19, INK, 13); ws.row_dimensions[6].height = 36
for x in ws[6]: x.border = Border(left=thin, right=thin, top=thin, bottom=Side(style='medium', color=GOLD))
for col, w in zip([CL(i) for i in range(1, 20)], (5, 15, 8, 8, 16, 7, 44, 14, 15, 9, 10, 8, 42, 14, 14, 7, 8, 12, 7)):
    ws.column_dimensions[col].width = w
def V(r, c): return f'VLOOKUP($B{r},{D}!$A:$Y,{c},FALSE)'
FIRST, LAST = 7, 306
for r in range(FIRST, LAST + 1):
    def IND(cell): return f'INDIRECT("\'"&$B{r}&"\'!{cell}")'
    def PICK(lc, qc): return f'IF($C{r}="{TY_Q}",{IND(qc)},{IND(lc)})'
    ok = f'$S{r}="✓"'
    done = f'IF($C{r}="{TY_Q}",COUNTIF({IND(f"{QA}8:{QZ}8")},"<="&TODAY()),COUNTIF({IND("F8:F67")},"<="&TODAY()))'
    exp, en, nx, tr, st = V(r, 24), V(r, 22), V(r, 16), V(r, 17), V(r, 21)
    vals = {
        1: f'=IF(ROW()-{FIRST-1}<=MAX({D}!$T:$T),ROW()-{FIRST-1},"")',
        2: f'=IF($A{r}="","",HYPERLINK("#\'"&INDEX({D}!$A:$A,MATCH($A{r},{D}!$T:$T,0))&"\'!A1",INDEX({D}!$A:$A,MATCH($A{r},{D}!$T:$T,0))))',
        3: f'=IF($B{r}="","",IF({V(r,2)}="","{TY_L}",{V(r,2)}&""))',
        4: f'=IF($B{r}="","",{V(r,5)}&"")',
        5: f'=IF($B{r}="","",{V(r,3)}&"")',
        6: f'=IF($B{r}="","",IF({V(r,4)}="","",{V(r,4)}))',
        7: f'=IF($B{r}="","",IF(NOT({ok}),"—",{PICK("D5", "C5")}))',
        8: f'=IF($B{r}="","",IF(NOT({ok}),"",{PICK("E5", "D5")}))',
        9: f'=IF($B{r}="","",IF(NOT({ok}),"",{PICK("G5", "F5")}))',
        10: f'=IF($B{r}="","",IF(NOT({ok}),"",{PICK("A5", "A5")}))',
        11: f'=IF($B{r}="","",{V(r,25)}&"")',
        12: f'=IF($B{r}="","",IF(OR(NOT({ok}),$C{r}<>"{TY_Q}"),"",{IND("L5")}))',
        14: f'=IF($B{r}="","",IF({V(r,13)}="","",{V(r,13)}))',
        15: f'=IF($B{r}="","",IF({V(r,14)}="","",{V(r,14)}))',
        16: f'=IF($B{r}="","",IF(NOT({ok}),"",IF($C{r}="{TY_Q}",{IND("F3")},IF({V(r,15)}="","",{V(r,15)}))))',
        17: f'=IF($B{r}="","",IF(OR(NOT({ok}),$C{r}<>"{TY_Q}"),"",{IND("N5")}))',
        18: f'=IF($B{r}="","",{nx}&"")',
        19: f'=IF($B{r}="","",IF(ISERROR(INDIRECT("\'"&$B{r}&"\'!A1")),"ناقصة","✓"))',
    }
    vals[13] = ('=IF($B{r}="","",IF(NOT({ok}),"⚠ ورقة ناقصة. سمِّها: "&$B{r},TRIM('
                'IF(AND(ISNUMBER({st}),{st}>TODAY()),"لم يبدأ بعد  ","")'
                '&IF(AND({nx}<>"",ISNUMBER({tr})),IF({tr}<=TODAY(),"⚠ حان انتقاله إلى "&{nx}&"  ",""),"")'
                '&IF({skip}>0,"⚠ متخطاة: "&{skip}&"  ","")'
                '&IF(AND(ISNUMBER({exp}),{exp}-{done}>=CFG_Behind),"⚠ متأخر "&({exp}-{done})&" حصة  ","")'
                '&IF({sub}="بديل","(آخر حصة بديل)  ","")'
                '&IF(AND(ISNUMBER($H{r}),TODAY()-$H{r}>CFG_Stale,OR(NOT(ISNUMBER({en})),TODAY()<={en})),"⚠ لا حصة منذ "&(TODAY()-$H{r})&" يومًا  ","")'
                '&IF(AND($C{r}<>"{TQ}",ISNUMBER($N{r})),IF(AND($N{r}>=TODAY(),$N{r}-TODAY()<=CFG_ReviewDays,{ih5}<>"نعم"),"⚠ سلِّم مراجعة العقيدة  ",""),"")'
                '&IF(AND($C{r}<>"{TQ}",ISNUMBER($O{r})),IF(AND($O{r}>=TODAY(),$O{r}-TODAY()<=CFG_ReviewDays,{ii5}<>"نعم"),"⚠ سلِّم مراجعة الفقه  ",""),"")'
                ')))').format(r=r, ok=ok, st=st, nx=nx, tr=tr, en=en, exp=exp, done=done, TQ=TY_Q,
                              skip=PICK('B5', 'J5'), sub=PICK('F5', 'H5'), ih5=IND('H5'), ii5=IND('I5'))
    for c, v in vals.items(): ws.cell(r, c).value = v
    for c in range(1, 20):
        x = ws.cell(r, c); x.font = f(False, 13); x.alignment = rgt if c in (7, 13) else ctr
    ws.cell(r, 2).font = f(True, 13, '1F6FA8', u='single')
    for c in (8, 14, 15): ws.cell(r, c).number_format = DF
    ws.row_dimensions[r].height = 26
cfd = ws.conditional_formatting; A_ = f'{FIRST}:'
rng = lambda a, b: f'{a}{FIRST}:{b}{LAST}'
cfd.add(rng('A', 'S'), FormulaRule(formula=[f'$B{FIRST}<>""'], border=box))
cfd.add(rng('M', 'M'), FormulaRule(formula=[f'ISNUMBER(SEARCH("⚠",$M{FIRST}))'], fill=fill(WARN), font=Font(name=FONT, color=WARN_T, bold=True)))
cfd.add(rng('M', 'M'), FormulaRule(formula=[f'AND($M{FIRST}<>"",NOT(ISNUMBER(SEARCH("⚠",$M{FIRST}))))'], fill=fill(ALERT)))
cfd.add(rng('S', 'S'), FormulaRule(formula=[f'$S{FIRST}="ناقصة"'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
cfd.add(rng('S', 'S'), FormulaRule(formula=[f'$S{FIRST}="✓"'], font=Font(name=FONT, bold=True, color=DONE_T)))
cfd.add(rng('C', 'C'), FormulaRule(formula=[f'$C{FIRST}="{TY_Q}"'], fill=fill(GOLD_L), font=Font(name=FONT, bold=True, color=INK)))
cfd.add(rng('L', 'L'), FormulaRule(formula=[f'AND(ISNUMBER($L{FIRST}),$L{FIRST}<CFG_Pass)'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
cfd.add(rng('Q', 'Q'), FormulaRule(formula=[f'AND(ISNUMBER($Q{FIRST}),$Q{FIRST}>0)'], fill=fill(WARN), font=Font(name=FONT, bold=True, color=WARN_T)))
for col in ('N', 'O'):
    cfd.add(rng(col, col), FormulaRule(formula=[f'AND(ISNUMBER({col}{FIRST}),{col}{FIRST}<TODAY())'], fill=fill(MUTED_L), font=Font(name=FONT, color=MUTED)))
    cfd.add(rng(col, col), FormulaRule(formula=[f'AND(ISNUMBER({col}{FIRST}),{col}{FIRST}-TODAY()<=CFG_ReviewDays,{col}{FIRST}>=TODAY())'], fill=fill(ALERT), font=Font(name=FONT, bold=True)))
cfd.add(rng('A', 'S'), FormulaRule(formula=[f'AND($B{FIRST}<>"",MOD(ROW(),2)=1)'], fill=fill('FBF8F1')))
ws.auto_filter.ref = f'A6:S{LAST}'
ws.freeze_panes = 'C7'; ws.sheet_properties.tabColor = INK; protect(ws, filt=True)
ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToHeight = 0; ws.page_setup.fitToWidth = 1; ws.print_title_rows = '6:6'
for w_, c_ in ((DATA, GOLD), (CAT, GOLD), (SUR, GOLD), (HOL, GOLD), (TEA, GOLD), (SET, GOLD), (LST, MUTED), (GUIDE, PRI)):
    sheets[w_].sheet_properties.tabColor = c_
for n_, s_ in (('SYS_Dash', DASH), ('SYS_Data', DATA), ('SYS_Catalog', CAT), ('SYS_Surah', SUR), ('SYS_Holidays', HOL),
               ('SYS_Teachers', TEA), ('SYS_Lists', LST), ('SYS_Guide', GUIDE), ('SYS_Settings', SET)):
    name(n_, f"'{s_}'!$A$1")

# ------------------------------------------------------------------ guide
ws = sheets[GUIDE]
title(ws, 'A1:A1', 'دليل الملف', 22, 44)
G = [
 ('', 0),
 ('هذا ملف المدرسين ولا يحتوي على أي كود. الإضافة والأرشفة والاسترجاع ونقل الطلاب والتصدير وتعبئة التواريخ تتم من «أداة الإدارة».', 0),
 ('١) إضافة فصل', 2),
 ('في «بيانات_الفصول» اكتب رقم الفصل في أول صف فارغ، واختر النوع (مناهج / قرآن) والمدرس، والفترة (بالتاريخين أو برقمي الأسبوعين)، وأيام الحصص، والحالة «نشط».', 0),
 ('ثم من أداة الإدارة: «إنشاء الأوراق الناقصة». أو يدويًا: انسخ ورقة «نموذج» (للمناهج) أو «نموذج قرآن» وسمِّها بنفس رقم الفصل تمامًا.', 0),
 ('فصول CC: إن عُرف الفصل الفني الذي سينتقلون إليه فاكتبه في «الفصل التالي» مع «تاريخ الانتقال». وعند حلول التاريخ: «تنفيذ الانتقالات» في أداة الإدارة.', 0),
 ('٢) إنهاء فصل', 2),
 ('«منتهٍ»: يختفي من الصفحة الأساسية وتبقى ورقته. «للأرشفة»: ينتقل إلى Archive.xlsx (ويمكن استرجاعه لاحقًا). «للحذف»: يُحذف نهائيًا.', 0),
 ('٣) القرآن', 2),
 ('قسّم السور إلى مقاطع في «قائمة السور». في الكشف: الصق الأرقام والأسماء، وفوق كل مقطع تاريخ التنفيذ والمنفذ، ثم الدرجة من 10 أو «غائب».', 0),
 ('المعدل من 100 = متوسط الدرجات المرصودة فقط (الفارغ وغائب لا يُحتسبان، والصفر يُحتسب) ويُقرَّب للأعلى. حد التنبيه في «الإعدادات».', 0),
 ('٤) المناهج', 2),
 ('الدروس وأرقام الصفحات في «فهرس الدروس». ملفات الـPDF في مجلد PDF_Lessons بجوار هذا الملف، واسم الملف = الصفحات + .pdf', 0),
 ('٥) التواريخ', 2),
 ('يُقبل تاريخ الحصة من الأحد إلى الخميس فقط، داخل فترة الفصل، وليس في إجازة (ورقة «الإجازات»). أرقام الأسابيع من «الإعدادات».', 0),
 ('٦) الألوان', 2),
 ('ذهبي فاتح = خانة إدخال. أخضر = منفذ. برتقالي = نقص أو تخطٍّ. أصفر = ملاحظة (تاريخ أقدم من سابقه، أو آخر حصة بديل). أزرق مائل = تاريخ عبّأته الأداة تقديريًا.', 0),
 ('٧) ملاحظات', 2),
 ('الأوراق محمية بلا كلمة مرور (مراجعة ← إلغاء حماية الورقة). لا تغيّر أسماء الأوراق الثابتة ولا ورقة «القوائم».', 0),
 ('نفّذ العمليات التي تغيّر الملف (إنشاء، أرشفة، نقل طلاب، تعبئة) بعد إيقاف المشاركة. التصدير والفحص يعملان والملف مشارك.', 0),
]
for i, (t_, lvl) in enumerate(G, 2):
    x = ws.cell(i, 1, t_)
    if lvl: x.font = f(True, 16, INK); x.fill = fill(GOLD_L); x.border = Border(bottom=Side(style='thin', color=GOLD)); ws.row_dimensions[i].height = 28
    else: x.font = f(False, 14); ws.row_dimensions[i].height = 40 if t_ else 8
    x.alignment = Alignment(horizontal='right', vertical='center', wrap_text=True, indent=1)
ws.column_dimensions['A'].width = 150
protect(ws)

wb.calculation.fullCalcOnLoad = True
wb.save(OUT)
print('saved', OUT)
