# TeaCloud Frontend

TeaCloud is the frontend application for the **TeaCloud / ابر چایی** platform; a service-management web application designed to let users purchase, manage, renew, and monitor hosted services such as **TeaSpeak servers** and **AudioBot instances**, while providing a dedicated administration panel for managing users, infrastructure, billing, DNS, nodes, support, and system configuration.

**Current frontend version: `0.2.2`**

---

# فارسی

## معرفی پروژه

TeaCloud یک پنل تحت وب برای مدیریت سرویس‌های ابری ابر چایی است.

هدف اصلی فرانت‌اند این است که تمام عملیات مربوط به سرویس‌ها، کاربران، پرداخت‌ها و زیرساخت را در یک رابط یکپارچه ارائه کند.

کاربر عادی می‌تواند سرویس خود را خریداری و مدیریت کند، وضعیت آن را ببیند، سرویس را تمدید کند، DNS اختصاصی بسازد، فاکتورها و تراکنش‌هایش را مدیریت کند و از سیستم پشتیبانی استفاده کند.

در سمت دیگر، ادمین به ابزارهای مدیریتی برای کاربران، سرویس‌ها، محصولات، زیرساخت TeaSpeak و AudioBot، DNS، فاکتورها، تیکت‌ها، تنظیمات سیستم و مانیتورینگ دسترسی دارد.

---

## تکنولوژی‌ها

TeaCloud Frontend برخلاف بسیاری از Dashboardهای مدرن بر پایه React یا Vue ساخته نشده است.

معماری اصلی پروژه بر پایه موارد زیر است:

- **TypeScript**
- **JavaScript ES Modules**
- **HTML**
- **CSS**
- **SCSS / Design System**
- **Vite-based build environment**
- **Native DOM Rendering**
- **Custom SPA Router**
- **Generated OpenAPI Client**
- **WebSocket / STOMP**
- **Anime.js** برای برخی تعاملات Landing Page

رابط کاربری به‌صورت مستقیم با DOM ساخته و مدیریت می‌شود و Virtual DOM یا JSX در پروژه وجود ندارد.

این معماری باعث شده Runtime فرانت‌اند سبک باشد و کنترل مستقیم زیادی روی UI، Animation و Lifecycle صفحات وجود داشته باشد.

---

## معماری کلی

TeaCloud یک **Single Page Application** است.

Routing، Page Rendering، Dialogها، Polling، API Layer و Stateهای موردنیاز پروژه توسط ساختار داخلی خود پروژه مدیریت می‌شوند.

ساختار کلی به چند بخش اصلی تقسیم می‌شود:

- API Layer
- Generated OpenAPI Models
- Core utilities
- Page renderers
- Shared UI components
- Runtime configuration
- Styling system
- Public content
- Admin panel
- User panel

APIهای Backend از OpenAPI تولید می‌شوند تا Modelها و Operationها تا حد امکان با قرارداد Backend هماهنگ باقی بمانند.

برای برخی Endpointهایی که قرارداد Backend آنها رفتار خاصی دارد، Frontend دارای Adapter یا Override اختصاصی است.

---

## Authentication Flow

احراز هویت TeaCloud بر پایه شماره موبایل، OTP و Cookie انجام می‌شود.

Frontend هیچ JWT را داخل `localStorage` یا Storageهای سمت Client نگهداری نمی‌کند.

### مرحله اول

کاربر شماره موبایل خود را وارد می‌کند.

Frontend درخواست Initiate Authentication را ارسال می‌کند.

Backend مشخص می‌کند که شماره مربوط به:

- کاربر موجود است و باید Login انجام شود
- یا کاربر جدید است و باید Register انجام شود

### Login

برای کاربر موجود:

1. شماره موبایل ارسال می‌شود.
2. OTP ارسال می‌شود.
3. کاربر OTP را وارد می‌کند.
4. گزینه Remember Me در صورت نیاز ارسال می‌شود.
5. Backend Cookieهای Session/Auth را تنظیم می‌کند.
6. Frontend وارد پنل می‌شود.

### Registration

برای کاربر جدید:

1. Authentication Initiate انجام می‌شود.
2. OTP برای کاربر ارسال می‌شود.
3. اطلاعات اولیه کاربر دریافت می‌شود.
4. Registration انجام می‌شود.
5. Backend Cookie احراز هویت را ایجاد می‌کند.
6. کاربر مستقیماً وارد پنل می‌شود.

