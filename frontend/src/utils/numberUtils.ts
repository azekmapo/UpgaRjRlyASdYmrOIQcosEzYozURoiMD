/**
 * Safely converts a value to a number, returning 0 if invalid
 */
export const safeNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === "") {
    return 0
  }

  const num = Number(value)
  return isNaN(num) ? 0 : num
}

/**
 * Safely formats a number to a fixed decimal places
 */
export const safeToFixed = (value: number, decimals = 2): string => {
  if (isNaN(value) || !isFinite(value)) {
    return "0." + "0".repeat(decimals)
  }
  return value.toFixed(decimals)
}

/**
 * Calculates the sum of multiple values safely
 */
export const safeSum = (...values: (number | undefined)[]): number => {
  return values.reduce((sum, value) => sum + safeNumber(value), 0)
}

/**
 * Calculates percentage safely, avoiding division by zero
 */
export const safePercentage = (value: number, total: number): number => {
  if (isNaN(value) || isNaN(total) || total === 0) {
    return 0
  }
  return Math.min((value / total) * 100, 100)
}
