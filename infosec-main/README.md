# StockPilot (infosec) — React + Vite + MongoDB

Inventory demo app. Data now lives in MongoDB (via a small Express API); the browser keeps
`localStorage` only as an offline cache.

## Run it

```bash
npm install
cp .env.example .env        # then set your own MONGO_ROOT_PASSWORD (and the same one inside MONGO_URI)
npm run db:up               # starts MongoDB in Docker (docker compose up -d mongo)
npm run seed                # loads the demo products, suppliers, orders, users...
npm run server              # API on http://127.0.0.1:4000   (terminal 1)
npm run dev                 # app on http://localhost:5173   (terminal 2)
```

Demo login: `maria.santos@ctinassl.ph` / `demo1234`
(the login page has a Show/Hide password eye icon).

## Collections (database `stockpilot`)

`products`, `suppliers`, `movements`, `orders`, `users`, `audit`.
User passwords are stored only as bcrypt hashes (`passwordHash`) and are never sent to the browser.

## Using MongoDB Atlas instead of Docker

Put your Atlas connection string in `MONGO_URI` in `.env`, skip `npm run db:up`, run `npm run seed`.

## Before deploying anywhere public

The API has no session/token layer: the `PUT /api/<collection>` endpoints are open to anyone who can
reach the server. It binds to 127.0.0.1 by default for that reason. Add token auth + role checks first.
