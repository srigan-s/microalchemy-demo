import { Activity, Box, Clock3, Gauge, Route, Timer, TriangleAlert, Workflow } from 'lucide-react'
import { calculateMetrics } from '../../simulation/metrics/analysis'
import { useSimulationStore } from '../../stores/useSimulationStore'

interface MetricProps { label: string; value: string | number; unit?: string; icon: React.ReactNode; warning?: boolean; note?: string }
function Metric({ label, value, unit, icon, warning, note }: MetricProps): React.JSX.Element {
  return <div className={`panel metric ${warning ? 'warn' : ''}`}><div className="metric-top"><span>{label}</span>{icon}</div><div className="metric-value">{value}<small>{unit}</small></div>{note && <div className="trend">{note}</div>}</div>
}
export function Metrics({ compact = false }: { compact?: boolean }): React.JSX.Element {
  const simulation = useSimulationStore((store) => store.simulation); const metrics = calculateMetrics(simulation)
  const values = [
    { label: 'Work in progress', value: metrics.wip, icon: <Box size={13} />, note: `${metrics.processing} processing` },
    { label: 'Completed lots', value: metrics.completed, icon: <Activity size={13} />, note: `${metrics.throughput.toFixed(1)} / sim hr` },
    { label: 'Awaiting transport', value: metrics.awaiting, icon: <Route size={13} />, warning: metrics.awaiting > 3 },
    { label: 'Avg cycle time', value: metrics.avgCycle.toFixed(0), unit: 's', icon: <Clock3 size={13} /> },
    { label: 'Vehicle utilization', value: metrics.vehicleUtilization.toFixed(0), unit: '%', icon: <Gauge size={13} /> },
    { label: 'Avg queue time', value: metrics.avgQueue.toFixed(1), unit: 's', icon: <Timer size={13} /> },
    { label: 'Distance travelled', value: metrics.distance.toFixed(0), unit: 'm', icon: <Workflow size={13} /> },
    { label: 'Congestion events', value: metrics.congestion, icon: <TriangleAlert size={13} />, warning: metrics.congestion > 0 },
  ]
  return <div className="metrics">{values.slice(0, compact ? 4 : 8).map((metric) => <Metric key={metric.label} {...metric} />)}</div>
}
