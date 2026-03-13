/**
 * validators.js
 * Input validation helpers for battery API endpoints.
 */

function isValidCapacity(value) {
  return typeof value === 'number' && isFinite(value) && value >= 0;
}

function validateBatchRequest(body) {
  const { presentCapacities, ratedCapacity } = body;

  if (!Array.isArray(presentCapacities)) {
    return { valid: false, error: 'presentCapacities must be an array of numbers' };
  }
  if (presentCapacities.length === 0) {
    return { valid: false, error: 'presentCapacities array cannot be empty' };
  }
  for (let i = 0; i < presentCapacities.length; i++) {
    if (!isValidCapacity(presentCapacities[i])) {
      return { valid: false, error: `Invalid value at index ${i}: must be a non-negative number` };
    }
  }
  if (ratedCapacity !== undefined && (!isValidCapacity(ratedCapacity) || ratedCapacity <= 0)) {
    return { valid: false, error: 'ratedCapacity must be a positive number' };
  }

  return { valid: true };
}

function validateSingleRequest(body) {
  const { presentCapacity, ratedCapacity } = body;

  if (!isValidCapacity(presentCapacity)) {
    return { valid: false, error: 'presentCapacity must be a non-negative number' };
  }
  if (ratedCapacity !== undefined && (!isValidCapacity(ratedCapacity) || ratedCapacity <= 0)) {
    return { valid: false, error: 'ratedCapacity must be a positive number' };
  }

  return { valid: true };
}

module.exports = { isValidCapacity, validateBatchRequest, validateSingleRequest };
