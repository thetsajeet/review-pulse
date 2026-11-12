"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createDemoReviews } from "@/lib/reviews/demo-reviews";
import { sentimentFromRating } from "@/lib/reviews/sentiment";
import { generateReviewDraft } from "@/lib/reviews/review-agent";
import type { Review } from "@/lib/reviews/types";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const reviewIdSchema = z.string().uuid();
const reviewStatusSchema = z.enum(["APPROVED", "REJECTED"]);
const threadMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

const refineInputSchema = z.object({
  reviewId: reviewIdSchema,
  feedback: z.string().trim().max(1200).default(""),
  messages: z.array(threadMessageSchema).max(20).default([]),
});

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
  if (!reviewIdSchema.safeParse(reviewId).success) {
    throw new Error("Invalid review identifier.");
  }
  if (!reviewStatusSchema.safeParse(status).success) {
    throw new Error("Invalid review status.");
  }

  const config = getSupabaseConfig();
  if (!config) return;

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw new Error(`Unable to verify your session: ${authError.message}`);
  if (!user) throw new Error("Sign in to update this review.");

  const { data, error } = await supabase
    .from("reviews")
    .update({ status })
    .eq("id", reviewId)
    .eq("status", "PENDING_REVIEW")
    .select("id")
    .maybeSingle();

  if (error) throw new Error(`Unable to update review: ${error.message}`);
  if (!data) throw new Error("This review is no longer awaiting review.");

  revalidatePath("/triage");
}

export async function refineReviewDraft(input: {
  reviewId: string;
  feedback: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<{ draft: string; sentiment: Review["sentiment"] }> {
  const parsed = refineInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Review feedback is invalid or too long.");
  }

  const { reviewId, feedback, messages } = parsed.data;
  const config = getSupabaseConfig();

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

    const { data, error } = await supabase
      .from("reviews")
      .select("id, author_name, rating, review_text, review_date, sentiment, draft_response, status")
      .eq("id", reviewId)
      .eq("status", "PENDING_REVIEW")
      .single();

    if (error) throw new Error(`Unable to load review: ${error.message}`);

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
    const demoReview = createDemoReviews().find((item) => item.id === reviewId);
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
    });
    draft = generated.draft;
  } else if (!config) {
    draft = createDemoDraft(review);
  } else {
    throw new Error("Set GEMINI_API_KEY to enable Gemini draft generation.");
  }

  if (config) {
    const supabase = await createClient();
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
