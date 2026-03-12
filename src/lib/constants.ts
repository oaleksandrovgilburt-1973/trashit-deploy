/**
 * Application Constants
 * Centralized constants for status labels, colors, and other configuration
 */

import { RequestStatus } from './stateMachine';

/**
 * Status labels in Bulgarian
 */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Отворено',
  assigned: 'Възложено',
  in_progress: 'В процес',
  completed: 'Завършено',
  cancelled: 'Отменено',
};

/**
 * Status colors for UI display
 */
export const REQUEST_STATUS_COLORS: Record<RequestStatus, string> = {
  open: 'blue',
  assigned: 'purple',
  in_progress: 'yellow',
  completed: 'green',
  cancelled: 'red',
};

/**
 * Status badge styles
 */
export const STATUS_BADGE_STYLES: Record<RequestStatus, string> = {
  open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
