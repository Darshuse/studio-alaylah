from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import sys
sys.path.insert(0,r'C:\tmp\family-story-pydeps')
import arabic_reshaper
from bidi.algorithm import get_display
R=Path(__file__).parent; O=R/'output/pdf/family_story_studio_architecture_plan.pdf'; T=R/'tmp/pdfs/architecture';T.mkdir(parents=True,exist_ok=True)
W,H=1240,1754; FONT='C:/Windows/Fonts/tahoma.ttf'; BOLD='C:/Windows/Fonts/tahomabd.ttf'
def f(n,b=0):return ImageFont.truetype(BOLD if b else FONT,n)
def rtl(x):return get_display(arabic_reshaper.reshape(x),base_dir='R')
def txt(d,y,s,n=29,b=0,c='#17222d'):
    q=f(n,b); words=s.split();lines=[];z=''
    for w in words:
        v=(z+' '+w).strip()
        if d.textbbox((0,0),rtl(v),font=q)[2]>1030:lines.append(z);z=w
        else:z=v
    if z:lines.append(z)
    for x in lines:d.text((1120,y),rtl(x),font=q,fill=c,anchor='ra');y+=n+13
    return y
def pg(no,title,parts):
    im=Image.new('RGB',(W,H),'white');d=ImageDraw.Draw(im);d.rectangle((0,0,W,24),fill='#0c5361');d.rectangle((0,H-25,W,H),fill='#0c5361');y=76
    d.text((1120,y),rtl(title),font=f(49,1),fill='#0c3540',anchor='ra');y+=85
    for typ,s in parts:
        if typ=='h':
            d.rounded_rectangle((1040,y+4,1055,y+55),4,fill='#d98f41');d.text((1022,y),rtl(s),font=f(39,1),fill='#0c3540',anchor='ra');y+=72
        elif typ=='b':
            d.rounded_rectangle((75,y,1165,y+120),14,fill='#edf6f4');y=txt(d,y+16,s,27,1,'#204b50')+20
        elif typ=='l':
            for x in s:
                d.ellipse((1090,y+12,1102,y+24),fill='#d98f41');y=txt(d,y,x,27)+5
            y+=8
        else:y=txt(d,y,s,29)+16
    d.text((620,H-15),rtl(f'{no} | استوديو حكايات العائلة - معمارية التنفيذ'),font=f(14),fill='white',anchor='mm');p=T/f'{no}.png';im.save(p);return p
