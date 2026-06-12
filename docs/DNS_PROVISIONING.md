# DNS Provisioning UI

## User routes

- `/panel/dns`: lists the user's assigned DNS records and supports assign/unassign.
- `/panel/services/{resourceId}`: TeaSpeak connection card displays the assigned DNS or an add-DNS action.

The global assignment dialog loads active zones from `GET /v1/dns/zones`, selects only TeaSpeak resources, and checks availability through:

```http
HEAD /v1/dns/zones/{zoneId}/subdomains/{subdomain}/availability
```

Frontend behavior:

- `204`: available; submit becomes enabled when a TeaSpeak resource is also selected.
- `409`: already used; submit remains disabled.
- The check is debounced by 1350 ms.

Assignment uses `POST /v1/dns/records`; unassignment uses `DELETE /v1/dns/records/{recordId}`.

## Admin routes

- `/admin/dns/liara`: provider configuration and zone list.
- `/admin/dns/liara/zones/{zoneName}`: zone records.

Zone actions:

- Enable/disable user provisioning with `PATCH /v1/admin/dns/zones/{zoneId}/toggle-active`.
- Open provider records for a zone.

Record presentation:

- `assigned=true` rows receive a distinct managed-record surface.
- `ownerId` links to the admin user detail.
- `targetResourceId` links to the admin resource detail.
- `assigned=false` records expose `PATCH /v1/admin/dns/records/{recordId}/re-assign`.
