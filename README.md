
## Run Locally

**Prerequisites:**  Node.js (يفضّل 20 أو أعلى)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app (معاينة الثيم مع محاكي الإعدادات):
   ```bash
   npm run dev
   ```
   ثم افتح http://localhost:3000 (أو المنفذ المعروض). للاختبار مع متجر حقيقي أضف `?storeId=معرف_المتجر` أو استخدم مسار المتجر.

## تجهيز الثيم للرفع (Storify)

1. بناء الثيم وملف الرفع:
   ```bash
   npm run zip
   ```
2. الناتج: **`storify-template-theme.zip`** في مجلد الثيم (محتويات `dist/` في جذر الـ zip).
3. من لوحة تحكم Storify: **الثيمات المرفوعة** → رفع ثيم → اختر `storify-template-theme.zip` → بعد الرفع اختر «استخدام هذا الثيم» للمتجر.

## Theme control & preview

- **Theme manifest**: الثيم يعرّف كل الأقسام والصفحات المنطقية عبر الملف `theme-manifest.json` (الأقسام في الحقل `sections[]`، والصفحات في الحقل `pages[]` مثل `home`, `shop`, `product`).
- **Page defaults**: المحتوى الافتراضي لكل صفحة يعرّف في ملفات JSON داخل `config/pages/`، حيث يكون اسم الملف قبل `.json` هو `page id`:
  - `config/pages/home.json` لمحتوى الصفحة الرئيسية.
  - `config/pages/shop.json` لمحتوى صفحة المتجر.
  - `config/pages/product.json` لمحتوى صفحة تفاصيل المنتج.
- عند بناء الثيم ورفعه كـ zip، يقوم النظام بدمج هذه الملفات في `pageDefaults` داخل الـ manifest، بحيث تظهر للمستخدم كقيم أولية في محرر الثيم على Storify.
- محاكيات الإعدادات مثل محاكي الثيم (`ThemeApp` + `StorifySimulator` و `SettingsSimulator`) تساعدك على معاينة شكل الأقسام محلياً، بينما التحكم الحقيقي في المتجر يكون من خلال لوحة تحكم Storify اعتماداً على نفس الـ manifest وملفات `config/pages`.
