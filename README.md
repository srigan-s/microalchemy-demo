# FabFlow Twin

**Intelligent Wafer Transport and Scheduling**

FabFlow Twin is a browser-based, deterministic digital-twin demonstration for wafer-carrier movement through a compact semiconductor production line. It shows how a small manufacturer might explore transport routing, station queues, dispatch policies, traffic conflicts, faults, and throughput before investing in physical automation.

> This is an original educational prototype. It is not connected to physical semiconductor tools, and it is not endorsed by any equipment manufacturer or semiconductor company.

## Screenshots

Add current captures here after running the application:

- `docs/screenshots/digital-twin.png` — isometric cleanroom and live rail traffic
- `docs/screenshots/production-dashboard.png` — production metrics and bottleneck analysis
- `docs/screenshots/presentation-mode.png` — interview presentation view

## Highlights

- Programmatic React Three Fiber cleanroom with seven stations, elevated bidirectional rail, original carrier pods, supports, load ports, indicators, labels, vehicle selection, and route highlighting
- Fixed-step, React-independent TypeScript simulation engine
- Graph routing with Dijkstra shortest path, disabled/blocked links, and live rerouting
- Segment reservation and occupancy rules that prevent two vehicles entering the same constrained segment
- FIFO, nearest-vehicle, priority-aware, and bottleneck-aware dispatch modules
- Station queue, process progress, synthetic recipe, transport jobs, traceability, and automatic lot release
- Faults for station breakdown, blocked rail, processing delay, vehicle failure, carrier identification, metrology rejection, and emergency transport stop
- Live KPIs, queue/utilization charts, bottleneck heuristic, searchable event log, and JSON/print reporting
- Accelerated strategy experiment runner using the same seeded scenario
- Guided six-step interview flow and a 1920×1080 presentation mode
- Isometric, top-down, selected-vehicle, selected-lot, and free-orbit cameras
- Layout settings for station visibility/timing/capacity, fleet size/speed, lot release, and rail-link availability
- Keyboard access, high-contrast states, responsive views, empty states, and an error boundary

## Technology

React, TypeScript, Vite, React Three Fiber, Drei, Zustand, Recharts, Tailwind CSS, Lucide React, Three.js, and Vitest. There is no backend, database, Docker, ROS 2, or proprietary runtime.

## Quick start

Prerequisite: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The UI also supports `Space` to run/pause and `N` to advance the guided demo.

## Commands

```bash
npm run dev        # local Vite development server
npm run build      # strict TypeScript check and production bundle
npm test           # deterministic simulation tests
npm run test:watch # interactive Vitest mode
```

## Architecture

```text
Wafer orders
     ↓
Production scheduler
     ↓
Transport job queue
     ↓
Fleet dispatcher
     ↓
Graph route planner
     ↓
Traffic and segment reservation
     ↓
3D digital twin
     ↓
Metrics, faults and bottleneck analysis
```

The simulation under `src/simulation/` has no React dependency. The engine advances logical state at a fixed step, while Zustand publishes snapshots and React Three Fiber renders smooth positions. Metrics are sampled every five simulated seconds to avoid unnecessary chart rerenders.

Key directories:

```text
src/
  components/       3D scene, charts, dashboards and controls
  simulation/
    engine/         state transitions and deterministic clock
    models/         strict domain interfaces
    routing/        Dijkstra graph routing
    dispatch/       independent scheduling policies
    traffic/        segment reservation and occupancy
    metrics/        KPIs and bottleneck analysis
    experiments/    accelerated strategy comparison
  stores/           UI-facing simulation snapshot store
  tests/            routing, dispatch, traffic and engine tests
```

## Simulation assumptions

The demonstration recipe is:

1. Wafer Stocker
2. Oxidation
3. Photolithography
4. Etching
5. Deposition
6. Metrology
7. Completed Storage

One carrier represents one lot; a vehicle carries at most one carrier. Each station represents one synthetic processing resource. Travel occurs only along graph segments. A vehicle reserves its next constrained segment before entry and releases it after exit. Timings, due dates, battery values, rejection behavior, and capacities are synthetic.

