# Basma redesign: audit and regression report

Date: 2026-11-15. Branch `basma-redesign` in `tovi` (admin), `tovi-teacher`, and `tove-instu` (institute). Nothing committed yet.

## What changed

The old presentation layer is gone from all three apps:

- Removed: `shared/src/tovi.css`, `shared/src/theme.ts`, the MUI theme and Emotion RTL cache in `src/main.tsx`, Tailwind, and the old fonts.
- Removed dependencies: `@mui/material`, `@mui/icons-material`, `@emotion/*`, `stylis`, `stylis-plugin-rtl`, `tailwindcss`, `@tailwindcss/vite`, `@fontsource/alexandria`, `@fontsource/ibm-plex-sans-arabic`, `@fontsource/tajawal`.
- Added: `@tabler/icons-react`, `@fontsource/readex-pro` (body), `@fontsource/baloo-bhaijaan-2` (display).

The new design system lives in `shared/src` and is identical in all three repositories except `config.ts`:

| File | Contents |
|---|---|
| `basma.css` | Tokens (palette, type, spacing, radii, shadows), per-app personality via `data-app`, every component style, phone breakpoints, reduced-motion rules |
| `ui.tsx` | Button, ButtonLink, IconButton (with tooltip), Badge, StatusBadge, Avatar, Alert, PageHeader, Card, StatCard with animated count, Bars, Meter, EmptyState, ErrorState, Skeletons, cover tiles, Dialog (focus trap, Esc, phone bottom sheet), ConfirmDialog, ActionMenu, toasts, celebration burst, `useAction` |
| `form.tsx` | TextField (password reveal), TextArea, Select (custom listbox with keyboard and search), Segmented, ChoiceChips, PermissionPicker (grouped by module, search, select all), DateTimeField (calendar and time), FileDrop, FormSection, Fields |
| `table.tsx` | DataTable (sorting on the loaded page, skeleton rows, empty and no-match states, rows become cards on phones), Pagination with page numbers |
| `resource.tsx` | The generic list and create screen, rebuilt on the pieces above |
| `shell.tsx` | Sidebar, top bar with breadcrumb, page switcher (Ctrl+K), profile menu, phone tab bar and drawer, sign-in layout |
| `meeting.tsx` | Live class room restyled; LiveKit logic unchanged |
| `art.tsx`, `icons.tsx` | Original illustrations (sprout mascot, empty-state scenes, course covers) and one icon and colour per route |

`config.ts` per app: `kind` (admin, teacher, institute) and `serverSearch` (the admin API filters lists with `q`; the other two filter the loaded page, as before).

Personalities: admin uses a navy command-center sidebar, teacher uses colourful icon tiles and the mascot, institute uses the sky accent.

## Business behaviour kept

Checked by comparing the committed `App.tsx` and `meeting.tsx` against the new ones:

- Routes: identical (admin 25, teacher 18, institute 20).
- List endpoints passed to `Resource`: identical (admin 44, teacher 24, institute 28 `path` values including routes).
- `api()` and `download()` calls: every old call is still made, with the same method and body. The only textual differences are two renamed variables for the same endpoints (`/api/teacher/questions/{id}` DELETE, `/api/teacher/sessions/{id}/cancel` POST).
- New requests, all read-only GETs on endpoints the apps already use, to fill pickers that used to be raw ID fields:
  - `/api/admin/plans?page=1&pageSize=100`: the plan picker in "assign cash". It falls back to the old text field if the list does not load.
  - `/api/institute/schools?page=1&pageSize=100`: the school picker when adding a student, with the same fallback.
  - `/api/institute/classrooms`: the classroom picker when scheduling a session, with the same fallback.
  - The institute course dialog now uses the teacher list the page already loaded, as a picker.

Small behaviour changes, all on the client:

- Required end date on new exams and required start on new sessions. Before, an empty value crashed in `new Date("").toISOString()` before any request.
- The admin "next run" field for scheduled notifications is a date picker that sends `toISOString()`. Before, it was free text labelled ISO.
- Lessons can move down as well as up. Both use the same `PUT .../lessons/order`.
- Errors that used to be unhandled now show a toast.
- Boolean selects with defaults (approved, active, export, attendance) are yes/no toggles. Each one has a default, so the payload is unchanged.
- Numbers display with Western digits in Arabic (`ar-IQ-u-nu-latn`), as the old screens showed raw numbers.

No new metrics, fake data, XP, streaks, or badges were added to the dashboards. The usage meter appears only where the API returns both values (`codesIssued` / `planCodesCount`).

## Legacy elimination checklist

| Area | Admin | Teacher | Institute |
|---|---|---|---|
| Sign-in (and institute registration) | Rebuilt | Rebuilt | Rebuilt |
| Sidebar, top bar, profile menu, phone nav | Rebuilt | Rebuilt | Rebuilt |
| Overview / home / dashboard | Rebuilt | Rebuilt | Rebuilt |
| Generic lists (`Resource`), tables, pagination, search | Rebuilt | Rebuilt | Rebuilt |
| Create dialogs and forms | Rebuilt | Rebuilt | Rebuilt |
| Course studio, chapters, lessons | n/a | Rebuilt | Rebuilt |
| Exams and questions | n/a | Rebuilt | list only, rebuilt |
| Staff and permission picker | Resource | Rebuilt | Rebuilt |
| Plans and payment link | Resource | Rebuilt | Rebuilt |
| Sessions, classrooms, pool | Resource | Rebuilt | Rebuilt |
| Live meeting room | n/a | Rebuilt | n/a |
| FAQ, notifications, parameters, privacy upload | Rebuilt | n/a | FAQ list rebuilt |
| Settings / profile | n/a | Rebuilt | Rebuilt |

A text scan for the old class names (`sheet`, `record`, `composer`, `pill`, `ghost`, `danger` as classes), `@mui`, `createTheme`, and `tovi.css` finds nothing in any of the three apps.

## Tests run

- `tsc --noEmit --noUnusedLocals` and `npm run build`: pass in all three. Each bundle is about 530 kB minified; Vite warns about chunks over 500 kB.
- No automated test suites exist in these three repositories.
- Run against `tovi-backend` on a throwaway SQLite database, in the browser:
  - Admin: sign-in, overview counts, create a teacher through the dialog (server 400 shown inside the dialog, then success with a toast and the new row), focus ring in the employee dialog.
  - Teacher: sign-in as the new teacher, home figures, create a course, open it, add a chapter, add two lessons, reorder (`PUT .../order` 200).
  - Institute: register through the new form, dashboard figures, add a student from the phone-size bottom sheet (POST 200).
  - Phone width (375 px): institute student list, tab bar, bottom-sheet dialog.

## Not verified

- Every remaining screen in the browser: admin catalog pages, invoices, codes, hour packages, ads, guides, FAQ, notifications, scheduled notifications, reports, parameters and privacy upload, subscriptions; teacher summaries, exams and questions, groups, assistants, classrooms, sessions, plans, chat, profile; institute teachers, courses, chapters, employees, schools, plans, pool, sessions, settings, and the teacher-only sessions view. They typecheck, build, and use the same components.
- Code generation and spreadsheet download (the test teacher has a code balance of 0).
- The live meeting room (it needs LiveKit).
- English (LTR) mode in the browser.
- Tablet width, and phone width outside the institute student page.

## Observed server behaviour (unchanged, not a UI bug)

`GET /api/institute/students` returns only students linked to one of the institute's schools. A student added without a school is saved (POST 200) but does not appear in the list.
