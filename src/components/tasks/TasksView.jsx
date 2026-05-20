import { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Plus, Calendar, CheckSquare, Trash2,
  TrendingUp, Users, Building2, LayoutGrid, List, ChevronDown,
} from 'lucide-react';
import CreateTaskModal from '../shared/CreateTaskModal';

// ─── helpers ──────────────────────────────────────────────────────────────────

function parseDateLocal(str) {
  if (!str) return null;
  const d = new Date(str + 'T00:00:00');
  return isNaN(d) ? null : d;
}

function formatDueDateLabel(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = parseDateLocal(dateStr);
  if (!d) return null;
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, overdue: true };
  if (diff === 0) return { label: 'Today', overdue: false };
  if (diff === 1) return { label: 'Tomorrow', overdue: false };
  if (diff < 7)  return { label: d.toLocaleDateString('en-US', { weekday: 'short' }), overdue: false };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false };
}

function getStatus(task) {
  if (task.status) return task.status;
  return task.completed ? 'done' : 'todo';
}

const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#6B7280', bg: '#F9FAFB' },
  { id: 'in_progress', label: 'In Progress',  color: '#F59E0B', bg: '#FFFBEB' },
  { id: 'done',        label: 'Done',         color: '#10B981', bg: '#ECFDF5' },
];

const RECORD_ICONS  = { deal: TrendingUp, contact: Users, company: Building2 };
const RECORD_COLORS = { deal: '#8B5CF6', contact: '#3B82F6', company: '#10B981' };

// ─── Task Card (kanban) ───────────────────────────────────────────────────────

