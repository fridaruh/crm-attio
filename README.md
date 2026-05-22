# CRM Attio Clone

A pixel-faithful clone of [Attio](https://attio.com) CRM built with React 19 + Vite. Includes kanban deal management, contact and company records, a full task manager, and an income report — all persisted in Firestore with Google Auth.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

### Authentication
- Google Sign-In via Firebase Auth
- Protected routes — all views require authentication

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
- **Board view**: drag-and-drop kanban with three columns — To Do · In Progress · Done
- **List view**: compact table with status badges, linked record, and due date
- Click any task to open a full **edit modal** with all fields editable:
  - Title, Status, Due date, Linked record (deal / contact / company)
  - Additional notes textarea persisted to Firestore
- Create task modal: due date picker, link to any deal / contact / company, "Create more" toggle
- Keyboard shortcuts: `ESC` to cancel, `⌘↵` to save
- Filter tasks by linked project
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
| Firebase | Auth (Google Sign-In) + Firestore persistence |
| `@hello-pangea/dnd` | Drag-and-drop kanban |
| `lucide-react` | Icons |
| `papaparse` | CSV parsing for initial data seed |
| `recharts` | Income report charts |

No router library — navigation is pure React state.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/fridaruh/crm-attio.git
cd crm-attio
npm install
```

### 2. Configure Firebase

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), enable **Firestore** and **Google Auth**, then add your config to `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  // ...
};
```

### 3. Run

```bash
npm run dev        # dev server at http://localhost:5173
npm run build      # production build
```

---

## Data

On first login the app checks Firestore. If empty, it seeds from CSV exports in `public/data/imported_data/`:

| File | Source |
|---|---|
| `Deals - Pipeline.csv` | Attio Deals export |
| `People - Recently Contacted People.csv` | Attio People export |
| `Companies - All Companies.csv` | Attio Companies export |

Company enrichment (country, industry, employees, description) is pre-built in `public/data/company_enrichment.json` keyed by domain. After seeding, all reads and writes go directly to Firestore.

---

## Project Structure

```
src/
├── components/
│   ├── companies/     CompaniesView
│   ├── contacts/      ContactsView · ContactDetailPage
│   ├── deals/         DealsView · KanbanBoard · DealCard · DealDetailPage
│   ├── reports/       IncomeReport
│   ├── shared/        RecordDetail · CreateTaskModal · TaskDetailModal
│   │                  AddDealModal · AddPersonModal · AddCompanyModal · Avatar
│   ├── tasks/         TasksView
│   ├── Login.jsx
│   └── Sidebar.jsx
├── hooks/
│   └── useData.js     Central data store + CRUD (Firestore)
├── utils/
│   ├── enrichCompany.js   Abstract API enrichment helper
│   └── linking.js         Record linking utilities
├── firebase.js        Firebase app + Firestore + Auth init
└── index.css          CSS custom properties (design tokens)
```

---

## License

MIT
