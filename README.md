# Ascendency (Because She Can)

A mentorship platform connecting African women with tech mentors, with an AI Career Coach chatbot built in — two switchable personas (Chataki and Botema) available as a floating widget on dashboard pages.

## Tech stack

- Vite + React + TypeScript
- shadcn-ui + Tailwind CSS
- Supabase (Postgres, Auth, Storage, Realtime, Edge Functions)
- Deployed to Vercel

## Getting started

Requires Node.js & npm ([install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
# Clone the repository
git clone https://github.com/hilinaayenew/bscascendbot-test
cd bscascendbot-test

# Install dependencies
npm i

# Start the dev server
npm run dev
```

## Testing

```sh
npm test        # run once
npm run test:watch
```

## Deployment

- **Frontend**: Vercel auto-deploys from this repo on every push to `main` (`git push origin main`), per the rewrite rule in `vercel.json`.
- **AI Coach edge function** (`supabase/functions/ai-career-coach/`): pushing to git does **not** deploy it — after pushing, also run:
  ```sh
  npx supabase functions deploy ai-career-coach
  ```

## More documentation

- [AGENT.md](AGENT.md) — practical, project-specific notes for working on this repo (git remotes, Supabase project details, deployment steps, environment quirks).
- [supabase/functions/ai-career-coach/README.md](supabase/functions/ai-career-coach/README.md) — full design doc for the AI Career Coach architecture.
