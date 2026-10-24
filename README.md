# سهولة – نظام إدارة أعمال العمليات

تطبيق ويب يعمل بدون إنترنت (Offline-First)، ويخزن البيانات محلياً على الجهاز باستخدام `localStorage` و`IndexedDB`.

## نظرة عامة

"سهولة" هو تطبيق لإدارة أعمال العمليات اليومية داخل المؤسسة أو الفريق، مع نظام مالي محلي (OutCap) للحد اليومي وتصنيف المصروفات، ودعم:
- إدارة الأقسام والمهام
- نظام المصروف اليومي والحد الآمن، التزامات، تقارير، واستيراد كشوف CSV
- قاعدة 330+ متجر سعودي للتصنيف التلقائي مع التذكر الذكي
- تخزين بيانات محلي ونسخ احتياطي (JSON / CSV / PDF)
- تشغيل بدون إنترنت (PWA)
- دعم الهاتف/الكمبيوتر عبر تصميم متجاوب عربي RTL
- نماذج بيانات مرنة قابلة للتوسيع

النسخة المالية المستقلة (بدون تسجيل دخول): افتح `finance.html`

## التشغيل

### محلياً
```bash
python3 -m http.server 8000
```
ثم افتح في المتصفح:
```text
http://localhost:8000
```

### على الآيفون
- ارفع المجلد على استضافة ثابتة تدعم HTTPS مثل GitHub Pages
- افتح الصفحة في Safari
- استخدم: "مشاركة ← إضافة إلى الشاشة الرئيسية"

## ملاحظات مهمة
- رمز الدخول الحالي هو قفل بسيط وليس تشفيراً حقيقياً للبيانات
- ملف النسخ الاحتياطي (`.json`) يحتوي المرفقات إلا أنه لا يضم الرمز أو مفتاح API
- التنبيهات تظهر عند فتح التطبيق فقط، لأن المتصفح لا يملك خادم خلفي

## هيكل المشروع
```text
.
├── README.md
├── package.json
├── index.html
├── app.css
├── app.js
├── engine.js
├── finance.js
├── finance.html
├── sections.js
├── sw.js
├── manifest.webmanifest
├── apple-touch-icon.png
├── icon-192.png
├── icon-512.png
├── tests/
│   ├── run.js
│   ├── engine.js
│   └── legacy.js
├── skills/
│   ├── README.md
│   ├── frontend-web/
│   │   └── SKILL.md
│   ├── backend-api/
│   │   └── SKILL.md
│   ├── database-design/
│   │   └── SKILL.md
│   ├── devops-deployment/
│   │   └── SKILL.md
│   ├── testing-qa/
│   │   └── SKILL.md
│   └── project-management/
│       └── SKILL.md
└── .github/
```

## شرح الملفات الأساسية
- `index.html`: هيكل الصفحة الأساسية فقط
- `app.css`: التنسيق العام ونظام الـ Design System
- `engine.js`: محرك النماذج، التحقق، التخزين، الأرشفة، السجل الزمني، الحوار
- `finance.js`: محرك OutCap، المتاجر، الاستيراد، التحليل، الالتزامات
- `finance.html`: واجهة مالية مستقلة Local-first بدون تسجيل دخول
- `sections.js`: تعريفات الأقسام (Schema)
- `app.js`: الواجهة العامة، المهام الدورية، التخزين، النسخ الاحتياطي
- `sw.js`: خدمة العمل بدون اتصال
- `manifest.webmanifest`: إعدادات التطبيق المحمول / PWA

## الاختبارات
```bash
npm install
npx playwright install chromium   # مرة واحدة
npm test
```
يشغّل `npm test` خادماً محلياً على المنفذ 8765 ثم ينفّذ `tests/engine.js` و`tests/legacy.js` تلقائياً.
يعمل الفحص نفسه على GitHub Actions عند كل push وطلب دمج (`.github/workflows/ci.yml`).

## المهارات داخل المستودع
المجلد `skills/` يحتوي على وثائق مهارات تنظيمية وتقنية يمكن توسيعها لاحقاً، مثل:
- Frontend Web
- Backend API
- Database Design
- DevOps & Deployment
- Testing & QA
- Project Management

## المساهمة
يمكنك تعديل المشروع وتحسينه بإنشاء فرع جديد ثم فتح Pull Request.

## الترخيص
هذا المشروع مخصص للاستخدام التعليمي والتطوير المحلي، مع إمكانية التوسع حسب الحاجة.
