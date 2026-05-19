const COLORS = [
  '#7C5CFC', '#3B82F6', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899',
];

function getColor(name = '') {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[hash % COLORS.length];
}

function getInitials(name = '') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Avatar({ name = '', size = 'default', style = {} }) {
  const sizeClass = size === 'sm' ? 'avatar avatar-sm'
    : size === 'lg' ? 'avatar avatar-lg'
    : size === 'xl' ? 'avatar avatar-xl'
    : 'avatar';

  return (
    <div
      className={sizeClass}
      style={{ background: getColor(name), ...style }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

export { getColor, getInitials };
