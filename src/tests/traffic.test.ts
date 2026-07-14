import { describe, expect, it } from 'vitest'
import { createSimulation } from '../simulation/engine/createSimulation'
import { occupySegment, releaseSegment, reserveSegment } from '../simulation/traffic/reservations'

describe('segment traffic management', () => {
  it('reserves and releases a constrained segment', () => {
    const segment = createSimulation().segments[0]
    expect(reserveSegment(segment, 'VEH-01')).toBe(true)
    expect(segment.reservedBy).toBe('VEH-01')
    releaseSegment(segment, 'VEH-01')
    expect(segment.reservedBy).toBeNull()
  })

  it('prevents two vehicles occupying the same segment', () => {
    const segment = createSimulation().segments[0]
    expect(occupySegment(segment, 'VEH-01')).toBe(true)
    expect(occupySegment(segment, 'VEH-02')).toBe(false)
    expect(segment.occupiedBy).toBe('VEH-01')
  })
})
