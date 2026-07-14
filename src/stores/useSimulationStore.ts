import { create } from 'zustand'
import { SimulationEngine } from '../simulation/engine/SimulationEngine'
import type { DispatchStrategy, FaultKind, SimulationState } from '../simulation/models/types'

const engine = new SimulationEngine(42)
interface SimulationStore {
  simulation: SimulationState; selectedLot: string | null; selectedVehicle: string | null; selectedStation: string | null
  cameraMode: 'isometric' | 'top' | 'vehicle' | 'lot' | 'free'; speed: number; lastMessage: string
  sync: () => void; toggleRunning: () => void; step: (dt?: number) => void; reset: () => void
  addLot: (urgent?: boolean) => void; strategy: (value: DispatchStrategy) => void; inject: (kind: FaultKind, target?: string) => void
  clearFault: (id: string) => void; selectLot: (id: string | null) => void; selectVehicle: (id: string | null) => void
  selectStation: (id: string | null) => void; setCamera: (mode: SimulationStore['cameraMode']) => void; setSpeed: (speed: number) => void
  nextDemo: () => void; setVehicleCount: (count: number) => void; updateStation: (id: string, patch: { processingDuration?: number; queueCapacity?: number; visible?: boolean }) => void
  toggleSegment: (id: string) => void; setVehicleSpeed: (speed: number) => void; setSeed: (seed: number) => void; clearCompleted: () => void
  setReleaseInterval: (seconds: number) => void
  exportReport: () => void
}
const snap = (): SimulationState => engine.snapshot()
export const useSimulationStore = create<SimulationStore>((set, get) => ({
  simulation: snap(), selectedLot: null, selectedVehicle: null, selectedStation: null, cameraMode: 'isometric', speed: 1, lastMessage: 'Ready — add a lot or start the guided demo.',
  sync: () => set({ simulation: snap() }),
  toggleRunning: () => { engine.state.running = !engine.state.running; set({ simulation: snap(), lastMessage: engine.state.running ? 'Simulation running.' : 'Simulation paused.' }) },
  step: (dt = 1) => { engine.step(dt); set({ simulation: snap() }) },
  reset: () => { engine.reset(); set({ simulation: snap(), selectedLot: null, selectedVehicle: null, lastMessage: 'Simulation reset.' }) },
  addLot: (urgent = false) => { const lot = engine.addLot(urgent); set({ simulation: snap(), selectedLot: lot.id, lastMessage: `${lot.id} added${urgent ? ' with urgent priority' : ''}.` }) },
  strategy: (value) => { engine.setStrategy(value); set({ simulation: snap(), lastMessage: `${value} dispatch active.` }) },
  inject: (kind, target) => { const id = engine.injectFault(kind, target); set({ simulation: snap(), lastMessage: `${id} injected.` }) },
  clearFault: (id) => { engine.clearFault(id); set({ simulation: snap(), lastMessage: `${id} cleared.` }) },
  selectLot: (selectedLot) => set({ selectedLot, selectedVehicle: null }), selectVehicle: (selectedVehicle) => set({ selectedVehicle, selectedLot: null }), selectStation: (selectedStation) => set({ selectedStation }),
  setCamera: (cameraMode) => set({ cameraMode }), setSpeed: (speed) => set({ speed }),
  nextDemo: () => set({ simulation: (engine.nextDemoEvent(), snap()), lastMessage: `Demo: step ${engine.state.demoStep || 6} of 6.` }),
  setVehicleCount: (count) => { engine.setVehicleCount(count); set({ simulation: snap() }) },
  updateStation: (id, patch) => { const station = engine.state.stations.find((item) => item.id === id); if (station) Object.assign(station, patch); set({ simulation: snap() }) },
  toggleSegment: (id) => { const segment = engine.state.segments.find((item) => item.id === id); if (segment) segment.enabled = !segment.enabled; set({ simulation: snap() }) },
  setVehicleSpeed: (value) => { engine.state.config.vehicleSpeed = value; engine.state.vehicles.forEach((vehicle) => { vehicle.speed = value }); set({ simulation: snap() }) },
  setReleaseInterval: (seconds) => { engine.state.config.lotReleaseInterval = seconds; engine.state.nextAutoRelease = engine.state.time + seconds; set({ simulation: snap() }) },
  setSeed: (seed) => { engine.reset(seed); set({ simulation: snap(), lastMessage: `Reset with deterministic seed ${seed}.` }) },
  clearCompleted: () => { engine.state.lots = engine.state.lots.filter((lot) => lot.status !== 'complete'); set({ simulation: snap() }) },
  exportReport: () => { const blob = new Blob([JSON.stringify(engine.report(), null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `fabflow-report-${Math.round(engine.state.time)}s.json`; link.click(); URL.revokeObjectURL(url); get().sync() },
}))
