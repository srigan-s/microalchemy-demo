import { dispatch } from '../dispatch/strategies'
import { analyzeBottleneck, calculateMetrics } from '../metrics/analysis'
import type { DispatchStrategy, EventCategory, FaultKind, ProcessStation, SimulationEvent, SimulationState, TransportJob, TransportVehicle, WaferLot } from '../models/types'
import { segmentBetween, shortestPath } from '../routing/graph'
import { occupySegment, releaseSegment, reserveSegment } from '../traffic/reservations'
import { createSimulation, recipe } from './createSimulation'

export class SimulationEngine {
  state: SimulationState
  constructor(seed = 42) { this.state = createSimulation(seed) }

  reset(seed = this.state.config.seed): void { this.state = createSimulation(seed) }
  snapshot(): SimulationState { return structuredClone(this.state) }
  private event(severity: SimulationEvent['severity'], source: string, type: EventCategory, message: string, refs: Partial<Pick<SimulationEvent, 'lotId' | 'vehicleId' | 'stationId'>> = {}): void {
    this.state.eventSequence += 1
    this.state.events.unshift({ id: `EVT-${this.state.eventSequence}`, timestamp: this.state.time, severity, source, type, message, ...refs })
    if (this.state.events.length > 600) this.state.events.length = 600
  }
  addLot(urgent = false): WaferLot {
    this.state.lotSequence += 1
    const id = `LOT-${String(this.state.lotSequence).padStart(3, '0')}`
    const lot: WaferLot = {
      id, currentOperation: 0, currentLocation: 'STOCK', destination: null, priority: urgent ? 10 : 1,
      creationTime: this.state.time, waitingTime: 0, processingTime: 0, transportTime: 0,
      status: 'queued', completedOperations: [], dueTime: this.state.time + (urgent ? 170 : 240),
      history: [{ time: this.state.time, type: 'arrival', message: 'Released to wafer stocker' }], faults: [],
    }
    this.state.lots.push(lot); this.station('STOCK').queue.push(id)
    this.event('info', 'Scheduler', 'scheduling', `${id} released${urgent ? ' as urgent' : ''}.`, { lotId: id, stationId: 'STOCK' })
    return lot
  }
  private station(id: string): ProcessStation { return this.state.stations.find((station) => station.id === id)! }
  private nodeForStation(id: string): string { return this.state.nodes.find((node) => node.stationId === id)!.id }
  private createJob(lot: WaferLot, pickup: string, destination: string): void {
    this.state.jobSequence += 1
    const job: TransportJob = { id: `JOB-${String(this.state.jobSequence).padStart(3, '0')}`, lotId: lot.id, pickup, destination, createdAt: this.state.time, priority: lot.priority, state: 'queued', assignedVehicle: null }
    this.state.jobs.push(job); lot.status = 'awaiting-transport'; lot.destination = destination
    this.event('info', 'Scheduler', 'scheduling', `${job.id} created for ${lot.id}: ${pickup} → ${destination}.`, { lotId: lot.id })
  }
  private route(vehicle: TransportVehicle, destinationStation: string): boolean {
    const result = shortestPath(this.state.nodes, this.state.segments, vehicle.currentNode, this.nodeForStation(destinationStation))
    if (!result) { vehicle.state = 'blocked'; return false }
    vehicle.destination = destinationStation; vehicle.route = result.nodes; vehicle.routeIndex = 0; vehicle.segmentProgress = 0
    return true
  }
  private assignJobs(): void {
    const heldLots = new Set(this.state.faults.filter((fault) => fault.active && fault.kind === 'carrier-id').map((fault) => fault.targetId))
    const assignments = dispatch(this.state.config.strategy, {
      jobs: this.state.jobs.filter((job) => !heldLots.has(job.lotId)), vehicles: this.state.vehicles, lots: this.state.lots, stations: this.state.stations,
      distance: (vehicle, job) => shortestPath(this.state.nodes, this.state.segments, vehicle.currentNode, this.nodeForStation(job.pickup))?.distance ?? 9999,
    })
    for (const assignment of assignments) {
      const vehicle = this.state.vehicles.find((item) => item.id === assignment.vehicleId)!
      const job = this.state.jobs.find((item) => item.id === assignment.jobId)!
      job.state = 'assigned'; job.assignedVehicle = vehicle.id; vehicle.assignedJob = job.id; vehicle.state = 'to-pickup'
      if (!this.route(vehicle, job.pickup)) { job.state = 'queued'; job.assignedVehicle = null; vehicle.assignedJob = null }
      this.event('info', vehicle.id, 'transport', `${vehicle.id} assigned ${job.id}.`, { vehicleId: vehicle.id, lotId: job.lotId })
    }
  }
  private arriveAtDestination(vehicle: TransportVehicle): void {
    const job = this.state.jobs.find((item) => item.id === vehicle.assignedJob)
    if (!job) { vehicle.state = 'idle'; vehicle.destination = null; return }
    const lot = this.state.lots.find((item) => item.id === job.lotId)!
    if (vehicle.state === 'to-pickup') {
      vehicle.payload = lot.id; lot.status = 'in-transit'; lot.currentLocation = vehicle.id
      lot.history.push({ time: this.state.time, type: 'departure', message: `Picked up from ${job.pickup} by ${vehicle.id}` })
      vehicle.state = 'delivering'; this.route(vehicle, job.destination)
      this.event('info', vehicle.id, 'transport', `${vehicle.id} picked up ${lot.id}.`, { vehicleId: vehicle.id, lotId: lot.id })
      return
    }
    const station = this.station(job.destination)
    station.queue.push(lot.id); lot.currentLocation = station.id; lot.destination = null; lot.status = 'queued'
    lot.history.push({ time: this.state.time, type: 'arrival', message: `Delivered to ${station.name}` })
    vehicle.payload = null; vehicle.assignedJob = null; vehicle.destination = null; vehicle.route = []; vehicle.state = 'idle'; vehicle.completedDeliveries += 1
    job.state = 'complete'
    this.event('info', vehicle.id, 'transport', `${lot.id} delivered to ${station.name}.`, { vehicleId: vehicle.id, lotId: lot.id, stationId: station.id })
  }
  private moveVehicle(vehicle: TransportVehicle, dt: number): void {
    if (vehicle.state === 'idle' || vehicle.state === 'fault' || vehicle.route.length === 0) return
    if (vehicle.routeIndex >= vehicle.route.length - 1) { this.arriveAtDestination(vehicle); return }
    const from = vehicle.route[vehicle.routeIndex], to = vehicle.route[vehicle.routeIndex + 1]
    const segment = segmentBetween(this.state.segments, from, to)
    if (!segment || segment.blocked || !segment.enabled) {
      const destination = vehicle.destination
      if (destination && this.route(vehicle, destination)) this.event('warning', vehicle.id, 'transport', `${vehicle.id} rerouted because ${segment?.id ?? 'a link'} is unavailable.`, { vehicleId: vehicle.id, lotId: vehicle.payload ?? undefined })
      else { vehicle.state = 'blocked'; vehicle.blockedTime += dt }
      return
    }
    if (!reserveSegment(segment, vehicle.id)) {
      if (vehicle.state !== 'blocked') { this.state.congestionEvents += 1; this.event('warning', 'Traffic', 'transport', `${vehicle.id} waiting for ${segment.id}.`, { vehicleId: vehicle.id }) }
      vehicle.state = 'blocked'; vehicle.blockedTime += dt; return
    }
    occupySegment(segment, vehicle.id)
    if (vehicle.state === 'blocked') vehicle.state = vehicle.payload ? 'delivering' : 'to-pickup'
    vehicle.currentRailSegment = segment.id; vehicle.activeTime += dt
    const travel = vehicle.speed * dt; vehicle.segmentProgress += travel / segment.length
    const a = this.state.nodes.find((node) => node.id === from)!.position, b = this.state.nodes.find((node) => node.id === to)!.position
    const p = Math.min(1, vehicle.segmentProgress)
    vehicle.position = [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p, a[2] + (b[2] - a[2]) * p]
    vehicle.distanceTravelled += travel; vehicle.battery = Math.max(15, vehicle.battery - travel * .004)
    if (vehicle.payload) this.state.lots.find((lot) => lot.id === vehicle.payload)!.transportTime += dt
    if (vehicle.segmentProgress >= 1) {
      vehicle.position = [...b]; vehicle.currentNode = to; vehicle.routeIndex += 1; vehicle.segmentProgress = 0
      releaseSegment(segment, vehicle.id); vehicle.currentRailSegment = null
      if (vehicle.routeIndex >= vehicle.route.length - 1) this.arriveAtDestination(vehicle)
    }
  }
  private processStations(dt: number): void {
    const emergency = this.state.faults.some((fault) => fault.active && fault.kind === 'emergency-stop')
    for (const station of this.state.stations) {
      if (station.operationalState === 'fault' || station.operationalState === 'offline') continue
      if (!station.currentLot && station.queue.length) {
        station.currentLot = station.queue.shift() ?? null; station.progress = 0; station.operationalState = 'processing'
        const lot = this.state.lots.find((item) => item.id === station.currentLot)!
        lot.status = 'processing'; this.event('info', station.name, 'processing', `${lot.id} began ${station.processType.toLowerCase()}.`, { lotId: lot.id, stationId: station.id })
      }
      if (station.currentLot && !(emergency && this.state.config.emergencyStopsProcessing)) {
        station.utilizationTime += dt; station.totalProcessingTime += dt
        const lot = this.state.lots.find((item) => item.id === station.currentLot)!
        lot.processingTime += dt; station.progress += dt / (station.processingDuration * station.delayedMultiplier)
        if (station.progress >= 1) {
          station.completedLotCount += 1; lot.completedOperations.push(station.name)
          lot.history.push({ time: this.state.time, type: 'processing', message: `Completed ${station.name}` })
          this.event('info', station.name, 'processing', `${lot.id} completed ${station.name}.`, { lotId: lot.id, stationId: station.id })
          station.currentLot = null; station.progress = 0; station.operationalState = 'idle'
          if (station.id === 'DONE') {
            lot.status = 'complete'; lot.destination = null; lot.history.push({ time: this.state.time, type: 'arrival', message: 'Lot completed' })
            this.event('info', 'Scheduler', 'completion', `${lot.id} completed the demonstration recipe.`, { lotId: lot.id, stationId: 'DONE' })
          } else {
            lot.currentOperation += 1; this.createJob(lot, station.id, recipe.stationIds[lot.currentOperation])
          }
        }
      }
      for (const lotId of station.queue) this.state.lots.find((lot) => lot.id === lotId)!.waitingTime += dt
    }
  }
  step(dt = 1): void {
    const clamped = Math.min(2, Math.max(.05, dt)); this.state.time += clamped
    if (this.state.time >= this.state.nextAutoRelease && this.state.lots.filter((lot) => lot.status !== 'complete').length < 25) {
      this.addLot(false); this.state.nextAutoRelease += this.state.config.lotReleaseInterval
    }
    this.processStations(clamped)
    const emergency = this.state.faults.some((fault) => fault.active && fault.kind === 'emergency-stop')
    if (!emergency) { this.assignJobs(); for (const vehicle of this.state.vehicles) this.moveVehicle(vehicle, clamped) }
    else for (const vehicle of this.state.vehicles) if (vehicle.state !== 'idle') vehicle.blockedTime += clamped
    if (Math.floor(this.state.time / 5) > Math.floor((this.state.time - clamped) / 5)) this.state.history.push(calculateMetrics(this.state))
    if (this.state.history.length > 180) this.state.history.shift()
  }
  injectFault(kind: FaultKind, targetId?: string): string {
    this.state.faultSequence += 1
    const activeLot = this.state.lots.find((lot) => lot.status !== 'complete')?.id
    const fallback = kind === 'station' || kind === 'delay' ? 'PHOTO' : kind === 'rail' ? 'SEG-02' : kind === 'vehicle' ? 'VEH-01' : kind === 'metrology-reject' ? 'METRO' : kind === 'carrier-id' ? activeLot ?? 'SYSTEM' : 'SYSTEM'
    const target = targetId ?? fallback; const id = `FLT-${String(this.state.faultSequence).padStart(3, '0')}`
    this.state.faults.push({ id, kind, targetId: target, startedAt: this.state.time, active: true, message: `${kind.replaceAll('-', ' ')} at ${target}` })
    if (kind === 'station') { const station = this.station(target); station.operationalState = 'fault'; station.faultId = id }
    if (kind === 'delay') { const station = this.station(target); station.delayedMultiplier = 2 }
    if (kind === 'rail') { const segment = this.state.segments.find((item) => item.id === target); if (segment) segment.blocked = true }
    if (kind === 'vehicle') { const vehicle = this.state.vehicles.find((item) => item.id === target); if (vehicle) { vehicle.state = 'fault'; vehicle.faultId = id; if (vehicle.currentRailSegment) releaseSegment(this.state.segments.find((s) => s.id === vehicle.currentRailSegment)!, vehicle.id) } }
    if (kind === 'carrier-id') { const lot = this.state.lots.find((item) => item.id === target); if (lot) lot.faults.push(id) }
    if (kind === 'metrology-reject') {
      const lot = this.state.lots.find((item) => item.currentLocation === 'METRO')
      if (lot) { lot.faults.push(id); lot.currentOperation = Math.max(2, lot.currentOperation - 2); lot.status = 'rejected'; this.createJob(lot, 'METRO', recipe.stationIds[lot.currentOperation]) }
    }
    this.event('error', target, 'fault', `${id}: ${kind.replaceAll('-', ' ')} activated at ${target}.`)
    return id
  }
  clearFault(id: string): void {
    const fault = this.state.faults.find((item) => item.id === id); if (!fault) return; fault.active = false
    if (fault.kind === 'station') { const station = this.station(fault.targetId); station.faultId = null; station.operationalState = station.currentLot ? 'processing' : 'idle' }
    if (fault.kind === 'delay') this.station(fault.targetId).delayedMultiplier = 1
    if (fault.kind === 'rail') { const segment = this.state.segments.find((item) => item.id === fault.targetId); if (segment) segment.blocked = false }
    if (fault.kind === 'vehicle') { const vehicle = this.state.vehicles.find((item) => item.id === fault.targetId); if (vehicle) { vehicle.faultId = null; vehicle.state = vehicle.assignedJob ? (vehicle.payload ? 'delivering' : 'to-pickup') : 'idle' } }
    this.event('info', fault.targetId, 'fault', `${fault.id} cleared.`)
  }
  setStrategy(strategy: DispatchStrategy): void { this.state.config.strategy = strategy; this.event('info', 'Dispatcher', 'scheduling', `Dispatch strategy changed to ${strategy}.`) }
  setVehicleCount(count: number): void {
    const target = Math.max(2, Math.min(8, count)); const current = this.state.vehicles.length
    if (target < current) this.state.vehicles = this.state.vehicles.slice(0, target)
    else for (let i = current; i < target; i += 1) {
      const node = this.state.nodes[i % this.state.nodes.length]
      this.state.vehicles.push({ id: `VEH-${String(i + 1).padStart(2, '0')}`, position: [...node.position], currentNode: node.id, currentRailSegment: null, destination: null, speed: this.state.config.vehicleSpeed, state: 'idle', assignedJob: null, payload: null, distanceTravelled: 0, activeTime: 0, battery: 100 - i * 3, route: [], routeIndex: 0, segmentProgress: 0, blockedTime: 0, completedDeliveries: 0, faultId: null })
    }
    this.state.config.vehicleCount = target
  }
  nextDemoEvent(): string {
    const actions = [
      () => { for (let i = 0; i < 6; i += 1) this.addLot(i === 1); return 'Normal production loaded with six lots.' },
      () => { this.injectFault('station', 'PHOTO'); return 'Photolithography fault injected; its queue will grow.' },
      () => { const fault = this.state.faults.find((item) => item.active && item.targetId === 'PHOTO'); if (fault) this.clearFault(fault.id); return 'Photolithography recovered.' },
      () => { this.injectFault('rail', 'SEG-02'); return 'SEG-02 blocked; active routes recalculate.' },
      () => { const fault = this.state.faults.find((item) => item.active && item.kind === 'rail'); if (fault) this.clearFault(fault.id); return 'Rail link restored.' },
      () => { this.setStrategy('bottleneck'); return 'Bottleneck-aware dispatch enabled for comparison.' },
    ]
    const action = actions[this.state.demoStep % actions.length]; const result = action(); this.state.demoStep = (this.state.demoStep + 1) % actions.length
    return result
  }
  report(): Record<string, unknown> {
    return { configuration: this.state.config, randomSeed: this.state.config.seed, dispatchStrategy: this.state.config.strategy, simulationDuration: this.state.time, productionMetrics: calculateMetrics(this.state), stationStatistics: this.state.stations, vehicleStatistics: this.state.vehicles, waferLotHistory: this.state.lots, faultHistory: this.state.faults, bottleneckAnalysis: analyzeBottleneck(this.state), eventLog: this.state.events }
  }
}
