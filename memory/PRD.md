# Orbit - Space-Grade Hotel Automation Platform

## Original Problem Statement
Centralize multi-platform hotel availability via autonomous vision-based browser agents. Sync calendars between Booking.com and Airbnb using Playwright + Gemini Vision AI.

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + Lucide-React icons
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Agent Engine**: Playwright Chromium + Gemini 2.5 Flash Vision (via Emergent LLM key)
- **Auth**: JWT sessions (email/password) + Google OAuth (Emergent Auth)
- **Payments**: Stripe Checkout Sessions via emergentintegrations
- **Storage**: MongoDB for all data, filesystem for screenshots

## User Personas
1. **Admin**: Full access - manages all properties, users, agents, subscriptions
2. **Manager**: Manages own properties, views own logs and reservations

## Core Requirements (Static)
1. Dashboard with system health monitoring
2. Property CRUD with subscription limits
3. Browser agent sync (Observe -> Compare -> Act -> Validate)
4. Live console with SSE log streaming
5. Proof gallery with agent screenshots
6. Authentication (Email/Password + Google OAuth)
7. User management (Admin/Manager roles)
8. Reservation management (Calendar + Table)
9. User settings (profile, password change)
10. Subscription plans with Stripe payments

## What's Been Implemented

### Phase 1 - MVP (March 16, 2026)
- Full NASA Command Center dark mode UI
- Property management with CRUD
- Real browser automation agent (Playwright + Gemini Vision)
- Mock HTML calendars for safe testing
- Live Console with SSE streaming
- Proof Gallery with screenshots
- Agent control panel

### Phase 2 - Auth, Reservations, Users, Subscriptions (March 16, 2026)
- Login page (Email/Password + Google OAuth via Emergent Auth)
- Session-based authentication with JWT tokens
- Role-based access (Admin/Manager)
- User management page (admin only)
- User settings page (profile + password)
- Reservations management (mini calendar + table with search/filter)
- Auto-created reservations from agent sync
- Subscription page (Starter free/Pro 29EUR/Enterprise 99EUR)
- Stripe Checkout integration
- Property limits enforced per subscription tier
- All existing endpoints protected with auth

## Testing Results
- Phase 1: Backend 100% (13/13), Frontend 100%
- Phase 2: Backend 100% (23/23), Frontend 100%

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High)
- Webhook/notification on sync events
- Real Airbnb/Booking.com URL support with stealth
- 2FA/CAPTCHA handling with human-in-the-loop
- Stripe webhook handling for production

### P2 (Medium)
- Property sync history timeline
- Batch sync operations
- Calendar conflict resolution
- Custom sync rules
- Email notifications via SendGrid

### Next Tasks
1. Add real site URL support with stealth browser profiles
2. Build calendar diff visualization
3. Add email/webhook notifications
4. Implement retry logic with exponential backoff
5. Add Stripe Customer Portal for subscription management
