import { AlertOctagon, Ban, CircleOff, RadioTower, ShieldAlert, TimerOff, Unplug } from 'lucide-react'
import { useSimulationStore } from '../../stores/useSimulationStore'
import type { FaultKind } from '../../simulation/models/types'

const faultActions: Array<{ kind: FaultKind; label: string; icon: React.ReactNode }> = [
  { kind:'station', label:'Station breakdown', icon:<Unplug size={13}/> }, { kind:'rail', label:'Block rail segment', icon:<Ban size={13}/> },
  { kind:'delay', label:'Delayed processing', icon:<TimerOff size={13}/> }, { kind:'vehicle', label:'Vehicle fault', icon:<CircleOff size={13}/> },
  { kind:'carrier-id', label:'Carrier ID failure', icon:<RadioTower size={13}/> }, { kind:'metrology-reject', label:'Metrology rejection', icon:<ShieldAlert size={13}/> },
  { kind:'emergency-stop', label:'Emergency stop', icon:<AlertOctagon size={13}/> },
]
export function FaultControls(): React.JSX.Element {
  const simulation = useSimulationStore((store) => store.simulation); const inject = useSimulationStore((store) => store.inject); const clear = useSimulationStore((store) => store.clearFault)
  const active = simulation.faults.filter((fault) => fault.active)
  return <><div className="panel"><div className="panel-header"><h3>Fault injection</h3><span className={`tiny ${active.length ? 'red' : 'green'}`}>{active.length ? `${active.length} active` : 'Nominal'}</span></div><div className="panel-body"><div className="list">{faultActions.map((item) => <button className={`btn ${item.kind === 'emergency-stop' ? 'danger' : ''}`} style={{justifyContent:'flex-start'}} key={item.kind} onClick={() => inject(item.kind)}>{item.icon}{item.label}</button>)}</div></div></div>
  <div className="panel"><div className="panel-header"><h3>Active faults</h3></div><div className="panel-body"><div className="list">{active.length ? active.map((fault) => <div className="fault-card" key={fault.id}><div className="head"><span>{fault.id} · {fault.kind.replaceAll('-',' ')}</span><span className="mono">T+{fault.startedAt.toFixed(0)}</span></div><p>{fault.message}. The simulation model is applying operational consequences.</p><button className="btn success" onClick={() => clear(fault.id)}>Clear fault</button></div>) : <div className="empty">No active faults. All systems are nominal.</div>}</div></div></div></>
}
