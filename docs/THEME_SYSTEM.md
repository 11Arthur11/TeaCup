# TeaCloud Theme System

## Modes

- `dark`: حالت پیش‌فرض و نسخه اصلی پروژه
- `light`: پس‌زمینه روشن با هویت آبی و کنتراست استاندارد

انتخاب در `localStorage` با کلید `teacloud-theme` ذخیره و پیش از بارگذاری CSS روی `document.documentElement.dataset.theme` اعمال می‌شود تا flash تم اشتباه رخ ندهد.

## Controls

دکمه تغییر تم در این نقاط وجود دارد:

- Header صفحات عمومی
- Topbar پنل در دسکتاپ
- Footer سایدبار برای موبایل و دسکتاپ

## Covered UI

Design tokenهای روشن/تیره و overrideهای ضروری برای این بخش‌ها بررسی شده‌اند:

- Landing، صفحات محصولات و قوانین
- Auth
- Sidebar، Topbar، Wallet Header و navigation
- Card، stat، chart و dashboard metrics
- Table، filter، form، select، toggle و pagination
- Dialog، Toast، loading overlay و maintenance state
- Wallet، invoice و payment
- Ticket thread، message bubble و attachments
- Product cards، Product Presentation editor و live preview
- User/admin profile و presence state
- Resource، node و provisioning management

صفحات terminal/log عمداً مستقل و تیره باقی می‌مانند.

## Dialog submission errors

هنگام خطای API داخل submit یک Dialog، فقط همان Dialog درحال‌ارسال بسته می‌شود و Toast خطا باقی می‌ماند. خطای validation محلی Dialog را نمی‌بندد.
