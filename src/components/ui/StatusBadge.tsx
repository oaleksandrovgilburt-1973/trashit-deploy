import { type RequestStatus } from '@/lib/database.types';

interface StatusBadgeProps {
  status: RequestStatus;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig = {
  open: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-300',
    label: 'Отворено',
  },
  assigned: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-800 dark:text-yellow-300',
    label: 'Възложено',
  },
  in_progress: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-800 dark:text-purple-300',
    label: 'В процес',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-800 dark:text-green-300',
    label: 'Завършено',
  },
  cancelled: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-300',
    label: 'Отменено',
  },
};

const sizeConfig = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
  lg: 'px-4 py-2 text-base',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClass = sizeConfig[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bg} ${config.text} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}
