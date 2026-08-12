## Overview

TeaCloud is the frontend application for the **TeaCloud cloud service platform**.

It provides a unified interface for purchasing, managing, renewing, and monitoring hosted services such as TeaSpeak servers and AudioBot instances.

Regular users can manage their services, billing, DNS records, tickets, notifications, and account settings.

Administrators have access to infrastructure management, users, resources, products, DNS providers, invoices, tickets, nodes, system settings, and live backend monitoring.

---

## Technology Stack

TeaCloud Frontend is intentionally built without React or Vue.

The main technologies are:

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
- **Anime.js** for selected landing-page interactions

The application renders directly to the browser DOM and does not use JSX or a Virtual DOM.

This architecture keeps the runtime lightweight while providing direct control over rendering, animations, page lifecycle, and network activity.

---

## Application Architecture

TeaCloud is a **Single Page Application**.

Routing, page rendering, dialogs, polling, API communication, and UI state are handled by the project's internal architecture.

The application is broadly separated into:

- API layer
- Generated OpenAPI models
- Core utilities
- Page renderers
- Shared UI components
- Runtime configuration
- Styling system
- Public content
- User panel
- Admin panel

The API layer is generated from the backend OpenAPI specification wherever possible.

Small adapters and explicit overrides are used when a backend endpoint has application-specific behavior.

---

## Authentication Flow

Authentication is based on:

- Phone number
- OTP
- Backend-managed cookies

The frontend does **not** store JWT tokens in `localStorage`.

### Authentication initiation

The user submits a phone number.

The backend determines whether the user should:

- Login to an existing account
- Register a new account

### Login Flow

1. Authentication is initiated.
2. An OTP is sent.
3. The user submits the OTP.
4. Remember-me preference may be included.
5. Authentication cookies are created by the backend.
6. The user is redirected to the panel.

### Registration Flow

1. Authentication is initiated.
2. OTP verification is performed.
3. Basic user information is collected.
4. Registration is submitted.
5. Backend authentication cookies are created.
6. The user enters the application automatically.

---

## Session Validation

Session state is checked using:

```text
HEAD /v1/auth/session
```

Frontend behavior:

```text
204 → Authenticated
401 → Guest
403 → Guest for this endpoint
429 → Rate limited
```

The special `403` handling prevents a production redirect loop where the authentication page could repeatedly reload and call the session endpoint.

---

## Rate Limit Protection

`429 Too Many Requests` is treated as a global frontend rate-limit state.

After the first `429` response:

- Automatic API requests stop
- Polling stops
- Queued API requests are blocked
- Dashboard refreshes stop
- Live monitoring stops

The state is cleared only after a **manual browser refresh**.

This prevents the frontend itself from continuously increasing the backend rate limit.

---

## Roles

TeaCloud currently supports:

```text
ROLE_USER
ROLE_SUPPORT
ROLE_ADMIN
```

Available pages and actions are determined by the authenticated user's role.

Profile data is cached to reduce unnecessary backend requests.

---

# User Panel

The user panel provides access to:

- Dashboard
- Services
- DNS
- Products
- Wallet
- Transactions
- Invoices
- Tickets
- Notifications
- Profile

---

## TeaSpeak Services

TeaSpeak resource details include information such as:

- Resource status
- Server address
- Port
- Capacity
- Expiration
- Auto renewal
- Privilege token
- Custom DNS

Available actions include:

- Start
- Stop
- Prolong
- Rename
- Toggle auto prolong
- Generate privilege token
- Manage DNS

---

## DNS Management

TeaCloud provides integrated DNS provisioning for TeaSpeak resources.

Users can:

- View assigned DNS records
- Select an available zone
- Select a TeaSpeak resource
- Create a subdomain
- Check subdomain availability
- Unassign DNS records

Subdomain availability is validated through a HEAD request before assignment.

Client-side validation is also performed immediately while the user types.

---

## AudioBot Services

AudioBot details include:

- Bot nickname
- Server address
- Bot status
- Resource status
- Expiration
- Auto prolong

Supported bot states are:

```text
OFFLINE
CONNECTING
CONNECTED
```

Control logic:

```text
OFFLINE    → Start
CONNECTING → Stop
CONNECTED  → Stop
```

This allows administrators and users to stop a bot even while it is connecting.

---

## AudioBot Scoped Panel

Playlist and track management is no longer handled directly inside TeaCloud.

Instead, each AudioBot can provide access to a dedicated management panel.

The access endpoint returns:

- Panel URL
- Credentials
- Token expiration

Before access is requested, the values are displayed as blurred placeholders.

After a successful request:

- The panel URL becomes clickable
- The URL can be copied
- Credentials can be copied
- Token validity is displayed

The access state survives the regular resource-detail refresh cycle and only returns to the locked state when the token expires.

---

# Billing

TeaCloud includes an integrated Wallet and Invoice system.

Users can:

