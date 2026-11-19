# Project Rules — Life Dashboard

These rules govern the **Life Dashboard** project located at the workspace root (`d:\kiro`). All changes to this project must respect them.

## Technical Constraints

- **Stack:** HTML, CSS, and Vanilla JavaScript only. No frameworks, no libraries, no build tools.
- **Storage:** All data persists client-side using the Browser Local Storage API. No backend, no server, no external API calls.
- **File structure (strict):**
  - `index.html` at the project root.
  - Exactly **one** CSS file: `css/style.css`.
  - Exactly **one** JS file: `js/script.js`.
- Do **not** add additional CSS or JS files, inline `<style>` blocks, or inline `onclick` handlers. Keep markup, styling, and behavior in their respective files.

## MVP Features

1. **Greeting Card** — Live clock in `HH:MM:SS`, full date, and a dynamic greeting based on time of day: *Good Morning* (< 12:00), *Good Afternoon* (< 18:00), *Good Evening* (otherwise).
2. **Focus Timer Card** — 25-minute Pomodoro timer with Start, Stop, and Reset buttons.
3. **Tasks (To-Do List) Card** — Add, edit, mark done (checkbox + strikethrough), and delete tasks. All tasks saved in Local Storage.
4. **Quick Links Card** — Add links via a Link Name + URL form, render clickable buttons that open in a new tab, and allow deleting links. Links saved in Local Storage.

## Additional Challenges (required)

1. **Light / Dark mode toggle** — Persisted in Local Storage.
2. **Custom name in greeting** — User can set and edit their name; persisted in Local Storage. Falls back to a generic placeholder when empty.
3. **Duplicate task prevention** — Adding a task that already exists shows a warning and does not add it.

## Design Guidelines

- Clean, minimal, modern dashboard.
- Soft gradient background with rounded white (light) / dark (dark) cards.
- Readable typography using system fonts.
- Responsive grid: Greeting full-width on top, Focus Timer and Tasks side-by-side in the middle, Quick Links full-width below. Collapses to a single column on narrow screens.

## Data Keys (Local Storage)

| Key         | Purpose                       |
| ----------- | ----------------------------- |
| `ld_tasks`  | Array of task objects `{id, text, done}` |
| `ld_links`  | Array of link objects `{id, name, url}`   |
| `ld_theme`  | Theme preference (`"light"` or `"dark"`) |
| `ld_name`   | User's custom greeting name (string)      |
