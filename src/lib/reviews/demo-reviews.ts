import { sentimentFromRating } from "./sentiment";
import type { Review } from "./types";

export function createDemoReviews(): Review[] {
  const hoursAgo = (hours: number) =>
    new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  return [
  {
    id: "c56671f0-81ca-43bd-90d4-0a6dafb40c53",
    authorName: "Marcus T.",
    rating: 2,
    reviewText:
      "Waited 40 minutes for a table even with a booking. Food was good, but nobody kept us updated. The host was friendly when we finally got seated, but it took the shine off the evening.",
    reviewDate: hoursAgo(2),
    sentiment: sentimentFromRating(2),
    draftResponse:
      "Hi Marcus, thank you for telling us about your evening, and I'm sorry about the wait. A booking should mean a prompt table, and we should have kept you updated. I'm glad the food and our host made up some of the difference. We're reviewing how we handle delays at the door. Please reach us so we can make it right.",
    status: "PENDING_REVIEW",
  },
  {
    id: "ea9f19c6-b91e-4e8e-9b98-90a82b0f62e7",
    authorName: "Priya S.",
    rating: 5,
    reviewText:
      "The saffron latte is unreal. Staff remembered my name.",
    reviewDate: hoursAgo(5),
    sentiment: sentimentFromRating(5),
    draftResponse:
      "Thank you for the lovely review, Priya! We're so glad you enjoyed the saffron latte and felt remembered by the team. We hope to see you again soon.",
    status: "PENDING_REVIEW",
  },
  {
    id: "a1c8162e-6da4-4d7e-91de-98e9c47eac4e",
    authorName: "Dan K.",
    rating: 1,
    reviewText:
      "Found a hair in my soup. Manager shrugged.",
    reviewDate: hoursAgo(9),
    sentiment: sentimentFromRating(1),
    draftResponse:
      "Hi Dan, we're very sorry about your experience. This falls short of our standards, and we appreciate you bringing it to our attention. We'd like to understand what happened and follow up with you directly.",
    status: "PENDING_REVIEW",
  },
  {
    id: "d617918a-df80-4852-8063-25f9b9ba0eed",
    authorName: "Aisha R.",
    rating: 4,
    reviewText:
      "Lovely brunch spot. Parking is a pain but worth it.",
    reviewDate: hoursAgo(23),
    sentiment: sentimentFromRating(4),
    draftResponse:
      "Thanks for spending part of your day with us, Aisha. We're glad you enjoyed brunch and appreciate the note about parking. We hope to welcome you back soon.",
    status: "PENDING_REVIEW",
  },
  {
    id: "8a59c422-f5b3-4981-99aa-d0d37029239d",
    authorName: "Leo M.",
    rating: 3,
    reviewText:
      "Decent menu, a bit pricey for the portion size.",
    reviewDate: hoursAgo(31),
    sentiment: sentimentFromRating(3),
    draftResponse:
      "Thank you for sharing your thoughts, Leo. We're glad you enjoyed the menu and appreciate the honest feedback about portion sizes and pricing. We'll pass it along to our team.",
    status: "PENDING_REVIEW",
  },
  ];
}
