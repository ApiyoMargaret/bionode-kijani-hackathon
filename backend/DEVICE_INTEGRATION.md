# Device integration guide

## 1. KijaniBox device payload

Your KijaniBox device or gateway should send telemetry to:

POST /api/v1/telemetry/stream

Example payload:

```json
{
  "device_id": "NYANDO_01",
  "water_height_cm": 270.0,
  "turbidity_ntu": 170.0,
  "latitude": -0.1,
  "longitude": 34.7,
  "timestamp": "2026-07-25T12:30:00Z"
}
```

### Notes
- `device_id` should be unique per device.
- `water_height_cm` is used for flood/diversion logic.
- `turbidity_ntu` is used for pollution spike logic.
- `latitude` and `longitude` are used for location context.
- `timestamp` should be an ISO-8601 timestamp in UTC.

## 2. Example curl command

```bash
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

## 3. Copernicus integration

If you have a real Copernicus API available, set these environment variables before starting the backend:

```bash
export COPERNICUS_API_URL="https://your-copernicus-provider.example"
export COPERNICUS_API_TOKEN="your-token"
```

The app will then use that configuration for the soil endpoint at:

GET /api/v1/integrations/copernicus/soil?latitude=-0.1&longitude=34.7

## 4. Run the backend

```bash
cd backend
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 5. Run the frontend

```bash
cd ..
npm run dev -- --host 0.0.0.0
```

## 6. What the app will do once the device is connected

- KijaniBox telemetry will update the water/turbidity cards
- the backend will decide whether the relay should be sealed or diverted
- the dashboard will show the latest data and alert history
- Copernicus soil information will appear on the satellite card
