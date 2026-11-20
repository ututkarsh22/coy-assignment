# Coy Discover

Swipe-based Discover tab (Next.js 14 App Router + JSON-file storage).

## Run
```
npm install
npm run seed   # optional: resets data/db.json (auto-created on first request)
npm run dev    # http://localhost:3000
npm test
```

## API
- `GET /api/feed` – unswiped profiles, shuffled. No "liked you" info.
- `POST /api/swipe` `{profileId, direction: "like"|"pass"}` – returns `{matched:false}` or `{matched:true, profile}`. 409 on duplicate swipe.
- `GET /api/matches` – mutual matches only.

## Privacy decisions
- Seeded "already liked you" ids live only server-side (`likedMe`) and are never serialized to the client.
- Feed order is shuffled each request so likers can't be inferred from position.
- A pass on a liker and any swipe on a non-liker return the identical `{matched:false}`.
- Swipes persist in `data/db.json`, so reloads never resurface swiped profiles.

## Note
JSON file storage does not persist on serverless hosts (e.g. Vercel); run locally or swap in a hosted DB.
