export type Sentiment = "Positive" | "Neutral" | "Negative";

export type ReviewStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED";

export type ThreadMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Review = {
  id: string;
  authorName: string;
  rating: number;
  reviewText: string;
  reviewDate: string;
  sentiment: Sentiment;
  draftResponse: string | null;
  status: ReviewStatus;
};
