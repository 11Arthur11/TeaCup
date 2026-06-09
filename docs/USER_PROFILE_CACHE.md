# User profile cache

The shared user profile adapter is located at `src/api/user-profile.ts`.

- The authenticated session profile primes the cache after `HEAD /v1/auth/session` succeeds.
- The user dashboard reads the profile through the cache and only requests it again after the cache expires.
- Cache lifetime is ten minutes and concurrent requests are deduplicated.
- The dedicated profile page calls the adapter with `force: true`; therefore its existing five-second page refresh still receives current profile data.
- Logout invalidates the profile cache.

The cached name and phone are rendered in `.sidebar-user`. The dashboard page title uses the cached first name for the greeting.