---

## بررسی Session

وضعیت Session از طریق:

```text
HEAD /v1/auth/session
```

بررسی می‌شود.

رفتار Frontend:

- `204` → Session معتبر
- `401` → Guest
- `403` روی همین Endpoint → Guest
- `429` → Rate Limit

رفتار ویژه `403` برای جلوگیری از Loop در محیط Production اضافه شده است.

Frontend در صورت دریافت `403` از `/auth/session` دیگر صفحه Auth را دائماً Reload یا Redirect نمی‌کند.

---

## Rate Limit Protection

کد وضعیت:

```text
429 Too Many Requests
```

به‌صورت یک Rate Limit سراسری در نظر گرفته می‌شود.

پس از اولین `429`:

- درخواست‌های خودکار متوقف می‌شوند
- Polling متوقف می‌شود
- درخواست‌های Queue شده اجرا نمی‌شوند
- Refreshهای خودکار Dashboard متوقف می‌شوند
- Live monitoring متوقف می‌شود

این وضعیت فقط با **Refresh دستی مرورگر توسط کاربر** Reset می‌شود.

هدف این مکانیزم جلوگیری از تشدید Rate Limit توسط خود Frontend است.

---

## نقش‌های کاربری

TeaCloud از سه Role اصلی استفاده می‌کند:

```text
ROLE_USER
ROLE_SUPPORT
ROLE_ADMIN
```

دسترسی صفحات و عملیات بر اساس Role کاربر کنترل می‌شود.

اطلاعات Profile پس از Login از Backend دریافت شده و برای کاهش درخواست‌های غیرضروری Cache می‌شود.

---

# پنل کاربر

پنل کاربر برای مدیریت کامل سرویس‌ها و حساب مالی طراحی شده است.

مهم‌ترین قسمت‌ها:

- داشبورد
- سرویس‌های من
- DNSهای من
- محصولات
- کیف پول و مالی
- تراکنش‌ها
- فاکتورها
- تیکت‌ها
- اعلان‌ها
- پروفایل

---

## سرویس‌های TeaSpeak

کاربر می‌تواند اطلاعات سرویس TeaSpeak خود را مشاهده و مدیریت کند.

اطلاعات اصلی شامل مواردی مانند:

- وضعیت سرویس
- IP / Address
- Port
- ظرفیت
- تاریخ انقضا
- Auto Prolong
- Privilege Token
- DNS اختصاصی

است.

عملیات اصلی نیز شامل:

- Start
- Stop
- تمدید
- تغییر نام
- فعال یا غیرفعال کردن تمدید خودکار
- دریافت Privilege Token
- مدیریت DNS

می‌شود.

---

## DNS Management

TeaCloud دارای سیستم DNS داخلی برای اتصال Subdomain به سرویس TeaSpeak است.

کاربر می‌تواند:

- DNSهای خود را ببیند
- Zone مناسب را انتخاب کند
- TeaSpeak Resource را انتخاب کند
- Subdomain جدید ایجاد کند
- Availability آن را بررسی کند
- DNS را از سرویس Unassign کند

قبل از ثبت Subdomain، Frontend با یک درخواست HEAD موجود بودن آن را بررسی می‌کند.

اعتبارسنجی Subdomain نیز در لحظه انجام می‌شود.

---

## AudioBot

AudioBot دارای Detail Page اختصاصی است.

اطلاعات اصلی شامل:

- Bot Nickname
- Server Address
- Bot Status
- وضعیت Resource
- تاریخ انقضا
- Auto Prolong

است.

وضعیت‌های Bot عبارت‌اند از:

```text
OFFLINE
CONNECTING
CONNECTED
```

منطق کنترل:

```text
OFFLINE    → Start
CONNECTING → Stop
CONNECTED  → Stop
```

بنابراین حتی در زمان Connecting، کاربر می‌تواند فرمان Stop ارسال کند.

---

## پنل اختصاصی AudioBot

مدیریت Playlist و Track مستقیماً داخل TeaCloud انجام نمی‌شود.

هر AudioBot دارای یک **Scoped Management Panel** است.

Frontend از Endpoint اختصاصی Access، اطلاعات زیر را دریافت می‌کند:

- Panel URL
- Credentials
- Token expiration

