import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import DealCard, { STAGE_CONFIG, formatCurrency } from './DealCard';

const STAGES = [
  'Lead',
  'Por realizarse',
  'Por facturar',
  'Por recibir pago',
  'Pagado',
];

export default function KanbanBoard({ deals, getCompany, tasks, notes, onMoveDeal, onSelectDeal, onAddDeal, onAddTask, onAddNote }) {
  function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onMoveDeal(draggableId, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div style={{
        display: 'flex',
        gap: 0,
        padding: '20px 24px',
        overflowX: 'auto',
        overflowY: 'hidden',
        height: '100%',
        alignItems: 'flex-start',
      }}>
        {STAGES.map(stageId => {
          const config = STAGE_CONFIG[stageId];
          const stageDeals = deals.filter(d => d.stage === stageId);
          const total = stageDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

          return (
            <div
              key={stageId}
              style={{
                width: 268,
                minWidth: 268,
                marginRight: 12,
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '100%',
              }}
            >
              {/* Column header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 4px 10px',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: config.color,
                    flexShrink: 0,
                  }} />
                  <span style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}>
                    {config.label}
                  </span>
                  <span style={{
                    fontSize: 11.5,
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-secondary)',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                  }}>
                    {stageDeals.length}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {stageDeals.length > 0 && (
                    <span style={{
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                      fontWeight: 500,
                    }}>
                      {formatCurrency(total)}
                    </span>
                  )}
                  <button
                    onClick={() => onAddDeal(stageId)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-muted)',
                      transition: 'all var(--transition)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-secondary)';
                      e.currentTarget.style.color = 'var(--text)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                    title="Add deal"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={stageId}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      flex: 1,
                      overflowY: 'auto',
                      padding: '4px 4px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: snapshot.isDraggingOver
                        ? 'rgba(124,92,252,0.04)'
                        : 'transparent',
                      transition: 'background 120ms ease',
                      minHeight: 120,
                    }}
                  >
                    {stageDeals.map((deal, index) => (
                      <Draggable
                        key={String(deal.id)}
                        draggableId={String(deal.id)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              marginBottom: 8,
                              ...provided.draggableProps.style,
                            }}
                          >
                            <DealCard
                              deal={deal}
                              company={getCompany(deal.company_id)}
                              tasks={tasks}
                              notes={notes}
                              onAddTask={onAddTask}
                              onAddNote={onAddNote}
                              isDragging={snapshot.isDragging}
                              onClick={() => onSelectDeal(deal)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}

                    {stageDeals.length === 0 && !snapshot.isDraggingOver && (
                      <button
                        onClick={() => onAddDeal(stageId)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1.5px dashed var(--border)',
                          borderRadius: 'var(--radius-md)',
                          color: 'var(--text-muted)',
                          fontSize: 12.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          transition: 'all var(--transition)',
                          background: 'transparent',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = 'var(--purple-border)';
                          e.currentTarget.style.color = 'var(--purple)';
                          e.currentTarget.style.background = 'var(--purple-light)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <Plus size={13} />
                        Add deal
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
