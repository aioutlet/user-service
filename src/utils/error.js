// Centralized error creation utility for user-service
export function createError({
  status = 500,
  code = 'INTERNAL_ERROR',
  message = 'Internal server error',
  details = null,
}) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  err.details = details;
  return err;
}
