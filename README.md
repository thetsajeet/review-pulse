# Review Pulse

Review Pulse helps a business owner triage customer reviews and prepare brand-aligned replies. The app uses Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Supabase, and LangGraph with Gemini.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

With Supabase variables left blank, the app runs with sample reviews and simulated actions. Add a Gemini key to `.env.local` to use Gemini for draft generation in demo mode.

## Configure Supabase

Set these values in `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GEMINI_API_KEY=
```

Apply the SQL migration in `supabase/migrations/` to your Supabase project. For a local Supabase stack, start it with the Supabase CLI and run `supabase db reset`; for a linked hosted project, run `supabase db push`.

Enable email sign-in in Supabase Auth and allow `http://localhost:3000/auth/callback` in the project's redirect URL list. Add your production callback URL before deployment. After signing in, create a business owned by that Auth user and add a location. Reviews must be supplied by an ingestion process or inserted through a trusted administrative workflow; Google review synchronization is not part of this MVP.

The migration enables RLS on all three public tables and scopes access through the business owner. Authenticated clients cannot read or write `locations.access_token`.

## MVP behavior

- The triage page loads pending reviews visible to the signed-in user and shows sample reviews when Supabase is not configured.
- Feedback refines the current draft through the LangGraph workflow. Gemini calls require `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) when Supabase is configured.
- Review sentiment is derived from its rating: 1–2 Negative, 3 Neutral, and 4–5 Positive.
- Approve and Reject update the review state in Supabase, or simulate that change in demo mode. Approval does **not** publish to Google Business Profile yet.

## Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```
