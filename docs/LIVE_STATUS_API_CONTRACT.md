# قرارداد پیشنهادی وضعیت لحظه‌ای سرویس

صفحه `/admin/live-status` فعلاً فقط از داده mock استفاده می‌کند و هیچ درخواست backend ندارد.

## Snapshot اولیه

```http
GET /v1/admin/system/live-status
```

```json
{
  "success": true,
  "type": "DATA",
  "data": {
    "generatedAt": "2026-07-25T18:30:00Z",
    "overallStatus": "OPERATIONAL",
    "metrics": {
      "activeResources": 128,
      "deployingResources": 3,
      "queryNodesOnline": 4,
      "audioNodesOnline": 6
    },
    "components": [
      {
        "identifier": "API_GATEWAY",
        "status": "ONLINE",
        "latencyMs": 42,
        "detail": "پاسخ‌گویی پایدار"
      }
    ],
    "latestEventCursor": "evt_01923"
  }
}
```

## جریان لاگ لحظه‌ای

SSE برای این مورد ساده‌تر و مناسب‌تر از polling پنج‌ثانیه‌ای است:

```http
GET /v1/admin/system/events?cursor=evt_01923
Accept: text/event-stream
```

هر event:

```json
{
  "id": "evt_01924",
  "timestamp": "2026-07-25T18:30:02Z",
  "level": "INFO",
  "source": "query-dispatcher",
  "message": "heartbeat accepted from query-node-04",
  "resourceId": null,
  "nodeId": 4
}
```

مقادیر پیشنهادی enum:

- `overallStatus`: `OPERATIONAL`, `DEGRADED`, `MAINTENANCE`, `OUTAGE`
- `component.status`: `ONLINE`, `DEGRADED`, `OFFLINE`, `UNKNOWN`
- `event.level`: `DEBUG`, `INFO`, `SUCCESS`, `WARN`, `ERROR`, `CRITICAL`

پیام log نباید credential، token، password، API key یا اطلاعات حساس کاربر را دربر بگیرد.
