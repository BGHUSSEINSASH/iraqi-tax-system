# TAX IQ

© 2026 BGHUSSEINSASH. جميع الحقوق محفوظة.

هذا المشروع هو برنامج تجاري خاص ومملوك بالكامل لـ BGHUSSEINSASH. يمنع النسخ أو التعديل أو إعادة النشر أو التوزيع أو الاستغلال التجاري أو أي استخدام غير مصرح به من قبل مالك المشروع.

Official repository: https://github.com/BGHUSSEINSASH/iraqi-tax-system.git

## نبذة عامة
TAX IQ هو نظام ضريبي عربي متكامل مصمم لإدارة الضرائب والملفات والعمليات المالية داخل بيئة تجارية آمنة. يتم فصل منطق العمل عن الواجهة للمحافظة على أمان النظام وموثوقيته.

## البنية التقنية
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express
- Authentication: JWT
- Database: SQLite
- Business Logic: يعمل بالكامل على الخادم
- Security: Helmet, CORS, Rate Limiting, Environment-based configuration

## مبدأ الحماية
- الواجهة لا تحتوي على المنطق التجاري الحاسم
- حسابات الضرائب والعمليات الحساسة تُنفذ على الـ Backend
- JWT و RBAC و شروط التحقق من الوصول تُدار على الخادم
- لا يتم تخزين المفاتيح السرّية داخل الكود المصدري
- المستودع يوصى به على شكل Private في GitHub

## متطلبات التشغيل

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## بناء الإنتاج
```bash
cd frontend
npm run build
```

## إعدادات البيئة
يُفضّل تهيئة المتغيرات التالية في ملفات الـ environment:

- `NODE_ENV=production`
- `JWT_SECRET=your_secure_secret`
- `ALLOWED_ORIGINS=https://yourdomain.com`
- `PORT=4000`

> لا يتم رفع ملفات `.env` إلى GitHub. استخدم GitHub Secrets أو إدارة سرّية خاصة.

## الأمان
- لا ينشر المشروع في مستودع عام ما لم يكن هدفاً معلناً ومصرحاً به
- استخدام HTTPS فقط في البيئة الإنتاجية
- تقييد Cross-Origin فقط إلى النطاقات المصرح بها
- حماية نقاط تسجيل الدخول والـ APIs باستخدام rate limits
- الاحتفاظ بملفات قاعدة البيانات في مسار آمن وغير عام

## حقوق الملكية
© 2026 BGHUSSEINSASH. جميع الحقوق محفوظة.

يُمنع نسخ أو تعديل أو إعادة توزيع أو إعادة نشر أو بيع أو استغلال هذا المشروع دون إذن كتابي مسبق من مالك المشروع.

## التواصل والمرجعية
- Repo: https://github.com/BGHUSSEINSASH/iraqi-tax-system.git
- للدعم أو الاستخدام التجاري المصرح، يرجى التواصل عبر صاحب المشروع أو القنوات الرسمية المعلنة.

## ملاحظات تجارية
هذا المشروع موجه للاستخدام التجاري الداخلي أو المصرح به فقط، ويُعامل كبرنامج ملكية خاصة. أي استخدام غير مصرح به قد يترتب عليه إجراءات قانونية وتجارية.