p=[]
im=Image.new('RGB',(W,H),'#f2f7f6');d=ImageDraw.Draw(im);d.rectangle((0,0,W,24),fill='#0c5361');d.rectangle((0,H-25,W,H),fill='#0c5361')
d.text((1080,210),rtl('خطة المعمارية والتنفيذ'),font=f(34,1),fill='#ba6f27',anchor='ra');d.text((1080,360),rtl('استوديو حكايات العائلة'),font=f(67,1),fill='#0c3540',anchor='ra')
txt(d,510,'من كتابة الذكرى أو تسجيلها إلى فيلم عائلي عربي خاص.',46,1,'#0d5564');d.rounded_rectangle((95,720,1145,900),20,fill='white');txt(d,775,'النص هو مرجع القصة، والصوت هو مرجع الأداء - بعد موافقة صريحة.',37,1,'#25434a')
txt(d,1420,'وثيقة تسليم لفريق المنتج والتطوير | سبتمبر 2026',25,0,'#637278');cover=T/'1.png';im.save(cover);p.append(cover)
p.append(pg(2,'قرار المنتج والرحلة',[
('b','القرار المعماري: اجعلوا النص المصدر النهائي للقصة دائمًا. يستطيع الوالد كتابته، أو تسجيله ثم مراجعته واعتماده. لا يدخل أي نص مستخرج من الصوت إلى الفيلم دون مراجعة الوالد.'),
('h','مدخلا القصة'),('l',['اكتب الحكاية: نص حر مع تحسين اختياري وصياغة قابلة للتعديل.','سجّل بصوتك: مقطع من 30 إلى 90 ثانية، يحول إلى نص ثم يعرض للتحرير.','مسار مختلط: يكتب الوالد القصة ويسجل افتتاحية أو خاتمة بصوته.']),
('h','تدفق المستخدم'),('p','كتابة أو تسجيل ثم اعتماد النص، ثم اختيار أبطال القصة، ثم إنشاء المشاهد والتعليق الصوتي، ثم معاينة قصيرة، وأخيرًا اعتماد الفيلم أو تعديل مشهد محدد.')]))
p.append(pg(3,'المكونات الرئيسية',[
('h','Modular Monolith في البداية'),('p','تطبيق خلفي واحد منظم إلى وحدات مستقلة، مع طابور مهام للعمليات الثقيلة. لا تبدأوا بخدمات مصغرة كاملة قبل ظهور حجم استخدام يبرر ذلك.'),
('l',['واجهة الويب أو الجوال: القصة، التسجيل، بطاقة العائلة، المعاينة والموافقات.','API: المصادقة، الصلاحيات، القصص، الأصول وحالات الإنتاج.','Story Service: حفظ النص، التحويل من الصوت إلى نص، المراجعة وتقسيم المشاهد.','Voice Service: التسجيل، موافقة الاستخدام، التعليق الصوتي من النص المعتمد.','Character Service: صور مرجعية وهوية ثابتة لكل فرد من العائلة.','Render Orchestrator وJob Queue: تنسيق التوليد، التحقق والدمج النهائي.','Media Storage: ملفات خاصة بروابط وصول موقعة ومحدودة المدة.']),
('b','كل عملية فيديو أو صوت توليدية تعمل في طابور مهام، وليس داخل طلب API ينتظر المستخدم.')]))
p.append(pg(4,'الصوت والخصوصية',[
('h','افصلوا ثلاث وظائف'),('l',['Speech to Text: تحويل تسجيل الوالد إلى نص قابل للتحرير.','Voice Enrollment: حفظ عينة الصوت بعد موافقة صريحة قابلة للسحب.','Text to Speech: نطق النص المعتمد بصوت الوالد لتوليد التعليق الصوتي.']),
('h','ضوابط غير قابلة للتفاوض'),('l',['صوت الوالد البالغ فقط في MVP. لا استنساخ لصوت طفل.','إقرار أن الصوت للمستخدم أو لديه تفويض واضح من صاحبه.','لا إعادة استخدام العينة خارج قصص العائلة دون موافقة مستقلة.','زر حذف يزيل عينة الصوت والنص والأصول والمشتقات.','منع الرفع العام والمشاركة الافتراضية، وسجل تدقيق لكل موافقة وحذف.']),
('b','لا تسوقوا المنتج بعبارة استنساخ الصوت. الرسالة: حكاية عائلية بصوتك.')]))
p.append(pg(5,'البيانات والتدفق التشغيلي',[
('h','الكيانات'),('p','User، Family، FamilyMember، CharacterProfile، Story، StoryRevision، VoiceConsent، VoiceSample، StoryScene، GenerationJob، MediaAsset، DeletionRequest، AuditEvent.'),
('h','حالة التوليد'),('p','queued ثم processing ثم needs_review ثم completed أو failed أو cancelled. تعرض الواجهة مراحل مفهومة: نرتب الحكاية، نجهز الأصوات، نصنع المشاهد، المعاينة جاهزة.'),
('h','واجهات API الأساسية'),('l',['POST /stories و POST /stories/{id}/text و POST /stories/{id}/audio','POST /stories/{id}/transcribe و POST /stories/{id}/approve-text','POST /voice-consents و POST /voice-samples و POST /characters','POST /stories/{id}/scenes/generate و GET /jobs/{id}','DELETE /media/{id} و DELETE /families/{id}']),
('b','ترفع الملفات مباشرة إلى التخزين عبر روابط موقعة؛ لا تمر ملفات الصوت والفيديو الكبيرة عبر خادم API.')]))
p.append(pg(6,'خطة العمل والقرارات',[
('h','المرحلة صفر - أسبوعان'),('p','كتابة أو تسجيل، تحويل إلى نص، اعتماد النص، بطاقة طفل واحدة، فيلم قصير شبه يدوي، وحذف يدوي من لوحة الإدارة. الهدف: 10 إلى 20 عائلة تنهي القصة وتقبل المعاينة.'),
('h','MVP - أربعة أسابيع'),('p','حساب الوالد، ثلاث شخصيات كحد أقصى، 4 إلى 6 مشاهد، معاينة بعلامة مائية، دفع بعد المعاينة، وأرشيف خاص للعائلة.'),
('h','الجودة والاقتصاديات - 4 إلى 6 أسابيع'),('p','إعادة توليد مشهد واحد، الفصحى واللهجة الخليجية، قوالب المناسبات، قياس تكلفة الفيلم والشراء الثاني والرضا عن اتساق الشخصية.'),
('b','المقاييس الحاسمة: وقت أول معاينة، نسبة اعتماد النص، نسبة قبول الهوية، تكلفة الفيلم، إعادة التوليد، والتحويل إلى شراء.')]))
c=canvas.Canvas(str(O),pagesize=(595.276,841.89))
for x in p:c.drawImage(ImageReader(str(x)),0,0,width=595.276,height=841.89);c.showPage()
c.save();print(O)
