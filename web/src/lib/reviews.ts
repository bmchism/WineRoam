// Local notes + reviews (private-by-default, opt-in publish). Mirrors the
// Review/Note entities used by the deployed version that persists via
// AppSync and runs the published path through moderation.

export interface MyReview {
  body: string;
  score: number; // 1-10, 0 = unset
  aroma?: number; // 1-5
  palate?: number; // 1-5
  finish?: number; // 1-5
  published: boolean;
}

const noteKey = (id: string) => `wine.note.${id}`;
const reviewKey = (id: string) => `wine.review.${id}`;

export function loadNote(bottleId: string): string {
  return localStorage.getItem(noteKey(bottleId)) ?? "";
}
export function saveNote(bottleId: string, text: string) {
  localStorage.setItem(noteKey(bottleId), text);
}

export function loadMyReview(bottleId: string): MyReview {
  try {
    const raw = localStorage.getItem(reviewKey(bottleId));
    return raw ? JSON.parse(raw) : { body: "", score: 0, published: false };
  } catch {
    return { body: "", score: 0, published: false };
  }
}
export function saveMyReview(bottleId: string, review: MyReview) {
  localStorage.setItem(reviewKey(bottleId), JSON.stringify(review));
}

