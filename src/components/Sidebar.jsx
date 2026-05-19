import {
  Home, Users, Building2, TrendingUp, CheckSquare,
  BarChart2, Zap, Settings, Search, Bell, ChevronDown,
  LineChart,
} from 'lucide-react';

const AVATAR_COLORS = ['#7C5CFC', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

function workspaceColor(name) {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
];

const recordItems = [
  { id: 'contacts', label: 'People', icon: Users },
  { id: 'companies', label: 'Companies', icon: Building2 },
  { id: 'deals', label: 'Deals', icon: TrendingUp },
];

const bottomItems = [
  { id: 'income_report', label: 'Income Report', icon: LineChart },
  { id: 'automations', label: 'Automations', icon: Zap },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ currentView, onNavigate }) {
  const workspace = 'My Workspace';
  const color = workspaceColor(workspace);

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--sidebar-bg)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      flexShrink: 0,
      borderRight: '1px solid var(--sidebar-border)',
    }}>
      {/* Workspace header */}
      <div style={{
        padding: '12px 10px',
        borderBottom: '1px solid var(--sidebar-border)',
      }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-item-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-xs)',
            background: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
          }}>
            {workspace.charAt(0)}
          </div>
          <span style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--sidebar-text-active)',
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {workspace}
          </span>
          <ChevronDown size={13} color="var(--sidebar-text)" />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 10px 6px' }}>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            transition: 'background var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-item-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <Search size={14} color="var(--sidebar-text)" />
          <span style={{ fontSize: 13, color: 'var(--sidebar-text)', flex: 1, textAlign: 'left' }}>
            Search
          </span>
          <span style={{
            fontSize: 11,
            color: 'var(--sidebar-section-text)',
            background: 'var(--sidebar-item-hover)',
            padding: '1px 5px',
            borderRadius: 3,
          }}>⌘K</span>
        </button>
      </div>

      {/* Nav items */}
      <nav style={{ padding: '4px 10px', flex: 0 }}>
        {navItems.map(item => (
          <SidebarItem
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </nav>

      {/* Records section */}
      <div style={{ padding: '12px 10px 4px', flex: 0 }}>
        <SectionLabel label="Records" />
        {recordItems.map(item => (
          <SidebarItem
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom items */}
      <div style={{
        padding: '4px 10px 12px',
        borderTop: '1px solid var(--sidebar-border)',
      }}>
        {bottomItems.map(item => (
          <SidebarItem
            key={item.id}
            item={item}
            active={currentView === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}
      </div>
    </aside>
  );
}

function SidebarItem({ item, active, onClick }) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 8px',
        borderRadius: 'var(--radius-sm)',
        background: active ? 'var(--purple-light)' : 'transparent',
        transition: 'background var(--transition)',
        marginBottom: 1,
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = 'var(--sidebar-item-hover)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = active ? 'var(--purple-light)' : 'transparent';
      }}
    >
      <Icon
        size={15}
        color={active ? 'var(--purple)' : 'var(--sidebar-text)'}
        strokeWidth={active ? 2 : 1.75}
      />
      <span style={{
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        color: active ? 'var(--purple)' : 'var(--sidebar-text)',
      }}>
        {item.label}
      </span>
    </button>
  );
}

function SectionLabel({ label }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 500,
      color: 'var(--sidebar-section-text)',
      padding: '2px 8px 6px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {label}
    </div>
  );
}
