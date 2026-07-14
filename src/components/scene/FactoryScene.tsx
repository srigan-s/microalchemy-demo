import { Html, OrbitControls, PerspectiveCamera } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useSimulationStore } from '../../stores/useSimulationStore'
import type { ProcessStation, RailSegment, TransportVehicle, Vec3, WaferLot } from '../../simulation/models/types'

function Track({ segment }: { segment: RailSegment }): React.JSX.Element {
  const nodes = useSimulationStore((store) => store.simulation.nodes)
  const selectedVehicle = useSimulationStore((store) => store.selectedVehicle)
  const vehicles = useSimulationStore((store) => store.simulation.vehicles)
  const a = nodes.find((node) => node.id === segment.from)!.position, b = nodes.find((node) => node.id === segment.to)!.position
  const midpoint: Vec3 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]
  const length = Math.hypot(b[0] - a[0], b[2] - a[2]); const angle = Math.atan2(b[2] - a[2], b[0] - a[0])
  const onRoute = selectedVehicle ? (() => { const route = vehicles.find((vehicle) => vehicle.id === selectedVehicle)?.route ?? []; return route.some((node, i) => i < route.length - 1 && ((node === segment.from && route[i + 1] === segment.to) || (node === segment.to && route[i + 1] === segment.from))) })() : false
  const color = segment.blocked || !segment.enabled ? '#ef476f' : segment.occupiedBy ? '#fbbf24' : segment.reservedBy ? '#38bdf8' : onRoute ? '#22d3ee' : '#40596c'
  return <group>
    <mesh position={midpoint} rotation={[0, -angle, Math.PI / 2]}><cylinderGeometry args={[.11, .11, length, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={segment.blocked || onRoute ? .65 : .12} /></mesh>
    <mesh position={[midpoint[0], midpoint[1] - .16, midpoint[2]]} rotation={[0, -angle, Math.PI / 2]}><cylinderGeometry args={[.08, .08, length, 8]} /><meshStandardMaterial color="#253a4a" metalness={.8} roughness={.35} /></mesh>
    <mesh position={[midpoint[0], midpoint[1] - 1.55, midpoint[2]]}><boxGeometry args={[.16, 3, .16]} /><meshStandardMaterial color="#2c4353" metalness={.7} /></mesh>
  </group>
}

function Station({ station }: { station: ProcessStation }): React.JSX.Element | null {
  const select = useSimulationStore((store) => store.selectStation); const selected = useSimulationStore((store) => store.selectedStation === station.id)
  if (!station.visible) return null
  const fault = station.operationalState === 'fault'; const active = station.operationalState === 'processing'; const color = fault ? '#fb4765' : active ? '#22d3ee' : '#34d399'
  return <group position={station.position} onClick={(event) => { event.stopPropagation(); select(station.id) }}>
    <mesh position={[0, 1.05, 0]} castShadow receiveShadow><boxGeometry args={[3.2, 2.1, 2.4]} /><meshStandardMaterial color={selected ? '#214d64' : '#172b3a'} metalness={.38} roughness={.55} /></mesh>
    <mesh position={[0, 1.15, -1.23]}><boxGeometry args={[2.5, 1.45, .08]} /><meshStandardMaterial color="#0a1822" /></mesh>
    <mesh position={[0, .55, -1.36]}><boxGeometry args={[1.25, .38, .25]} /><meshStandardMaterial color="#253e4d" metalness={.7} /></mesh>
    <mesh position={[1.15, 2.35, -1]}><sphereGeometry args={[.13, 12, 8]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} /></mesh>
    {active && <mesh position={[0, 2.17, 0]}><boxGeometry args={[2.7 * station.progress, .05, 2.1]} /><meshBasicMaterial color="#22d3ee" /></mesh>}
    <Html position={[0, 2.7, 0]} center distanceFactor={12}><div className="station-label">{station.name}<span>{fault ? 'FAULT' : active ? `${station.currentLot} · ${Math.round(station.progress * 100)}%` : `${station.queue.length} queued`}</span></div></Html>
  </group>
}

function Carrier({ selected = false }: { selected?: boolean }): React.JSX.Element {
  return <group position={[0, -.16, 0]}>
    <mesh castShadow><boxGeometry args={[.72, .58, .66]} /><meshStandardMaterial color={selected ? '#b9f6ff' : '#d5e1e7'} emissive={selected ? '#22d3ee' : '#000'} emissiveIntensity={.6} metalness={.25} roughness={.35} /></mesh>
    <mesh position={[0, 0, -.35]}><boxGeometry args={[.48, .33, .035]} /><meshStandardMaterial color="#173749" /></mesh>
    <mesh position={[0, .32, 0]}><boxGeometry args={[.46, .07, .42]} /><meshStandardMaterial color="#8fa9b7" /></mesh>
  </group>
}

function Vehicle({ vehicle }: { vehicle: TransportVehicle }): React.JSX.Element {
  const selectedId = useSimulationStore((store) => store.selectedVehicle); const select = useSimulationStore((store) => store.selectVehicle)
  const selectedLot = useSimulationStore((store) => store.selectedLot); const selected = selectedId === vehicle.id
  const color = vehicle.state === 'fault' ? '#fb4765' : vehicle.state === 'blocked' ? '#fbbf24' : selected ? '#a5f3fc' : '#1cb5d1'
  return <group position={vehicle.position} onClick={(event) => { event.stopPropagation(); select(vehicle.id) }}>
    <mesh castShadow><boxGeometry args={[1.15, .24, .8]} /><meshStandardMaterial color="#162e3e" metalness={.75} roughness={.25} /></mesh>
    <mesh position={[0, .2, 0]}><boxGeometry args={[.7, .18, .55]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.55} /></mesh>
    {vehicle.payload && <Carrier selected={vehicle.payload === selectedLot} />}
    <pointLight color={color} intensity={selected ? 2 : .6} distance={3} />
    <Html position={[0, .72, 0]} center distanceFactor={13}><div className="vehicle-label">{vehicle.id}{vehicle.payload ? ` · ${vehicle.payload}` : ''}</div></Html>
  </group>
}

function WaitingCarriers({ lots, station }: { lots: WaferLot[]; station: ProcessStation }): React.JSX.Element {
  const selected = useSimulationStore((store) => store.selectedLot); const select = useSimulationStore((store) => store.selectLot)
  const waiting = lots.filter((lot) => lot.currentLocation === station.id && lot.status !== 'processing' && lot.status !== 'complete').slice(0, 4)
  return <group position={[station.position[0], .55, station.position[2] - 1.75]}>{waiting.map((lot, i) => <group key={lot.id} position={[(i - 1.5) * .8, 0, 0]} onClick={(event) => { event.stopPropagation(); select(lot.id) }}><Carrier selected={selected === lot.id} /></group>)}</group>
}

function CameraRig(): null {
  const { camera } = useThree(); const mode = useSimulationStore((store) => store.cameraMode); const selectedVehicle = useSimulationStore((store) => store.selectedVehicle); const selectedLot = useSimulationStore((store) => store.selectedLot); const simulation = useSimulationStore((store) => store.simulation)
  const target = useMemo(() => {
    if (mode === 'vehicle' && selectedVehicle) return simulation.vehicles.find((vehicle) => vehicle.id === selectedVehicle)?.position
    if (mode === 'lot' && selectedLot) { const lot = simulation.lots.find((item) => item.id === selectedLot); const vehicle = simulation.vehicles.find((item) => item.payload === selectedLot); return vehicle?.position ?? simulation.stations.find((station) => station.id === lot?.currentLocation)?.position }
    return undefined
  }, [mode, selectedVehicle, selectedLot, simulation])
  useFrame(() => {
    if (mode === 'free') return
    const focus = target ?? [0, 0, 0]; const desired = mode === 'top' ? [focus[0], 30, focus[2] + .01] : mode === 'vehicle' || mode === 'lot' ? [focus[0] + 7, focus[1] + 6, focus[2] + 7] : [19, 17, 20]
    camera.position.lerp(new THREE.Vector3(...desired), .04); camera.lookAt(...focus)
  })
  return null
}

function SceneContent(): React.JSX.Element {
  const simulation = useSimulationStore((store) => store.simulation); const mode = useSimulationStore((store) => store.cameraMode)
  return <>
    <PerspectiveCamera makeDefault fov={42} near={.1} far={130} position={[19, 17, 20]} />
    <CameraRig /><OrbitControls enabled={mode === 'free'} makeDefault minDistance={7} maxDistance={45} maxPolarAngle={Math.PI / 2.05} />
    <ambientLight intensity={.6} /><directionalLight position={[8, 18, 11]} intensity={1.3} castShadow shadow-mapSize={[1024, 1024]} /><pointLight position={[-10, 8, -7]} color="#3bdcf3" intensity={8} distance={20} />
    <fog attach="fog" args={['#07111d', 28, 62]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[52, 36]} /><meshStandardMaterial color="#0b1721" roughness={.75} metalness={.2} /></mesh>
    <gridHelper args={[48, 48, '#1b4051', '#132b38']} position={[0, .012, 0]} />
    {simulation.segments.map((segment) => <Track key={segment.id} segment={segment} />)}
    {simulation.stations.map((station) => <Station key={station.id} station={station} />)}
    {simulation.stations.map((station) => <WaitingCarriers key={station.id} lots={simulation.lots} station={station} />)}
    {simulation.vehicles.map((vehicle) => <Vehicle key={vehicle.id} vehicle={vehicle} />)}
  </>
}

export function FactoryScene(): React.JSX.Element {
  return <Canvas shadows dpr={[1, 1.6]} gl={{ antialias: true, powerPreference: 'high-performance' }}><SceneContent /></Canvas>
}
