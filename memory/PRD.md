# Orbit - Space-Grade Hotel Automation Platform

## Original Problem Statement
Centralize multi-platform hotel availability via autonomous vision-based browser agents. Sync calendars between Booking.com and Airbnb using Playwright + Gemini Vision AI.

## Architecture
- **Frontend**: React (CRA) + Tailwind CSS + Framer Motion + Lucide-React
- **Backend**: FastAPI + MongoDB (Motor async driver)
- **Agent Engine**: Playwright Chromium + Gemini 2.5 Flash Vision (Emergent LLM key)
- **Auth**: JWT sessions (email/password) + Google OAuth (Emergent Auth)
- **Payments**: Stripe Checkout Sessions via emergentintegrations
- **Storage**: MongoDB for all data, filesystem for screenshots

## User Personas
1. **Admin**: Full access - manages all properties, users, agents, subscriptions
2. **Manager**: Manages own properties, views own logs and reservations

## What's Been Implemented

### Phase 1 - MVP (March 16, 2026)
- Full NASA Command Center dark mode dashboard
- Property CRUD with browser automation agent
- Real Playwright + Gemini Vision sync pipeline
- Live Console (SSE), Proof Gallery, Agent Control

### Phase 2 - Auth, Users, Reservations, Stripe (March 16, 2026)
- Authentication (email/password + Google OAuth)
- Role-based access (Admin/Manager)
- User management, User settings
- Reservations (calendar + table)
- Stripe subscriptions (Starter/Pro/Enterprise)

### Phase 3 - Cinematic Landing Page (March 16, 2026)
- Scroll-choreographed landing at '/'
- Star field particle background (mouse-reactive)
- Hero with orbital animations + gradient text
- Demo section: Booking -> Agent -> Airbnb flow visualization
- Features: Bento grid with glassmorphism cards
- Pricing: 3-tier cards with Pro highlighted
- CTA: Final conversion section
- All content in French
- framer-motion scroll-triggered animations
- Responsive navbar with mobile support
- Dashboard moved to '/dashboard'
- Auto-redirect logged-in users to dashboard

## Testing Results
- Phase 1: Backend 100%, Frontend 100%
- Phase 2: Backend 100% (23/23), Frontend 100%
- Phase 3: Frontend 95% (all sections render, minor session persistence fixed)

## Prioritized Backlog
### P1 (High)
- Real Airbnb/Booking.com URL support with stealth
- 2FA/CAPTCHA human-in-the-loop handling
- Email notifications (SendGrid)

### P2 (Medium)
- Testimonials section on landing
- Property sync history timeline
- Calendar conflict resolution
- Stripe Customer Portal
