# Product Presentation UI Contract

`ProductPresentation` محتوای نمایشی محصول را نگهداری می‌کند. Backend این مقادیر را بدون تفسیر ذخیره و بازگردانی می‌کند؛ Frontend مسئول ساخت، اعتبارسنجی و نمایش آن‌هاست.

## DTO

```json
{
  "description": "سرور TeaSpeak برای تیم‌های بازی و کامیونیتی‌ها",
  "features": "[{\"text\":\"صدای با کیفیت\",\"enabled\":true},{\"text\":\"بکاپ خودکار\",\"enabled\":false}]",
  "badges": "[{\"text\":\"پرفروش\",\"variant\":\"success\"}]"
}
```

`features` و `badges` عمداً JSON Array داخل String هستند. Parser فرانت در برابر رشته خالی، JSON خراب، فیلد ناشناخته و variant نامعتبر مقاوم است.

## Feature

```ts
interface ProductFeaturePresentation {
  text: string;
  enabled: boolean;
}
```

- `enabled: true`: نمایش با تیک
- `enabled: false`: نمایش با ضربدر و حالت غیرفعال
- حداکثر پیشنهادی UI: ۱۲ قابلیت

## Badge

```ts
interface ProductBadgePresentation {
  text: string;
  variant: ProductBadgeVariant;
}
```

حداکثر پیشنهادی UI: ۶ نشان. Variantهای پشتیبانی‌شده:

`primary`, `success`, `warning`, `danger`, `info`, `neutral`, `ocean`, `violet`, `sunset`, `forest`, `rose`, `amber`, `cyan`, `indigo`, `lime`, `graphite`, `aurora`, `royal`, `fire`, `mint`.

Variant ناشناخته هنگام parse به `primary` تبدیل می‌شود.

## Admin Editor

فرم افزودن و ویرایش محصول شامل موارد زیر است:

- توضیح فروش‌محور محصول
- افزودن، حذف و فعال/غیرفعال‌کردن Feature
- افزودن و حذف Badge
- انتخاب بصری از ۲۰ Badge Style
- پیش‌نمایش زنده پیش از ثبت

هنگام submit، state ویرایشگر با `JSON.stringify` به دو رشته `features` و `badges` تبدیل می‌شود.

## Rendering

Renderer مشترک در این بخش‌ها استفاده می‌شود:

- کارت محصولات پنل کاربر
- پیش‌نمایش فرم ادمین
- خلاصه نشان‌های محصول در جدول ادمین

فایل اصلی قرارداد و renderer:

`src/ui/product-presentation.ts`

## Admin list/detail rule

`GET /v1/admin/products` is treated as a lightweight list response and the frontend does not read `presentation` from its rows.
When the administrator clicks Edit, the frontend first calls `GET /v1/admin/products/{productId}` and initializes the presentation editor from that detail response. This prevents stale or missing presentation data from the list endpoint from overwriting the saved configuration.

## Shared card renderer

The customer product card and the admin live preview use the same `renderProductCard` function. The preview includes product name, price, period, presentation badges/features and a disabled order button. Empty feature arrays remain empty; the frontend does not invent fallback features.
