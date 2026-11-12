# Review Pulse

Review Pulse helps a business owner triage customer reviews and prepare brand-aligned replies. The app uses Next.js 16 App Router, React 19, Tailwind CSS v4, shadcn/ui, Framer Motion, Supabase, and LangGraph with Gemini.

The dark theme is based on TweakCN's [openprofile theme](https://tweakcn.com/r/themes/cmi0kusqy000004jlhzfjfpim).

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

- The triage page loads pending and rejected reviews visible to the signed-in user and shows sample reviews when Supabase is not configured.
- In the demo workspace, **Add review** inserts a dummy review and automatically generates its first draft. Without a Gemini key, the demo uses canned response templates.
- **Refactor** opens an instruction field under the draft actions and sends the entered guidance plus the full ordered thread of owner comments and prior drafts through LangGraph. Gemini calls require `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) when Supabase is configured.
- Review sentiment is derived from its rating: 1–2 Negative, 3 Neutral, and 4–5 Positive.
- Approve and Reject update the review state in Supabase, or simulate that change in demo mode. Rejected reviews remain visible with a **Rejected** status. Approval does **not** publish to Google Business Profile yet.

## Terminal activity logs

UI-triggered review actions log their progress in the Next.js server terminal, not the browser console. Draft-generation logs include a request ID, workflow stages, Gemini request timing and outcome, and whether a demo template was used. Supabase review loads and saves are logged when configured. These activity logs do not include review text, conversation content, generated drafts, credentials, or raw provider errors.

## Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```
