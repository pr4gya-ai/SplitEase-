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

## AI Tool Used
**Kiro**

## AI Development Experience
_TODO: 1 short paragraph on how you used Kiro (specs, steering files, vibe chat)._

### Specific tasks where I used Kiro
1. _TODO_
2. _TODO_
3. _TODO_
