import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { stationUtilization } from '../../simulation/metrics/analysis'
import { useSimulationStore } from '../../stores/useSimulationStore'

const tooltipStyle = { background: '#091722', border: '1px solid #29475c', borderRadius: 6, fontSize: 10 }
export function ThroughputChart(): React.JSX.Element {
  const history = useSimulationStore((store) => store.simulation.history)
  return <ResponsiveContainer width="100%" height="100%"><LineChart data={history}><CartesianGrid stroke="#183043" strokeDasharray="3 3"/><XAxis dataKey="time" stroke="#547084" fontSize={9}/><YAxis stroke="#547084" fontSize={9}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:9}}/><Line type="monotone" dataKey="wip" name="WIP" stroke="#22d3ee" dot={false} strokeWidth={2}/><Line type="monotone" dataKey="completed" name="Completed" stroke="#4ade80" dot={false}/><Line type="monotone" dataKey="awaiting" name="Awaiting transport" stroke="#fbbf24" dot={false}/></LineChart></ResponsiveContainer>
}
export function UtilizationChart(): React.JSX.Element {
  const simulation = useSimulationStore((store) => store.simulation); const data = simulation.stations.map((station) => ({ name: station.id, utilization: Number(stationUtilization(station, simulation.time).toFixed(1)), queue: station.queue.length }))
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke="#183043" strokeDasharray="3 3"/><XAxis dataKey="name" stroke="#547084" fontSize={9}/><YAxis stroke="#547084" fontSize={9}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:9}}/><Bar dataKey="utilization" name="Utilization %" fill="#169cba" radius={[3,3,0,0]}/><Bar dataKey="queue" name="Queue length" fill="#f59e0b" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer>
}
export function VehicleChart(): React.JSX.Element {
  const simulation = useSimulationStore((store) => store.simulation); const data = simulation.vehicles.map((vehicle) => ({ name: vehicle.id.replace('VEH-','V'), utilization: simulation.time ? vehicle.activeTime / simulation.time * 100 : 0, blocked: vehicle.blockedTime, distance: vehicle.distanceTravelled }))
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid stroke="#183043" strokeDasharray="3 3"/><XAxis dataKey="name" stroke="#547084" fontSize={9}/><YAxis stroke="#547084" fontSize={9}/><Tooltip contentStyle={tooltipStyle}/><Legend wrapperStyle={{fontSize:9}}/><Bar dataKey="utilization" name="Utilization %" fill="#38bdf8"/><Bar dataKey="blocked" name="Blocked sec" fill="#fb7185"/></BarChart></ResponsiveContainer>
}
