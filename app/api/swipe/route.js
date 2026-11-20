import { swipe, SwipeError } from "../../../lib/store";
export async function POST(req) {
  try {
    const { profileId, direction } = await req.json();
    return Response.json(swipe(profileId, direction));
  } catch (e) {
    const status = e instanceof SwipeError ? e.status : 400;
    return Response.json({ error: e.message }, { status });
  }
}
