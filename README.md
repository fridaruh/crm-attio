# CRM Attio Clone

A pixel-faithful clone of [Attio](https://attio.com) CRM built with React 19 + Vite. Includes kanban deal management, contact and company records, a full task manager, and an income report — all persisted locally via CSV imports and `localStorage`.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### Deals — Kanban Board
- Drag-and-drop cards across pipeline stages (Lead → Closed Won/Lost)
- Click any deal to open a full-page detail view
- Edit name, stage, owner, value, close date, linked company & contact inline
- Tabs: Overview · Activity log · Notes · Tasks · People
- All mutations are logged as timestamped activity events

### People (Contacts)
- Sortable table: Name, Connection strength, Last email, Last meeting
- Full-page contact detail with click-to-edit fields
- Link contacts to companies with favicon autocomplete
- Overview highlights, activity feed (derived from linked deals), notes

### Companies
- Rich table: logo/favicon, domain, country, industry, founded, employees, connection strength, last interaction, people count, deals count
- Sort by any column · Filter panel (connection strength, has deals, has people)
- Detail drawer with clickable domain, LinkedIn, and Twitter links
- Company logos via Google Favicon service with letter-avatar fallback
- 99 companies pre-enriched via Abstract API (country, industry, employees, description)

### Tasks
- Global task manager accessible from the sidebar
- Grouped sections: Overdue · Today · Upcoming · No due date · Completed (collapsible)
- Create task modal: due date picker, assignee, link to any deal / contact / company
- "Create more" toggle for rapid task entry
- Keyboard shortcuts: `ESC` to cancel, `⌘↵` to save
- Tasks also appear inside deal and contact detail pages

### Income Report
- Revenue analytics with Recharts charts
- Aggregated from deal values and stages

---

## Tech Stack

| Package | Purpose |
|---|---|
| React 19 | UI framework |
| Vite 8 | Build tool & dev server |
| `@hello-pangea/dnd` | Drag-and-drop kanban |
| `lucide-react` | Icons |
| `papaparse` | CSV parsing for data import |
| `recharts` | Income report charts |
| `localStorage` | Client-side persistence |

No backend. No router library — navigation is pure React state.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:5173](http://localhost:5173).

---

## Data

The app loads from CSV exports placed in `public/data/imported_data/`:

| File | Source |
|---|---|
| `Deals - Pipeline.csv` | Attio Deals export |
| `People - Recently Contacted People.csv` | Attio People export |
| `Companies - All Companies.csv` | Attio Companies export |

Company enrichment data (country, industry, employees, description) is pre-built in `public/data/company_enrichment.json` — keyed by domain.

On first load the CSVs are parsed and normalized; subsequent loads use `localStorage` cache. Bump the storage key version in `src/hooks/useData.js` to force a fresh reload.

---

## Project Structure

```
src/
├── components/
│   ├── companies/     CompaniesView
│   ├── contacts/      ContactsView · ContactDetailPage
│   ├── deals/         DealsView · KanbanBoard · DealCard · DealDetailPage
│   ├── reports/       IncomeReport
│   ├── shared/        RecordDetail · AddDealModal · AddPersonModal · AddCompanyModal · Avatar
│   └── tasks/         TasksView
├── hooks/
│   └── useData.js     Central data store + CRUD (localStorage + CSV)
├── utils/
│   ├── enrichCompany.js   Abstract API enrichment helper
│   └── linking.js         Record linking utilities
└── index.css          CSS custom properties (design tokens)
```

---

## License

MIT
