# Railway Environment Variables Setup

## Required Environment Variables for Railway Deployment

Add these variables in Railway Dashboard → Your Service → Variables:

### 1. OAuth & Session Configuration

```bash
# OAuth Server URL (your Railway app URL)
OAUTH_SERVER_URL=https://steadfast-motivation-production.up.railway.app
BASE_URL=https://steadfast-motivation-production.up.railway.app

# Session Secret (generate a strong random string)
SESSION_SECRET=CHANGE_THIS_TO_LONG_RANDOM_STRING_AT_LEAST_32_CHARACTERS

# JWT Secret (if using JWT)
JWT_SECRET=CHANGE_THIS_TO_ANOTHER_LONG_RANDOM_STRING
```

### 2. Cookie Configuration

```bash
COOKIE_NAME=pa_session
COOKIE_DOMAIN=steadfast-motivation-production.up.railway.app
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
COOKIE_PATH=/
```

### 3. Database (Already Configured)

```bash
# These should already be set by Railway MySQL plugin
DATABASE_URL=mysql://root:...@mysql.railway.internal:3306/railway
MYSQL_PUBLIC_URL=...
```

### 4. AWS S3 (Already Configured)

```bash
# These should already be set
AWS_REGION=eu-north-1
AWS_S3_BUCKET=player-archive-photos-2025
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

## How to Add Variables in Railway

1. Go to Railway Dashboard
2. Select your project: **steadfast-motivation**
3. Click on your service (web application, not database)
4. Go to **Variables** tab
5. Click **+ New Variable** or use **Raw Editor**
6. Paste the variables above
7. Click **Deploy** or **Add**

## Security Notes

⚠️ **IMPORTANT**: Change all placeholder values:
- `SESSION_SECRET` - Use a strong random string (at least 32 characters)
- `JWT_SECRET` - Use a different strong random string
- Update `COOKIE_DOMAIN` to match your actual Railway domain

## Generating Secure Secrets

You can generate secure random strings using:

```bash
# In terminal
openssl rand -base64 32
```

Or use online tools like: https://randomkeygen.com/

## After Adding Variables

1. Railway will automatically redeploy your application
2. Wait 2-3 minutes for deployment to complete
3. Test image upload functionality
4. Check logs for any remaining errors
