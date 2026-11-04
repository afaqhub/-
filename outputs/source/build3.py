"""Builds the teachers' workbook (v3): lessons classes + Quran classes, no macros."""
import sys, datetime as dt
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
TODAY = dt.datetime(2026, 11, 4)

old = openpyxl.load_workbook(SRC)
oldn = old['نموذج']

FONT = 'Arial'
NAVY, TEAL, GREEN = '1F3864', '1F6F78', '548235'
def f(b=False, s=11, c='000000', i=False): return Font(name=FONT, bold=b, size=s, color=c, italic=i)
def fill(c): return PatternFill('solid', start_color=c, end_color=c)
thin = Side(style='thin', color='BFBFBF')
box = Border(left=thin, right=thin, top=thin, bottom=thin)
ctr = Alignment(horizontal='center', vertical='center', wrap_text=True)
rgt = Alignment(horizontal='right', vertical='center', wrap_text=True)
DF = 'yyyy/mm/dd'
DFZ = 'yyyy/mm/dd;;'

DASH = 'الصفحة الأساسية'
DATA = 'بيانات_الفصول'; D = f"'{DATA}'"
CAT = 'فهرس الدروس'; C = f"'{CAT}'"
SUR = 'قائمة السور'
HOL = 'الإجازات'
TEA = 'أسماء المدرسين'; T = f"'{TEA}'"
LST = 'القوائم'; L = f"'{LST}'"
GUIDE = 'دليل الإدارة'
TPL_L = 'نموذج'
TPL_Q = 'نموذج قرآن'
ST_ACT, ST_ARC, ST_DEL = 'نشط', 'للأرشفة', 'للحذف'
TY_L, TY_Q = 'مناهج', 'قرآن'
ABS = 'غائب'
DROWS = 300

wb = Workbook()
ws_dash = wb.active; ws_dash.title = DASH
ws_data = wb.create_sheet(DATA)
ws_cat = wb.create_sheet(CAT)
ws_sur = wb.create_sheet(SUR)
ws_hol = wb.create_sheet(HOL)
ws_t = wb.create_sheet(TEA)
ws_l = wb.create_sheet(LST)
ws_g = wb.create_sheet(GUIDE)
for w in wb.worksheets: w.sheet_view.rightToLeft = True

def name(n, ref): wb.defined_names[n] = DefinedName(n, attr_text=ref)
def hdr(ws, row, c1, c2, color=NAVY, size=11):
    for c in range(c1, c2 + 1):
        x = ws.cell(row, c); x.font = f(True, size, 'FFFFFF'); x.fill = fill(color); x.alignment = ctr; x.border = box
def protect(ws, filt=False):
    ws.protection.sheet = True; ws.protection.selectLockedCells = False
    ws.protection.formatColumns = False; ws.protection.formatRows = False
    if filt: ws.protection.autoFilter = False

