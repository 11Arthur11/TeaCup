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
- The check is debounced by 700 ms.
- The subdomain is validated live with `^(?=.{1,63}$)(?!-)[a-z0-9]+(?:-[a-z0-9]+)*(?<!-)$` before any HEAD request is sent.

Assignment uses `POST /v1/dns/records`; unassignment uses `DELETE /v1/dns/records/{recordId}`.

## Admin routes

- `/admin/dns/liara`: provider configuration and zone list.
- `/admin/dns/liara/zones/{zoneName}`: zone records.

Zone actions:

- Enable/disable user provisioning with `PATCH /v1/admin/dns/zones/{zoneId}/toggle-active`.
- Open provider records for a zone.

Record presentation:

- Records that include the `assigned` contract are grouped under a collapsible TeaCloud table.
- Provider-native records without the TeaCloud assignment contract are shown in a separate collapsible table without empty owner/resource/action columns.
- `assigned=true` rows receive a distinct managed-record surface.
- `ownerId` links to the admin user detail and `targetResourceId` links to the admin resource detail.
- Missing owner/resource values are shown explicitly as detached state instead of blank cells.
- `assigned=false` records expose `PATCH /v1/admin/dns/records/{recordId}/re-assign`.
- Connected records expose admin unassign through `DELETE /v1/admin/dns/records/{recordId}`.
