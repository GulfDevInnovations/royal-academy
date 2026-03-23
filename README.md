<!-- This is the Web App of Royal Academy -->

<!-- We are using: -->

Next.js App router mode
Postgresql as the database
prisma to connect project to postgresql locally
pgAdmin4 as the GUI for postgresql database
tailwind for css

<!-- How the team colaborate: -->

https://trello.com

<!-- Push Commands: -->

making a new branch with:
git checkout -b "name of the branch"
git add .
git commit -m "name of the commition"
git push
it throws an error:
do what error suggests

after commiting and pushing GO to github
got to your branch that you made for pushing
make a pull request
in reviewers assign reviewing to fatmadali94 or gulfDev
then wait till approvement
when approved:
merge the branch by clicking on merge button (green)

<!-- what others should do to get the latest changes from github: -->

git push origin main

<!-- Useful prisma commands -->

npx prisma db seed # run the seed
npx prisma migrate reset # wipe database + re-migrate + re-seed automatically
npx prisma studio # visual browser for your data

<!-- after changing the schema.prisma for making changes in database do: -->

npx prisma migrate dev --name set-verified-default-true

---

## Local Database Setup (macOS)

This project uses **PostgreSQL locally** + **Prisma** as the ORM.

### How it works (high level)

- `prisma/schema.prisma` defines models (tables), relations, and enums.
- `.env` provides `DATABASE_URL` which tells Prisma **where your local Postgres is** and **which credentials to use**.
- `npx prisma migrate dev` / `npx prisma migrate reset` apply migrations from `prisma/migrations/*` to your local DB.
- `npx prisma generate` generates the Prisma client into `node_modules/@prisma/client`.
- `npx prisma db seed` runs `prisma/seed.ts` to insert initial data.

### 1) Install & start Postgres (pick ONE)

**Option A: Postgres.app**
- Install Postgres.app and make sure it’s running.

**Option B: Homebrew**
- `brew install postgresql@16`
- `brew services start postgresql@16`

**Option C: Docker**
- Run a local Postgres container and expose port `5432`.

### 2) Create the database + user

Use `psql` (or pgAdmin) and create a database + user that matches your `.env`.

Example (adjust username/password as you like):

- Create user:
	- `psql -d postgres -c "CREATE USER postgres WITH PASSWORD 'radikal4';"`
- Create database:
	- `psql -d postgres -c "CREATE DATABASE royal_academy OWNER postgres;"`

If the `postgres` role already exists, just set its password:
- `psql -d postgres -c "ALTER USER postgres WITH PASSWORD 'radikal4';"`

### 3) Set `DATABASE_URL`

In `.env`:
- `DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/royal_academy"`

### 4) Apply migrations + seed

- `npx prisma migrate reset`
	- This recreates the schema, runs all migrations, then runs the seed.

### 5) Run the app

- `npm run dev`

### Troubleshooting

- If you see `P1000 Authentication failed`, your local Postgres username/password doesn’t match `DATABASE_URL`.
- If Prisma Client seems missing models after schema changes, run: `npx prisma generate`.
