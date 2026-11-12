"use server";

import { randomInt, randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createDemoReviews } from "@/lib/reviews/demo-reviews";
import { sentimentFromRating } from "@/lib/reviews/sentiment";
import { generateReviewDraft } from "@/lib/reviews/review-agent";
import type { Review } from "@/lib/reviews/types";
import { logActivity, withServerActivity, type Activity } from "@/lib/server-activity";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const reviewIdSchema = z.string().uuid();
const reviewStatusSchema = z.enum(["APPROVED", "REJECTED"]);
const threadMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});
const threadMessagesSchema = z.array(threadMessageSchema).superRefine((messages, ctx) => {
  const totalCharacters = messages.reduce(
    (total, message) => total + message.content.length,
    0,
  );
  if (totalCharacters > 100_000) {
    ctx.addIssue({
      code: "custom",
      message: "Thread history is too long to process.",
    });
  }
});
const reviewSchema = z
  .object({
    id: reviewIdSchema,
    authorName: z.string().min(1).max(200),
    rating: z.number().int().min(1).max(5),
    reviewText: z.string().min(1).max(5000),
    reviewDate: z.string().datetime(),
    sentiment: z.enum(["Positive", "Neutral", "Negative"]),
    draftResponse: z.string().max(5000).nullable(),
    status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED"]),
  })
  .refine((review) => review.sentiment === sentimentFromRating(review.rating));

const refineInputSchema = z.object({
  reviewId: reviewIdSchema,
  feedback: z.string().trim().max(1200).default(""),
  messages: threadMessagesSchema.default([]),
  demoReview: reviewSchema.optional(),
});

const simulatedReviews = [
  {
    authorName: "Avery Thompson",
    rating: 5,
    reviewText:
      "A lovely evening from start to finish. The staff made us feel welcome, and the seasonal pasta was the best meal we have had in a long time.",
  },
  {
    authorName: "Noah Williams",
    rating: 3,
    reviewText:
      "The food was good and the portions were generous. Service took longer than expected, but the team was friendly.",
  },
  {
    authorName: "Mia Robinson",
    rating: 2,
    reviewText:
      "We waited a long time for our order, and one dish arrived cold. I hope the restaurant can improve the experience.",
  },
] as const;

export async function sendSignInLink(email: string) {
  const parsedEmail = z.string().trim().email().safeParse(email);
  if (!parsedEmail.success) {
    return { error: "Enter a valid email address." };
  }

  const config = getSupabaseConfig();
  if (!config) return { error: "Supabase authentication is not configured." };

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email: parsedEmail.data,
    options: {
      emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
    },
  });

  if (error) return { error: error.message };
  return { sent: true };
}

export async function simulateDemoReview(): Promise<Review> {
  return withServerActivity("demo.add-review", createSimulatedReview);
}

async function createSimulatedReview(): Promise<Review> {
  if (getSupabaseConfig()) {
    throw new Error("Simulated reviews are only available in the demo workspace.");
  }

  const sample = simulatedReviews[randomInt(simulatedReviews.length)];
  const review: Review = {
    id: randomUUID(),
    authorName: sample.authorName,
    rating: sample.rating,
    reviewText: sample.reviewText,
    reviewDate: new Date().toISOString(),
    sentiment: sentimentFromRating(sample.rating),
    draftResponse: null,
    status: "PENDING_REVIEW",
  };

  return review;
}

export async function signOut() {
  const config = getSupabaseConfig();
  if (!config) redirect("/");

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(`Unable to sign out: ${error.message}`);
  redirect("/login");
}

export async function updateReviewStatus(
  reviewId: string,
  status: "APPROVED" | "REJECTED",
) {
  return withServerActivity("review.update-status", async (activity) => {
    await updateStatus(reviewId, status, activity);
  });
}

