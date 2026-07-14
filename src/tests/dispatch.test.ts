import { describe, expect, it } from 'vitest'
import { fifoDispatch, nearestDispatch, priorityDispatch } from '../simulation/dispatch/strategies'
import { createSimulation } from '../simulation/engine/createSimulation'
import type { TransportJob } from '../simulation/models/types'

const jobs: TransportJob[] = [
  { id:'JOB-OLD', lotId:'LOT-1', pickup:'STOCK', destination:'OXID', createdAt:1, priority:1, state:'queued', assignedVehicle:null },
  { id:'JOB-URGENT', lotId:'LOT-2', pickup:'PHOTO', destination:'ETCH', createdAt:2, priority:10, state:'queued', assignedVehicle:null },
]
function context() {
  const state = createSimulation()
  return { jobs: structuredClone(jobs), vehicles: state.vehicles.slice(0,2), lots: state.lots, stations: state.stations, distance: (vehicle: typeof state.vehicles[number], job: TransportJob) => vehicle.id === 'VEH-01' ? (job.id === 'JOB-URGENT' ? 1 : 20) : (job.id === 'JOB-OLD' ? 1 : 20) }
}

describe('dispatch strategies', () => {
  it('FIFO assigns the oldest request first', () => {
    expect(fifoDispatch(context())[0]).toEqual({ vehicleId:'VEH-01', jobId:'JOB-OLD' })
  })
  it('nearest vehicle minimizes pickup distance', () => {
    const assignments = nearestDispatch(context())
    expect(assignments).toContainEqual({ vehicleId:'VEH-02', jobId:'JOB-OLD' })
    expect(assignments).toContainEqual({ vehicleId:'VEH-01', jobId:'JOB-URGENT' })
  })
  it('priority dispatch selects urgent work first', () => {
    expect(priorityDispatch({ ...context(), vehicles: context().vehicles.slice(0,1) })[0].jobId).toBe('JOB-URGENT')
  })
})
