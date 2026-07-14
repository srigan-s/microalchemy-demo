import { describe, expect, it } from 'vitest'
import { SimulationEngine } from '../simulation/engine/SimulationEngine'

describe('simulation engine', () => {
  it('queues a lot, processes it, and creates transport work', () => {
    const engine = new SimulationEngine(7)
    const lot = engine.addLot()
    expect(engine.state.stations[0].queue).toContain(lot.id)
    for (let i = 0; i < 7; i += 1) engine.step(1)
    expect(lot.completedOperations).toContain('Wafer Stocker')
    expect(engine.state.jobs.some((job) => job.lotId === lot.id)).toBe(true)
  })

  it('recovers station processing after a fault is cleared', () => {
    const engine = new SimulationEngine()
    const faultId = engine.injectFault('station', 'PHOTO')
    expect(engine.state.stations.find((station) => station.id === 'PHOTO')?.operationalState).toBe('fault')
    engine.clearFault(faultId)
    expect(engine.state.stations.find((station) => station.id === 'PHOTO')?.operationalState).toBe('idle')
    expect(engine.state.faults.find((fault) => fault.id === faultId)?.active).toBe(false)
  })

  it('produces identical state for the same seed and inputs', () => {
    const first = new SimulationEngine(31415); const second = new SimulationEngine(31415)
    for (let i = 0; i < 5; i += 1) { first.addLot(i === 2); second.addLot(i === 2) }
    for (let i = 0; i < 160; i += 1) { first.step(.5); second.step(.5) }
    expect(first.snapshot()).toEqual(second.snapshot())
  })
})
