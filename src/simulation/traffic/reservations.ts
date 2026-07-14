import type { RailSegment } from '../models/types'

export function reserveSegment(segment: RailSegment, vehicleId: string): boolean {
  if (!segment.enabled || segment.blocked) return false
  if (segment.reservedBy && segment.reservedBy !== vehicleId) return false
  if (segment.occupiedBy && segment.occupiedBy !== vehicleId) return false
  segment.reservedBy = vehicleId
  return true
}
export function occupySegment(segment: RailSegment, vehicleId: string): boolean {
  if (!reserveSegment(segment, vehicleId)) return false
  segment.occupiedBy = vehicleId
  return true
}
export function releaseSegment(segment: RailSegment, vehicleId: string): void {
  if (segment.reservedBy === vehicleId) segment.reservedBy = null
  if (segment.occupiedBy === vehicleId) segment.occupiedBy = null
}
