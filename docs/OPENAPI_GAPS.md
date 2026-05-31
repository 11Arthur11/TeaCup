# نکات و شکاف‌های OpenAPI

این فایل قراردادهای تکمیلی تأییدشده برای frontend را ثبت می‌کند.

1. **endpoint هویت حذف شده است.** مجوز frontend اکنون از `GET /v1/users` و فیلد enum نقش (`ROLE_USER`, `ROLE_SUPPORT`, `ROLE_ADMIN`) استخراج می‌شود. این درخواست فقط پس از login/register موفق یا برای بازیابی نشست قبلی انجام می‌شود.
2. **`POST /v1/admin/tickets/submit` پارامتر الزامی `targetUserId` دارد.** در نسخه محلی OpenAPI به‌صورت query parameter از نوع `int64` ثبت شده و payload تیکت همچنان multipart است.
3. **بدنه `POST /v1/admin/products/add` به `AbstractNewResourceRequest` ارجاع داده شده است،** اما مثال endpoint فیلدهای محصول مانند `productName`، `categoryId`، `price` و `productPeriod` را نشان می‌دهد. فرم ادمین از مثال endpoint استفاده می‌کند و cast در یک نقطه محدود نگه داشته شده است.
4. **پاسخ endpointهای محصولات و `GET /v1/invoices/{invoiceToken}` schema دقیق ندارند** و صرفاً example یا `object` هستند. DTOهای محلی فقط برای نمایش فیلدهای پشتیبانی‌شده توسط همان مثال‌ها استفاده شده‌اند.
5. operationId مسیر `/v1/services/{resourceId}/edit` در specification برابر `prolongResource_1` است. client تولیدشده همین نام را حفظ کرده تا drift ایجاد نشود.

## Enum audit

فهرست enumهای تعریف‌نشده و فیلدهای غایب در [`OPENAPI_ENUM_AUDIT.md`](OPENAPI_ENUM_AUDIT.md) ثبت شده است.
