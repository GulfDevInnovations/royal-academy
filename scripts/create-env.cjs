const fs = require('fs');

const envContent = `
DATABASE_URL=${process.env.DATABASE_URL}
DIRECT_URL=${process.env.DIRECT_URL}
NEXT_PUBLIC_SITE_URL=${process.env.NEXT_PUBLIC_SITE_URL}
NEXT_PUBLIC_APP_URL=${process.env.NEXT_PUBLIC_APP_URL}
NEXTAUTH_URL=${process.env.NEXTAUTH_URL}
NEXTAUTH_SECRET=${process.env.NEXTAUTH_SECRET}
CRON_SECRET=${process.env.CRON_SECRET}
SMS_PROVIDER=${process.env.SMS_PROVIDER}
STORAGE_DRIVER=${process.env.STORAGE_DRIVER}
LOCAL_STORAGE_ROOT=${process.env.LOCAL_STORAGE_ROOT}
LOCAL_MEDIA_BASE_URL=${process.env.LOCAL_MEDIA_BASE_URL}
RESEND_API_KEY=${process.env.RESEND_API_KEY}
RESEND_FROM_EMAIL=${process.env.RESEND_FROM_EMAIL}
`.trim();

fs.writeFileSync('.env', envContent);
console.log('[create-env] .env file created successfully');
