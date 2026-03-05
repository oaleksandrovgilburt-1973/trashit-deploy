/**
 * TRASHit Job Status State Machine
 * 
 * Defines valid state transitions for service requests
 * Prevents invalid transitions like open → completed directly
 */

export type RequestStatus = 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

/**
 * Valid transitions map
 * Maps from current status to array of allowed next statuses
 */
export const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  open: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [], // Terminal state
  cancelled: [], // Terminal state
};

/**
 * Status labels in Bulgarian
 */
export const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'Отворено',
  assigned: 'Възложено',
  in_progress: 'В процес',
  completed: 'Завършено',
  cancelled: 'Отменено',
};

/**
 * Status descriptions
 */
export const STATUS_DESCRIPTIONS: Record<RequestStatus, string> = {
  open: 'Заявката е отворена и чака доставчик',
  assigned: 'Доставчик е приел заявката',
  in_progress: 'Доставчик работи по заявката',
  completed: 'Заявката е завършена',
  cancelled: 'Заявката е отменена',
};

/**
 * Check if a transition is valid
 */
export function isValidTransition(
  fromStatus: RequestStatus,
  toStatus: RequestStatus
): boolean {
  return VALID_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * Get allowed next statuses for a given status
 */
export function getAllowedTransitions(status: RequestStatus): RequestStatus[] {
  return VALID_TRANSITIONS[status];
}

/**
 * Get transition action label
 */
export function getTransitionLabel(
  fromStatus: RequestStatus,
  toStatus: RequestStatus
): string {
  if (toStatus === 'in_progress') return 'Начни работа';
  if (toStatus === 'completed') return 'Маркирай като завършена';
  if (toStatus === 'cancelled') return 'Отмени';
  return 'Промени статус';
}

/**
 * Transitions that require proof photos
 */
export const TRANSITIONS_REQUIRING_PROOF: Record<string, boolean> = {
  'in_progress->completed': true,
};

/**
 * Check if a transition requires proof photos
 */
export function requiresProofPhotos(
  fromStatus: RequestStatus,
  toStatus: RequestStatus
): boolean {
  const key = `${fromStatus}->${toStatus}`;
  return TRANSITIONS_REQUIRING_PROOF[key] || false;
}
