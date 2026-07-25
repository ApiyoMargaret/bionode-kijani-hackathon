# Bionode backend scaffold

## Notes

- The current frontend is a mock dashboard in [src/routes/index.tsx](src/routes/index.tsx), so it is compatible at the product level but not yet wired to live APIs.
- The backend is intentionally structured around the requested contract: a FastAPI telemetry ingest endpoint, SQLAlchemy models, and Redis-backed task publishing.
- The initial implementation focuses on the core flood-control and pollution-spike logic. Full PostGIS/TimescaleDB integration and Copernicus cron scheduling will be added next.

## Next steps

1. Replace the frontend’s local simulation state with live API calls.
2. Add database migrations and PostgreSQL/PostGIS integration.
3. Add a WebSocket or SSE channel for real-time alerts.
4. Add an async worker and scheduled Copernicus polling job.
