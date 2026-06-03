# OpenAPI enum audit — TeaCloud 0.2.1

این گزارش بر اساس `openapi/teacloud.openapi.json` همگام‌شده با سند 0.2.1 است.

## موارد برطرف‌شده

- `QueryInstanceListResponse.status` دارای enum کامل است.
- `InvoiceUserResponse.status` و `InvoiceAdminResponse.status` به enum تبدیل شده‌اند.
- `TicketMessageResponse.senderRole` به `ROLE_USER`, `ROLE_SUPPORT`, `ROLE_ADMIN` محدود شده است.
- وضعیت‌های DNS zone و Liara provider دارای enum هستند.
- استراتژی Provisioning برای Query و AudioBot با enumهای `BALANCED`, `BIN_PACKING`, `RANDOMIZED`, `ROUND_ROBIN` تعریف شده است.
- `online` به DTO پروفایل، فهرست کاربران و جزئیات کاربر ادمین اضافه شده است.
- endpoint مستقل identity در نسخه محلی استفاده نمی‌شود و نقش از `/v1/users` دریافت می‌شود.

## موارد قطعی باقی‌مانده

| Schema | Field | وضعیت فعلی | پیشنهاد |
|---|---|---|---|
| `WalletTransactionResponse` | `reason` | `string` | enum: `PROLONG`, `PURCHASE`, `WALLET_CHARGE` |
| `UserListResponse` | `role` | در سند اصلی `string` | enum نقش‌های سیستم؛ در نسخه محلی برای type-safety اصلاح شده است. |

## enumهای احتمالی که مقادیرشان مشخص نیست

| Schema | Field | توضیح |
|---|---|---|
| `ABPlayListItemResponse` | `audioType` | نوع منبع صوتی به نظر enum است، اما مقادیر backend در سند نیست. |
| `TicketFilterRequest` | `sortedBy` | مجموعه sort keyهای مجاز مشخص نشده است. |

## Response type

فیلد `type` در wrapperهای پاسخ هنوز `string` است. مقادیر شناخته‌شده شامل `SUCCESS`, `ERROR`, `PROCESSING`, `FAILURE`, `DATA`, `NO_DATA`, `LOGIN_SUCCESS`, `REGISTER_SUCCESS`, `LOGIN_INITIATED`, `REGISTER_INITIATED` هستند. بهتر است یک schema مشترک برای response type تعریف شود.

## جزئیات اختصاصی TeaSpeak

سند اصلی هنوز discriminator و schema اختصاصی برای TeaSpeak detail ندارد. نسخه محلی برای سازگاری فیلدهای زیر را روی `AbstractResourceDetailResponse` نگه می‌دارد:

- `address`
- `maxClients`
- `port`
- `teaSpeakStatus`
- `privilegeToken.token`

راه‌حل نهایی بهتر، تعریف `TeaSpeakResourceDetailResponse` و `AudioBotResourceDetailResponse` با discriminator بر اساس `resourceType` است.