Real semiconductor manufacturing contains many more repeated, qualified, and specialized operations. It also requires contamination controls, hold/release governance, batching, reticle and operator constraints, maintenance, sampling plans, and equipment integration. Those concerns are deliberately outside this logistics-focused model.

## Dispatch policies

- **FIFO:** assigns the oldest unassigned transport request first.
- **Nearest available vehicle:** minimizes estimated graph distance to pickup for each queued job.
- **Priority-aware:** handles urgent lots first, then chooses the nearest available vehicle.
- **Bottleneck-aware:** favors destinations with lower queue/capacity pressure before minimizing pickup distance.

The experiment page gives every policy the same seed and 12-lot scenario. The winner uses a visible composite of completed work, cycle time, queueing, travel distance, and congestion. This is a comparative teaching tool, not an industrial optimizer.

## Fault model

- Station breakdown freezes current processing and grows the upstream queue.
- Rail blockage invalidates the affected link and forces graph rerouting when an alternative exists.
- Processing delay doubles the target station duration until cleared.
- Vehicle fault stops the vehicle and releases its current segment reservation; manual recovery resumes its assignment.
- Carrier ID failure holds affected queued transport work until identification is restored.
- Metrology rejection sends an eligible lot back to a previous process step.
- Emergency stop freezes vehicle motion. Station processing continues unless configured otherwise in the model.

Every fault is visible, logged, exportable, and manually clearable.

## Bottleneck analysis

The transparent heuristic combines observed utilization, current queue pressure, nominal processing capacity, and downstream lots awaiting delivery. The panel reports a likely station, confidence, explanation, and action. It must not be interpreted as production-grade semiconductor optimization.

## Reports

The About page exports JSON containing configuration, seed, strategy, duration, metrics, station and vehicle statistics, lot histories, faults, bottleneck analysis, and the event log. “Print summary” uses a print-friendly stylesheet for a browser PDF or paper report.

## Interview demo

1. Start on **Digital Twin** and enter **Presentation Mode**.
2. Press **Next demo event** to load six lots, including an urgent lot.
3. Run at 5× and explain that positions follow graph routes, not direct interpolation.
4. Advance to the station breakdown and point to the fault card and growing queue.
5. Advance through recovery, rail blockage, and link restoration.
6. Open **Experiments**, run all strategies, and discuss why results are scenario-dependent.
7. Open **Architecture** to describe the boundary between this prototype and proposed production interfaces.

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for exact actions and [INTERVIEW_PITCH.md](./INTERVIEW_PITCH.md) for prepared explanations.

## Limitations

- In-memory, single-browser execution only
- Synthetic processing and travel models; no calibration against equipment
- One simplified process resource per station; no batching or chamber matching
- Basic segment-level traffic control rather than a formal deadlock-free fleet controller
- No authentication, authorization, persistence, audit service, or safety-rated command path
- No MES, equipment, PLC, RFID, sensor, or broker connectivity
- Browser rendering and an intentionally compact layout graph

## Possible real-world integrations

A production exploration could add an MES order adapter, SEMI-standard equipment interfaces, PLC/motion-controller commands, station sensors, barcode/RFID readers, an industrial message broker, historical time-series storage, observability, and a read-only shadow mode before any closed-loop control.

## Future work

- Calibrate travel/processing distributions with real observations
- Add batching, preventive maintenance, re-entrant flows, and chamber qualification
- Formal deadlock prevention and look-ahead segment reservation
- Monte Carlo experiments and statistically meaningful confidence intervals
- Persist experiments and compare layout variants
- Add ROS 2 simulation adapters or PLC interfaces behind explicit safety boundaries
- Validate physical transport behavior with hardware-in-the-loop testing

## Branding and provenance

FabFlow Twin uses original names, layout, geometry, and visual assets. Carrier pods are simple original Three.js geometry inspired only by the general function of sealed wafer carriers.

“Built as an independent exploration of digital-twin and material-flow concepts for small-scale semiconductor production.”
