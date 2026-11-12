"""Fictional demo data for the teachers workbook (names, classes, students, dates)."""
import datetime as dt, random

TODAY = dt.datetime(2026, 11, 12)
D = lambda y, m, d: dt.datetime(y, m, d)

TEACHERS = ['أحمد الشمري (تجريبي)', 'سالم العتيبي (تجريبي)', 'ماجد القحطاني (تجريبي)', 'فهد الدوسري (تجريبي)',
            'خالد الحربي (تجريبي)', 'عبدالله الزهراني (تجريبي)', 'ناصر المطيري (تجريبي)', 'يوسف الغامدي (تجريبي)',
            'بدر السبيعي (تجريبي)', 'تركي الشهراني (تجريبي)']
T = {i + 1: n for i, n in enumerate(TEACHERS)}
ST_ACT, ST_ARC, ST_DEL, ST_FIN = 'نشط', 'للأرشفة', 'للحذف', 'منتهٍ'
TY_L, TY_Q = 'مناهج', 'قرآن'
SUN_THU = {'الأحد': 6, 'الاثنين': 0, 'الثلاثاء': 1, 'الأربعاء': 2, 'الخميس': 3}   # python weekday

# name, type, teacher, course, part, start, end, wfrom, wto, d1, d2, d3, examA, examF, students, next, trans, status, prev
CLASSES = [
 # ---- Quran classes
 ('CC-25-1', TY_Q, T[1], 144, 'P37', D(2026, 8, 30), D(2026, 11, 5), None, None, 'الأحد', 'الثلاثاء', None, None, None, None, 'SMS 163', D(2026, 11, 8), ST_FIN, None),
 ('CC-25-2', TY_Q, T[2], 145, 'P38', D(2026, 9, 13), D(2026, 12, 3), None, None, 'الاثنين', 'الأربعاء', None, None, None, None, 'MEC 201', D(2026, 12, 6), ST_ACT, None),
 ('CC-25-3', TY_Q, T[3], 145, 'P38', D(2026, 9, 13), D(2026, 12, 3), None, None, 'الأحد', 'الخميس', None, None, None, None, None, None, ST_ACT, None),
 ('CC-25-4', TY_Q, T[4], 146, 'P40', D(2026, 11, 8), D(2027, 1, 14), None, None, 'الأحد', 'الثلاثاء', None, None, None, None, None, None, ST_ACT, None),
 ('CC-25-5', TY_Q, T[1], 146, 'P40', D(2026, 10, 18), D(2026, 12, 24), None, None, 'الأحد', 'الثلاثاء', None, None, None, None, 'SMS 170', D(2026, 12, 27), ST_ACT, None),
 ('CC-24-3', TY_Q, T[5], 143, 'P36', D(2026, 7, 5), D(2026, 9, 24), None, None, 'الاثنين', 'الأربعاء', None, None, None, None, 'SMS 150', D(2026, 9, 27), ST_FIN, None),
 ('CC-25-6', TY_Q, T[6], 146, 'P40', D(2026, 11, 8), D(2027, 1, 14), None, None, 'الاثنين', 'الأربعاء', None, None, None, None, None, None, ST_ACT, None),
 # ---- lessons classes
 ('SMS 163', TY_L, T[1], 144, 'P37', D(2026, 9, 20), D(2027, 2, 4), None, None, 'الأربعاء', 'الخميس', None, D(2026, 11, 15), D(2027, 1, 31), 13, None, None, ST_ACT, 'CC-25-1'),
 ('SMS 150', TY_L, T[5], 143, 'P36', D(2026, 9, 27), D(2027, 2, 11), None, None, 'الأحد', 'الاثنين', None, D(2026, 11, 22), D(2027, 2, 8), 12, None, None, ST_ACT, 'CC-24-3'),
 ('FLOP-CG-02', TY_L, T[7], 144, 'P37', D(2026, 9, 20), D(2027, 2, 4), None, None, 'الأحد', 'الاثنين', None, D(2026, 11, 15), D(2027, 1, 31), 12, None, None, ST_ACT, None),
 ('FLOP 049', TY_L, T[8], 144, 'P37', None, None, 4, 22, 'الأحد', 'الثلاثاء', None, D(2026, 11, 15), D(2027, 1, 31), 13, None, None, ST_ACT, None),
 ('MEC 140', TY_L, T[2], 142, 'P35', D(2026, 6, 14), D(2026, 11, 5), None, None, 'الأحد', 'الثلاثاء', None, D(2026, 9, 20), D(2026, 10, 25), 14, None, None, ST_FIN, None),
 ('ELC 118', TY_L, T[3], 144, 'P37', D(2026, 9, 13), D(2027, 1, 28), None, None, 'الاثنين', 'الأربعاء', None, D(2026, 11, 18), D(2027, 1, 25), 11, None, None, ST_ACT, None),
 ('COM 305', TY_L, T[9], 146, 'P40', D(2026, 11, 22), D(2027, 4, 8), None, None, 'الأحد', 'الثلاثاء', None, D(2027, 1, 20), D(2027, 4, 1), 15, None, None, ST_ACT, None),
 ('COM 220', TY_L, T[4], 141, 'P34', D(2026, 4, 5), D(2026, 9, 17), None, None, 'الاثنين', 'الأربعاء', None, D(2026, 7, 5), D(2026, 8, 30), 13, None, None, ST_ARC, None),
 ('ELC 099', TY_L, T[10], 141, 'P34', D(2026, 4, 5), D(2026, 9, 17), None, None, 'الأحد', 'الخميس', None, D(2026, 7, 5), D(2026, 8, 30), 10, None, None, ST_DEL, None),
 ('MEC 177', TY_L, T[6], 145, 'P38', D(2026, 10, 4), D(2027, 2, 18), None, None, 'الثلاثاء', 'الأربعاء', None, D(2026, 12, 6), D(2027, 2, 15), 14, None, None, ST_ACT, None),
]
HAS_SHEET = {c[0] for c in CLASSES} - {'FLOP 049', 'CC-25-6'}


