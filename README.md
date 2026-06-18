# MIDI Piano Teacher

**A Web-based MIDI Piano Learning App**

Simply connect your MIDI Piano and start playing!

![Home Page](home_page.png)

## Explore Different Chords

View the Chord Explorer to visualize the shapes and positions of each chord on a virtual keyboard

## Practice Chords

Select the Chord groups (Major, Minor, Suspended, etc.) you want to practice, then play the chords on screen to progress

### Timed Mode

Select the Chord groups (Major, Minor, Suspended, etc.) you want to test out, then see how many chords you can play correctly in a minute.

View your High Scores and graphs of your progress over time

## Development

### Prerequisites

- Node.js
- Docker (for the database)

### Initial Setup

Install dependencies for both the frontend and the API server:

```bash
npm install
cd server && npm install
```

### Running the App

**1. Start the database:**
```bash
docker compose up -d
```

**2. Start the API server** (from the `server/` directory):
```bash
cd server && npm run dev
```

The server starts at `http://localhost:3001`. On first run (or after a volume reset) it automatically applies migrations and seeds the default user.

**3. Start the frontend** (from the repo root):
```bash
npm start
```

The frontend is available at `http://localhost:3000`.

### Database Management

**Reset the database** (wipes all data and recreates tables from scratch on next server start):
```bash
docker compose down -v && docker compose up -d
```

**Update the schema** after editing `server/src/schema.ts`:
```bash
cd server && npm run db:generate
```

This generates a new SQL migration file in `server/drizzle/`. The migration is applied automatically the next time the server starts.

## Browser Support

Your browser needs to support the Web MIDI API for MIDI Piano Teacher to work:
- Chrome, Edge, and Firefox should all work.
- Safari is **not supported**
