import type { ProcessStation, ProductionRecipe, RailNode, RailSegment, SimulationState, TransportVehicle, Vec3 } from '../models/types'

export const recipe: ProductionRecipe = {
  id: 'DEMO-7', name: 'Simplified wafer flow',
  stationIds: ['STOCK', 'OXID', 'PHOTO', 'ETCH', 'DEPO', 'METRO', 'DONE'],
}

const stationDefinitions: Array<[string, string, string, Vec3, number]> = [
  ['STOCK', 'Wafer Stocker', 'Storage', [-11, 0, -6], 5],
  ['OXID', 'Oxidation', 'Thermal process', [-4, 0, -6], 20],
  ['PHOTO', 'Photolithography', 'Patterning', [3, 0, -6], 32],
  ['ETCH', 'Etching', 'Material removal', [10, 0, -6], 22],
  ['DEPO', 'Deposition', 'Thin films', [10, 0, 6], 25],
  ['METRO', 'Metrology', 'Inspection', [3, 0, 6], 16],
  ['DONE', 'Completed Storage', 'Finished lots', [-4, 0, 6], 4],
]

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[2] - b[2])
}

export function createSimulation(seed = 42): SimulationState {
  const stations: ProcessStation[] = stationDefinitions.map(([id, name, processType, position, duration]) => ({
    id, name, processType, position, processingDuration: duration, queue: [], currentLot: null,
    operationalState: 'idle', utilizationTime: 0, completedLotCount: 0, totalProcessingTime: 0,
    faultId: null, progress: 0, queueCapacity: 6, visible: true, delayedMultiplier: 1,
  }))
  const nodes: RailNode[] = stations.map((station) => ({ id: `N-${station.id}`, position: [station.position[0], 3.2, station.position[2]], stationId: station.id }))
  nodes.push({ id: 'N-WEST', position: [-11, 3.2, 6] })
  const pairs: Array<[string, string]> = [
    ['N-STOCK', 'N-OXID'], ['N-OXID', 'N-PHOTO'], ['N-PHOTO', 'N-ETCH'], ['N-ETCH', 'N-DEPO'],
    ['N-DEPO', 'N-METRO'], ['N-METRO', 'N-DONE'], ['N-DONE', 'N-WEST'], ['N-WEST', 'N-STOCK'],
    ['N-OXID', 'N-DONE'], ['N-PHOTO', 'N-METRO'],
  ]
  const segments: RailSegment[] = pairs.map(([from, to], index) => ({
    id: `SEG-${String(index + 1).padStart(2, '0')}`, from, to,
    length: distance(nodes.find((node) => node.id === from)!.position, nodes.find((node) => node.id === to)!.position),
    enabled: true, blocked: false, reservedBy: null, occupiedBy: null, constrained: true,
  }))
  const vehicles: TransportVehicle[] = Array.from({ length: 5 }, (_, index) => {
    const node = nodes[(index * 2) % nodes.length]
    return {
      id: `VEH-${String(index + 1).padStart(2, '0')}`, position: [...node.position], currentNode: node.id,
      currentRailSegment: null, destination: null, speed: 3.2, state: 'idle', assignedJob: null,
      payload: null, distanceTravelled: 0, activeTime: 0, battery: 100 - index * 4, route: [], routeIndex: 0,
      segmentProgress: 0, blockedTime: 0, completedDeliveries: 0, faultId: null,
    }
  })
  return {
    time: 0, running: false, config: { seed, strategy: 'fifo', vehicleCount: 5, vehicleSpeed: 3.2, lotReleaseInterval: 18, emergencyStopsProcessing: false },
    stations, lots: [], vehicles, nodes, segments, jobs: [], events: [], faults: [], history: [],
    congestionEvents: 0, lotSequence: 0, jobSequence: 0, eventSequence: 0, faultSequence: 0, demoStep: 0, nextAutoRelease: 18,
  }
}
