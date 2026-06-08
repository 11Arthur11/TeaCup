# Dashboard tour

The user dashboard tour is configured entirely from:

`public/content/dashboard-tour.json`

The build script copies this file to `dist/content/dashboard-tour.json`.

## Automatic start

After a successful registration response with `type: REGISTER_SUCCESS`, the frontend stores a pending marker. The tour starts after the fully loaded `/panel` dashboard is rendered. Login responses do not create this marker.

A user can restart the tour at any time through the `راهنما` control above the user sidebar footer.

## Target types

### Header or any CSS target

```json
{
  "target": {
    "type": "selector",
    "selector": "[data-tour-target=\"HEADER_PROFILE\"]",
    "context": "workspace"
  }
}
```

For responsive targets, a separate mobile selector and context can be supplied:

```json
{
  "target": {
    "type": "selector",
    "selector": "[data-tour-target=\"HEADER_THEME\"]",
    "mobileSelector": "[data-tour-target=\"SIDEBAR_THEME\"]",
    "context": "workspace",
    "mobileContext": "sidebar"
  }
}
```

### Sidebar item by visual order

```json
{
  "target": { "type": "sidebar-index", "index": 4 },
  "title": "امور مالی",
  "text": "..."
}
```

User sidebar top-level entries receive `data-tour-menu-index` automatically according to their current order. When a new item is added to the sidebar, tour steps can be reordered or extended only by editing this JSON.

### Centered final step

```json
{
  "target": { "type": "center" },
  "placement": "center"
}
```

## Editing

The order of objects in `steps` is the tour order. Titles, descriptions, icons, labels, storage keys, mobile breakpoint, spotlight padding and card distance are all editable from JSON.
