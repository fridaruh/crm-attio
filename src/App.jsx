import { useState, useEffect } from 'react';
import { Home, CheckSquare, Zap, Settings, Bell, LogOut } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import DealsView from './components/deals/DealsView';
import DealDetailPage from './components/deals/DealDetailPage';
import ContactDetailPage from './components/contacts/ContactDetailPage';
import ContactsView from './components/contacts/ContactsView';
import CompaniesView from './components/companies/CompaniesView';
import RecordDetail from './components/shared/RecordDetail';
import AddDealModal from './components/shared/AddDealModal';
import AddPersonModal from './components/shared/AddPersonModal';
import AddCompanyModal from './components/shared/AddCompanyModal';
import IncomeReport from './components/reports/IncomeReport';
import TasksView from './components/tasks/TasksView';
import { useData } from './hooks/useData';

const ALLOWED_EMAIL = 'i.am@fridaruh.com';

export default function App() {
  // Auth state — must be declared before any conditional return
  const [authUser, setAuthUser] = useState(undefined); // undefined = checking, null = not allowed

  // All hooks must be declared unconditionally at the top
  const [view, setView] = useState('deals');
  const [selectedDealId, setSelectedDealId]       = useState(null);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [addDealStage, setAddDealStage] = useState(null);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);

  const {
    deals, contacts, companies, activities, tasks, notes, loading,
    moveDeal, addDeal, updateDeal, archiveDeal, addContact, updateContact, addCompany, updateCompany,
    addTask, toggleTask, updateTask, deleteTask, addNote, deleteNote,
    getCompany, getContact,
  } = useData();

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setAuthUser(user?.email === ALLOWED_EMAIL ? user : null);
    });
  }, []);

  // Conditionals come after all hooks
  if (authUser === undefined) return <LoadingScreen />;
  if (!authUser) return <Login allowedEmail={ALLOWED_EMAIL} />;
  if (loading) return <LoadingScreen />;

  function openRecord(record, type) {
    setSelectedRecord(record);
    setSelectedType(type);
  }

  function closeRecord() {
    setSelectedRecord(null);
    setSelectedType(null);
  }

  function openAddDeal(stage) {
    setAddDealStage(stage);
    setShowAddDeal(true);
  }

  return (
    <div className="app-layout">
      <Sidebar currentView={view} onNavigate={setView} onLogout={() => signOut(auth)} />

      <main className="main-content">
        {view === 'deals' && selectedDealId ? (
          <DealDetailPage
            dealId={selectedDealId}
            deals={deals}
            contacts={contacts}
            companies={companies}
            activities={activities}
            tasks={tasks}
            notes={notes}
            updateDeal={updateDeal}
            archiveDeal={archiveDeal}
            addTask={addTask}
            toggleTask={toggleTask}
            deleteTask={deleteTask}
            addNote={addNote}
            deleteNote={deleteNote}
            onBack={() => setSelectedDealId(null)}
          />
        ) : view === 'deals' && (
          <DealsView
            deals={deals}
            tasks={tasks}
            notes={notes}
            getCompany={getCompany}
            getContact={getContact}
            onMoveDeal={moveDeal}
            onAddDeal={openAddDeal}
            onSelectDeal={(deal) => setSelectedDealId(deal.id)}
            onArchiveDeal={archiveDeal}
            onAddTask={addTask}
            onAddNote={addNote}
          />
        )}

        {view === 'contacts' && selectedContactId ? (
          <ContactDetailPage
            contactId={selectedContactId}
            contacts={contacts}
            companies={companies}
            deals={deals}
            activities={activities}
            notes={notes}
            updateContact={updateContact}
            addNote={addNote}
            deleteNote={deleteNote}
            onBack={() => setSelectedContactId(null)}
          />
        ) : view === 'contacts' && (
          <ContactsView
            contacts={contacts}
            companies={companies}
            onSelectContact={(c) => setSelectedContactId(c.id)}
            onAddContact={() => setShowAddPerson(true)}
          />
        )}

        {view === 'companies' && (
          <CompaniesView
            companies={companies}
            contacts={contacts}
            deals={deals}
            onSelectCompany={(c) => openRecord(c, 'company')}
            onAddCompany={() => setShowAddCompany(true)}
          />
        )}

        {view === 'income_report' && (
          <IncomeReport deals={deals} />
        )}

        {view === 'tasks' && (
          <TasksView
            tasks={tasks}
            contacts={contacts}
            companies={companies}
            deals={deals}
            onAddTask={addTask}
            onToggleTask={toggleTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
          />
        )}

        {['home', 'notifications', 'automations', 'settings'].includes(view) && (
          <PlaceholderView view={view} />
        )}
      </main>

      {selectedRecord && (
        <RecordDetail
          record={selectedRecord}
          type={selectedType}
          getCompany={getCompany}
          getContact={getContact}
          deals={deals}
          contacts={contacts}
          onClose={closeRecord}
          onUpdateCompany={updateCompany}
        />
      )}

      {showAddDeal && (
        <AddDealModal
          defaultStage={addDealStage}
          companies={companies}
          contacts={contacts}
          onSave={addDeal}
          onClose={() => setShowAddDeal(false)}
        />
      )}

      {showAddPerson && (
        <AddPersonModal
          companies={companies}
          onSave={addContact}
          onClose={() => setShowAddPerson(false)}
        />
      )}

      {showAddCompany && (
        <AddCompanyModal
          onSave={addCompany}
          onClose={() => setShowAddCompany(false)}
        />
      )}
    </div>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0F0F0F',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: '#7C5CFC',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, fontWeight: 800, color: 'white',
        }}>A</div>
        <span style={{ color: '#555', fontSize: 13 }}>Cargando datos…</span>
      </div>
    </div>
  );
}

const PLACEHOLDER_ICONS = {
  home: Home,
  notifications: Bell,
  tasks: CheckSquare,
  automations: Zap,
  settings: Settings,
};

function PlaceholderView({ view }) {
  const label = view.charAt(0).toUpperCase() + view.slice(1);
  const Icon = PLACEHOLDER_ICONS[view];
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
    }}>
      {Icon && <Icon size={32} strokeWidth={1.25} color="var(--text-muted)" />}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>{label}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Coming soon.</p>
      </div>
    </div>
  );
}
