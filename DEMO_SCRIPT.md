# FabFlow Twin — Exact Interview Demo Script

## Preparation

1. Run `npm install`.
2. Run `npm run dev`.
3. Open the Vite URL in Chrome or Edge at 1920×1080.
4. Confirm the Digital Twin page shows seven stations and five vehicles.
5. Click **Reset** immediately before the interview.

## Reliable four-minute flow

### 1. Establish normal production

1. Click **Presentation Mode** in the upper-right.
2. Say: “This scene is driven by a deterministic material-flow simulation, not a scripted animation.”
3. Click **Next demo event** once. Six lots are released; one is urgent.
4. Set speed to **5×**.
5. Click **Run**.
6. Say: “Vehicles receive transport jobs, route over a weighted graph, and reserve constrained rail segments before entry.”
7. Let the model run for about 15 real seconds.

### 2. Create a station bottleneck

1. Click **Next demo event** a second time.
2. Say: “Photolithography is now faulted. Its current process stops, upstream work continues, and waiting work accumulates.”
3. Point to the red station light, Active Faults card, and WIP/awaiting-transport metrics.
4. Let the model run for 8–10 real seconds.

### 3. Recover the process tool

1. Click **Next demo event** a third time.
2. Say: “Recovery resumes the held operation without losing lot history or simulated time.”
3. Point to the station status returning from red to cyan/green.

### 4. Demonstrate dynamic rerouting

1. Click **Next demo event** a fourth time.
2. Say: “SEG-02 is unavailable. The route planner removes that edge and computes an alternate path from the vehicle’s current graph node.”
3. Point to the red rail link and any vehicle taking the lower/cross link.
4. If desired, exit Presentation Mode, select a moving vehicle, and choose **Follow selected vehicle** to highlight its planned route.
5. Click **Next demo event** a fifth time to restore the link.

### 5. Show traceability

1. Exit Presentation Mode.
2. Open **Wafer Traceability**.
3. Select a lot.
4. Point to its route/process timestamps, waiting/processing/transport breakdown, due time, expected completion, and fault history.
5. Say: “The UI and report use the same source state as the 3D scene.”

### 6. Compare dispatch strategies

1. Open **Experiments**.
2. Click **Run all strategies**.
3. Say: “This executes the same seeded 12-lot scenario four times without rendering each logical step.”
4. Point to the ranked table and chart.
5. Say: “The winner is scenario-specific and based on this simplified model; it is not a production optimization claim.”

### 7. Close on architecture

1. Open **Architecture**.
2. Trace the top implemented data flow from Wafer Orders through Metrics & Analysis.
3. Point to the dashed proposed integrations.
4. Say: “MES, equipment, PLC, sensor, RFID, broker, and historical database connections are explicitly proposed—not implemented.”

## Optional deeper dives

- **Collision control:** Open Fleet Management and show segment `reservedBy`/`occupiedBy` state and vehicle blocked time.
- **Dispatch behavior:** Return to Digital Twin and switch FIFO to Priority-aware after adding an urgent lot.
- **Layout study:** Change fleet size, speed, station duration, queue capacity, release interval, or disable a rail link.
- **Event evidence:** Search the event log for `rerouted`, `fault`, a lot ID, or a vehicle ID.
- **Report:** Open About and export the JSON report; then use Print Summary.
- **Camera modes:** Select a lot/vehicle before choosing its follow camera. Top-down and free orbit work without a selection.

## Recovery if the demo gets out of sequence

- Click **Reset**, then use Next demo event from step one.
- If no lot is moving, add a lot, set 10× speed, and run briefly.
- If a rail blockage leaves no route, clear its fault in Fault Injection or re-enable links in Layout Configuration.
- If an Emergency Stop is active, clear it from Active Faults.
- Keyboard shortcuts: `Space` run/pause; `N` next demo event.

## Closing sentence

“FabFlow Twin is a small but complete example of turning scheduling, traffic, fault, and traceability requirements into a testable model and an operator-readable digital twin—while keeping a clear boundary between educational simulation and validated factory control.”