تا قبل از دریافت Access، اطلاعات کارت به‌صورت Blur نمایش داده می‌شوند.

بعد از دریافت:

- URL قابل کلیک است
- URL قابل Copy است
- Credentials قابل Copy است
- زمان اعتبار نمایش داده می‌شود

اطلاعات Access در طول Refreshهای دوره‌ای Resource حفظ می‌شوند و تا زمان Expire شدن Token دوباره Blur نمی‌شوند.

---

# سیستم مالی

TeaCloud دارای ساختار مالی مبتنی بر Wallet و Invoice است.

کاربر می‌تواند:

- کیف پول را شارژ کند
- تراکنش‌ها را مشاهده کند
- فاکتورها را ببیند
- فاکتور Pending را پرداخت کند
- تاریخچه پرداخت را بررسی کند

---

## مالیات

هر Invoice می‌تواند دارای `taxPercentage` باشد.

مقدار Backend عدد صحیح درصد است.

برای مثال:

```text
9 = 9%
```

Frontend مبلغ مالیات را محاسبه می‌کند:

```text
Tax = Base Amount × Tax Percentage / 100
```

و مبلغ نهایی:

```text
Payable Amount = Base Amount + Tax
```

در صفحات Invoice مبلغ پایه، مالیات و مبلغ نهایی قابل پرداخت نمایش داده می‌شوند.

---

# پنل ادمین

Admin Panel برای مدیریت عملیاتی کل TeaCloud طراحی شده است.

بخش‌های اصلی شامل:

- Dashboard
- Users
- Resources
- Products
- TeaSpeak Query Instances
- AudioBot Nodes
- Invoices
- Tickets
- DNS
- Notifications
- System

است.

---

## مدیریت Resource

ادمین می‌تواند تمامی Resourceها را مشاهده کند و بر اساس:

- نوع
- وضعیت
- Owner

فیلتر انجام دهد.

Detail هر Resource شامل اطلاعات فنی و مدیریتی مربوط به همان نوع سرویس است.

---

## TeaSpeak Infrastructure

TeaSpeak Resourceها بین Query Instanceها توزیع می‌شوند.

ادمین می‌تواند:

- Query Instanceها را مشاهده کند
- Instance جدید ایجاد کند
- Instance را Enable / Disable کند
- تنظیمات آن را ویرایش کند
- Provisioning Strategy را تغییر دهد

Strategyهای پشتیبانی‌شده شامل:

```text
BALANCED
BIN_PACKING
RANDOMIZED
ROUND_ROBIN
```

هستند.

---

## AudioBot Nodes

AudioBotها روی Nodeهای اختصاصی اجرا می‌شوند.

ادمین می‌تواند:

- Nodeها را ببیند
- Node جدید ایجاد کند
- ظرفیت Node را مدیریت کند
- Credentialهای Node را ویرایش کند
- Node را فعال یا غیرفعال کند
- Provisioning Strategy را تنظیم کند

Edit نود به‌صورت Patch-like انجام می‌شود.

یعنی فقط فیلدهایی که واقعاً تغییر کرده‌اند به Backend ارسال می‌شوند.

---

# DNS Administration

ادمین می‌تواند DNS Providerها و Zoneها را مدیریت کند.

امکانات اصلی:

- مشاهده Provider
- مشاهده Zoneها
- Enable / Disable کردن Zone
- مشاهده Recordهای Zone
- مشاهده Recordهای TeaCloud
- ReAssign
- Unassign
- لینک Owner
- لینک Target Resource

رکوردهای Provider و TeaCloud به‌صورت جداگانه و Foldable نمایش داده می‌شوند.

TeaCloud Record بر اساس قرارداد داخلی Resource و Owner تشخیص داده می‌شود.

---

# فاکتورها و پرداخت‌ها

ادمین به لیست کامل Invoiceها دسترسی دارد.

اطلاعات شامل:

- Owner
- Amount
- Tax
- Final Amount
- Status
- Payment information
- Gateway transaction

است.

امکان ایجاد Debt Invoice برای کاربران نیز وجود دارد.

---

# پشتیبانی و Ticketing

TeaCloud دارای Ticket System داخلی است.

کاربر می‌تواند:

- Ticket ایجاد کند
- Ticket را به Resource مرتبط کند
- پیام ارسال کند
- فایل ضمیمه کند
- Ticket را ببندد

