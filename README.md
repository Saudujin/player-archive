# أرشيف اللاعبين | Player Archive

نظام إدارة متكامل لأرشيف اللاعبين مع تحسين الصور وتحويل الشعارات باستخدام الذكاء الاصطناعي.

## المميزات

### للزوار (بدون تسجيل دخول)
- ✅ تصفح جميع اللاعبين والصور
- ✅ بحث ذكي بالعربية والإنجليزية (يستخرج الأسماء من النص الطبيعي)
- ✅ تحسين الصور بالذكاء الاصطناعي (Replicate API)
- ✅ تحويل الشعارات إلى SVG (Vectorizer.AI)
- ✅ عرض الألبومات والمعارض

### للمشرفين (بعد تسجيل الدخول)
- ✅ إضافة لاعبين جدد
- ✅ تعديل بيانات اللاعبين
- ✅ حذف اللاعبين (مع جميع صورهم)
- ✅ رفع صور متعددة مباشرة إلى AWS S3
- ✅ حذف الصور من الألبومات
- ✅ إدارة كاملة للمحتوى

## التقنيات المستخدمة

### Frontend
- React 19 + TypeScript
- TailwindCSS 4
- shadcn/ui Components
- Wouter (Routing)
- tRPC React Query

### Backend
- Node.js + Express
- tRPC 11
- MySQL/TiDB Database
- Drizzle ORM

### التخزين والذكاء الاصطناعي
- AWS S3 (تخزين الصور)
- Replicate API (تحسين الصور)
- Vectorizer.AI (تحويل الشعارات)
- bcrypt (تشفير كلمات المرور)

## المتطلبات

- Node.js 18+
- MySQL Database
- AWS S3 Bucket
- Replicate API Key
- Vectorizer.AI API Key

## التثبيت المحلي

```bash
# تثبيت المكتبات
pnpm install

# إعداد قاعدة البيانات
pnpm db:push

# تشغيل المشروع
pnpm dev
```

## المتغيرات البيئية (Environment Variables)

يجب إضافة المتغيرات التالية في ملف `.env` أو في إعدادات Railway:

```env
# Database
DATABASE_URL=mysql://user:password@host:port/database

# AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-north-1
AWS_S3_BUCKET=your-bucket-name

# AI APIs
REPLICATE_API_TOKEN=your_replicate_token
VECTORIZER_API_ID=your_vectorizer_id
VECTORIZER_API_SECRET=your_vectorizer_secret

# JWT (generate a random string)
JWT_SECRET=your_random_secret_string

# OAuth (optional - not used in current version)
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=your_oauth_url
VITE_OAUTH_PORTAL_URL=your_portal_url
OWNER_OPEN_ID=owner_id
OWNER_NAME=owner_name

# Built-in APIs (optional)
BUILT_IN_FORGE_API_URL=api_url
BUILT_IN_FORGE_API_KEY=api_key
VITE_FRONTEND_FORGE_API_KEY=frontend_key
VITE_FRONTEND_FORGE_API_URL=frontend_url

# App Info
VITE_APP_TITLE=أرشيف اللاعبين
VITE_APP_LOGO=/logo.png

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=analytics_endpoint
VITE_ANALYTICS_WEBSITE_ID=website_id
```

## إنشاء حسابات المشرفين

بعد نشر المشروع، قم بتشغيل السكريبت التالي لإنشاء حسابات المشرفين:

```bash
# إنشاء ملف seed-admins.mjs
node seed-admins.mjs
```

محتوى الملف:
```javascript
import { drizzle } from "drizzle-orm/mysql2";
import bcrypt from "bcryptjs";
import { admins } from "./drizzle/schema.js";

const db = drizzle(process.env.DATABASE_URL);

async function seedAdmins() {
  const admin1Password = await bcrypt.hash("your_password_1", 10);
  const admin2Password = await bcrypt.hash("your_password_2", 10);

  await db.insert(admins).values([
    { username: "admin1", password: admin1Password },
    { username: "admin2", password: admin2Password },
  ]);

  console.log("✅ Admins created successfully");
}

seedAdmins();
```

## النشر على Railway

### الخطوة 1: إنشاء حساب Railway
1. اذهب إلى [railway.app](https://railway.app)
2. سجل دخول باستخدام GitHub

### الخطوة 2: إنشاء مشروع جديد
1. اضغط "New Project"
2. اختر "Deploy from GitHub repo"
3. اختر repository المشروع

### الخطوة 3: إضافة قاعدة بيانات MySQL
1. في نفس المشروع، اضغط "+ New"
2. اختر "Database" → "Add MySQL"
3. Railway سيوفر لك `DATABASE_URL` تلقائياً

### الخطوة 4: إضافة المتغيرات البيئية
1. اضغط على service المشروع
2. اذهب إلى "Variables"
3. أضف جميع المتغيرات المطلوبة (انظر القائمة أعلاه)

### الخطوة 5: إعداد Build & Deploy
Railway سيكتشف المشروع تلقائياً، لكن تأكد من:

**Build Command:**
```bash
pnpm install && pnpm build
```

**Start Command:**
```bash
node dist/index.js
```

### الخطوة 6: Deploy
1. اضغط "Deploy"
2. انتظر حتى ينتهي البناء
3. ستحصل على رابط مثل: `your-app.up.railway.app`

### الخطوة 7: تشغيل Database Migration
بعد أول deploy، قم بتشغيل:
```bash
railway run pnpm db:push
```

## إعداد AWS S3

1. أنشئ bucket في AWS S3
2. فعّل Public Access للصور
3. أضف CORS Policy:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

## الأمان

- ✅ كلمات المرور مشفرة باستخدام bcrypt
- ✅ حسابين فقط للمشرفين
- ✅ جميع عمليات الإدارة محمية
- ✅ الزوار لا يمكنهم الوصول لعمليات الحذف/التعديل

## الدعم

للمساعدة أو الإبلاغ عن مشاكل، تواصل مع المطور.

## الترخيص

جميع الحقوق محفوظة © 2025
