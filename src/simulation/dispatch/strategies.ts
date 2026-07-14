import type { DispatchStrategy, ProcessStation, TransportJob, TransportVehicle, WaferLot } from '../models/types'

interface Context { jobs: TransportJob[]; vehicles: TransportVehicle[]; lots: WaferLot[]; stations: ProcessStation[]; distance: (vehicle: TransportVehicle, job: TransportJob) => number }
export interface Assignment { jobId: string; vehicleId: string }

const idle = (vehicles: TransportVehicle[]) => vehicles.filter((vehicle) => vehicle.state === 'idle' && !vehicle.faultId)
const queued = (jobs: TransportJob[]) => jobs.filter((job) => job.state === 'queued')

export function fifoDispatch(context: Context): Assignment[] {
  const jobs = queued(context.jobs).sort((a, b) => a.createdAt - b.createdAt)
  return idle(context.vehicles).map((vehicle, index) => jobs[index] ? { vehicleId: vehicle.id, jobId: jobs[index].id } : null).filter((x): x is Assignment => x !== null)
}
export function nearestDispatch(context: Context): Assignment[] {
  const available = [...idle(context.vehicles)]; const result: Assignment[] = []
  for (const job of queued(context.jobs).sort((a, b) => a.createdAt - b.createdAt)) {
    if (!available.length) break
    available.sort((a, b) => context.distance(a, job) - context.distance(b, job))
    const vehicle = available.shift()
    if (vehicle) result.push({ vehicleId: vehicle.id, jobId: job.id })
  }
  return result
}
export function priorityDispatch(context: Context): Assignment[] {
  const jobs = queued(context.jobs).sort((a, b) => b.priority - a.priority || a.createdAt - b.createdAt)
  const available = [...idle(context.vehicles)]; const result: Assignment[] = []
  for (const job of jobs) {
    if (!available.length) break
    available.sort((a, b) => context.distance(a, job) - context.distance(b, job))
    const vehicle = available.shift(); if (vehicle) result.push({ vehicleId: vehicle.id, jobId: job.id })
  }
  return result
}
export function bottleneckDispatch(context: Context): Assignment[] {
  const jobs = queued(context.jobs).sort((a, b) => {
    const sa = context.stations.find((station) => station.id === a.destination)
    const sb = context.stations.find((station) => station.id === b.destination)
    const pressureA = sa ? sa.queue.length / Math.max(1, sa.queueCapacity) + sa.utilizationTime / Math.max(1, sa.processingDuration) : 0
    const pressureB = sb ? sb.queue.length / Math.max(1, sb.queueCapacity) + sb.utilizationTime / Math.max(1, sb.processingDuration) : 0
    return pressureA - pressureB || b.priority - a.priority
  })
  const available = [...idle(context.vehicles)]; const result: Assignment[] = []
  for (const job of jobs) {
    if (!available.length) break
    available.sort((a, b) => context.distance(a, job) - context.distance(b, job))
    const vehicle = available.shift(); if (vehicle) result.push({ vehicleId: vehicle.id, jobId: job.id })
  }
  return result
}
export function dispatch(strategy: DispatchStrategy, context: Context): Assignment[] {
  return strategy === 'nearest' ? nearestDispatch(context) : strategy === 'priority' ? priorityDispatch(context) : strategy === 'bottleneck' ? bottleneckDispatch(context) : fifoDispatch(context)
}
