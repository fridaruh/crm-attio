import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Area, AreaChart,
} from 'recharts';
import { TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../deals/DealCard';

const PAID_STAGE = 'Pagado';

function getMonthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key) {
  const [year, month] = key.split('-');
  const d = new Date(parseInt(year), parseInt(month) - 1);
  return d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
}

function buildMonthlyData(deals) {
  const paidDeals = deals.filter(d => d.stage === PAID_STAGE && d.value > 0);
  const byMonth = {};
  paidDeals.forEach(deal => {
    const key = getMonthKey(deal.date || deal.created_at);
    if (!key) return;
    byMonth[key] = (byMonth[key] || 0) + Number(deal.value);
  });
  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total]) => ({ month: formatMonthLabel(key), total }));
}

function buildCumulativeData(monthlyData) {
  let running = 0;
  return monthlyData.map(({ month, total }) => {
    running += total;
    return { month, total, acumulado: running };
  });
}

function buildFunnelData(deals) {
  const stages = ['Lead', 'Por realizarse', 'Por facturar', 'Por recibir pago', 'Pagado'];
  return stages.map(stage => {
    const stageDeals = deals.filter(d => d.stage === stage);
    const total = stageDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    return { stage, count: stageDeals.length, total };
  });
}

const CHART_COLORS = {
  primary: '#7C5CFC',
  green: '#10B981',
  blue: '#3B82F6',
  amber: '#F59E0B',
};

const CustomTooltip = ({ active, payload, label, prefix = '$' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'white',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '8px 12px',
      boxShadow: 'var(--shadow-md)',
      fontSize: 12.5,
    }}>
      <div style={{ fontWeight: 500, marginBottom: 4, color: 'var(--text-secondary)' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>
          {formatCurrency(p.value)}
        </div>
      ))}
    </div>
  );
};

export default function IncomeReport({ deals }) {
  const paidDeals = deals.filter(d => d.stage === PAID_STAGE && d.value > 0);
  const inPipeline = deals
    .filter(d => d.stage !== PAID_STAGE)
    .reduce((s, d) => s + (Number(d.value) || 0), 0);
  const totalPaid = paidDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const totalDeals = deals.length;

  const monthlyData = buildMonthlyData(deals);
  const cumulativeData = buildCumulativeData(monthlyData);
  const funnelData = buildFunnelData(deals);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div className="view-header">
        <div className="view-header-left">
          <span className="view-header-title">Income Report</span>
          <div className="view-header-tabs">
            <button className="view-tab active">Overview</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 28,
        }}>
          <KPICard
            icon={CheckCircle}
            iconColor="#10B981"
            label="Total cobrado"
            value={formatCurrency(totalPaid)}
            sub={`${paidDeals.length} deals pagados`}
          />
          <KPICard
            icon={Clock}
            iconColor="#3B82F6"
            label="En pipeline"
            value={formatCurrency(inPipeline)}
            sub={`${totalDeals - paidDeals.length} deals activos`}
          />
          <KPICard
            icon={DollarSign}
            iconColor="#F59E0B"
            label="Ticket promedio"
            value={paidDeals.length > 0 ? formatCurrency(totalPaid / paidDeals.length) : '—'}
            sub="por deal pagado"
          />
          <KPICard
            icon={TrendingUp}
            iconColor="#7C5CFC"
            label="Total deals"
            value={totalDeals}
            sub="en el pipeline"
          />
        </div>

        {/* Monthly bar chart */}
        <ChartCard title="Ingresos por mes" subtitle="Deals marcados como Pagado">
          {monthlyData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={36} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11.5, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                  width={48}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(124,92,252,0.06)' }} />
                <Bar dataKey="total" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Bottom row: Funnel + Cumulative */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>

          {/* Pipeline funnel */}
          <ChartCard title="Pipeline por etapa" subtitle="Valor total de deals en cada etapa">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={funnelData}
                layout="vertical"
                barSize={20}
                margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  tick={{ fontSize: 11.5, fill: '#5A5A5A' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const d = funnelData.find(f => f.stage === label);
                    return (
                      <div style={{
                        background: 'white', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)', padding: '8px 12px',
                        boxShadow: 'var(--shadow-md)', fontSize: 12.5,
                      }}>
                        <div style={{ fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4 }}>{label}</div>
                        <div style={{ fontWeight: 600 }}>{formatCurrency(payload[0]?.value)}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{d?.count} deals</div>
                      </div>
                    );
                  }}
                  cursor={{ fill: 'rgba(124,92,252,0.06)' }}
                />
                <Bar dataKey="total" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Cumulative revenue */}
          <ChartCard title="Revenue acumulado" subtitle="Total cobrado a lo largo del tiempo">
            {cumulativeData.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={cumulativeData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.green} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={CHART_COLORS.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11.5, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: CHART_COLORS.green, strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="acumulado"
                    stroke={CHART_COLORS.green}
                    strokeWidth={2}
                    fill="url(#greenGrad)"
                    dot={{ fill: CHART_COLORS.green, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, fill: CHART_COLORS.green }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: iconColor + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 450 }}>{label}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div style={{
      background: 'var(--bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 20px 16px',
    }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyChart() {
  return (
    <div style={{
      height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontSize: 13,
    }}>
      No hay datos disponibles
    </div>
  );
}
