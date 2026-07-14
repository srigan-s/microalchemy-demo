import { describe, expect, it } from 'vitest'
import { createSimulation } from '../simulation/engine/createSimulation'
import { shortestPath } from '../simulation/routing/graph'

describe('graph routing', () => {
  it('finds the shortest bidirectional route', () => {
    const state = createSimulation()
    const route = shortestPath(state.nodes, state.segments, 'N-STOCK', 'N-PHOTO')
    expect(route?.nodes).toEqual(['N-STOCK', 'N-OXID', 'N-PHOTO'])
    expect(route?.distance).toBe(14)
  })

  it('reroutes around a blocked segment', () => {
    const state = createSimulation()
    state.segments.find((segment) => segment.id === 'SEG-02')!.blocked = true
    const route = shortestPath(state.nodes, state.segments, 'N-OXID', 'N-PHOTO')
    expect(route).not.toBeNull()
    expect(route?.nodes).not.toEqual(['N-OXID', 'N-PHOTO'])
    expect(route?.nodes).toContain('N-METRO')
  })
})
