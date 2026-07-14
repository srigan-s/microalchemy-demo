# FabFlow Twin — Interview Pitch

## 30-second explanation

FabFlow Twin is a browser-based digital twin for wafer transport and scheduling. A deterministic simulation drives original 3D equipment, independently dispatched vehicles, real station queues, graph routing, collision-safe segment reservations, faults, and live production metrics. It lets a small semiconductor operation explore material flow before committing to physical transport equipment. It is deliberately transparent and educational, not a production optimizer.

## 90-second explanation

The project separates simulation from presentation. A strict TypeScript engine owns wafer lots, process stations, transport jobs, vehicles, rail segments, events, and faults. Vehicles use Dijkstra routing over a bidirectional rail graph and reserve constrained segments before entering, so the animation reflects actual model decisions rather than moving props directly between coordinates.

The operator can compare FIFO, nearest-vehicle, priority-aware, and bottleneck-aware dispatch. A blocked rail link triggers a new graph route; a broken station freezes processing and grows its queue. Metrics, traceability, event logs, and the bottleneck explanation all come from the same underlying state. An accelerated experiment runs an identical seeded scenario with every dispatch strategy.

The UI is React and React Three Fiber, while simulation logic is independent and tested in Vitest. The prototype makes limits explicit: timings are synthetic, the seven-step wafer recipe is intentionally simplified, and proposed MES, PLC, sensor, RFID, and broker connections are not implemented.

## Four-minute demonstration

**0:00–0:35 — Frame the problem**

Open Presentation Mode. Explain that the goal is to test flow and scheduling before building transport hardware. Point out seven stations, elevated graph rails, five independent vehicles, and synthetic carrier pods.

**0:35–1:20 — Show real model behavior**

Click Next demo event, set 5× speed, and run. Select a vehicle and choose Follow selected vehicle. Explain that the vehicle takes graph nodes, reserves its next segment, and releases it after exit. Amber means occupied, red blocked, and cyan shows a planned selected route.

**1:20–2:10 — Inject a bottleneck**

Click Next demo event to break Photolithography. Show the active fault and queue growing while other stations continue. Open Production Dashboard briefly and point to utilization, WIP, average waiting, and the transparent bottleneck recommendation.

**2:10–2:50 — Recover and reroute**

Advance once to recover Photolithography and again to block SEG-02. Point out reroute messages in the event log and the alternate graph path. Explain that the vehicle never moves directly through space; unavailable links are removed from shortest-path planning.

**2:50–3:30 — Compare policies**

Open Experiments and run all strategies. Explain that the engine executes faster than real time without rendering each frame and that the displayed winner is specific to the seeded simplified scenario.

**3:30–4:00 — Close on architecture and honesty**

Open Architecture. Trace scheduler → job queue → dispatcher → graph planner → reservations → 3D twin → metrics. Identify MES, equipment, PLC, sensors, RFID, broker, and history as proposed—not implemented—interfaces. Close with the model’s strongest contribution: a testable software boundary for exploring material flow safely and cheaply.

## Likely technical questions

### Is this a real discrete-event simulation?

It uses a deterministic fixed logical step and explicit state transitions for releases, queues, processing, jobs, assignment, travel, arrival, completion, and faults. It is closer to a discrete-event material-flow model than a visual animation, though a future version could use an event-priority queue to skip inactive time.

### How is determinism achieved?

The engine has a single simulated clock, controlled inputs, stable ordering, and a stored seed. Tests run identical input sequences twice and compare complete snapshots. The current baseline contains little stochastic variation; the seed is retained so future synthetic distributions can use a seeded PRNG without changing the interface.

### How do you prevent collisions?

Every constrained segment has `reservedBy` and `occupiedBy`. A vehicle must reserve before entering. A second vehicle fails that reservation, stops at its current node, records blocked time and a congestion event, then retries. This is basic segment safety, not a complete deadlock-proof fleet controller.

### How does rerouting work?

The rail is a bidirectional weighted graph. Dijkstra ignores disabled or blocked edges. If the next edge becomes unavailable, the vehicle computes a new route from its current node to its current pickup or delivery destination.

### Why Zustand?

The simulation engine stays framework-independent. Zustand holds UI selections and publishes structured snapshots, making the bridge small and avoiding Three.js frame state from becoming business state.

### Why not update simulation state every rendered frame?

Logical state advances at a controlled interval. Three.js renders independently, while dashboard samples are stored every five simulated seconds. That keeps charts and React trees from rerendering at GPU frame rate.

### How is the bottleneck chosen?

It is a documented heuristic combining utilization, queue pressure, nominal processing duration, and downstream waiting work. The UI shows its reasoning and labels it as a demonstration.

### What would you change for production?

Use durable event sourcing, statistically calibrated distributions, richer re-entrant recipes, formal traffic/deadlock control, observability, access controls, MES/equipment adapters, command interlocks, and extensive validation in read-only shadow and hardware-in-the-loop environments.

### How would this scale?

The engine could move to a Web Worker first, then a service for larger experiments. Spatial and route computations could be cached, event logs paged, chart sampling aggregated, and 3D assets instanced. Distributed execution would be useful for Monte Carlo comparisons, not for this compact deterministic demo.

## Honest limitations

- Synthetic timings and due dates
- Seven-step linear recipe instead of a re-entrant semiconductor route
- Compact single-loop graph and segment-level traffic rules
- No calibrated failure distributions or statistical confidence intervals
- No physical equipment, safety system, MES, PLC, sensor, or identity integration
- In-memory state and browser-only reports
- Battery is explicitly hypothetical

## Relevance to MicroAlchemy

Without claiming endorsement or inside knowledge, the project demonstrates capabilities relevant to a small-scale semiconductor operation: turning an ambiguous material-flow problem into explicit domain models, building a testable scheduling and transport core, visualizing operational state for engineers, and communicating a credible path from simulation to equipment integration. It also shows restraint about where a prototype ends and validated industrial control begins.

## Future development with ROS 2, PLCs, or hardware

ROS 2 could provide a simulation or robot-fleet adapter for research environments, while PLC integration would require vendor-specific protocols, deterministic command handshakes, safety interlocks, and a clearly bounded supervisory role. Real transport hardware should first connect through a read-only digital shadow, then hardware-in-the-loop tests, then supervised limited commands. Any production path needs hazard analysis, cybersecurity, observability, durable audit data, and independent safety-rated controls.
