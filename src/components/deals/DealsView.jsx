import { useState } from 'react';
import { Plus, LayoutGrid, List, SlidersHorizontal, Search, Archive, ArchiveRestore } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import { STAGE_CONFIG, formatCurrency } from './DealCard';
import Avatar from '../shared/Avatar';

export default function DealsView({
  deals, tasks, notes, getCompany, getContact,
  onMoveDeal, onAddDeal, onSelectDeal, onArchiveDeal, onAddTask, onAddNote,
}) {
  const [view, setView]               = useState('kanban');
  const [search, setSearch]           = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const activeDeals   = deals.filter(d => !d.archived);
  const archivedDeals = deals.filter(d =>  d.archived);

  const filtered = (showArchived ? archivedDeals : activeDeals).filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    getCompany(d.company_id)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = activeDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="view-header-title">
              {showArchived ? 'Archived deals' : 'Deals'}
            </span>
            {!showArchived && (
              <span style={{
                fontSize: 12, color: 'var(--text-muted)',
                background: 'var(--bg-secondary)', padding: '2px 8px',
                borderRadius: 'var(--radius-full)', fontWeight: 500,
              }}>
                {activeDeals.length} deals · {formatCurrency(totalValue)}
              </span>
            )}
            {archivedDeals.length > 0 && (
              <button
                onClick={() => setShowArchived(p => !p)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 12, fontWeight: 500, padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--border)',
                  color: showArchived ? 'var(--purple)' : 'var(--text-muted)',
                  background: showArchived ? 'var(--purple-light)' : 'transparent',
                }}
                onMouseEnter={e => { if (!showArchived) e.currentTarget.style.background = 'var(--bg-secondary)'; }}
                onMouseLeave={e => { if (!showArchived) e.currentTarget.style.background = 'transparent'; }}
              >
                <Archive size={11} />
                {archivedDeals.length} archived
              </button>
            )}
          </div>

          {!showArchived && (
            <div className="view-header-tabs">
              <button
                className={`view-tab ${view === 'kanban' ? 'active' : ''}`}
                onClick={() => setView('kanban')}
              >
                <LayoutGrid size={13} />
                Board
              </button>
              <button
                className={`view-tab ${view === 'table' ? 'active' : ''}`}
                onClick={() => setView('table')}
              >
                <List size={13} />
                Table
              </button>
            </div>
          )}
        </div>

        <div className="view-header-right">
          <div className="search-input">
            <Search size={13} color="var(--text-muted)" />
            <input
              placeholder={showArchived ? 'Search archived…' : 'Search deals…'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {!showArchived && (
            <>
              <button className="btn-secondary">
                <SlidersHorizontal size={13} />
                Filter
              </button>
              <button className="btn-primary" onClick={() => onAddDeal(null)}>
                <Plus size={14} />
                New deal
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="view-content">
        {showArchived ? (
          <ArchivedTable
            deals={filtered}
            getCompany={getCompany}
            onSelectDeal={onSelectDeal}
            onUnarchive={(id) => onArchiveDeal(id, false)}
          />
        ) : view === 'kanban' ? (
          <KanbanBoard
            deals={filtered}
            tasks={tasks}
            notes={notes}
            getCompany={getCompany}
            onMoveDeal={onMoveDeal}
            onSelectDeal={onSelectDeal}
            onAddDeal={onAddDeal}
            onAddTask={onAddTask}
            onAddNote={onAddNote}
          />
        ) : (
          <DealsTable
            deals={filtered}
            getCompany={getCompany}
            onSelectDeal={onSelectDeal}
          />
        )}
      </div>
    </div>
  );
}

function DealsTable({ deals, getCompany, onSelectDeal }) {
  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Deal</th>
            <th>Company</th>
            <th>Value</th>
            <th>Stage</th>
            <th>Owner</th>
            <th>Close Date</th>
          </tr>
        </thead>
        <tbody>
          {deals.map(deal => {
            const company = getCompany(deal.company_id);
            const config = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.Lead;

            return (
              <tr key={deal.id} onClick={() => onSelectDeal(deal)}>
                <td>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>{deal.name}</span>
                </td>
                <td>
                  {company ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 3, background: '#7C5CFC',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {company.name.charAt(0)}
                      </div>
                      {company.name}
                    </div>
                  ) : '—'}
                </td>
                <td><span style={{ fontWeight: 500 }}>{formatCurrency(deal.value)}</span></td>
                <td>
                  <span className="stage-badge" style={{ color: config?.color, background: config?.bg }}>
                    {config?.label || deal.stage}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={deal.owner} size="sm" />
                    <span style={{ color: 'var(--text-secondary)' }}>{deal.owner}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{deal.close_date || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {deals.length === 0 && (
        <div className="empty-state">
          <h3>No deals found</h3>
          <p>Try adjusting your search or create a new deal.</p>
        </div>
      )}
    </div>
  );
}

function ArchivedTable({ deals, getCompany, onSelectDeal, onUnarchive }) {
  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {deals.length === 0 ? (
        <div className="empty-state">
          <h3>No archived deals</h3>
          <p>Archived deals will appear here.</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Deal</th>
              <th>Company</th>
              <th>Value</th>
              <th>Stage</th>
              <th>Owner</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {deals.map(deal => {
              const company = getCompany(deal.company_id);
              const config  = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.Lead;

              return (
                <tr key={deal.id} onClick={() => onSelectDeal(deal)} style={{ opacity: 0.7 }}>
                  <td>
                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>{deal.name}</span>
                  </td>
                  <td>
                    {company ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 3, background: '#9CA3AF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0,
                        }}>
                          {company.name.charAt(0)}
                        </div>
                        {company.name}
                      </div>
                    ) : '—'}
                  </td>
                  <td><span style={{ fontWeight: 500 }}>{formatCurrency(deal.value)}</span></td>
                  <td>
                    <span className="stage-badge" style={{ color: config?.color, background: config?.bg }}>
                      {config?.label || deal.stage}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Avatar name={deal.owner} size="sm" />
                      <span style={{ color: 'var(--text-secondary)' }}>{deal.owner}</span>
                    </div>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onUnarchive(deal.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 500, padding: '4px 10px',
                        borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
                        color: 'var(--text-secondary)', background: 'transparent',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <ArchiveRestore size={12} />
                      Unarchive
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
