import { sentimentFromRating } from "./sentiment";
import type { Review } from "./types";

export function createDemoReviews(): Review[] {
  const hoursAgo = (hours: number) =>
    new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  return [
  {
    id: "c56671f0-81ca-43bd-90d4-0a6dafb40c53",
    authorName: "Olivia Chen",
    rating: 5,
    reviewText:
      "The team made our anniversary dinner feel special from the moment we walked in. The mushroom risotto was incredible, and Maya was so thoughtful with the wine pairing. We will absolutely be back.",
    reviewDate: hoursAgo(2),
    sentiment: sentimentFromRating(5),
    draftResponse:
      "Olivia, thank you for celebrating your anniversary with us. We are so glad you enjoyed the risotto and Maya's wine pairing. It means a lot that you chose to spend such a special evening here, and we look forward to welcoming you back.",
    status: "PENDING_REVIEW",
  },
  {
    id: "ea9f19c6-b91e-4e8e-9b98-90a82b0f62e7",
    authorName: "Marcus Williams",
    rating: 2,
    reviewText:
      "We waited nearly 40 minutes after ordering, and two dishes arrived cold. The staff were polite, but the whole experience was frustrating for a weeknight dinner.",
    reviewDate: hoursAgo(5),
    sentiment: sentimentFromRating(2),
    draftResponse:
      "Marcus, thank you for letting us know. We are sorry your dinner was delayed and that the food did not arrive as it should. This is not the experience we want for our guests, and we would appreciate the chance to learn more and make things right.",
    status: "PENDING_REVIEW",
  },
  {
    id: "a1c8162e-6da4-4d7e-91de-98e9c47eac4e",
    authorName: "Priya Patel",
    rating: 4,
    reviewText:
      "Lovely atmosphere and a great brunch menu. The coffee was excellent. It got a little noisy around noon, but we had a really nice time overall.",
    reviewDate: hoursAgo(9),
    sentiment: sentimentFromRating(4),
    draftResponse:
      "Priya, thank you for joining us for brunch. We are happy you enjoyed the coffee and atmosphere, and we appreciate the note about the noise at midday. We hope to see you again soon.",
    status: "PENDING_REVIEW",
  },
  {
    id: "d617918a-df80-4852-8063-25f9b9ba0eed",
    authorName: "James Rivera",
    rating: 3,
    reviewText:
      "The food was fine and the portions were generous. Nothing really stood out, but it was a convenient place for lunch.",
    reviewDate: hoursAgo(23),
    sentiment: sentimentFromRating(3),
    draftResponse:
      "James, thanks for stopping by for lunch and sharing your feedback. We are glad the portions worked well for you, and we would love another opportunity to make your next visit stand out.",
    status: "PENDING_REVIEW",
  },
  {
    id: "8a59c422-f5b3-4981-99aa-d0d37029239d",
    authorName: "Sofia Martin",
    rating: 1,
    reviewText:
      "The reservation was not ready when we arrived, and we were seated by the kitchen door despite asking for a quieter table. We left before ordering.",
    reviewDate: hoursAgo(31),
    sentiment: sentimentFromRating(1),
    draftResponse:
      "Sofia, we are sorry we did not have your table ready and that we could not accommodate your seating request. We understand why you left disappointed. Please contact us so we can learn more and try to make this right.",
    status: "PENDING_REVIEW",
  },
  ];
}