- Charge their wallet
- Review transactions
- View invoices
- Pay pending invoices
- Review payment history

---

## Invoice Tax

Invoices may contain a `taxPercentage`.

The backend sends the percentage as an integer:

```text
9 = 9%
```

The frontend calculates:

```text
Tax = Base Amount × Tax Percentage / 100
```

and:

```text
Payable Amount = Base Amount + Tax
```

Invoice interfaces display the base amount, calculated tax, and final payable amount.

---

# Admin Panel

The admin panel provides operational control over the TeaCloud platform.

Main areas include:

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

---

## Resource Management

Administrators can inspect resources and filter them by:

- Type
- Resource status
- Owner

Resource detail pages expose management operations depending on the underlying resource type.

---

## TeaSpeak Infrastructure

TeaSpeak resources are distributed across Query Instances.

Administrators can:

- View instances
- Create instances
- Enable or disable instances
- Edit configuration
- Remove instances
- Configure provisioning strategy

Supported strategies include:

```text
BALANCED
BIN_PACKING
RANDOMIZED
ROUND_ROBIN
```

---

## AudioBot Nodes

AudioBot instances run on dedicated AudioBot nodes.

Administrators can:

- Create nodes
- Inspect node capacity
- Manage node credentials
- Enable or disable nodes
- Edit node configuration
- Configure provisioning strategy

Node editing uses patch-like behavior.

Only fields that actually changed are sent to the backend.

---

# DNS Administration

Administrators can manage DNS providers, zones, and records.

Features include:

- Provider status
- Zone enable / disable
- Zone record inspection
- TeaCloud-managed records
- ReAssign
- Unassign
- Owner links
- Target resource links

Provider records and TeaCloud-managed records are displayed in separate foldable tables.

---

# Invoice Administration

Administrators can inspect system-wide invoices and payment information.

Invoice data may include:

- Owner
- Base amount
- Tax
- Payable amount
- Status
- Gateway transaction
- Payment metadata

Administrators can also create debt invoices for users.

---

# Ticketing

TeaCloud includes an integrated support ticket system.

Users can:

- Create tickets
- Associate tickets with resources
- Send messages
- Attach files
- Close tickets

Admin and Support users can manage ticket state and departments.

Messages are displayed using a conversation-oriented interface.

---

# System Administration

The System page contains application-level configuration and live monitoring.

Application settings include values such as:

- Minimum wallet charge
- Invoice tax percentage
- Suspended resource cleanup timing

Application settings are displayed inside a foldable card that is closed by default.

Duration values can be edited using:

- Seconds
- Minutes
- Hours
- Days

The frontend converts the entered duration into the backend representation before submitting it.

---

## Live Backend Logs

Backend logs are streamed through:

- WebSocket
- STOMP

The frontend subscribes to:

```text
/topic/logs
```

A log event contains:

```text
logger
level
message
thread
timestamp
```

The monitoring client supports:

- Automatic reconnect
- Connection state reporting
- Smart auto-scroll
- Bounded in-memory log history
- Connection cleanup when leaving the page

---

# Runtime Configuration

Important deployment configuration can be changed without rebuilding the frontend.

The runtime configuration file is:

```text
config.js
```

It can define values such as:

- API base URL
- Public files base URL
- Dashboard Tour location
- Rules file location

Example:

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

This allows deployment-specific configuration to be changed after the production build has already been generated.

---

# Dashboard Tour

The user panel includes a JSON-driven onboarding tour.

Tour content and order can be changed through public configuration without modifying application source code.

The tour is started after successful registration and temporarily pauses conflicting background polling while active.

---

# Themes

TeaCloud supports:

- Dark theme
- Light theme

Dark is the default theme.

The selected theme is stored locally in the browser.

Monitoring and terminal-style interfaces may intentionally preserve their dark appearance.

---

# Polling and Page Lifecycle

Operational pages use controlled polling to refresh backend state.

Polling is paused when appropriate, including when:

- The browser tab is hidden
- A dialog is open
- An input is focused
- The onboarding tour is active
- The user is composing a ticket
- Global rate limiting has been triggered

This prevents unnecessary network traffic and disruptive UI refreshes.

---

# OpenAPI Integration

TeaCloud uses generated TypeScript models and operation definitions based on the backend OpenAPI specification.

Main development commands include:

```bash
npm run generate:api
npm run check
npm run build
```

`generate:api` synchronizes generated frontend models with the backend API specification.

`check` performs strict TypeScript validation and API usage coverage checks.

`build` generates the production bundle.

---

# Production

The production build is generated in:

```text
dist/
```

Environment-specific configuration can be changed through `config.js` after deployment, making it possible to change API and public-content endpoints without rebuilding the frontend.

---

## Version

```text
TeaCloud Frontend 0.2.2
```

TeaCloud Frontend is actively developed alongside the TeaCloud backend and its service infrastructure.
