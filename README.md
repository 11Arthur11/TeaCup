# TeaCloud — ابر چایی

Frontend production-oriented، کاملاً فارسی و RTL برای فروش، Provisioning و مدیریت سرویس‌های TeaSpeak و AudioBot. این پروژه بدون runtime framework و با TypeScript ماژولار ساخته شده تا bundle کوچک، سطح حمله محدود و کنترل کامل روی RTL و design system داشته باشد.

## قابلیت‌ها

- Landing حرفه‌ای SaaS، responsive و رابط dark-only یکپارچه
- OTP login/register مطابق lifecycle کوکی‌محور backend؛ پس از موفقیت login یا register، نشست توسط backend برقرار و سپس پروفایل `/v1/users` برای دریافت نقش enum حساب فراخوانی می‌شود؛ ورودی موبایل در قالب `09xxxxxxxxx` دریافت و هنگام initiate به `+989xxxxxxxxx` تبدیل می‌شود؛ هیچ JWT یا refresh token در storage نگهداری نمی‌شود
- route protection برای public، authenticated و role-based admin routes؛ هر پاسخ HTTP 403 از API ـ به‌جز logout ـ نشست frontend را خاتمه می‌دهد
- پنل مشتری: سرویس‌ها، TeaSpeak، AudioBot، Playlist، محصولات، کیف پول، فاکتور و پرداخت، تیکت و پیوست، اعلان‌ها و پروفایل
- پنل ادمین با RBAC: `ROLE_ADMIN` دارای دسترسی کامل؛ `ROLE_SUPPORT` فقط داشبورد پشتیبانی، تیکت‌ها و فاکتورها؛ `ROLE_USER` فقط پنل کاربری
- ۱۰۷ مدل و ۸۵ operation تولیدشده از OpenAPI همگام‌شده با پروفایل نقش‌محور و موجودی کیف پول
- toast پیام backend، confirmation dialog، skeleton، empty/error state، pagination و permission-based rendering
- runtime API configuration بدون rebuild

## اجرا

```bash
npm install
npm run generate:api
npm run check
npm run build
npm run dev
```

آدرس dev server: `http://localhost:4173`

## تنظیم API

فایل `public/config.js` در runtime بارگذاری می‌شود:

```js
globalThis.TEACLOUD_API_BASE_URL = 'https://api.example.com';
```

برای deployment امن‌تر، frontend و `/v1` را پشت یک reverse proxy هم‌دامنه قرار دهید و مقدار بالا را روی origin همان سایت تنظیم کنید. Backend باید cookie attributes و CORS/credentials را مطابق محیط production پیکربندی کند.

## معماری

- `src/api/generated-*`: مدل‌ها و operation catalog تولیدشده از OpenAPI
- `src/api/client.ts`: typed HTTP client، query serialization، multipart/blob و خطای backend
- `src/api/session-profile.ts`: دریافت پروفایل احراز‌شده و استخراج نقش برای RBAC
- `src/core/authorization.ts`: ماتریس دسترسی role-based و نام فارسی نقش‌ها
- `src/core`: router، store، session hint غیرحساس، dialog، toast، format و action orchestration
- `src/ui`: layout و component primitives
- `src/pages`: صفحات landing/auth/user/admin
- `scripts`: generator، build، dev server و coverage check

## نکات specification

ناسازگاری‌های مشاهده‌شده بدون حدس‌زدن backend در [`docs/OPENAPI_GAPS.md`](docs/OPENAPI_GAPS.md) ثبت شده‌اند.

## چرخه دریافت داده و Auto Refresh

- داده هر route محافظت‌شده یک بار هنگام ورود به همان صفحه دریافت می‌شود.
- routeهای داده‌محور هر ۵ ثانیه تازه می‌شوند.
- زمان‌بندی با `setTimeout` بازگشتی انجام می‌شود؛ بنابراین refresh جدید تا پایان درخواست قبلی شروع نمی‌شود.
- با خروج از route، timer قبلی فوراً پاک و سایدبار موبایل بسته می‌شود.
- هنگام مخفی بودن تب، باز بودن dialog یا ویرایش فرم، polling موقتاً متوقف می‌شود.
- API client حداکثر ۶ درخواست هم‌زمان را اجرا و درخواست‌های read یکسان و هم‌زمان را single-flight می‌کند.

## تغییرات معماری رابط و Refresh

- رابط کاربری کاملاً dark-only است و light mode حذف شده است.
- هر route داده‌محور در ورود به صفحه یک بار fetch می‌شود و سپس هر ۵ ثانیه refresh می‌شود.
- polling فقط به route فعال تعلق دارد و هنگام خروج از صفحه پاک می‌شود.
- هیچ click listener عمومی برای refresh وجود ندارد؛ کلیک روی ناحیه‌های غیرتعاملی fetch ایجاد نمی‌کند.
- دکمه refresh دستی در هدر وجود ندارد و refresh مرورگر مستقل باقی مانده است.
- درخواست‌های هم‌زمان یکسان deduplicate می‌شوند و refresh قبلی باید قبل از refresh بعدی تمام شود.
- پاسخ `NO_DATA` حالت خالی معتبر است و خطا محسوب نمی‌شود.

