# Orbit - Space-Grade Hotel Automation Platform

## Original Problem Statement
Centralize multi-platform hotel availability via autonomous vision-based browser agents. Sync calendars between Booking.com and Airbnb using Playwright + Gemini Vision AI.

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + Lucide-React icons
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Agent Engine**: Playwright Chromium + Gemini 2.5 Flash Vision (via Emergent LLM key)
- **Storage**: MongoDB for properties/logs/agent state, filesystem for screenshots

## User Persona
Single hotel property manager managing listings across Airbnb and Booking.com. Technical enough to understand agent automation, needs a reliable monitoring dashboard.

## Core Requirements (Static)
1. Dashboard with system health monitoring
2. Property CRUD management
3. Browser agent that syncs calendars (Observe -> Compare -> Act -> Validate)
4. Live console with real-time log streaming (SSE)
5. Proof gallery with agent screenshots
6. Agent control (start/stop, polling interval config)

## What's Been Implemented (March 16, 2026)
- Full NASA Command Center dark mode UI
- Property management with CRUD operations
- Real browser automation agent (Playwright + Gemini Vision)
- Mock HTML calendars (Booking.com + Airbnb) for safe testing
- Live Console with SSE streaming, filters, export
- Proof Gallery with screenshot viewer dialog
- Agent control panel (start/stop, polling config)
- System health monitoring
- Full observe -> compare -> act -> validate sync cycle WORKING

## Testing Results
- Backend: 13/13 endpoints passing (100%)
- Frontend: All pages and interactions verified
- Agent pipeline: Gemini detected 11 booked dates, synced to target successfully

## Prioritized Backlog
### P0 (Critical)
- None remaining for MVP

### P1 (High)
- Webhook/notification on sync completion or errors
- Multi-month calendar view in UI
- Real Airbnb/Booking.com URL support (with stealth/anti-detection)
- 2FA/CAPTCHA handling with human-in-the-loop UI

### P2 (Medium)
- Property sync history view
- Batch sync operations
- Calendar conflict resolution UI
- Custom sync rules (e.g., minimum stay blocks)

### Next Tasks
1. Add real site URL support with stealth browser profiles
2. Build calendar diff visualization in UI
3. Add email/webhook notifications for sync events
4. Implement retry logic with exponential backoff for failed syncs
