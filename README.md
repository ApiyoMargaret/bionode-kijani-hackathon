# Bionode

An IoT-based early-warning system for flood risk and water pollution, built during the **Kijani Hackathon**. Bionode ingests live telemetry from a field sensor device (the "KijaniBox"), evaluates it against flood and pollution thresholds in real time, and pushes alerts and dashboard updates so upstream and downstream communities can react before conditions become dangerous.

The initial use case targets communities along the Nyando river system near Kisumu Bay, where flash flooding and agricultural/industrial runoff both pose recurring risks.

## How it works

- **Telemetry ingest**: KijaniBox devices stream water height (cm) and turbidity (NTU) readings, tagged with GPS coordinates and a timestamp, to the backend.
- **Flood control**: Water height is checked against a danger threshold to decide whether a relay valve should stay sealed, move to standby, or open for automatic diversion, with a hysteresis band to prevent rapid flapping near the threshold.
- **Pollution detection**: Turbidity is compared against the device's previous reading to compute a rate-of-change. A spike beyond the configured threshold triggers a pollution alert.
- **Alert dispatch**: Triggered alerts are queued and published through Redis, broadcast over a Server-Sent Events stream, and logged to alert history.
- **Environmental context**: A satellite soil-saturation endpoint (built for Copernicus data) adds context alongside live sensor readings, with a local fallback when no provider is configured.

## Alerting logic

- **Flood thresholds**: `DANGER_FLOOD_THRESHOLD_CM` (default 250 cm), `HYSTERESIS_RESEAL_CM` (default 230 cm)
- **Pollution threshold**: `POLLUTION_RATE_SHIFT_THRESHOLD_PCT` (default 5% turbidity shift between readings)
- **Community alerts**: pollution spikes generate plain-language guidance rather than a raw numeric flag — e.g. pausing upstream fertilizer/pesticide use, keeping livestock off the open channel, and inspecting nearby canal junctions for runoff sources.

## Status

Built under hackathon time constraints. The backend contract (ingest endpoint, models, Redis queuing, flood/pollution logic) is implemented and functional. The frontend still runs on local mock state rather than live API calls.

Next steps:

- Wire the dashboard to live backend endpoints in place of simulated data
- Add PostgreSQL/PostGIS + TimescaleDB for production-grade geospatial time-series storage
- Complete the real-time channel end-to-end (backend SSE stream exists; frontend consumption is pending)
- Add a scheduled Copernicus polling job and async worker instead of the current on-request fallback

## Development

You need Node.js/npm for the frontend and Python for the backend.

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

```sh
cd backend
pip install -r requirements.txt
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Send test telemetry:

```sh
curl -X POST http://127.0.0.1:8000/api/v1/telemetry/stream \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "NYANDO_01",
    "water_height_cm": 270.0,
    "turbidity_ntu": 170.0,
    "latitude": -0.1,
    "longitude": 34.7,
    "timestamp": "2026-07-25T12:30:00Z"
  }'
```

## Built with

- FastAPI
- SQLAlchemy
- Redis
- TanStack Start
- TypeScript
- React
- Tailwind CSS
- 