ادمین و Support نیز به Ticketهای کاربران دسترسی دارند و می‌توانند وضعیت و Department آنها را مدیریت کنند.

نمای پیام‌ها به شکل Conversation طراحی شده است.

---

# System Page

بخش System در پنل ادمین شامل تنظیمات عمومی Backend و Live Logs است.

Application Settings شامل مواردی مانند:

- Minimum wallet charge
- Invoice tax percentage
- Resource suspend/delete timing

است.

Application Settings داخل یک Foldable Card قرار دارند و به‌صورت پیش‌فرض بسته هستند.

زمان‌ها از طریق یک Duration Editor قابل تنظیم‌اند.

ادمین می‌تواند واحد را انتخاب کند:

- Seconds
- Minutes
- Hours
- Days

و Frontend مقدار نهایی را به واحد موردنیاز Backend تبدیل می‌کند.

---

## Live Logs

صفحه System دارای Live Backend Logs است.

اتصال با:

- WebSocket
- STOMP

انجام می‌شود.

Subscription اصلی:

```text
/topic/logs
```

ساختار Log:

```text
logger
level
message
thread
timestamp
```

Frontend:

- Auto reconnect دارد
- Connection status را نمایش می‌دهد
- Auto-scroll هوشمند دارد
- تعداد Logهای داخل حافظه را محدود می‌کند
- با خروج از صفحه Connection را می‌بندد

---

# Runtime Configuration

بخش‌هایی از تنظیمات Frontend بدون Build مجدد قابل تغییر هستند.

فایل:

```text
config.js
```

برای تنظیم Runtime استفاده می‌شود.

مواردی مانند:

```text
API Base URL
Public Files Base URL
Dashboard Tour URL
Rules URL
```

می‌توانند بعد از Build نیز تغییر کنند.

برای مثال:

```js
globalThis.TEACLOUD_CONFIG = {
  apiBaseUrl: "https://api.example.com",

  publicFilesBaseUrl: "https://example.com/public/",

  publicFiles: {
    dashboardTour: "dashboard-tour.json",
    rules: "rules.json",
  },
};
```

بنابراین برای تغییر API یا فایل‌های Public در Production نیازی به Build مجدد پروژه نیست.

---

# Dashboard Tour

پنل کاربر دارای Tour داخلی است.

Tour توسط JSON کنترل می‌شود و می‌تواند بدون تغییر Source Code و از طریق Public Content تنظیم شود.

Tour پس از Registration موفق اجرا می‌شود و در حین اجرا Pollingهای مزاحم متوقف می‌شوند.

---

# Theme

TeaCloud از دو Theme پشتیبانی می‌کند:

- Dark
- Light

Theme پیش‌فرض Dark است.

انتخاب کاربر در مرورگر ذخیره می‌شود.

برخی قسمت‌ها مانند Live Monitoring عمداً ظاهر Terminal/Dark خود را حفظ می‌کنند.

---

# Polling & Lifecycle

صفحات Operational در TeaCloud برای دریافت وضعیت جدید Backend از Polling کنترل‌شده استفاده می‌کنند.

Polling با `setTimeout` مدیریت می‌شود و در شرایطی مانند موارد زیر Pause می‌شود:

- Tab مخفی باشد
- Dialog باز باشد
- Input در Focus باشد
- Tour فعال باشد
- User در حال نوشتن پیام Ticket باشد
- Rate Limit فعال شده باشد

این رویکرد از درخواست‌های اضافی و Refreshهای مزاحم جلوگیری می‌کند.

---

# API Integration

API Layer پروژه بر پایه OpenAPI است.

مدل‌ها و Operationهای Typed به‌صورت Generated نگهداری می‌شوند.

دستورهای اصلی توسعه:

```bash
npm run generate:api
npm run check
npm run build
```

`generate:api` برای همگام‌سازی مدل‌های TypeScript با OpenAPI استفاده می‌شود.

`check` شامل TypeScript strict checking و بررسی پوشش APIهای مورد استفاده Frontend است.

---

# Production Build

خروجی Production در پوشه:

```text
dist/
```

تولید می‌شود.

Runtime configuration به شکلی طراحی شده که فایل `config.js` بعد از Deploy نیز قابل تغییر باشد.

به همین دلیل Environment-specific configuration لازم نیست حتماً در زمان Build مشخص شود.

---
