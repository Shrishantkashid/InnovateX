# SafeGuard — Protect without being asked

SafeGuard is an AI-powered safety platform with three interconnected modules targeting women, children who carry phones, and children's digital activity.

## Project Structure

- `apps/mobile`: React Native + Expo app for women and children.
- `apps/api`: FastAPI + Python backend.
- `apps/dashboard`: React + Vite dashboard for authorities and parents.
- `services/ai`: AI/ML components (Threat Fusion, Route Risk, Grooming Detection).
- `supabase/migrations`: Database schema and RLS policies.
- `shared`: Shared assets and configurations.

## Tech Stack

- **Mobile**: React Native + Expo
- **Backend**: FastAPI + Python
- **Database**: Supabase (Postgres + Realtime + Storage + PostGIS)
- **AI**: YAMNet TFLite, MiniLM, GPT-4o-mini, DBSCAN
- **Notifications**: Twilio (SMS, Voice, WhatsApp), Expo Push
- **Dashboards**: React + Leaflet.js + Recharts

## Setup

1. Copy `.env.example` to `.env` and fill in the secrets.
2. Follow instructions in each sub-directory for specific service setup.

## License

MIT
