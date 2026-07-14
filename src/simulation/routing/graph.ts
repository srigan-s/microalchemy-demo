import type { RailNode, RailSegment } from '../models/types'

export interface RouteResult { nodes: string[]; distance: number }

export function shortestPath(nodes: RailNode[], segments: RailSegment[], start: string, goal: string): RouteResult | null {
  const distances = new Map(nodes.map((node) => [node.id, Number.POSITIVE_INFINITY]))
  const previous = new Map<string, string>()
  const unvisited = new Set(nodes.map((node) => node.id))
  distances.set(start, 0)
  while (unvisited.size > 0) {
    let current: string | null = null
    let best = Number.POSITIVE_INFINITY
    for (const id of unvisited) {
      const value = distances.get(id) ?? Number.POSITIVE_INFINITY
      if (value < best) { best = value; current = id }
    }
    if (current === null || best === Number.POSITIVE_INFINITY) break
    unvisited.delete(current)
    if (current === goal) break
    for (const segment of segments) {
      if (!segment.enabled || segment.blocked) continue
      const neighbor = segment.from === current ? segment.to : segment.to === current ? segment.from : null
      if (!neighbor || !unvisited.has(neighbor)) continue
      const candidate = best + segment.length
      if (candidate < (distances.get(neighbor) ?? Number.POSITIVE_INFINITY)) {
        distances.set(neighbor, candidate); previous.set(neighbor, current)
      }
    }
  }
  const distance = distances.get(goal) ?? Number.POSITIVE_INFINITY
  if (!Number.isFinite(distance)) return null
  const path = [goal]
  while (path[0] !== start) {
    const parent = previous.get(path[0])
    if (!parent) return null
    path.unshift(parent)
  }
  return { nodes: path, distance }
}

export function segmentBetween(segments: RailSegment[], a: string, b: string): RailSegment | undefined {
  return segments.find((segment) => (segment.from === a && segment.to === b) || (segment.from === b && segment.to === a))
}
