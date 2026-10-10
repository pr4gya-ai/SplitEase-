# SplitEase

> Split expenses with friends, simplify who owes whom, and settle up with one-tap UPI.

## Features
- JWT auth, groups, equal/custom expense splits
- Balances + simplify-debts (fewest payments)
- UPI deep-link settle-up
- Natural-language expense entry (AI draft, user confirms)

## Technologies Used
MongoDB, Express.js, React, Node.js, Mongoose, JWT, Tailwind CSS, Gemini API

## Setup and Installation
```bash
git clone <repo-url> && cd splitease
cd server && npm install && cp .env.example .env   # fill MONGO_URI and JWT_SECRET
# GEMINI_API_KEY is optional: without it, natural-language entry uses a rule-based parser
cd ../client && npm install
cd server && npm run seed      # optional: seed the database with sample data
```

## How to Run
```bash
cd server && npm run dev     # API on :5000
cd client && npm run dev     # UI on :5173
cd server && npm test        # unit tests
cd server && npm run seed     # seed sample data into the database
```

## Deployment

**Live demo:** https://split-ease-bb7h.vercel.app
**API health check:** https://<your-api-project>.vercel.app/api/health

The client and the API are deployed as two separate Vercel projects from this
one repository.

### API (Vercel project with Root Directory `server`)

1. On [Vercel](https://vercel.com), choose **Add New → Project** and import this repository.
2. Set **Root Directory** to `server` and **Framework Preset** to `Other`.
3. `server/vercel.json` routes every request to the Express app, which runs as a serverless function.
4. Under **Environment Variables**, add every API variable from the table below.
5. Deploy, then open `/api/health` on the new URL. It should return `{"status":"ok"}`.

### Client (Vercel project with Root Directory `client`)

1. Import the same repository again as a second project.
2. Set **Root Directory** to `client`. Vercel detects Vite automatically.
3. Add `VITE_API_URL` with the API URL plus the `/api` suffix
   (for example `https://<your-api-project>.vercel.app/api`), then deploy.
4. `client/vercel.json` handles the SPA rewrite so React Router routes work on a hard refresh.
5. Finally, set `CLIENT_URL` on the API project to this client URL and redeploy the API.

### Environment variables

| Variable | Project | Description |
|---|---|---|
| `MONGO_URI` | API | MongoDB Atlas connection string (Atlas Network Access must allow `0.0.0.0/0`) |
| `JWT_SECRET` | API | Long random string used to sign tokens. Set it manually |
| `CLIENT_URL` | API | Exact client URL, no trailing slash, e.g. `https://split-ease-bb7h.vercel.app` (used for CORS) |
| `GEMINI_API_KEY` | API | Google Gemini key. Leave unset to use the rule-based parser |
| `GEMINI_MODEL` | API | Gemini model name (optional; the code default is `gemini-2.0-flash`) |
| `VITE_API_URL` | Client | Full API URL including `/api`, e.g. `https://<your-api-project>.vercel.app/api` |

> **Warning: `VITE_` variables are public.** Vite inlines them into the JavaScript
> bundle that every visitor downloads. Never put secrets in a `VITE_` variable.

## AI Tool Used
**Kiro**

## AI Development Experience
The initial application scaffold (Express API, React client, core money and
debt-splitting logic) was generated with a separate AI assistant. I then moved
the project into Kiro and used it for the tasks below. I added steering files in
`.kiro/steering/` (`product.md`, `tech.md`) so Kiro followed the project's
conventions: money in integer paise, shared error handling, and `node:test`
for tests. I ran each result myself (`npm run seed`, `npm test`) and, after the
first task, switched Autopilot off so I could review changes before accepting them.

### Specific tasks where I used Kiro

1. **Database integration, seed script.** Kiro wrote `server/src/seed.js`
   and an `npm run seed` script. It creates 4 users (one with a UPI ID), a
   "Weekend Trip" group, 5 expenses (including a custom split) and one
   settlement, with all amounts in integer paise. The script clears the
   collections first, so it can be re-run safely on a demo database. I asked
   for 6 expenses and Kiro delivered 5 plus a settlement.

2. **Testing, route integration tests.** Kiro added `server/tests/routes.test.js`
   using `supertest` and `mongodb-memory-server`. The four tests cover: a
   non-member gets 403, a custom split that does not sum to the total gets 400,
   an equal split of ₹10 among 3 people sums to exactly 1000 paise, and a
   settlement reduces the payer's balance. It also updated the `npm test`
   script, and all 13 tests pass (9 existing unit tests plus 4 new ones).

3. **Deployment configuration.** Kiro generated `client/vercel.json` (SPA
   rewrite so React Router routes survive a refresh), `client/.env.example`
   (documenting `VITE_API_URL`), a `render.yaml`, and the README's environment
   variable table. No application code was changed. I deployed both the client
   and the API on Vercel; the generated client config was used as is.