async function updateStatus(
  reviewId: string,
  status: "APPROVED" | "REJECTED",
  activity: Activity,
) {
  if (!reviewIdSchema.safeParse(reviewId).success) {
    throw new Error("Invalid review identifier.");
  }
  if (!reviewStatusSchema.safeParse(status).success) {
    throw new Error("Invalid review status.");
  }

  const config = getSupabaseConfig();
  logActivity(activity, "status.validated", {
    status,
    mode: config ? "supabase" : "demo",
  });
  if (!config) return;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(`Unable to verify your session: ${authError.message}`);
  if (!user) throw new Error("Sign in to update this review.");

  logActivity(activity, "supabase.update.started");
  const { data, error } = await supabase
    .from("reviews")
    .update({ status })
    .eq("id", reviewId)
    .eq("status", "PENDING_REVIEW")
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Unable to update review: ${error.message}`);
  if (!data) throw new Error("This review is no longer awaiting review.");

  logActivity(activity, "supabase.update.completed");
  revalidatePath("/triage");
}

export async function refineReviewDraft(
  input: z.infer<typeof refineInputSchema>,
): Promise<{ draft: string; sentiment: Review["sentiment"] }> {
  return withServerActivity("review.generate-draft", (activity) =>
    generateDraft(input, activity),
  );
}

async function generateDraft(
  input: z.infer<typeof refineInputSchema>,
  activity: Activity,
): Promise<{ draft: string; sentiment: Review["sentiment"] }> {
  const parsed = refineInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Review feedback is invalid or the conversation is too long.");
  }

  const { reviewId, feedback, messages, demoReview: suppliedDemoReview } =
    parsed.data;
  const config = getSupabaseConfig();
  logActivity(activity, "input.validated", {
    mode: config ? "supabase" : "demo",
    historyMessages: messages.length,
    hasFeedback: Boolean(feedback),
  });

  let review: Review;
  if (config) {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      throw new Error(`Unable to verify your session: ${authError.message}`);
    }
    if (!user) throw new Error("Sign in to refine this review response.");

    logActivity(activity, "supabase.review-load.started");
    const { data, error } = await supabase
      .from("reviews")
      .select("id, author_name, rating, review_text, review_date, sentiment, draft_response, status")
      .eq("id", reviewId)
      .eq("status", "PENDING_REVIEW")
      .single();

    if (error) throw new Error(`Unable to load review: ${error.message}`);

    logActivity(activity, "supabase.review-load.completed");
    review = {
      id: data.id,
      authorName: data.author_name,
      rating: data.rating,
      reviewText: data.review_text,
      reviewDate: data.review_date,
      sentiment: sentimentFromRating(data.rating),
      draftResponse: data.draft_response,
      status: data.status,
    };
  } else {
    const demoReview =
      suppliedDemoReview?.id === reviewId &&
      suppliedDemoReview.status === "PENDING_REVIEW"
        ? suppliedDemoReview
        : createDemoReviews().find((item) => item.id === reviewId);
    if (!demoReview) throw new Error("The demo review could not be found.");
    review = demoReview;
  }

  let draft: string;
  if (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY
  ) {
    const generated = await generateReviewDraft({
      review,
      messages,
      feedback,
      activity,
    });
    draft = generated.draft;
  } else if (!config) {
    logActivity(activity, "demo.template-used");
    draft = createDemoDraft(review);
  } else {
    throw new Error("Set GEMINI_API_KEY to enable Gemini draft generation.");
  }

  if (config) {
    const supabase = await createClient();
    logActivity(activity, "supabase.draft-save.started");
    const { data, error } = await supabase
      .from("reviews")
      .update({
        draft_response: draft,
        sentiment: sentimentFromRating(review.rating),
      })
      .eq("id", reviewId)
      .eq("status", "PENDING_REVIEW")
      .select("id")
      .maybeSingle();

    if (error) throw new Error(`Unable to save the response draft: ${error.message}`);
    if (!data) throw new Error("This review is no longer awaiting review.");
    logActivity(activity, "supabase.draft-save.completed");
    revalidatePath("/triage");
  }

  return { draft, sentiment: sentimentFromRating(review.rating) };
}

function createDemoDraft(review: Review) {
  if (review.sentiment === "Negative") {
    return `${review.authorName}, thank you for sharing your experience. We are sorry that we fell short, and we appreciate the opportunity to learn from your feedback. Please reach out to our team so we can better understand what happened and make this right.`;
  }

  if (review.sentiment === "Neutral") {
    return `${review.authorName}, thank you for taking the time to leave a review. We appreciate your honest feedback and would love another opportunity to make your next visit even better.`;
  }

  return `${review.authorName}, thank you for your kind review. We are delighted you had a great experience and truly appreciate you choosing us. We look forward to welcoming you back.`;
}