## مسیرهای جدید

- `/panel/finance`: کیف پول، تراکنش‌ها و فاکتورها
- `/panel/products/:slug`: محصولات یک دسته‌بندی
- `/admin/resources`: فهرست و فیلتر سرویس‌های همه کاربران
- `/admin/dns`: فهرست DNS providerها
- `/admin/dns/liara`: تنظیمات مستقل Liara DNS
- `/admin/live-status`: صفحه mock وضعیت لحظه‌ای و لاگ ترمینالی زیرساخت

قرارداد پیشنهادی داشبورد در `docs/DASHBOARD_API_CONTRACT.md` مستند شده است.

## تجربه کاربری هدر و مسیریابی

- پنل کاربر دارای مرکز اعلان عمومی با badge تعداد، فهرست dialog و dialog جزئیات است.
- موجودی کیف پول و دکمه شارژ در تمام صفحات پنل کاربر در دسترس است.
- تازه‌سازی خودکار صفحات داده‌محور هر ۵ ثانیه ادامه دارد و دکمه refresh دستی در هدر وجود ندارد.
- هنگام جابه‌جایی routeهای پنل کاربر و staff، overlay بلوری با حداقل زمان نمایش کوتاه فعال می‌شود تا تغییر صفحه flash نداشته باشد.
- صفحه مالی از کارت موجودی جمع‌وجور و شاخص‌های آخرین تراکنش، تعداد افزایش‌ها، کاهش‌ها و فاکتورها استفاده می‌کند.

## همگام‌سازی enumها و جزئیات سرویس

- ترجمه و tone تمام enumهای شناخته‌شده backend در `src/core/format.ts` متمرکز شده است.
- وضعیت Query Instance شامل `DISABLED`, `FULL`, `UNREACHABLE`, `RECONNECTING`, `LOGIN_FAILED`, `DISPATCHED`, `INITIATED` است.
- وضعیت resource شامل `DEPLOYING`, `ACTIVE`, `PENDING_PROLONG` است.
- وضعیت AudioBot node شامل `DISABLED`, `FULL`, `UNREACHABLE`, `LOGIN_FAILED`, `DISPATCHED` است.
- صفحه سرویس‌های کاربر به دو جدول مستقل TeaSpeak و AudioBot با متریک‌های خلاصه تبدیل شده است.
- جزئیات TeaSpeak از `teaSpeakStatus`, `maxClients`, `port` و `privilegeToken.token` پشتیبانی می‌کند؛ توکن تا اقدام صریح کاربر محو می‌ماند.
- نقص‌های enum و فیلدهای غایب specification در `docs/OPENAPI_ENUM_AUDIT.md` مستند شده‌اند.


## کیف پول و منابع

- موجودی واقعی از `GET /v1/wallet/balance` در داشبورد، هدر و صفحه مالی دریافت می‌شود.
- صفحه مالی از فیلتر نوع تراکنش، دلیل تراکنش و بازه زمانی پشتیبانی می‌کند.
- جزئیات هر سرویس، تراکنش‌های مرتبط را با `relatedResourceId` همان resource نمایش می‌دهد.
- صفحه مدیریت منابع ادمین از فیلتر وضعیت، نوع و انتخاب مالک در dialog دارای جست‌وجوی لحظه‌ای استفاده می‌کند.
- زیرمنوی دسته‌بندی محصولات در سایدبار قابل باز و بسته‌شدن است و بازکردن آن در موبایل سایدبار را نمی‌بندد.

## Backend availability

Network-level `fetch` failures are treated as backend unavailability. The landing page displays a maintenance banner, protected routes are blocked, and active dashboard users are redirected through a maintenance dialog. Until a dedicated public health endpoint is added, `/v1/categories` is used only as a temporary reachability probe.

See `docs/BACKEND_API_CAPABILITY_GAPS.md` for the complete backend capability and OpenAPI gap report.

## انتخاب‌گر مشترک کاربران

تمام جریان‌های مدیریتی که به شناسه کاربر نیاز دارند از `src/ui/user-picker.ts` استفاده می‌کنند: فیلتر مالک سرویس، فیلتر تیکت، ثبت تیکت مدیریتی، فیلتر فاکتور و صدور فاکتور بدهی. جست‌وجو، نقش و وضعیت حساب مستقیماً از API کاربران و نقش‌ها دریافت می‌شوند.

## همگام‌سازی Resource و Monitoring

- صفحه مدیریت منابع از دو تب مستقل TeaSpeak و AudioBot استفاده می‌کند.
- `ResourceListAdminResponse.nodeId` به صفحه جزئیات Query Instance یا AudioBot Node متصل می‌شود.
- دوره سرویس با enum `ProductPeriod` در فهرست منابع کاربر و مدیریت نمایش داده می‌شود.
- تاریخ انقضا همراه با زمان باقی‌مانده محاسبه‌شده در frontend نمایش داده می‌شود.
- جزئیات TeaSpeak از `address` و `port` برای ساخت و کپی رشته اتصال استفاده می‌کند.
- صفحه «مانیتورینگ» فعلاً فقط یک log viewer آزمایشی دارد و متریک دیگری دریافت یا نمایش نمی‌دهد.
