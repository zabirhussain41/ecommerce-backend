import { describe, it, expect } from 'vitest'
import { formatPrice, formatDate, titleCase, ORDER_STATUS_STYLES } from '../utils/format'

describe('format utils', () => {
  it('formats prices as USD', () => {
    expect(formatPrice(19.9)).toBe('$19.90')
    expect(formatPrice('5')).toBe('$5.00')
    expect(formatPrice(null)).toBe('$0.00')
  })

  it('formats dates safely', () => {
    expect(formatDate('2025-01-15T10:00:00')).toContain('2025')
    expect(formatDate(null)).toBe('—')
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('title-cases enum values', () => {
    expect(titleCase('IN_PROGRESS')).toBe('In Progress')
    expect(titleCase(null)).toBe('—')
  })

  it('has styles for all order statuses', () => {
    for (const s of ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']) {
      expect(ORDER_STATUS_STYLES[s]).toBeTruthy()
    }
  })
})