# ---------------- lists ----------------
lists = {1: ('الحالة', [ST_ACT, ST_ARC, ST_DEL]), 2: ('النوع', [TY_L, TY_Q]),
         3: ('أيام الحصص', ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']), 4: ('رقم اليوم', [1, 2, 3, 4, 5]),
         5: ('رمز الغياب', [ABS]), 6: ('نعم/لا', ['نعم', 'لا'])}
for c, (h, vals) in lists.items():
    ws_l.cell(1, c, h)
    for i, v in enumerate(vals, 2): ws_l.cell(i, c, v).font = f()
hdr(ws_l, 1, 1, 6, '7F7F7F')
ws_l['H1'] = 'إصدار الملف'; ws_l['H2'] = '3.0'; hdr(ws_l, 1, 8, 8, '7F7F7F')
ws_l['A9'] = 'تُستعمل هذه القوائم في الملف وفي أداة الإدارة. لا تغيّر ترتيبها ولا تحذف منها.'
ws_l['A9'].font = f(False, 10, 'C00000')
for col in 'ABCDEFH': ws_l.column_dimensions[col].width = 14
protect(ws_l)
name('LST_Status', f"{L}!$A$2:$A$4"); name('LST_Type', f"{L}!$B$2:$B$3"); name('LST_Days', f"{L}!$C$2:$C$6")
name('LST_Absent', f"{L}!$E$2"); name('LST_YesNo', f"{L}!$F$2:$F$3"); name('APP_Version', f"{L}!$H$2")

# ---------------- teachers ----------------
ws_t['A1'] = 'اسم المدرس'; hdr(ws_t, 1, 1, 1)
names = [old['أسماء المدرسين'].cell(r, 1).value for r in range(3, 19)]
for i, n in enumerate(names, 2): ws_t.cell(i, 1, n).font = f(); ws_t.cell(i, 1).border = box
ws_t.column_dimensions['A'].width = 30
ws_t['C1'] = 'أضِف الاسم الجديد في آخر القائمة، وسيظهر في كل القوائم المنسدلة.'; ws_t['C1'].font = f(False, 10, '7F7F7F')
name('Teachers', f"OFFSET({T}!$A$2,0,0,MAX(1,COUNTA({T}!$A$2:$A$300)),1)")

# ---------------- holidays ----------------
H = f"'{HOL}'"
for i, h in enumerate(['من تاريخ', 'إلى تاريخ (اختياري)', 'السبب', 'إلى (تلقائي)'], 1): ws_hol.cell(1, i, h)
hdr(ws_hol, 1, 1, 3); hdr(ws_hol, 1, 4, 4, '7F7F7F')
ws_hol['F1'] = 'أيام الإجازة (تلقائي)'; hdr(ws_hol, 1, 6, 6, '7F7F7F')
hol_seed = [(dt.datetime(2026, 11, 22), dt.datetime(2026, 11, 26), 'إجازة (مثال، عدّلها)')]
for i, (a, b, c) in enumerate(hol_seed, 2): ws_hol.cell(i, 1, a); ws_hol.cell(i, 2, b); ws_hol.cell(i, 3, c)
for r in range(2, 202):
    for c in (1, 2, 3, 4):
        x = ws_hol.cell(r, c); x.font = f(); x.border = box; x.alignment = ctr
        if c != 3: x.number_format = DF
        x.protection = Protection(locked=c == 4)
    ws_hol.cell(r, 4).value = f'=IF(A{r}="","",IF(B{r}="",A{r},MAX(A{r},B{r})))'
    ws_hol.cell(r, 4).font = f(False, 10, '7F7F7F')
# expansion of ranges into single days (col F = day, col G = range index)
ws_hol['F2'] = '=IF(A2="",0,A2)'; ws_hol['G2'] = 1
for r in range(3, 802):
    p = r - 1
    ws_hol.cell(r, 6).value = (f'=IF(F{p}=0,0,IF(F{p}<INDEX($D$2:$D$201,G{p}),F{p}+1,'
                               f'IF(INDEX($A$2:$A$201,G{p}+1)="",0,INDEX($A$2:$A$201,G{p}+1))))')
    ws_hol.cell(r, 7).value = f'=IF(F{p}=0,G{p},IF(F{p}<INDEX($D$2:$D$201,G{p}),G{p},G{p}+1))'
for r in range(2, 802):
    ws_hol.cell(r, 6).number_format = DFZ; ws_hol.cell(r, 6).font = f(False, 9, '7F7F7F')
    ws_hol.cell(r, 7).font = f(False, 8, 'BFBFBF')
for col, w in zip('ABCDEFG', (14, 16, 30, 13, 2, 14, 5)): ws_hol.column_dimensions[col].width = w
ws_hol['I1'] = 'اكتب كل إجازة في صف: «من» و«إلى» (ليوم واحد اترك «إلى» فارغًا). اكتبها متتالية دون صفوف فارغة بينها.'
ws_hol['I2'] = 'تُستبعد هذه الأيام من «الحصص المتوقعة» ومن تعبئة التواريخ، ولا يقبل الملف تاريخ درس فيها.'
for a in ('I1', 'I2'): ws_hol[a].font = f(False, 10, '7F7F7F')
dvh = DataValidation(type='date', operator='between', formula1='36526', formula2='73415', allow_blank=True, showErrorMessage=True, error='أدخل تاريخًا صحيحًا')
dvh.add('A2:B201'); ws_hol.add_data_validation(dvh)
ws_hol.freeze_panes = 'A2'
name('HOL_From', f"{H}!$A$2:$A$201"); name('HOL_To', f"{H}!$D$2:$D$201"); name('HOL_Days', f"{H}!$F$2:$F$801")
name('DB_Holidays', f"{H}!$A$1:$D$201")
protect(ws_hol)

# ---------------- catalog (lessons) ----------------
for i, h in enumerate(['الكتاب', 'الأسبوع', 'الحصة', 'الموضوع', 'الصفحات (= اسم ملف الـPDF)'], 1): ws_cat.cell(1, i, h)
hdr(ws_cat, 1, 1, 5, TEAL)
for r in range(5, 52):
    cr = r - 3
    a, wk, ses, top, pg = (oldn.cell(r, 1).value, oldn.cell(r, 3).value, oldn.cell(r, 4).value, oldn.cell(r, 5).value, oldn.cell(r, 16).value)
    if r == 32: a, ses, top, pg = 'العقيدة', 'مراجعة', 'المراجعة النهائية والاختبار (العقيدة)', None
    if r == 51: a, ses, top, pg, wk = 'الفقه', 'مراجعة', 'المراجعة النهائية والاختبار (الفقه)', None, 10
    for c, v in enumerate([a, wk, ses, top, pg], 1): ws_cat.cell(cr, c, v)
for r in range(2, 62):
    for c in range(1, 6):
        x = ws_cat.cell(r, c); x.font = f(); x.border = box; x.alignment = rgt if c == 4 else ctr
    ws_cat.cell(r, 5).number_format = '@'
for col, w in zip('ABCDE', (18, 9, 10, 60, 24)): ws_cat.column_dimensions[col].width = w
ws_cat['G1'] = 'مسار مجلد ملفات PDF'; ws_cat['G1'].font = f(True)
ws_cat['G2'] = '=IFERROR(LEFT(CELL("filename",$A$1),FIND("[",CELL("filename",$A$1))-1)&"PDF_Lessons\\","")'
ws_cat['G3'] = 'الأصل: مجلد PDF_Lessons بجوار هذا الملف. ويمكن استبدال G2 بمسار ثابت مثل \\\\server\\share\\PDF_Lessons\\'
ws_cat['G5'] = ('دروس المنهج تُعرَّف هنا مرة واحدة وتقرؤها كل أوراق الفصول. للحصة الخاصة بالمراجعة اكتب في «الحصة»: مراجعة. '
                'السعة: 60 صفًا متتالية.')
for a in ('G2', 'G3', 'G5'): ws_cat[a].font = f(False, 10, '595959'); ws_cat[a].alignment = Alignment(wrap_text=True, vertical='top')
ws_cat.column_dimensions['G'].width = 60; ws_cat.row_dimensions[3].height = 32; ws_cat.row_dimensions[5].height = 45
ws_cat.freeze_panes = 'A2'
name('CFG_PdfPath', f"{C}!$G$2")

# ---------------- surah segments ----------------
S = f"'{SUR}'"
for i, h in enumerate(['المقطع (تلقائي)', 'السورة', 'رقم المقطع', 'من آية', 'إلى آية', 'ملاحظة'], 1): ws_sur.cell(1, i, h)
hdr(ws_sur, 1, 1, 1, '7F7F7F'); hdr(ws_sur, 1, 2, 6, TEAL)
segs = [('الأحزاب', [(1, 8), (9, 20), (21, 27), (28, 35), (36, 44), (45, 52), (53, 62), (63, 73)]),
        ('الفتح', [(1, 10), (11, 17), (18, 24), (25, 29)]),
        ('الحشر', [(1, 7), (8, 14), (15, 24)])]
r = 2
for s, parts in segs:
    for k, (a, b) in enumerate(parts, 1):
        ws_sur.cell(r, 2, s); ws_sur.cell(r, 3, k); ws_sur.cell(r, 4, a); ws_sur.cell(r, 5, b)
        if r == 2: ws_sur.cell(r, 6, 'تقسيم مثال: عدّله كما تشاء')
        r += 1
for r in range(2, 501):
    ws_sur.cell(r, 1).value = f'=IF(B{r}="","",B{r}&" "&C{r}&" ("&D{r}&"-"&E{r}&")")'
    for c in range(1, 7):
        x = ws_sur.cell(r, c); x.font = f(c == 1); x.border = box; x.alignment = ctr
for col, w in zip('ABCDEF', (30, 16, 11, 9, 9, 30)): ws_sur.column_dimensions[col].width = w
ws_sur['H1'] = 'قسّم كل سورة إلى مقاطع كما تريد (مقطع لكل حصة). الترتيب هنا هو ترتيب المقاطع في كل فصول القرآن.'
ws_sur['H2'] = 'لتخصيص فصل معيّن: ألغِ حماية ورقته واختر المقطع من القائمة في صف «المقطع».'
for a in ('H1', 'H2'): ws_sur[a].font = f(False, 10, '595959')
ws_sur.freeze_panes = 'A2'
name('LST_Segments', f"{S}!$A$2:$A$500")
name('LST_SegList', f"OFFSET({S}!$A$2,0,0,MAX(1,COUNTA({S}!$B$2:$B$500)),1)")

# ---------------- class data ----------------
cols = ['رقم الفصل (= اسم الورقة)', 'النوع', 'المدرس', 'رقم الدورة', 'الجزء (البلس)', 'بداية الفصل', 'نهاية الفصل',
        'يوم الحصة 1', 'يوم الحصة 2', 'يوم الحصة 3', 'اختبار العقيدة', 'اختبار الفقه', 'عدد الطلاب',
        'الفصل التالي (اختياري)', 'تاريخ الانتقال', 'الحالة', 'الورقة', 'ترتيب', 'أيام (تلقائي)', 'حصص متوقعة حتى اليوم']
for i, h in enumerate(cols, 1): ws_data.cell(1, i, h)
hdr(ws_data, 1, 1, 16); hdr(ws_data, 1, 17, 20, '7F7F7F', 10)
ws_data.row_dimensions[1].height = 34
seed = [
 ('AGE-CG-01', TY_L, 'عامر الهاجري', 143, 'P31', dt.datetime(2025, 9, 14), dt.datetime(2026, 5, 31), 'الأحد', 'الاثنين', None, dt.datetime(2026, 1, 11), dt.datetime(2026, 5, 17), 12, None, None, ST_ARC),
 ('SMS 163', TY_L, 'جهاد جمال', 144, 'P37', dt.datetime(2026, 9, 20), dt.datetime(2027, 1, 31), 'الأربعاء', 'الخميس', None, dt.datetime(2026, 11, 15), dt.datetime(2027, 1, 31), 13, None, None, ST_ACT),
 ('FLOP 049', TY_L, 'جهاد جمال', 144, 'P37', dt.datetime(2026, 9, 20), dt.datetime(2027, 1, 31), 'الأحد', 'الثلاثاء', None, dt.datetime(2026, 11, 15), dt.datetime(2027, 1, 31), 13, None, None, ST_ACT),
 ('FLOP-CG-02', TY_L, 'عامر الهاجري', 144, 'P37', dt.datetime(2026, 9, 20), dt.datetime(2027, 1, 31), 'الأحد', 'الاثنين', None, dt.datetime(2026, 11, 15), dt.datetime(2027, 1, 31), 12, None, None, ST_ACT),
 ('CC-25-5', TY_Q, 'جهاد جمال', 145, 'P40', dt.datetime(2026, 10, 18), dt.datetime(2026, 12, 24), 'الأحد', 'الثلاثاء', None, None, None, None, 'SMS 170', dt.datetime(2026, 12, 27), ST_ACT),
]
for i, row in enumerate(seed, 2):
    for c, v in enumerate(row, 1): ws_data.cell(i, c, v)
DAYS_MON_SUN = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
for r in range(2, DROWS + 2):
    for c in range(1, 21):
        x = ws_data.cell(r, c); x.font = f(); x.border = box; x.alignment = ctr
    for c in (6, 7, 11, 12, 15): ws_data.cell(r, c).number_format = DF
    ws_data.cell(r, 17).value = (f'=IF(A{r}="","",IF(ISERROR(INDIRECT("\'"&A{r}&"\'!A1")),IF(OR(P{r}="{ST_ARC}",P{r}="{ST_DEL}"),"—","ناقصة"),'
                                 f'IF(P{r}="{ST_ARC}","{ST_ARC}",IF(P{r}="{ST_DEL}","{ST_DEL}","✓"))))')
    ws_data.cell(r, 18).value = f'=IF(AND(A{r}<>"",OR(P{r}="",P{r}="{ST_ACT}")),MAX(R$1:R{r-1})+1,"")'
    mask = '&'.join(f'IF(COUNTIF(H{r}:J{r},"{d}")>0,"0","1")' for d in DAYS_MON_SUN)
    ws_data.cell(r, 19).value = f'=IF(A{r}="","",{mask})'
    ws_data.cell(r, 20).value = (f'=IF(OR(A{r}="",F{r}="",S{r}="1111111"),"",IF(F{r}>TODAY(),0,'
                                 f'NETWORKDAYS.INTL(F{r},MIN(TODAY(),IF(G{r}="",TODAY(),G{r})),S{r},HOL_Days)))')
    for c in (17, 18, 19, 20): ws_data.cell(r, c).font = f(c == 17, 10, '7F7F7F' if c != 17 else '000000')
for col, w in zip([CL(i) for i in range(1, 21)], (22, 9, 18, 9, 10, 12, 12, 10, 10, 10, 12, 12, 9, 15, 12, 10, 9, 6, 9, 10)):
    ws_data.column_dimensions[col].width = w
ws_data.freeze_panes = 'B2'
dvs = [('list', '=Teachers', f'C2:C{DROWS+1}'), ('list', '=LST_Type', f'B2:B{DROWS+1}'), ('list', '=LST_Status', f'P2:P{DROWS+1}'),
       ('list', '=LST_Days', f'H2:J{DROWS+1}')]
for t, fo, rg in dvs:
    dv = DataValidation(type=t, formula1=fo, allow_blank=True); dv.add(rg); ws_data.add_data_validation(dv)
dv = DataValidation(type='custom', showErrorMessage=True, errorTitle='رقم فصل غير صالح',
                    formula1=f'=AND(COUNTIF($A$2:$A${DROWS+1},A2)=1,LEN(A2)<=31,ISERROR(FIND("[",A2)),ISERROR(FIND("]",A2)),ISERROR(FIND("/",A2)),ISERROR(FIND("\\",A2)),ISERROR(FIND("?",A2)),ISERROR(FIND("*",A2)),ISERROR(FIND(":",A2)))',
                    error='الاسم مكرر، أو أطول من 31 حرفًا، أو فيه أحد الرموز ( [ ] / \\ ? * : ).')
dv.add(f'A2:A{DROWS+1}'); ws_data.add_data_validation(dv)
dv = DataValidation(type='date', operator='between', formula1='36526', formula2='73415', allow_blank=True, showErrorMessage=True, error='أدخل تاريخًا صحيحًا')
for rg in (f'F2:G{DROWS+1}', f'K2:L{DROWS+1}', f'O2:O{DROWS+1}'): dv.add(rg)
ws_data.add_data_validation(dv)
N = DROWS + 1
cf = ws_data.conditional_formatting
cf.add(f'Q2:Q{N}', FormulaRule(formula=['$Q2="ناقصة"'], fill=fill('F8CBAD'), font=Font(name=FONT, bold=True, color='C00000')))
cf.add(f'Q2:Q{N}', FormulaRule(formula=['$Q2="✓"'], font=Font(name=FONT, bold=True, color=GREEN)))
cf.add(f'A2:P{N}', FormulaRule(formula=[f'OR($P2="{ST_ARC}",$P2="{ST_DEL}")'], fill=fill('E7E6E6'), font=Font(name=FONT, color='7F7F7F')))
cf.add(f'A2:A{N}', FormulaRule(formula=[f'AND($A2<>"",COUNTIF($A$2:$A${N},$A2)>1)'], fill=fill('FF9999')))
cf.add(f'B2:B{N}', FormulaRule(formula=[f'$B2="{TY_Q}"'], fill=fill('E2EFDA')))
ws_data['W1'] = 'أضِف الفصل في أول صف فارغ. فصول القرآن (CC) نوعها «قرآن»، ويمكن أن تحدد لها «الفصل التالي» وتاريخ انتقاله.'
ws_data['W2'] = '«نشط» يظهر في الصفحة الأساسية. «للأرشفة» و«للحذف» تنفّذها أداة الإدارة. الأعمدة الرمادية تلقائية.'
ws_data['W3'] = 'أيام الحصص تُستعمل لحساب الحصص المتوقعة ولتعبئة التواريخ. «الجزء» هو البلس (مثل P40).'
for a in ('W1', 'W2', 'W3'): ws_data[a].font = f(False, 10, '595959')
name('DB_Classes', f"{D}!$A$1:$T${DROWS+1}")

# ---------------- common header for class sheets ----------------
def lk(c, text=False):
    v = f'VLOOKUP($A$3,{D}!$A:$T,{c},FALSE)'
    return f'=IFERROR({v}&"","")' if text else f'=IFERROR(IF({v}="","",{v}),"")'
NAME_F = '=MID(CELL("filename",$A$1),FIND("]",CELL("filename",$A$1))+1,255)'
WARN = (f'=IF(OR(LEFT($A$3,5)="نموذج",COUNTIF({D}!$A:$A,$A$3)>0),"",'
        f'"⚠ اسم هذه الورقة غير مسجَّل في بيانات_الفصول")')
BACK = f'=HYPERLINK("#\'{DASH}\'!A1","◀ الصفحة الأساسية")'

def label_cells(ws, row, spec, color):
    for rng, text in spec:
        a = rng.split(':')[0]
        if ':' in rng: ws.merge_cells(rng)
        ws[a] = text
    for rng, _ in spec:
        for rowc in ws[rng] if ':' in rng else [[ws[rng]]]:
            for x in rowc:
                x.font = f(True, 10, 'FFFFFF'); x.fill = fill(color); x.alignment = ctr; x.border = box

def value_cells(ws, spec, bg):
    for rng, val in spec:
        a = rng.split(':')[0]
        if ':' in rng: ws.merge_cells(rng)
        ws[a] = val
        for rowc in (ws[rng] if ':' in rng else [[ws[rng]]]):
            for x in rowc:
                x.font = f(True, 11); x.alignment = ctr; x.border = box; x.fill = fill(bg)

def date_dv(ws, rng, start_cell, end_cell, first):
    fo = (f'=AND(ISNUMBER({first}),WEEKDAY({first},1)<=5,OR({start_cell}="",{first}>={start_cell}),'
          f'OR({end_cell}="",{first}<={end_cell}),COUNTIFS(HOL_From,"<="&{first},HOL_To,">="&{first})=0)')
    dv = DataValidation(type='custom', formula1=fo, allow_blank=True, showErrorMessage=True, errorTitle='تاريخ غير مقبول',
                        error='يجب أن يكون التاريخ من الأحد إلى الخميس، وداخل فترة الفصل، وليس في إجازة.',
                        showInputMessage=True, promptTitle='تاريخ التنفيذ', prompt='اكتب تاريخ الحصة، مثل 2026/10/25')
    dv.add(rng); ws.add_data_validation(dv)

def exec_dv(ws, rng):
    dv = DataValidation(type='list', formula1='=Teachers', allow_blank=True, showErrorMessage=True, errorTitle='اسم غير موجود',
                        error='اختر الاسم من القائمة (لإضافة مدرس: ورقة أسماء المدرسين).',
                        showInputMessage=True, promptTitle='المنفذ', prompt='من درّس الحصة؟ (قد يكون بديلًا)')
    dv.add(rng); ws.add_data_validation(dv)

# ---------------- lessons sheet ----------------
R0, R1 = 8, 67
def make_lessons(ws, nm=None, rec=None):
    ws.sheet_view.rightToLeft = True
    for k, v in dict(A=16, B=8, C=9, D=58, E=11, F=14, G=20, H=15, I=13, J=13).items(): ws.column_dimensions[k].width = v
    ws['A1'] = BACK; ws.merge_cells('A1:B1'); ws['A1'].font = f(True, 11, 'FFFFFF'); ws['A1'].fill = fill(TEAL); ws['A1'].alignment = ctr
    ws['C1'] = 'سجل متابعة الدروس'; ws.merge_cells('C1:D1'); ws['C1'].font = f(True, 14, NAVY); ws['C1'].alignment = ctr
    ws['E1'] = WARN; ws.merge_cells('E1:J1'); ws['E1'].font = f(True, 10, 'C00000'); ws['E1'].alignment = ctr
    ws.row_dimensions[1].height = 28
    label_cells(ws, 2, [('A2', 'رقم الفصل'), ('B2:C2', 'الدورة'), ('D2', 'المدرس'), ('E2', 'الجزء'), ('F2', 'الطلاب'),
                        ('G2', 'اختبار العقيدة'), ('H2', 'اختبار الفقه'), ('I2', 'بداية الفصل'), ('J2', 'نهاية الفصل')], NAVY)
    value_cells(ws, [('A3', nm if (TEST and nm) else NAME_F), ('B3:C3', lk(4)), ('D3', lk(3, True)), ('E3', lk(5, True)),
                     ('F3', lk(13)), ('G3', lk(11)), ('H3', lk(12)), ('I3', lk(6)), ('J3', lk(7))], 'EAF1F8')
    for a in ('G3', 'H3', 'I3', 'J3'): ws[a].number_format = DF
    Fr, Dr, Cr, Gr, Hr, Ar = (f'${c}${R0}:${c}${R1}' for c in 'FDCGHA')
    MX = f'_xlfn.AGGREGATE(14,6,{Fr}/({Fr}<=TODAY()),1)'
    K = f'LOOKUP(2,1/({Fr}=$E$5),ROW({Fr})-{R0-1})'
    def sub(c): return f'INDEX(${c}${R0}:${c}${R1},1):INDEX(${c}${R0}:${c}${R1},{K})'
    label_cells(ws, 4, [('A4', 'المنفَّذ'), ('B4:C4', 'دروس متخطاة'), ('D4', 'آخر درس منفذ'), ('E4', 'تاريخه'), ('F4', 'بديل؟'),
                        ('G4', 'بواسطة'), ('H4', 'مراجعة العقيدة'), ('I4:J4', 'مراجعة الفقه')], TEAL)
    value_cells(ws, [
        ('A5', f'=COUNTIF({Fr},"<="&TODAY())&"/"&COUNTIF({Dr},"?*")'),
        ('B5:C5', f'=IF($E$5="",0,COUNTIFS({sub("F")},"",{sub("D")},"?*",{sub("C")},"<>مراجعة"))'),
        ('D5', f'=IF($E$5="","لم يُقدَّم درس",INDEX({Dr},{K}))'),
        ('E5', f'=IFERROR({MX},"")'),
        ('F5', '=IF(OR($G$5="",$G$5="(لم يُسجَّل)",$D$3=""),"",IF($G$5<>$D$3,"بديل",""))'),
        ('G5', f'=IF($E$5="","",IF(INDEX({Gr},{K})="","(لم يُسجَّل)",INDEX({Gr},{K})))'),
        ('H5', f'=IF(COUNTIFS({Ar},"العقيدة*",{Cr},"مراجعة",{Hr},"نعم")>0,"نعم","لا")'),
        ('I5:J5', f'=IF(COUNTIFS({Ar},"الفقه*",{Cr},"مراجعة",{Hr},"نعم")>0,"نعم","لا")'),
    ], 'F2F8F8')
    ws['E5'].number_format = DF; ws.row_dimensions[5].height = 34; ws.row_dimensions[6].height = 8
    for i, h in enumerate(['الكتاب', 'الأسبوع', 'الحصة', 'الموضوع', 'الصفحة', 'تاريخ التنفيذ', 'المنفذ', 'سُلّمت أوراق المراجعة؟'], 1): ws.cell(7, i, h)
    hdr(ws, 7, 1, 8); ws.row_dimensions[7].height = 32
    for r in range(R0, R1 + 1):
        cr = r - 6
        for c, col in zip((1, 2, 3, 4), 'ABCD'): ws.cell(r, c).value = f'=IF({C}!{col}{cr}="","",{C}!{col}{cr})'
        ws.cell(r, 5).value = f'=IF({C}!E{cr}="","",HYPERLINK(CFG_PdfPath&{C}!E{cr}&".pdf",{C}!E{cr}))'
        for c in range(1, 9):
            x = ws.cell(r, c); x.font = f(); x.alignment = rgt if c == 4 else ctr; x.protection = Protection(locked=c < 6)
        ws.cell(r, 5).font = Font(name=FONT, size=11, color='0563C1', underline='single')
        ws.cell(r, 6).number_format = DF; ws.row_dimensions[r].height = 30
    if rec:
        for r, (d_, who) in rec.items():
            if d_: ws.cell(r, 6, d_)
            if who: ws.cell(r, 7, who)
    date_dv(ws, f'F{R0}:F{R1}', '$I$3', '$J$3', f'F{R0}')
    exec_dv(ws, f'G{R0}:G{R1}')
    dvr = DataValidation(type='list', formula1='=LST_YesNo', allow_blank=True); dvr.add(f'H{R0}:H{R1}'); ws.add_data_validation(dvr)
    c = ws.conditional_formatting
    c.add(f'F{R0}:H{R1}', FormulaRule(formula=[f'AND($F{R0}="",$D{R0}<>"",$C{R0}<>"مراجعة",COUNTIF($F{R0+1}:$F${R1+1},"<="&TODAY())>0)'], fill=fill('F8CBAD'), stopIfTrue=True))
    c.add(f'G{R0}:G{R1}', FormulaRule(formula=[f'AND($F{R0}<>"",$G{R0}="")'], fill=fill('FF9999'), stopIfTrue=True))
    c.add(f'F{R0}:F{R1}', FormulaRule(formula=[f'AND($F{R0}<>"",$F{R0}<MAX($F$7:$F{R0-1}))'], fill=fill('FFD966'), stopIfTrue=True))
    c.add(f'H{R0}:H{R1}', FormulaRule(formula=[f'AND($D{R0}<>"",$C{R0}<>"مراجعة")'], fill=fill('D9D9D9'), stopIfTrue=True))
    c.add(f'F{R0}:H{R1}', FormulaRule(formula=[f'$F{R0}<>""'], fill=fill('C6E0B4')))
    c.add(f'F{R0}:H{R1}', FormulaRule(formula=[f'$D{R0}<>""'], fill=fill('FFFBEA')))
    c.add(f'A{R0}:H{R1}', FormulaRule(formula=[f'$D{R0}<>""'], border=box))
    c.add(f'A{R0}:A{R1}', FormulaRule(formula=[f'$A{R0}="العقيدة (المتوسط)"'], fill=fill('DDEBF7')))
    c.add(f'A{R0}:A{R1}', FormulaRule(formula=[f'$A{R0}="العقيدة (النهائي)"'], fill=fill('E2EFDA')))
    c.add(f'A{R0}:A{R1}', FormulaRule(formula=[f'$A{R0}="الفقه"'], fill=fill('FFF2CC')))
    c.add(f'A{R0}:E{R1}', FormulaRule(formula=[f'$C{R0}="مراجعة"'], fill=fill('EDEDED'), font=Font(name=FONT, bold=True)))
    c.add('B5:C5', FormulaRule(formula=['AND(ISNUMBER($B$5),$B$5>0)'], fill=fill('F8CBAD')))
    c.add('F5', FormulaRule(formula=['$F$5="بديل"'], fill=fill('FFD966')))
    c.add('H5:J5', FormulaRule(formula=['H5="نعم"'], font=Font(name=FONT, bold=True, color=GREEN)))
    ws.freeze_panes = 'A8'; protect(ws)
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.orientation = 'portrait'; ws.page_setup.fitToHeight = 0; ws.page_setup.fitToWidth = 1; ws.print_title_rows = '7:7'

# ---------------- quran sheet ----------------
Q0, Q1 = 5, 44          # segment columns E..AR
S0, S1 = 11, 70         # student rows
QA, QZ = CL(Q0), CL(Q1)
def make_quran(ws, nm=None, students=None, plan=None):
    ws.sheet_view.rightToLeft = True
    for k, v in dict(A=5, B=14, C=28, D=10).items(): ws.column_dimensions[k].width = v
    for c in range(Q0, Q1 + 1): ws.column_dimensions[CL(c)].width = 11
    ws['A1'] = BACK; ws.merge_cells('A1:B1'); ws['A1'].font = f(True, 11, 'FFFFFF'); ws['A1'].fill = fill(TEAL); ws['A1'].alignment = ctr
    ws['C1'] = 'كشف تقييم التلاوة'; ws.merge_cells('C1:D1'); ws['C1'].font = f(True, 14, NAVY); ws['C1'].alignment = ctr
    ws['E1'] = WARN; ws.merge_cells('E1:O1'); ws['E1'].font = f(True, 10, 'C00000'); ws['E1'].alignment = ctr
    ws.row_dimensions[1].height = 28
    label_cells(ws, 2, [('A2:B2', 'رقم الفصل'), ('C2', 'المدرس'), ('D2:E2', 'الجزء (البلس)'), ('F2:G2', 'عدد الطلاب'),
                        ('H2:I2', 'بداية الفصل'), ('J2:K2', 'نهاية الفصل'), ('L2:M2', 'الفصل التالي'), ('N2:O2', 'تاريخ الانتقال')], NAVY)
    value_cells(ws, [('A3:B3', nm if (TEST and nm) else NAME_F), ('C3', lk(3, True)), ('D3:E3', lk(5, True)),
                     ('F3:G3', f'=COUNTA($B${S0}:$B${S1})'), ('H3:I3', lk(6)), ('J3:K3', lk(7)), ('L3:M3', lk(14, True)), ('N3:O3', lk(15))], 'EAF1F8')
    for a in ('H3', 'J3', 'N3'): ws[a].number_format = DF
    Dt, Lb, Ex = (f'${QA}${r}:${QZ}${r}' for r in (8, 7, 9))
    Av = f'$D${S0}:$D${S1}'
    MX = f'_xlfn.AGGREGATE(14,6,{Dt}/({Dt}<=TODAY()),1)'
    K = f'LOOKUP(2,1/({Dt}=$D$5),COLUMN({Dt})-{Q0-1})'
    def sub(r): return f'INDEX(${QA}${r}:${QZ}${r},1):INDEX(${QA}${r}:${QZ}${r},{K})'
    label_cells(ws, 4, [('A4:B4', 'المقاطع المنفذة'), ('C4', 'آخر مقطع منفذ'), ('D4:E4', 'تاريخه'), ('F4:G4', 'بواسطة'),
                        ('H4:I4', 'بديل؟'), ('J4:K4', 'متخطاة'), ('L4:M4', 'معدل الفصل'), ('N4:O4', 'تحت 70')], TEAL)
    value_cells(ws, [
        ('A5:B5', f'=COUNTIF({Dt},"<="&TODAY())&"/"&COUNTIF({Lb},"?*")'),
        ('C5', f'=IF($D$5="","لم يُرصد",INDEX({Lb},{K}))'),
        ('D5:E5', f'=IFERROR({MX},"")'),
        ('F5:G5', f'=IF($D$5="","",IF(INDEX({Ex},{K})="","(لم يُسجَّل)",INDEX({Ex},{K})))'),
        ('H5:I5', '=IF(OR($F$5="",$F$5="(لم يُسجَّل)",$C$3=""),"",IF($F$5<>$C$3,"بديل",""))'),
        ('J5:K5', f'=IF($D$5="",0,COUNTIFS({sub(8)},"",{sub(7)},"?*"))'),
        ('L5:M5', f'=IFERROR(ROUND(AVERAGE({Av}),0),"")'),
        ('N5:O5', f'=COUNTIF({Av},"<70")'),
    ], 'F2F8F8')
    ws['D5'].number_format = DF; ws.row_dimensions[5].height = 34; ws.row_dimensions[6].height = 8
    # rows 7-9 : segment header block
    ws.merge_cells('A7:C9')
    ws['A7'] = 'الصق الأرقام الأكاديمية والأسماء في العمودين B و C.\nاكتب الدرجة من 10 (تقبل الكسور)، أو اختر «غائب».'
    ws['A7'].font = f(False, 10, '595959'); ws['A7'].alignment = Alignment(wrap_text=True, vertical='center', horizontal='right')
    for r, t in ((7, 'المقطع'), (8, 'تاريخ التنفيذ'), (9, 'المنفذ')):
        x = ws.cell(r, 4, t); x.font = f(True, 10, 'FFFFFF'); x.fill = fill(TEAL); x.alignment = ctr; x.border = box
    ws.row_dimensions[7].height = 48; ws.row_dimensions[8].height = 22; ws.row_dimensions[9].height = 22
    for i, h in enumerate(['م', 'الرقم الأكاديمي', 'الاسم (Cadet Name)', 'المعدل /100'], 1): ws.cell(10, i, h)
    hdr(ws, 10, 1, 4); ws.row_dimensions[10].height = 30
    for c in range(Q0, Q1 + 1):
        col = CL(c); k = c - Q0 + 1
        ws.cell(7, c).value = (plan[k - 1] if plan and k <= len(plan) else f'=IFERROR(INDEX(LST_Segments,{k})&"","")')
        ws.cell(7, c).font = f(True, 9); ws.cell(7, c).alignment = ctr; ws.cell(7, c).border = box
        for r in (8, 9):
            x = ws.cell(r, c); x.font = f(False, 9); x.alignment = ctr; x.border = box; x.protection = Protection(locked=False)
        ws.cell(8, c).number_format = DF
        ws.cell(10, c).value = f'=IF({col}7="","",{k})'
        x = ws.cell(10, c); x.font = f(True, 11, 'FFFFFF'); x.fill = fill(NAVY); x.alignment = ctr; x.border = box
    for r in range(S0, S1 + 1):
        ws.cell(r, 1).value = f'=IF($B{r}="","",ROW()-{S0-1})'
        ws.cell(r, 4).value = (f'=IF(COUNT(${QA}{r}:${QZ}{r})=0,"",'
                               f'ROUNDUP(ROUND(SUM(${QA}{r}:${QZ}{r})/COUNT(${QA}{r}:${QZ}{r})*10,6),0))')
        for c in range(1, Q1 + 1):
            x = ws.cell(r, c); x.font = f(c == 4); x.alignment = ctr if c != 3 else Alignment(horizontal='left', vertical='center')
            x.protection = Protection(locked=c in (1, 4))
        ws.cell(r, 2).number_format = '@'
    if students:
        for i, (sid, sn, grades) in enumerate(students):
            r = S0 + i
            ws.cell(r, 2, sid); ws.cell(r, 3, sn)
            for j, g in enumerate(grades):
                if g is not None: ws.cell(r, Q0 + j, g)
    # validations
    date_dv(ws, f'{QA}8:{QZ}8', '$H$3', '$J$3', f'{QA}8')
    exec_dv(ws, f'{QA}9:{QZ}9')
    dvg = DataValidation(type='list', formula1='=LST_Absent', allow_blank=True, showErrorMessage=False,
                         showInputMessage=True, promptTitle='الدرجة', prompt='اكتب الدرجة من 10، أو اختر «غائب» (لا يؤثر في المعدل).')
    dvg.add(f'{QA}{S0}:{QZ}{S1}'); ws.add_data_validation(dvg)
    dvs_ = DataValidation(type='list', formula1='=LST_SegList', allow_blank=True); dvs_.add(f'{QA}7:{QZ}7'); ws.add_data_validation(dvs_)
    c = ws.conditional_formatting
    G = f'{QA}{S0}:{QZ}{S1}'
    c.add(G, FormulaRule(formula=[f'{QA}{S0}="{ABS}"'], fill=fill('EDEDED'), font=Font(name=FONT, italic=True, color='7F7F7F'), stopIfTrue=True))
    c.add(G, FormulaRule(formula=[f'AND({QA}{S0}<>"",OR(NOT(ISNUMBER({QA}{S0})),{QA}{S0}<0,{QA}{S0}>10))'], fill=fill('FF9999'), stopIfTrue=True))
    c.add(G, FormulaRule(formula=[f'AND(ISNUMBER({QA}{S0}),{QA}{S0}<7)'], font=Font(name=FONT, bold=True, color='C00000')))
    c.add(G, FormulaRule(formula=[f'AND({QA}$7<>"",$B{S0}<>"")'], fill=fill('FFFBEA'), border=box))
    c.add(f'A{S0}:D{S1}', FormulaRule(formula=[f'$B{S0}<>""'], border=box))
    c.add(f'D{S0}:D{S1}', FormulaRule(formula=[f'AND(ISNUMBER($D{S0}),$D{S0}<70)'], fill=fill('F8CBAD'), font=Font(name=FONT, bold=True, color='C00000')))
    c.add(f'D{S0}:D{S1}', FormulaRule(formula=[f'AND(ISNUMBER($D{S0}),$D{S0}>=90)'], font=Font(name=FONT, bold=True, color=GREEN)))
    c.add(f'{QA}8:{QZ}8', FormulaRule(formula=[f'AND({QA}8="",COUNTA({QA}{S0}:{QA}{S1})>0)'], fill=fill('FF9999'), stopIfTrue=True))
    c.add(f'{QA}9:{QZ}9', FormulaRule(formula=[f'AND({QA}8<>"",{QA}9="")'], fill=fill('FF9999'), stopIfTrue=True))
    c.add(f'{QA}7:{QZ}9', FormulaRule(formula=[f'AND({QA}$7<>"",ISNUMBER({QA}$8))'], fill=fill('C6E0B4')))
    c.add(f'{QA}7:{QZ}9', FormulaRule(formula=[f'{QA}$7<>""'], fill=fill('FFFBEA')))
    c.add(f'{QA}7:{QZ}10', FormulaRule(formula=[f'{QA}$7=""'], fill=fill('F2F2F2'), font=Font(name=FONT, color='BFBFBF')))
    c.add('J5:K5', FormulaRule(formula=['AND(ISNUMBER($J$5),$J$5>0)'], fill=fill('F8CBAD')))
    c.add('N5:O5', FormulaRule(formula=['AND(ISNUMBER($N$5),$N$5>0)'], fill=fill('F8CBAD')))
    c.add('H5:I5', FormulaRule(formula=['$H$5="بديل"'], fill=fill('FFD966')))
    ws.freeze_panes = f'{QA}{S0}'; protect(ws)
    ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
    ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToHeight = 0; ws.page_setup.fitToWidth = 1; ws.print_title_rows = '7:10'

# ---------------- build class sheets ----------------
t1 = wb.create_sheet(TPL_L); make_lessons(t1, TPL_L); t1.sheet_properties.tabColor = '7F7F7F'
t2 = wb.create_sheet(TPL_Q); make_quran(t2, TPL_Q); t2.sheet_properties.tabColor = '7F7F7F'
name('TPL_Lessons', f"'{TPL_L}'!$A$1"); name('TPL_Quran', f"'{TPL_Q}'!$A$1")
for nm in ('FLOP-CG-02', 'SMS 163'):
    src = old[nm]; rec = {}
    for r in range(5, 52):
        if r in (32, 51): continue
        d_, who = src.cell(r, 7).value, src.cell(r, 8).value
        rec[r + 3] = (d_, None if who == 'اسم المدرس' else who)
    w = wb.create_sheet(nm); make_lessons(w, nm, rec); w.sheet_properties.tabColor = TEAL
# sample quran class
import random
random.seed(7)
studs = []
for i in range(1, 13):
    g = [round(random.choice([10, 9.5, 9, 8.5, 8, 7, 10]), 1) for _ in range(4)]
    studs.append([f'25{40000 + i}', f'Cadet {i:02d} (example)', g])
studs[2][2][1] = ABS; studs[5][2] = [5, 6, 0, 4.5]; studs[8][2][3] = None
wq = wb.create_sheet('CC-25-5'); make_quran(wq, 'CC-25-5', studs); wq.sheet_properties.tabColor = '548235'
qd = [dt.datetime(2026, 10, 18), dt.datetime(2026, 10, 20), dt.datetime(2026, 10, 25), dt.datetime(2026, 10, 27)]
for j, d_ in enumerate(qd):
    wq.cell(8, Q0 + j, d_); wq.cell(9, Q0 + j, 'جهاد جمال' if j != 2 else 'عامر الهاجري')

# ---------------- dashboard ----------------
ws = ws_dash
ws['A1'] = 'متابعة تنفيذ الدروس'; ws.merge_cells('A1:H1'); ws['A1'].font = f(True, 16, NAVY)
cards = [('B2', 'C2', 'الفصول النشطة', f'=MAX({D}!$R:$R)'), ('E2', 'F2', 'فصول القرآن', f'=COUNTIF($C$6:$C$205,"{TY_Q}")'),
         ('H2', 'I2', 'ورقة ناقصة', '=COUNTIF($R$6:$R$205,"ناقصة")'), ('K2', 'L2', 'تنبيهات', '=COUNTIF($L$6:$L$205,"*⚠*")')]
for la, va, t_, fo in cards:
    ws[la] = t_; ws[va] = fo
    ws[la].font = f(True, 10, 'FFFFFF'); ws[la].fill = fill(TEAL); ws[la].alignment = ctr
    ws[va].font = f(True, 14, NAVY); ws[va].alignment = ctr; ws[va].fill = fill('EAF1F8')
ws.row_dimensions[2].height = 26
ws['A3'] = 'يمكنك تصفية الجدول من أسهم العناوين (مثلًا بالنوع أو البلس أو المدرس).'; ws['A3'].font = f(False, 9, '7F7F7F')
dh = ['#', 'الفصل', 'النوع', 'الجزء', 'المدرس', 'الدورة', 'آخر درس / مقطع منفذ', 'تاريخه', 'بواسطة', 'التقدم', 'المعدل',
      'تنبيه', 'اختبار العقيدة', 'اختبار الفقه', 'الطلاب', 'تحت 70', 'الفصل التالي', 'الورقة']
for i, h in enumerate(dh, 1): ws.cell(5, i, h)
hdr(ws, 5, 1, 18); ws.row_dimensions[5].height = 30
for col, w in zip([CL(i) for i in range(1, 19)], (5, 15, 8, 7, 16, 7, 42, 11, 15, 9, 8, 40, 11, 11, 7, 7, 12, 8)):
    ws.column_dimensions[col].width = w
def V(r, c): return f'VLOOKUP($B{r},{D}!$A:$T,{c},FALSE)'
for r in range(6, 206):
    def IND(cell): return f'INDIRECT("\'"&$B{r}&"\'!{cell}")'
    def PICK(lc, qc): return f'IF($C{r}="{TY_Q}",{IND(qc)},{IND(lc)})'
    ok = f'$R{r}="✓"'
    done = f'IF($C{r}="{TY_Q}",COUNTIF({IND(f"{QA}8:{QZ}8")},"<="&TODAY()),COUNTIF({IND("F8:F67")},"<="&TODAY()))'
    exp = f'{V(r, 20)}'
    st = f'{V(r, 6)}'; en = f'{V(r, 7)}'; nx = f'{V(r, 14)}'; tr = f'{V(r, 15)}'
    vals = {
        1: f'=IF(ROW()-5<=MAX({D}!$R:$R),ROW()-5,"")',
        2: f'=IF($A{r}="","",HYPERLINK("#\'"&INDEX({D}!$A:$A,MATCH($A{r},{D}!$R:$R,0))&"\'!A1",INDEX({D}!$A:$A,MATCH($A{r},{D}!$R:$R,0))))',
        3: f'=IF($B{r}="","",IF({V(r,2)}="","{TY_L}",{V(r,2)}&""))',
        4: f'=IF($B{r}="","",{V(r,5)}&"")',
        5: f'=IF($B{r}="","",{V(r,3)}&"")',
        6: f'=IF($B{r}="","",IF({V(r,4)}="","",{V(r,4)}))',
        7: f'=IF($B{r}="","",IF(NOT({ok}),"—",{PICK("D5", "C5")}))',
        8: f'=IF($B{r}="","",IF(NOT({ok}),"",{PICK("E5", "D5")}))',
        9: f'=IF($B{r}="","",IF(NOT({ok}),"",{PICK("G5", "F5")}))',
        10: f'=IF($B{r}="","",IF(NOT({ok}),"",{PICK("A5", "A5")}))',
        11: f'=IF($B{r}="","",IF(OR(NOT({ok}),$C{r}<>"{TY_Q}"),"",{IND("L5")}))',
        13: f'=IF($B{r}="","",IF({V(r,11)}="","",{V(r,11)}))',
        14: f'=IF($B{r}="","",IF({V(r,12)}="","",{V(r,12)}))',
        15: f'=IF($B{r}="","",IF(NOT({ok}),"",IF($C{r}="{TY_Q}",{IND("F3")},IF({V(r,13)}="","",{V(r,13)}))))',
        16: f'=IF($B{r}="","",IF(OR(NOT({ok}),$C{r}<>"{TY_Q}"),"",{IND("N5")}))',
        17: f'=IF($B{r}="","",{nx}&"")',
        18: f'=IF($B{r}="","",IF(ISERROR(INDIRECT("\'"&$B{r}&"\'!A1")),"ناقصة","✓"))',
    }
    alert = ('=IF($B{r}="","",IF(NOT({ok}),"⚠ ورقة ناقصة. سمِّها: "&$B{r},TRIM('
             'IF(AND(ISNUMBER({st}),{st}>TODAY()),"لم يبدأ بعد  ","")'
             '&IF(AND({nx}<>"",ISNUMBER({tr})),IF({tr}<=TODAY(),"⚠ انتقل إلى "&{nx}&": أرشِفه  ",""),"")'
             '&IF({skip}>0,"⚠ متخطاة: "&{skip}&"  ","")'
             '&IF(AND(ISNUMBER({exp}),{exp}-{done}>=2),"⚠ متأخر "&({exp}-{done})&" حصص  ","")'
             '&IF({sub}="بديل","(آخر حصة بديل)  ","")'
             '&IF(AND(ISNUMBER($H{r}),TODAY()-$H{r}>14,OR(NOT(ISNUMBER({en})),TODAY()<={en})),"⚠ لا حصة منذ "&(TODAY()-$H{r})&" يومًا  ","")'
             '&IF(AND($C{r}<>"{TQ}",ISNUMBER($M{r})),IF(AND($M{r}>=TODAY(),$M{r}-TODAY()<=7,{ih5}<>"نعم"),"⚠ سلِّم مراجعة العقيدة  ",""),"")'
             '&IF(AND($C{r}<>"{TQ}",ISNUMBER($N{r})),IF(AND($N{r}>=TODAY(),$N{r}-TODAY()<=7,{ii5}<>"نعم"),"⚠ سلِّم مراجعة الفقه  ",""),"")'
             ')))').format(r=r, ok=ok, st=st, nx=nx, tr=tr, en=en, exp=exp, done=done, TQ=TY_Q,
                           skip=PICK('B5', 'J5'), sub=PICK('F5', 'H5'), ih5=IND('H5'), ii5=IND('I5'))
    vals[12] = alert
    for c, v in vals.items(): ws.cell(r, c).value = v
    for c in range(1, 19):
        x = ws.cell(r, c); x.font = f(); x.alignment = rgt if c in (7, 12) else ctr
    ws.cell(r, 2).font = Font(name=FONT, size=11, bold=True, color='0563C1', underline='single')
    for c in (8, 13, 14): ws.cell(r, c).number_format = DF
cfd = ws.conditional_formatting
cfd.add('A6:R205', FormulaRule(formula=['$B6<>""'], border=box))
cfd.add('L6:L205', FormulaRule(formula=['ISNUMBER(SEARCH("⚠",$L6))'], fill=fill('F8CBAD')))
cfd.add('L6:L205', FormulaRule(formula=['AND($L6<>"",NOT(ISNUMBER(SEARCH("⚠",$L6))))'], fill=fill('FFF2CC')))
cfd.add('R6:R205', FormulaRule(formula=['$R6="ناقصة"'], fill=fill('F8CBAD'), font=Font(name=FONT, bold=True, color='C00000')))
cfd.add('R6:R205', FormulaRule(formula=['$R6="✓"'], font=Font(name=FONT, bold=True, color=GREEN)))
cfd.add('C6:C205', FormulaRule(formula=[f'$C6="{TY_Q}"'], fill=fill('E2EFDA')))
cfd.add('K6:K205', FormulaRule(formula=['AND(ISNUMBER($K6),$K6<70)'], fill=fill('F8CBAD')))
cfd.add('P6:P205', FormulaRule(formula=['AND(ISNUMBER($P6),$P6>0)'], fill=fill('F8CBAD')))
for col in ('M', 'N'):
    cfd.add(f'{col}6:{col}205', FormulaRule(formula=[f'AND(ISNUMBER({col}6),{col}6<TODAY())'], fill=fill('D9D9D9'), font=Font(name=FONT, color='7F7F7F')))
    cfd.add(f'{col}6:{col}205', FormulaRule(formula=[f'AND(ISNUMBER({col}6),{col}6-TODAY()<=7,{col}6>=TODAY())'], fill=fill('FFD966'), font=Font(name=FONT, bold=True)))
ws.auto_filter.ref = 'A5:R205'
ws.freeze_panes = 'C6'; ws.sheet_properties.tabColor = NAVY; protect(ws, filt=True)
ws.sheet_properties.pageSetUpPr = PageSetupProperties(fitToPage=True)
ws.page_setup.orientation = 'landscape'; ws.page_setup.fitToHeight = 0; ws.page_setup.fitToWidth = 1
for w, c in ((ws_data, 'C00000'), (ws_cat, 'C00000'), (ws_sur, 'C00000'), (ws_hol, 'C00000'), (ws_t, 'C00000'), (ws_l, '7F7F7F'), (ws_g, 'FFC000')):
    w.sheet_properties.tabColor = c
for n_, s_ in (('SYS_Dash', DASH), ('SYS_Data', DATA), ('SYS_Catalog', CAT), ('SYS_Surah', SUR), ('SYS_Holidays', HOL),
               ('SYS_Teachers', TEA), ('SYS_Lists', LST), ('SYS_Guide', GUIDE)):
    name(n_, f"'{s_}'!$A$1")

# ---------------- guide ----------------
G = [
 ('دليل الإدارة', 1),
 ('هذا الملف للمدرسين ولا يحتوي على أي كود. الإضافة والأرشفة والتصدير وتعبئة التواريخ تتم من «أداة الإدارة» (ملف منفصل).', 0),
 ('', 0),
 ('١) إضافة فصل', 2),
 ('في «بيانات_الفصول» اكتب رقم الفصل في أول صف فارغ واختر النوع (مناهج / قرآن) والمدرس وبقية الخانات، والحالة «نشط».', 0),
 ('ثم من أداة الإدارة: «إنشاء الأوراق الناقصة». أو يدويًا: انسخ ورقة «نموذج» (للمناهج) أو «نموذج قرآن» وسمِّها بنفس رقم الفصل تمامًا.', 0),
 ('فصول CC: إن كان معروفًا الفصل الفني الذي سينتقلون إليه فاكتبه في «الفصل التالي» مع «تاريخ الانتقال»، وستنشئ الأداة خطته تلقائيًا.', 0),
 ('', 0),
 ('٢) إنهاء فصل', 2),
 ('اختر الحالة «للأرشفة» (ينتقل إلى Archive.xlsx كقيم ثابتة) أو «للحذف» (يُحذف نهائيًا)، ثم نفّذ من أداة الإدارة.', 0),
 ('', 0),
 ('٣) القرآن', 2),
 ('قسّم السور إلى مقاطع في «قائمة السور». تظهر المقاطع بنفس الترتيب في كل كشوف القرآن.', 0),
 ('في كشف الفصل: الصق الأرقام الأكاديمية والأسماء، وفوق كل مقطع اكتب تاريخ التنفيذ والمنفذ، ثم ضع الدرجة من 10 لكل طالب أو «غائب».', 0),
 ('المعدل من 100 = متوسط الدرجات المرصودة فقط (الفارغ وغائب لا يُحتسبان، والصفر يُحتسب) ويُقرَّب للأعلى. أقل من 70 يتلوّن بالأحمر.', 0),
 ('', 0),
 ('٤) المناهج وأوراق الصفحات', 2),
 ('الدروس وأرقام الصفحات في «فهرس الدروس». ملفات الـPDF في مجلد PDF_Lessons بجوار هذا الملف، واسم الملف = الصفحات + .pdf', 0),
 ('', 0),
 ('٥) الإجازات وأيام الحصص', 2),
 ('اكتب الإجازات في ورقة «الإجازات». وأيام الحصص لكل فصل في «بيانات_الفصول». يُرفض تاريخ في الجمعة أو السبت أو في إجازة أو خارج فترة الفصل.', 0),
 ('', 0),
 ('٦) الألوان', 2),
 ('أصفر فاتح = خانة إدخال. أخضر = منفذ. برتقالي = حصة متخطاة. أحمر = نقص (تاريخ بلا منفذ، درجات بلا تاريخ، قيمة خطأ). أزرق مائل = تاريخ عبّأته الأداة تقديريًا.', 0),
 ('', 0),
 ('٧) ملاحظات', 2),
 ('الأوراق محمية بلا كلمة مرور (مراجعة ← إلغاء حماية الورقة). لا تغيّر أسماء الأوراق الثابتة ولا ترتيب «القوائم».', 0),
 ('نفّذ عمليات الإضافة والأرشفة والتعبئة بعد إيقاف المشاركة وفي غير أوقات الحصص. التصدير والفحص يعملان والملف مشارك.', 0),
]
for i, (t_, lvl) in enumerate(G, 1):
    x = ws_g.cell(i, 1, t_); x.font = f(lvl > 0, 15 if lvl == 1 else 11, NAVY if lvl else '000000'); x.alignment = Alignment(horizontal='right', wrap_text=True)
ws_g.column_dimensions['A'].width = 140
protect(ws_g)

wb.calculation.fullCalcOnLoad = True
wb.save(OUT)
print('saved', OUT)
