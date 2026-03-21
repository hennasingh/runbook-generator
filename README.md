## Support Runbook Generator

### What It Does

- User enters a problem description
- App calls OpenAI and returns a structured runbook with: Problem Summary → Likely Causes → Troubleshooting Steps → Escalation Criteria
- User can save runbooks to Supabase
- User can browse and search saved runbooks
- Clean, professional UI

### Tech Stack
- Frontend: Plain HTML + CSS + Vanilla JS (no framework — keeps it simple and fast)
- Backend: Vercel Serverless functions
- AI: OpenAI API (gpt-4o-mini or gpt-5-mini)
- Database: Supabase
- Deployment: Vercel (free)
