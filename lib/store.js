import fs from "fs";
import path from "path";

const DEFAULT_PATH = path.join(process.cwd(), "data", "db.json");
const NAMES = ["Aanya","Rohan","Meera","Kabir","Isha","Vikram","Tara","Arjun","Naina","Dev","Riya","Aditya","Sana","Karan","Pooja","Neil","Diya","Rahul","Anika","Samar","Kiara","Yash","Myra","Ishaan","Zoya","Veer","Anvi","Rehan","Sia","Om"];
const PLACES = ["IIT Bombay","BITS Pilani","Bengaluru","Delhi University","Pune","Christ University","Hyderabad","NIT Trichy","Mumbai","Chennai"];
const INTERESTS = ["Hiking","Coffee","Indie music","Football","Photography","Cooking","Anime","Poetry","Gaming","Travel","Yoga","Cricket","Movies","Dancing","Startups"];
const BIOS = ["Will trade playlists for chai.","Overthinks texts, underthinks plans.","Weekend trekker, weekday napper.","Ask me about my terrible cooking.","Here for good conversation.","Camera roll full of sunsets."];

export function seedData() {
  const profiles = NAMES.map((name, i) => ({
    id: `p${i + 1}`,
    name,
    age: 19 + (i % 8),
    photo: `https://i.pravatar.cc/500?img=${(i % 70) + 1}`,
    bio: BIOS[i % BIOS.length],
    place: PLACES[i % PLACES.length],
    interests: [0, 1, 2].map((k) => INTERESTS[(i * 3 + k * 4) % INTERESTS.length]),
  }));
  // Server-only: seeded profiles that already liked the logged-in user (every 3rd => 10).
  const likedMe = profiles.filter((_, i) => i % 3 === 0).map((p) => p.id);
  return { profiles, likedMe, swipes: {} };
}

function load(file) {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(seedData(), null, 2));
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}
const save = (file, db) => fs.writeFileSync(file, JSON.stringify(db, null, 2));

export function resetDb(file = DEFAULT_PATH) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(seedData(), null, 2));
}

function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// Profiles contain no "likedYou" field, and order is random so likers can't be inferred.
export function getFeed(file = DEFAULT_PATH) {
  const db = load(file);
  return shuffle(db.profiles.filter((p) => !(p.id in db.swipes)));
}

export class SwipeError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

// Same response shape for "pass" and "like on a non-liker": { matched: false }.
export function swipe(profileId, direction, file = DEFAULT_PATH) {
  if (!["like", "pass"].includes(direction)) throw new SwipeError("direction must be 'like' or 'pass'", 400);
  const db = load(file);
  const profile = db.profiles.find((p) => p.id === profileId);
  if (!profile) throw new SwipeError("Unknown profile", 404);
  if (profileId in db.swipes) throw new SwipeError("Already swiped", 409);
  db.swipes[profileId] = direction;
  save(file, db);
  if (direction === "like" && db.likedMe.includes(profileId)) return { matched: true, profile };
  return { matched: false };
}

export function getMatches(file = DEFAULT_PATH) {
  const db = load(file);
  return db.profiles.filter((p) => db.swipes[p.id] === "like" && db.likedMe.includes(p.id));
}