def teach_days(c):
    return [SUN_THU[x] for x in (c[9], c[10], c[11]) if x]


def class_dates(c, n, until, skip=(), late_gap=()):
    """n lesson dates on the class's teaching days starting at class start, not after `until`."""
    start = c[5]
    days = set(teach_days(c)) or set(range(0, 4)) | {6}
    out, d = [], start
    while len(out) < n and d <= c[6]:
        if d.weekday() in days: out.append(d)
        d += dt.timedelta(1)
    return [x if x <= until else None for x in out]


# ------------------------------------------------------------------ student names
FIRST = ['Abdullah', 'Faisal', 'Salman', 'Turki', 'Nawaf', 'Rayan', 'Hamad', 'Sultan', 'Mishal', 'Badr', 'Khalid', 'Majed',
         'Saud', 'Yazeed', 'Waleed', 'Omar', 'Hassan', 'Ziyad', 'Talal', 'Bandar', 'Meshari', 'Anas', 'Saad', 'Fahad']
LAST = ['Alharbi', 'Alotaibi', 'Alqahtani', 'Aldosari', 'Alshehri', 'Alzahrani', 'Almutairi', 'Alghamdi', 'Alsubaie',
        'Alanazi', 'Almalki', 'Alshammari', 'Alyami', 'Alsulami', 'Alharthi', 'Alruwaili']


def make_roster(rng, n, base):
    out = []
    used = set()
    while len(out) < n:
        nm = f'{rng.choice(FIRST)} {rng.choice(LAST)} (demo)'
        if nm in used: continue
        used.add(nm); out.append((f'{base + len(out) + 1}', nm))
    return out


def grade(rng, level):
    r = rng.random()
    if level == 'good': return rng.choice([10, 10, 9.5, 9.5, 9, 8.5, 8])
    if level == 'mid': return rng.choice([9, 8.5, 8, 7.5, 7, 6.5, 6])
    return rng.choice([7, 6, 5.5, 5, 4.5, 4, 3, 2])


def quran_students(name, nseg, seed):
    rng = random.Random(seed)
    sizes = {'CC-25-1': 13, 'CC-25-2': 14, 'CC-25-3': 12, 'CC-25-4': 12, 'CC-25-5': 12, 'CC-24-3': 13}
    base = {'CC-25-1': 2541000, 'CC-25-2': 2542000, 'CC-25-3': 2543000, 'CC-25-4': 2544000, 'CC-25-5': 2545000, 'CC-24-3': 2440000}[name]
    ros = make_roster(rng, sizes[name], base)
    stu = []
    for i, (sid, nm) in enumerate(ros):
        lvl = 'good' if i % 4 in (0, 1) else ('mid' if i % 4 == 2 else 'low')
        g = [grade(rng, lvl) for _ in range(nseg)]
        stu.append([sid, nm, g])
    return stu


def quran_plan():
    """number of dated segments per Quran class (relative to the number of sessions held so far)"""
    out = {}
    for c in CLASSES:
        if c[1] != TY_Q: continue
        full = len([x for x in class_dates(c, 60, c[6]) if x])
        so_far = len([x for x in class_dates(c, 60, TODAY) if x])
        if c[0] in ('CC-25-1', 'CC-24-3'): out[c[0]] = full
        elif c[0] == 'CC-25-4': out[c[0]] = 0
        elif c[0] == 'CC-25-3': out[c[0]] = max(so_far - 4, 1)
        elif c[0] == 'CC-25-6': out[c[0]] = 0
        else: out[c[0]] = max(so_far - 1, 1)
    return out


def lesson_progress():
    """how many lessons are dated for each lessons class (None = all within period up to today)"""
    return {'SMS 163': 'orig', 'FLOP-CG-02': 'orig', 'SMS 150': 12, 'MEC 140': 47, 'ELC 118': 'gaps',
            'COM 305': 0, 'COM 220': 47, 'ELC 099': 9, 'MEC 177': 6}
