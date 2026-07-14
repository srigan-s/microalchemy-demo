import { SimulationEngine } from '../engine/SimulationEngine'
import { calculateMetrics } from '../metrics/analysis'
import type { DispatchStrategy } from '../models/types'

export interface ExperimentResult { strategy: DispatchStrategy; throughput: number; avgCycle: number; avgQueue: number; distance: number; onTime: number; congestion: number; score: number }
export function runExperiments(seed: number): ExperimentResult[] {
  const strategies: DispatchStrategy[] = ['fifo', 'nearest', 'priority', 'bottleneck']
  return strategies.map((strategy) => {
    const engine = new SimulationEngine(seed); engine.setStrategy(strategy)
    for (let i = 0; i < 12; i += 1) engine.addLot(i % 5 === 0)
    for (let i = 0; i < 900; i += 1) engine.step(.5)
    const metrics = calculateMetrics(engine.state)
    return { strategy, throughput: metrics.throughput, avgCycle: metrics.avgCycle, avgQueue: metrics.avgQueue, distance: metrics.distance, onTime: metrics.onTime, congestion: metrics.congestion, score: metrics.completed * 1000 - metrics.avgCycle - metrics.avgQueue - metrics.distance * .1 - metrics.congestion * 5 }
  }).sort((a, b) => b.score - a.score)
}
