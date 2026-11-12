import type { Sentiment } from "./types";

export function sentimentFromRating(rating: number): Sentiment {
  if (rating <= 2) return "Negative";
  if (rating === 3) return "Neutral";
  return "Positive";
}
