# Editable Rules Content

متن صفحه قوانین از فایل زیر خوانده می‌شود:

`public/content/rules.json`

این فایل در زمان build به `dist/content/rules.json` کپی می‌شود. در استقرارهایی که فایل‌های public مستقیماً قابل ویرایش‌اند، می‌توان متن قوانین را بدون تغییر TypeScript به‌روزرسانی کرد.

ساختار اصلی:

```json
{
  "versionLabel": "نسخه ۱.۰",
  "hero": {
    "kicker": "قوانین استفاده",
    "title": "عنوان صفحه",
    "description": "توضیح صفحه"
  },
  "summary": {
    "title": "عنوان خلاصه",
    "text": "متن خلاصه",
    "buttonLabel": "مشاهده محصولات",
    "buttonHref": "/products"
  },
  "items": [
    {
      "icon": "person_check",
      "title": "حساب کاربری",
      "text": "متن بند"
    }
  ]
}
```

اگر JSON خراب یا ساختار اصلی ناقص باشد، صفحه قوانین یک خطای قابل‌فهم و دکمه تلاش مجدد نمایش می‌دهد.
