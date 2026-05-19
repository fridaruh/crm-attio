import { useState } from 'react';
import { Plus, LayoutGrid, List, SlidersHorizontal, Search } from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import { STAGE_CONFIG, formatCurrency } from './DealCard';
import Avatar from '../shared/Avatar';

const STAGES = [
  'qualification', 'meeting_booked', 'proposal_sent',
  'negotiation', 'closed_won', 'closed_lost',
];

export default function DealsView({
  deals, getCompany, getContact,
  onMoveDeal, onAddDeal, onSelectDeal,
}) {
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');

  const filtered = deals.filter(d =>
    d.name?.toLowerCase().includes(search.toLowerCase()) ||
    getCompany(d.company_id)?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = deals.reduce((s, d) => s + (Number(d.value) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="view-header-title">Deals</span>
            <span style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              background: 'var(--bg-secondary)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              fontWeight: 500,
            }}>
              {deals.length} deals · {formatCurrency(totalValue)}
            </span>
          </div>
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
        </div>

        <div className="view-header-right">
          <div className="search-input">
            <Search size={13} color="var(--text-muted)" />
            <input
              placeholder="Search deals…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn-secondary">
            <SlidersHorizontal size={13} />
            Filter
          </button>
          <button className="btn-primary" onClick={() => onAddDeal(null)}>
            <Plus size={14} />
            New deal
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="view-content">
        {view === 'kanban' ? (
          <KanbanBoard
            deals={filtered}
            getCompany={getCompany}
            onMoveDeal={onMoveDeal}
            onSelectDeal={onSelectDeal}
            onAddDeal={onAddDeal}
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
            const config = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.qualification;

            return (
              <tr key={deal.id} onClick={() => onSelectDeal(deal)}>
                <td>
                  <span style={{ fontWeight: 500, color: 'var(--text)' }}>
                    {deal.name}
                  </span>
                </td>
                <td>
                  {company ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 18,
                        height: 18,
                        borderRadius: 3,
                        background: '#7C5CFC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 700,
                        color: 'white',
                        flexShrink: 0,
                      }}>
                        {company.name.charAt(0)}
                      </div>
                      {company.name}
                    </div>
                  ) : '—'}
                </td>
                <td>
                  <span style={{ fontWeight: 500 }}>
                    {formatCurrency(deal.value)}
                  </span>
                </td>
                <td>
                  <span
                    className="stage-badge"
                    style={{
                      color: config.color,
                      background: config.bg,
                    }}
                  >
                    {config.label}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Avatar name={deal.owner} size="sm" />
                    <span style={{ color: 'var(--text-secondary)' }}>{deal.owner}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>
                  {deal.close_date || '—'}
                </td>
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
