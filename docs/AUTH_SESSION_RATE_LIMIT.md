# Auth session and HTTP 429 guard

## Production 403 on `/v1/auth/session`

`HEAD /v1/auth/session` is a session probe. The frontend accepts both `401` and `403` as an unauthenticated/guest result for this endpoint. A `403` from this probe is excluded from the global forbidden redirect handler so it cannot create a full-page `/auth` reload loop.

Other protected API requests that return `403` continue to use the existing global forbidden/session-ended behavior.

## HTTP 429

The first HTTP `429 Too Many Requests` activates a page-lifetime rate-limit latch. After the latch is active:

- future `api.call` and `api.raw` calls fail locally before `fetch`;
- queued API calls are checked again before they can start a network request;
- the five-second page refresh controller is stopped;
- user header/chrome polling is stopped;
- live log reconnection is stopped by the main rate-limit event handler;
- the backend availability probe does not bypass the latch.

The latch has no programmatic reset. A full browser refresh creates a new JavaScript runtime and allows requests again.
