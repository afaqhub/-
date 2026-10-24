module.exports=function seed(env){
  const setup=env.ctx.setup(); const temp=(setup.match(/: (\S{10})\n/)||[])[1];
  let tok=env.call('login',{password:temp}).data.token;
  env.call('changePassword',{old:temp,neu:'Secret123'},tok);
  tok=env.call('login',{password:'Secret123'}).data.token;
  env.call('saveSettings',{settings:{'تم الإعداد':'نعم','اسم المنصة':'كُنّاشة تجريبية','صانع المنصة':'صديق','ختم الصور':'@kunnasha'}},tok);
  env.call('savePerson',{name:'',data:{name:'ابن كثير',aliases:['ابن كثير الدمشقي'],dua:'رحمه الله'}},tok);
  env.call('savePerson',{name:'',data:{name:'ابن عثيمين',aliases:['العثيمين','الشيخ ابن عثيمين'],dua:'رحمه الله'}},tok);
  const S=(o)=>env.call('save',{item:o},tok).data.id;
  const ids={};
  ids.quran=S({text:'فالاعتصام بالله والتوكل عليه هو العمدة في الهداية، والعدة في مباعدة الغواية، والوسيلة إلى الرشاد، وطريق السداد وحصول المراد.',speaker:'ابن كثير',ref:'تفسير ابن كثير',locus:'2/388',cat:'التفسير وعلوم القرآن',visibility:'عامة',medium:'قراءة',tags:['اعتصام','توكل'],anchor:'آل عمران ١٠١'});
  ids.hadith=S({text:'قال العلماء: الأعمال بالنيات قاعدةٌ عظيمة في الدين، ترجع إليها مسائل كثيرة من العبادات والمعاملات.',speaker:'ابن رجب',ref:'جامع العلوم والحكم — شرح الأربعين',locus:'1/61',via:'ابن عثيمين',cat:'الحديث وعلومه',visibility:'عامة',type:'قاعدة'});
  ids.listen=S({text:'من أعظم ما يعين على الثبات: الاشتغال بالطاعة، وصحبة الصالحين، والإكثار من ذكر الله.',speaker:'ابن عثيمين',ref:'شرح رياض الصالحين — الدرس الثالث',locus:'32:15',link:'https://www.youtube.com/watch?v=abcDEF12345',medium:'سماع',cat:'التربية والسلوك',visibility:'عامة',series:'فوائد الثبات',sorder:1});
  ids.poetry=S({text:'ولو أنّا إذا متنا تُركنا لكان الموتُ راحةَ كلِّ حيِّ\nولكنّا إذا متنا بُعثنا ونُسأل بعده عن كلِّ شيء',speaker:'الشافعي',ref:'الديوان',type:'شعر',cat:'اللغة والأدب',visibility:'عامة'});
  ids.long=S({text:('العلم نورٌ يقذفه الله في قلب من يشاء، وهو أشرف ما اشتغلت به النفوس وصُرفت فيه الأوقات. والعلم النافع هو ما أورث خشية الله، وقاد صاحبه إلى العمل. ولا يتحقق ذلك إلا بصدق الطلب وإخلاص النية والصبر على المشاق. ومن لزم الأدب مع شيوخه وكتبه فتح الله عليه من أبواب الفهم ما لا يخطر بباله. ').repeat(4),speaker:'ابن القيم',ref:'مفتاح دار السعادة',locus:'1/120',cat:'التربية والسلوك',visibility:'عامة'});
  ids.priv=S({text:'فائدة خاصة لا يراها الزائر أبدًا',speaker:'سري',cat:'فوائد متفرقة',visibility:'خاصة',note:'تعليق خاص'});
  ids.draft=S({text:'مسودة بلا توثيق',visibility:'خاصة'});
  return {temp,tok,ids};
};
