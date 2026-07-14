export type Vec3 = [number, number, number]
export type StationState = 'idle' | 'processing' | 'fault' | 'offline'
export type LotStatus = 'queued' | 'processing' | 'awaiting-transport' | 'in-transit' | 'complete' | 'rejected'
export type VehicleState = 'idle' | 'to-pickup' | 'loading' | 'delivering' | 'blocked' | 'fault'
export type DispatchStrategy = 'fifo' | 'nearest' | 'priority' | 'bottleneck'
export type FaultKind = 'station' | 'rail' | 'delay' | 'vehicle' | 'carrier-id' | 'metrology-reject' | 'emergency-stop'
export type EventCategory = 'transport' | 'processing' | 'fault' | 'scheduling' | 'completion'

export interface RailNode { id: string; position: Vec3; stationId?: string }
export interface RailSegment {
  id: string; from: string; to: string; length: number; enabled: boolean; blocked: boolean
  reservedBy: string | null; occupiedBy: string | null; constrained: boolean
}
export interface HistoryEntry { time: number; type: 'arrival' | 'departure' | 'processing' | 'transport' | 'fault'; message: string }
export interface WaferLot {
  id: string; currentOperation: number; currentLocation: string; destination: string | null
  priority: number; creationTime: number; waitingTime: number; processingTime: number; transportTime: number
  status: LotStatus; completedOperations: string[]; dueTime: number; history: HistoryEntry[]; faults: string[]
}
export interface ProcessStation {
  id: string; name: string; processType: string; position: Vec3; processingDuration: number
  queue: string[]; currentLot: string | null; operationalState: StationState; utilizationTime: number
  completedLotCount: number; totalProcessingTime: number; faultId: string | null; progress: number
  queueCapacity: number; visible: boolean; delayedMultiplier: number
}
export interface TransportJob {
  id: string; lotId: string; pickup: string; destination: string; createdAt: number; priority: number
  state: 'queued' | 'assigned' | 'complete'; assignedVehicle: string | null
}
export interface TransportVehicle {
  id: string; position: Vec3; currentNode: string; currentRailSegment: string | null; destination: string | null
  speed: number; state: VehicleState; assignedJob: string | null; payload: string | null
  distanceTravelled: number; activeTime: number; battery: number; route: string[]; routeIndex: number
  segmentProgress: number; blockedTime: number; completedDeliveries: number; faultId: string | null
}
export interface SimulationEvent {
  id: string; timestamp: number; severity: 'info' | 'warning' | 'error'; source: string
  type: EventCategory; message: string; lotId?: string; vehicleId?: string; stationId?: string
}
export interface Fault {
  id: string; kind: FaultKind; targetId: string; startedAt: number; active: boolean; message: string
}
export interface ProductionRecipe { id: string; name: string; stationIds: string[] }
export interface MetricsSnapshot {
  time: number; total: number; completed: number; wip: number; processing: number; awaiting: number
  avgCycle: number; avgTransport: number; avgQueue: number; throughput: number; onTime: number
  vehicleUtilization: number; stationUtilization: number; distance: number; congestion: number
}
export interface SimulationConfig {
  seed: number; strategy: DispatchStrategy; vehicleCount: number; vehicleSpeed: number
  lotReleaseInterval: number; emergencyStopsProcessing: boolean
}
export interface SimulationState {
  time: number; running: boolean; config: SimulationConfig; stations: ProcessStation[]; lots: WaferLot[]
  vehicles: TransportVehicle[]; nodes: RailNode[]; segments: RailSegment[]; jobs: TransportJob[]
  events: SimulationEvent[]; faults: Fault[]; history: MetricsSnapshot[]; congestionEvents: number
  lotSequence: number; jobSequence: number; eventSequence: number; faultSequence: number; demoStep: number; nextAutoRelease: number
}
