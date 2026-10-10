# Tech and conventions

- Monorepo: `server/` (Express 4, Mongoose 8, CommonJS) and `client/` (React + Vite, Tailwind).
- All money is stored and transferred as INTEGER PAISE. Never use floats for amounts.
  Convert to rupees only for display in the client.
- API routes live in `server/src/routes`, logic in `controllers/`, pure functions in `utils/`.
- Controllers throw `HttpError(status, message)`; async handlers are wrapped with `wrap()`.
- Every group route must check membership via `getGroupForMember`.
- Pure logic (splits, balances, debt simplification, NL parsing) must have `node --test` unit tests.
- Commit style: Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).
