# AudioBot scoped panel access

## Runtime controls

AudioBot resource detail uses the backend `botStatus` field as the source of truth:

- `ONLINE`: render a single stop action.
- `OFFLINE`: render a single start action.
- any unknown/missing value: render a disabled runtime action instead of guessing.

This behavior is used in both the user resource detail page and the admin resource detail page.

## Panel access

The frontend requests:

```http
GET /v1/services/audio-bot/{resourceId}/access
```

Expected payload data:

```json
{
  "panelAddress": "https://panel.example.com/...",
  "token": {
    "credentials": "...",
    "validUntil": "2026-08-10T20:00:00Z"
  }
}
```

The dialog:

- renders `panelAddress` as an HTTP(S)-only link that opens in a new tab with `noopener noreferrer`;
- renders `credentials` as selectable text with a copy button;
- shows token expiration when available;
- loads access only when the user/admin explicitly opens the dialog.

## Playlist and track controls

Playlist/track mutation UI was removed from both user and admin resource details. The remaining playlist-detail read endpoint present in the supplied OpenAPI is intentionally not surfaced because playlist management is now owned by the dedicated AudioBot panel.


## Runtime status contract

AudioBot runtime status is read from `botStatus` using the backend enum values:

- `OFFLINE`: show the Start action.
- `CONNECTING`: show an active Stop action; clicking it calls the AudioBot stop endpoint.
- `CONNECTED`: show an active Stop action.

Legacy `ONLINE` is not used for AudioBot runtime state.
