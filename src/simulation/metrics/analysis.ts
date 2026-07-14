import type { MetricsSnapshot, ProcessStation, SimulationState } from '../models/types'

export interface BottleneckAnalysis { stationId: string | null; name: string; confidence: number; explanation: string; recommendation: string }

const mean = (values: number[]): number => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

export function calculateMetrics(state: SimulationState): MetricsSnapshot {
  const completed = state.lots.filter((lot) => lot.status === 'complete')
  const activeVehicles = state.vehicles.reduce((sum, vehicle) => sum + vehicle.activeTime, 0)
  const stationActive = state.stations.reduce((sum, station) => sum + station.utilizationTime, 0)
  return {
    time: state.time, total: state.lots.length, completed: completed.length,
    wip: state.lots.filter((lot) => lot.status !== 'complete').length,
    processing: state.lots.filter((lot) => lot.status === 'processing').length,
    awaiting: state.lots.filter((lot) => lot.status === 'awaiting-transport').length,
    avgCycle: mean(completed.map((lot) => (lot.history.at(-1)?.time ?? state.time) - lot.creationTime)),
    avgTransport: mean(state.lots.map((lot) => lot.transportTime)), avgQueue: mean(state.lots.map((lot) => lot.waitingTime)),
    throughput: state.time > 0 ? completed.length / (state.time / 3600) : 0,
    onTime: completed.length ? completed.filter((lot) => (lot.history.at(-1)?.time ?? 0) <= lot.dueTime).length / completed.length * 100 : 100,
    vehicleUtilization: state.time && state.vehicles.length ? activeVehicles / (state.time * state.vehicles.length) * 100 : 0,
    stationUtilization: state.time && state.stations.length ? stationActive / (state.time * state.stations.length) * 100 : 0,
    distance: state.vehicles.reduce((sum, vehicle) => sum + vehicle.distanceTravelled, 0), congestion: state.congestionEvents,
  }
}

export function analyzeBottleneck(state: SimulationState): BottleneckAnalysis {
  if (!state.stations.length) return { stationId: null, name: 'None', confidence: 0, explanation: 'No station data.', recommendation: 'Run the simulation to collect data.' }
  const scored = state.stations.filter((station) => station.id !== 'STOCK' && station.id !== 'DONE').map((station) => {
    const utilization = state.time ? station.utilizationTime / state.time : 0
    const queuePressure = station.queue.length / Math.max(1, station.queueCapacity)
    const capacityPressure = station.processingDuration / 32
    const downstream = state.lots.filter((lot) => lot.destination === station.id && lot.status === 'awaiting-transport').length / 5
    return { station, score: utilization * .42 + queuePressure * .32 + capacityPressure * .16 + downstream * .1, utilization, queuePressure }
  }).sort((a, b) => b.score - a.score)
  const top = scored[0]
  const second = scored[1]?.score ?? 0
  const confidence = Math.min(96, Math.round(55 + Math.max(0, top.score - second) * 100))
  return {
    stationId: top.station.id, name: top.station.name, confidence,
    explanation: `${top.station.name} combines ${Math.round(top.utilization * 100)}% utilization with ${top.station.queue.length} queued lot${top.station.queue.length === 1 ? '' : 's'} and ${top.station.processingDuration}s nominal processing time.`,
    recommendation: top.queuePressure > .5 ? `Consider parallel ${top.station.processType.toLowerCase()} capacity or slower lot release.` : 'Monitor lot-release timing and compare bottleneck-aware dispatch.',
  }
}

export function stationUtilization(station: ProcessStation, time: number): number {
  return time ? station.utilizationTime / time * 100 : 0
}
