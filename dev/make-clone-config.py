#!/usr/bin/env python3
"""يكتب dev/clone-config.json (مواضع المسح والكتابة لكل تصميم). عدّل هنا ثم شغّل clone-templates.py"""
import json,os
F='Tajawal'
D=[]
# ١) الورق الكريمي
D.append(dict(id='c1',name='الورق الكريمي',src='c1.jpg',
 erase=[[180,292,846,414],dict(r=[425,402,600,556],mode='full'),dict(r=[168,568,862,676],mode='full'),[212,824,816,1042],dict(r=[168,1182,862,1320],mode='full')],
 layout=dict(
  header=dict(x=512,y=352,maxW=640,size=104,min=60,color='#6c7659',weight=700),
  num=dict(x=511,y=473,size=70,color='#f6f4e8',circle=dict(r=58,fill='#a3a781',ring='rgba(255,255,255,.6)')),
  attr=dict(pill=dict(x=178,y=580,w=670,h=82,fill='rgba(232,232,217,.97)'),x=700,y=621,align='right',maxW=520,size=38,min=24,color='#626d4f',weight=700,icon=dict(t='leaf',x=760,color='#8d9a72')),
  body=dict(x=215,y=800,w=596,h=290,color='#5d684b',max=66,min=30),
  src=dict(pill=dict(x=178,y=1195,w=670,h=110,fill='rgba(232,232,217,.97)'),x=700,y=1250,align='right',maxW=470,size=30,min=20,color='#6a7058',weight=700,icon=dict(t='book',x=806,color='#a1a47f')))))
# ٢) المحراب الأخضر
D.append(dict(id='c2',name='المحراب الأخضر',src='c2.jpg',
 erase=[[330,190,705,270],[470,355,555,445],[320,525,780,590],[150,625,905,920],dict(r=[312,1032,716,1140],mode='full')],
 layout=dict(
  header=dict(x=515,y=230,maxW=370,size=56,min=34,color='#59644b',weight=700),
  num=dict(x=512,y=400,size=60,color='#5f6a4e'),
  attr=dict(x=512,y=553,align='center',maxW=560,size=38,min=24,color='#8a6f5f',weight=500),
  body=dict(x=190,y=640,w=650,h=275,color='#5c6b47',max=62,min=30),
  src=dict(pill=dict(x=325,y=1048,w=375,h=78,fill='rgba(236,238,224,.96)',border='rgba(150,160,125,.55)'),x=512,y=1087,align='center',maxW=330,size=30,min=18,color='#7a7f66',weight=500))))
# ٣) الورق الزيتوني (تصميم ٤)
D.append(dict(id='c4',name='الظل الزيتوني',src='c4.jpg',
 erase=[[210,275,810,380],dict(r=[483,414,541,486],mode='full'),[262,575,732,632],[270,800,825,1215],[380,1338,812,1430]],
 layout=dict(
  header=dict(x=512,y=330,maxW=560,size=96,min=56,color='#4f5640',weight=700),
  num=dict(x=512,y=453,size=60,color='#f4f2e6'),
  attr=dict(x=730,y=605,align='right',maxW=460,size=34,min=22,color='#5a5e48',weight=500),
  body=dict(x=275,y=805,w=540,h=410,color='#4f5240',max=60,min=30),
  src=dict(x=785,y=1384,align='right',maxW=400,size=28,min=18,color='#5f6350',weight=500))))
# ٤) الأزرق الهادئ (تصميم ٥)
D.append(dict(id='c5',name='النافذة الزرقاء',src='c5.jpg',
 erase=[[255,225,765,335],[478,392,538,466],[255,528,780,603],[238,780,805,1290],[345,1405,665,1455]],
 layout=dict(
  header=dict(x=507,y=268,maxW=470,size=72,min=44,color='#0f2342',weight=700),
  num=dict(x=507,y=430,size=70,color='#12294a'),
  attr=dict(x=520,y=562,align='center',maxW=500,size=32,min=22,color='#1d2f4d',weight=500),
  body=dict(x=240,y=775,w=560,h=520,color='#14284a',max=58,min=30),
  src=dict(x=506,y=1430,align='center',maxW=320,size=28,min=16,color='#1d2f4d',weight=500))))
# ٥) الإطار الأخضر (تصميم ٧)
D.append(dict(id='c7',name='الإطار الأخضر',src='c7.jpg',
 erase=[dict(r=[315,322,765,440],mode='full'),[508,198,562,254],dict(r=[320,548,760,612],mode='full'),dict(r=[200,660,880,1010],mode='full'),dict(r=[320,1100,760,1265],mode='full')],
 layout=dict(
  header=dict(x=532,y=388,maxW=470,size=84,min=50,color='#44695a',weight=700,font='Aref Ruqaa'),
  num=dict(x=535,y=226,size=46,color='#3d6253'),
  attr=dict(x=540,y=580,align='center',maxW=560,size=36,min=22,color='#4a6b5d',weight=500),
  body=dict(x=190,y=680,w=700,h=330,color='#1c2a24',max=62,min=30),
  src=dict(x=540,y=1192,align='center',maxW=480,size=30,min=18,color='#5a666a',weight=500))))
json.dump(dict(designs=D),open(os.path.join(os.path.dirname(__file__),'clone-config.json'),'w',encoding='utf-8'),ensure_ascii=False,indent=1)
