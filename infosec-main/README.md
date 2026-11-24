# StockPilot (infosec) — React + Vite + MongoDB

Inventory demo app. Data now lives in MongoDB (via a small Express API); the browser keeps
`localStorage` only as an offline cache.

## Run it

### MongoDB Atlas

Create a database user in MongoDB Atlas and allow the computer's IP address in
**Network Access**. Then create `.env` in the project root:

```env
MONGO_DB=stockpilot
MONGO_URI=mongodb+srv://YOUR_ATLAS_USERNAME:YOUR_ATLAS_PASSWORD@cluster0.gla8ezl.mongodb.net/?retryWrites=true&w=majority
PORT=4000
```

Replace `YOUR_ATLAS_USERNAME` and `YOUR_ATLAS_PASSWORD`. If the password contains
reserved URL characters, URL-encode them (for example, `+` becomes `%2B`).
Do not commit real credentials to source control.

Open Windows PowerShell in the project folder by running:

```powershell
cd "C:\Users\Bench Culubong\Downloads\infosec-main 1 (2)\infosec-main\infosec-main"
Test-Path package.json
```

`Test-Path package.json` should return `True`.

Install dependencies and seed the database:

```bash
npm install
npm run seed
```

Open two terminals in the project folder.

Terminal 1 - API:

```bash
npm run server
```

The API runs at `http://127.0.0.1:4000`.

Terminal 2 - website:

```bash
npm run dev
```

Open the address printed by Vite, normally `http://127.0.0.1:5173/`.

Demo login:

- Email: `maria.santos@ctinassl.ph`
- Password: `demo1234`

(the login page has a Show/Hide password eye icon).

### Local MongoDB with Docker

Create `.env` with matching Docker and database credentials:

```env
MONGO_ROOT_USER=stockpilot_admin
MONGO_ROOT_PASSWORD=change-me
MONGO_DB=stockpilot
MONGO_URI=mongodb://stockpilot_admin:change-me@127.0.0.1:27017/?authSource=admin
PORT=4000
```

Docker Desktop must be running. Then run:

```bash
npm run db:up
npm run seed
npm run server
npm run dev
```

## Collections (database `stockpilot`)

`products`, `suppliers`, `movements`, `orders`, `users`, `audit`.
User passwords are stored only as bcrypt hashes (`passwordHash`) and are never sent to the browser.

## Using MongoDB Atlas instead of Docker

Put your Atlas connection string in `MONGO_URI` in `.env`, skip `npm run db:up`, run `npm run seed`.

## Before deploying anywhere public

The API has no session/token layer: the `PUT /api/<collection>` endpoints are open to anyone who can
reach the server. It binds to 127.0.0.1 by default for that reason. Add token auth + role checks first.