function TaskCard({ task, index, onToggle, onDelete, getRecordLabel }) {
  const [hovered, setHovered] = useState(false);
  const due = formatDueDateLabel(task.due_date);
  const recordLabel = task.record_id ? getRecordLabel(task.record_id, task.record_type) : null;
  const Icon = task.record_type ? RECORD_ICONS[task.record_type] : null;
  const status = getStatus(task);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 12px',
            marginBottom: 8,
            boxShadow: snapshot.isDragging ? 'var(--shadow-md)' : 'var(--shadow-xs)',
            opacity: snapshot.isDragging ? 0.95 : 1,
            cursor: 'grab',
            transition: 'box-shadow 0.15s',
            ...provided.draggableProps.style,
          }}
        >
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <button
              onClick={() => onToggle(task.id)}
              style={{
                width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: status === 'done' ? 'none' : '1.5px solid var(--border)',
                background: status === 'done' ? 'var(--purple)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {status === 'done' && (
                <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
                  <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
            <span style={{
              flex: 1, fontSize: 13, fontWeight: 450,
              color: status === 'done' ? 'var(--text-muted)' : 'var(--text)',
              textDecoration: status === 'done' ? 'line-through' : 'none',
              lineHeight: 1.4,
            }}>
              {task.title}
            </span>
            {hovered && (
              <button
                onClick={e => { e.stopPropagation(); onDelete(task.id); }}
                style={{ color: 'var(--text-muted)', display: 'flex', flexShrink: 0, padding: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>

          {/* Meta row */}
          {(due || recordLabel) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {recordLabel && Icon && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 11, color: RECORD_COLORS[task.record_type],
                  background: `${RECORD_COLORS[task.record_type]}18`,
                  padding: '2px 7px', borderRadius: 20, fontWeight: 500,
                }}>
                  <Icon size={9} />
                  {recordLabel}
                </span>
              )}
              {due && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: 11, fontWeight: 500,
                  color: due.overdue ? '#EF4444' : 'var(--text-muted)',
                }}>
                  <Calendar size={10} />
                  {due.label}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

// ─── Task Row (list view) ─────────────────────────────────────────────────────

function TaskRow({ task, onToggle, onDelete, getRecordLabel }) {
  const [hovered, setHovered] = useState(false);
  const due = formatDueDateLabel(task.due_date);
  const recordLabel = task.record_id ? getRecordLabel(task.record_id, task.record_type) : null;
  const status = getStatus(task);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 20px',
        borderBottom: '1px solid var(--border)',
        background: hovered ? 'var(--bg-secondary)' : 'transparent',
        transition: 'background 0.1s',
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        style={{
          width: 15, height: 15, borderRadius: 4, flexShrink: 0,
          border: status === 'done' ? 'none' : '1.5px solid var(--border)',
          background: status === 'done' ? 'var(--purple)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {status === 'done' && (
          <svg width="8" height="6" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      <span style={{
        flex: 1, fontSize: 13.5,
        color: status === 'done' ? 'var(--text-muted)' : 'var(--text)',
        textDecoration: status === 'done' ? 'line-through' : 'none',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {task.title}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Status badge */}
        <span style={{
          fontSize: 11, fontWeight: 500,
          color: COLUMNS.find(c => c.id === status)?.color || 'var(--text-muted)',
          background: COLUMNS.find(c => c.id === status)?.bg || 'var(--bg-secondary)',
          padding: '2px 8px', borderRadius: 20,
        }}>
          {COLUMNS.find(c => c.id === status)?.label || status}
        </span>

        {recordLabel && (
          <span style={{
            fontSize: 11, color: RECORD_COLORS[task.record_type] || 'var(--text-muted)',
            background: `${RECORD_COLORS[task.record_type] || '#9CA3AF'}18`,
            padding: '2px 7px', borderRadius: 20, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            {recordLabel}
          </span>
        )}
        {due && (
          <span style={{
            fontSize: 11.5, fontWeight: 500,
            color: due.overdue ? '#EF4444' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Calendar size={11} />
            {due.label}
          </span>
        )}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
            style={{ color: 'var(--text-muted)', display: 'flex', padding: 2 }}
            onMouseEnter={e => e.currentTarget.style.color = '#EF4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Project filter dropdown ──────────────────────────────────────────────────

function ProjectFilter({ tasks, deals, contacts, companies, value, onChange }) {
  const [open, setOpen] = useState(false);

  const projects = useMemo(() => {
    const seen = new Set();
    const items = [{ id: null, label: 'All projects', type: null }];
    tasks.forEach(t => {
      if (!t.record_id || seen.has(t.record_id)) return;
      seen.add(t.record_id);
      const label =
        t.record_type === 'deal'    ? deals.find(d => d.id === t.record_id)?.name :
        t.record_type === 'contact' ? contacts.find(c => c.id === t.record_id)?.name :
        t.record_type === 'company' ? companies.find(c => c.id === t.record_id)?.name : null;
      if (label) items.push({ id: t.record_id, label, type: t.record_type });
    });
    return items;
  }, [tasks, deals, contacts, companies]);

  const selected = projects.find(p => p.id === value) || projects[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 'var(--radius-sm)',
          border: `1px solid ${value ? 'var(--purple)' : 'var(--border)'}`,
          background: value ? 'var(--purple-light)' : 'transparent',
          fontSize: 12.5, fontWeight: 500,
          color: value ? 'var(--purple)' : 'var(--text-secondary)',
        }}
      >
        {selected.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 100,
            background: 'var(--bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
            minWidth: 180, overflow: 'hidden',
          }}>
            {projects.map(p => {
              const Icon = p.type ? RECORD_ICONS[p.type] : null;
              return (
                <button
                  key={p.id ?? '__all'}
                  onClick={() => { onChange(p.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '8px 12px', textAlign: 'left',
                    fontSize: 13, color: p.id === value ? 'var(--purple)' : 'var(--text)',
                    background: p.id === value ? 'var(--purple-light)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (p.id !== value) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                  onMouseLeave={e => { if (p.id !== value) e.currentTarget.style.background = 'transparent'; }}
                >
                  {Icon && <Icon size={12} color={RECORD_COLORS[p.type]} />}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export default function TasksView({ tasks, contacts, companies, deals, onAddTask, onToggleTask, onDeleteTask, onUpdateTask }) {
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode,   setViewMode]   = useState('board');
  const [projectFilter, setProjectFilter] = useState(null);

  function getRecordLabel(id, type) {
    if (type === 'deal')    return deals.find(d => d.id === id)?.name    || id;
    if (type === 'contact') return contacts.find(c => c.id === id)?.name || id;
    if (type === 'company') return companies.find(c => c.id === id)?.name || id;
    return id;
  }

  const filtered = projectFilter
    ? tasks.filter(t => t.record_id === projectFilter)
    : tasks;

  function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    const newStatus = destination.droppableId;
    onUpdateTask(draggableId, {
      status:    newStatus,
      completed: newStatus === 'done',
    });
  }

  const totalPending = tasks.filter(t => getStatus(t) !== 'done').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="view-header-title">Tasks</span>
            {totalPending > 0 && (
              <span style={{
                fontSize: 12, color: 'var(--text-muted)',
                background: 'var(--bg-secondary)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)', fontWeight: 500,
              }}>
                {totalPending} pending
              </span>
            )}
          </div>
          <div className="view-header-tabs">
            <button
              className={`view-tab ${viewMode === 'board' ? 'active' : ''}`}
              onClick={() => setViewMode('board')}
            >
              <LayoutGrid size={13} /> Board
            </button>
            <button
              className={`view-tab ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={13} /> List
            </button>
          </div>
        </div>
        <div className="view-header-right">
          <ProjectFilter
            tasks={tasks}
            deals={deals}
            contacts={contacts}
            companies={companies}
            value={projectFilter}
            onChange={setProjectFilter}
          />
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <Plus size={14} />
            New task
          </button>
        </div>
      </div>

      {/* Content */}
      {tasks.length === 0 ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', flex: 1, gap: 16,
        }}>
          <div style={{ opacity: 0.25 }}>
            <CheckSquare size={56} strokeWidth={1} color="var(--text-muted)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Tasks</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              No tasks yet. Create your first task to get started.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: 13.5 }}
          >
            <Plus size={15} /> New task
          </button>
        </div>
      ) : viewMode === 'board' ? (
        /* ── Kanban Board ── */
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board" style={{
            display: 'flex', gap: 0,
            padding: '20px 24px',
            overflowX: 'auto', overflowY: 'hidden',
            height: '100%', alignItems: 'flex-start',
          }}>
            {COLUMNS.map(col => {
              const colTasks = filtered.filter(t => getStatus(t) === col.id);
              return (
                <div
                  key={col.id}
                  className="kanban-column"
                  style={{
                    width: 280, minWidth: 280, marginRight: 12,
                    display: 'flex', flexDirection: 'column', maxHeight: '100%',
                  }}
                >
                  {/* Column header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 4px 10px', flexShrink: 0,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text)' }}>{col.label}</span>
                      <span style={{
                        fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)',
                        background: 'var(--bg-secondary)', padding: '1px 7px', borderRadius: 20,
                      }}>
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCreate(true)}
                      style={{ color: 'var(--text-muted)', display: 'flex', padding: 2, borderRadius: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Droppable column */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1, overflowY: 'auto',
                          minHeight: 80,
                          padding: '4px 4px 8px',
                          borderRadius: 'var(--radius-md)',
                          background: snapshot.isDraggingOver ? col.bg : 'transparent',
                          transition: 'background 0.15s',
                        }}
                      >
                        {colTasks.map((task, index) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            index={index}
                            onToggle={onToggleTask}
                            onDelete={onDeleteTask}
                            getRecordLabel={getRecordLabel}
                          />
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      ) : (
        /* ── List View ── */
        <div className="view-content" style={{ overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks</h3>
              <p>No tasks match the current filter.</p>
            </div>
          ) : (
            <>
              {filtered.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                  getRecordLabel={getRecordLabel}
                />
              ))}
              <div style={{ padding: '12px 20px', fontSize: 12, color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}>
                {filtered.length} task{filtered.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </div>
      )}

      {showCreate && (
        <CreateTaskModal
          contacts={contacts}
          companies={companies}
          deals={deals}
          onSave={onAddTask}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
