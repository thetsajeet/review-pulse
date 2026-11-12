import { redirect } from "next/navigation";
import { TriageDashboard } from "@/components/triage-dashboard";
import { sentimentFromRating } from "@/lib/reviews/sentiment";
import { createDemoReviews } from "@/lib/reviews/demo-reviews";
import type { Review } from "@/lib/reviews/types";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TriagePage() {
  const config = getSupabaseConfig();
  if (!config) {
    return <TriageDashboard initialReviews={createDemoReviews()} mode="demo" />;
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    throw new Error(`Unable to verify your session: ${authError.message}`);
  }
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, author_name, rating, review_text, review_date, sentiment, draft_response, status",
    )
    .in("status", ["PENDING_REVIEW", "APPROVED", "REJECTED"])
    .order("review_date", { ascending: false });

  if (error) throw new Error(`Unable to load reviews: ${error.message}`);

  const reviews: Review[] = data.map((review) => ({
    id: review.id,
    authorName: review.author_name,
    rating: review.rating,
    reviewText: review.review_text,
    reviewDate: review.review_date,
    sentiment: sentimentFromRating(review.rating),
    draftResponse: review.draft_response,
    status: review.status,
  }));

  return <TriageDashboard initialReviews={reviews} mode="supabase" />;
}
