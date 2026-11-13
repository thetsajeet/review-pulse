"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Clock3,
  Inbox,
  Plus,
  Search,
  ShieldCheck,
  Star,
  WandSparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  refineReviewDraft,
  signOut,
  simulateDemoReview,
  updateReviewStatus,
} from "@/app/actions";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Review, ReviewStatus, Sentiment, ThreadMessage } from "@/lib/reviews/types";
import { sentimentFromRating } from "@/lib/reviews/sentiment";
import { cn } from "@/lib/utils";

type Props = {
  initialReviews: Review[];
  mode: "demo" | "supabase";
};

type Notice = { tone: "success" | "error"; message: string };
type Action = "approve" | "reject" | "refine";

const reviewTabs: { label: string; status: ReviewStatus }[] = [
  { label: "Needs review", status: "PENDING_REVIEW" },
  { label: "Approved", status: "APPROVED" },
  { label: "Rejected", status: "REJECTED" },
];

const feedbackSuggestions = ["Warmer", "Shorter", "More formal", "Remove the offer"];

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";

  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return formatter.format(days, "day");
  return date.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function RelativeTime({ value }: { value: string }) {
  const [label, setLabel] = useState("recently");

  useEffect(() => {
    const timer = window.setTimeout(() => setLabel(relativeTime(value)), 0);
    return () => window.clearTimeout(timer);
  }, [value]);

  return <time dateTime={value}>{label}</time>;
}

function reviewTopic(review: Review) {
  const text = review.reviewText.toLowerCase();
  if (/wait|delay|booking|reservation|seated|service/.test(text)) return "Wait time";
  if (/hair|clean|hygiene|sanitary/.test(text)) return "Hygiene";
  if (/park/.test(text)) return "Parking";
  if (/price|cost|portion|expensive/.test(text)) return "Pricing";
  if (/food|meal|dish|soup|cold|pasta|latte/.test(text)) return "Food";
  return "Experience";
}

function priorityFromRating(rating: number) {
  if (rating <= 2) return "Urgent";
  if (rating === 3) return "Review";
  return "Auto-safe";
}

function SentimentPill({ sentiment }: { sentiment: Sentiment }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs",
        sentiment === "Positive" && "bg-emerald-50 text-emerald-800",
        sentiment === "Neutral" && "bg-amber-100/70 text-amber-900",
        sentiment === "Negative" && "bg-rose-50 text-rose-800",
      )}
    >
      {sentiment}
    </span>
  );
}

function RatingStars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-amber-600"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          strokeWidth={1.7}
          fill={index < rating ? "currentColor" : "transparent"}
        />
      ))}
    </span>
  );
}

function ReviewRow({
  review,
  selected,
  onSelect,
}: {
  review: Review;
  selected: boolean;
  onSelect: () => void;
}) {
  const priority = priorityFromRating(review.rating);

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "mb-1.5 w-full rounded-2xl border px-3.5 py-3 text-left transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected ? "border-primary bg-white" : "border-transparent",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="truncate text-sm font-semibold">{review.authorName}</span>
        <RatingStars rating={review.rating} size={13} />
      </span>
      <span className="mt-1.5 block line-clamp-2 text-sm leading-5 text-muted-foreground">
        {review.reviewText}
      </span>
      <span className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs",
            priority === "Urgent" && "bg-primary/25 text-amber-900",
            priority === "Review" && "bg-muted text-foreground",
            priority === "Auto-safe" && "bg-muted text-foreground",
          )}
        >
          {priority}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
          {reviewTopic(review)}
        </span>
      </span>
    </motion.button>
  );
}

function DraftTurn({
  content,
  version,
  isLatest,
  isApproved,
  isPending,
  refactorOpen,
  feedback,
  onApprove,
  onReject,
  onOpenRefactor,
  onFeedbackChange,
  onSubmitRefactor,
  onCancelRefactor,
  working,
}: {
  content: string;
  version: number;
  isLatest: boolean;
  isApproved: boolean;
  isPending: boolean;
  refactorOpen: boolean;
  feedback: string;
  onApprove: () => void;
  onReject: () => void;
  onOpenRefactor: () => void;
  onFeedbackChange: (feedback: string) => void;
  onSubmitRefactor: (event: FormEvent<HTMLFormElement>) => void;
  onCancelRefactor: () => void;
  working: Action | null;
}) {
  return (
    <section className="relative pl-8">
      <span
        className={cn(
          "absolute left-[-6px] top-1.5 size-4 rounded-full border-2 bg-background",
          isLatest ? "border-primary" : "border-border",
          isApproved && "border-emerald-600 bg-emerald-600",
        )}
      >
        {isApproved ? <Check className="size-3 text-white" strokeWidth={3} /> : null}
      </span>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Agent draft response · V{version}
      </p>
      <div
        className={cn(
          "rounded-[22px] border bg-white p-5 sm:p-6",
          isLatest ? "border-primary ring-2 ring-primary/15" : "border-border",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-semibold">
            {isLatest ? "Thoughtful reply" : "Previous draft"}
          </h3>
          {version > 1 ? (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
              Refactored
            </span>
          ) : null}
          {isApproved ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-800">
              Approved
            </span>
          ) : null}
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{content}</p>

        {isLatest && isApproved ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs leading-5 text-emerald-900">
            Response approved. Publishing is not connected yet.
          </p>
        ) : null}

        {isLatest && isPending ? (
          <>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onOpenRefactor}
                disabled={working !== null}
                aria-expanded={refactorOpen}
                className="rounded-full px-3"
              >
                <WandSparkles size={14} />
                Refactor
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onReject}
                disabled={working !== null}
                className="rounded-full px-3"
              >
                {working === "reject" ? "Rejecting…" : "Reject"}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={onApprove}
                disabled={working !== null}
                className="ml-auto rounded-full px-4"
              >
                {working === "approve" ? "Approving…" : "Approve"}
                <Check size={14} />
              </Button>
            </div>
            {refactorOpen ? (
              <form onSubmit={onSubmitRefactor} className="mt-4 border-t border-border pt-4">
                <label
                  htmlFor="draft-feedback"
                  className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Refactor with comments
                </label>
                <Textarea
                  id="draft-feedback"
                  autoFocus
                  value={feedback}
                  onChange={(event) => onFeedbackChange(event.target.value)}
                  maxLength={1200}
                  placeholder="e.g. Mention that we added a waitlist text alert"
                  aria-label="Refactor instructions"
                  className="mt-2 min-h-[60px] resize-y rounded-2xl border-border bg-transparent text-sm shadow-none focus-visible:ring-1"
                  disabled={working !== null}
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {feedbackSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => onFeedbackChange(suggestion)}
                      className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onCancelRefactor}
                    disabled={working !== null}
                    className="rounded-full"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!feedback.trim() || working !== null}
                    className="rounded-full"
                  >
                    {working === "refine" ? "Generating…" : "Regenerate"}
                  </Button>
                </div>
              </form>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

export function TriageDashboard({ initialReviews, mode }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedId, setSelectedId] = useState(initialReviews[0]?.id ?? "");
  const [threads, setThreads] = useState<Record<string, ThreadMessage[]>>({});
  const [filter, setFilter] = useState<ReviewStatus>("PENDING_REVIEW");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [refactorOpenId, setRefactorOpenId] = useState<string | null>(null);
  const [working, setWorking] = useState<Action | null>(null);
  const [addingReview, setAddingReview] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reviews.filter(
      (review) =>
        review.status === filter &&
        (!normalizedQuery ||
          `${review.authorName} ${review.reviewText}`
            .toLowerCase()
            .includes(normalizedQuery)),
    );
  }, [filter, query, reviews]);

  const selectedReview =
    filteredReviews.find((review) => review.id === selectedId) ??
    filteredReviews[0] ??
    null;
  const conversation = selectedReview ? threads[selectedReview.id] ?? [] : [];
  const visibleMessages =
    conversation.length > 0
      ? conversation
      : selectedReview?.draftResponse
        ? [{ role: "assistant" as const, content: selectedReview.draftResponse }]
        : [];
  const latestAssistantIndex = visibleMessages.reduce(
    (latest, message, index) => (message.role === "assistant" ? index : latest),
    -1,
  );
  const pendingCount = reviews.filter(
    (review) => review.status === "PENDING_REVIEW",
  ).length;
  const approvedCount = reviews.filter(
    (review) => review.status === "APPROVED",
  ).length;

  const handleStatus = useCallback(
    async (status: "APPROVED" | "REJECTED") => {
      if (!selectedReview || working) return;
      const review = selectedReview;
      const action: Action = status === "APPROVED" ? "approve" : "reject";
      setWorking(action);
      setNotice(null);

      try {
        await updateReviewStatus(review.id, status);
        setReviews((current) =>
          current.map((item) =>
            item.id === review.id ? { ...item, status } : item,
          ),
        );
        setRefactorOpenId(null);
        setNotice({
          tone: "success",
          message:
            status === "REJECTED"
              ? "Review marked as rejected."
              : "Response approved. Publishing is not connected yet.",
        });
      } catch (error) {
        setNotice({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Unable to update this review.",
        });
      } finally {
        setWorking(null);
      }
    },
    [selectedReview, working],
  );

  const handleAddDemoReview = useCallback(async () => {
    if (mode !== "demo" || addingReview || working) return;
    setAddingReview(true);
    setNotice(null);

    try {
      const review = await simulateDemoReview();
      setReviews((current) => [review, ...current]);
      setSelectedId(review.id);
      setFilter("PENDING_REVIEW");
      setQuery("");
      setFeedback("");
      setRefactorOpenId(null);
      setMobileThreadOpen(true);
      setWorking("refine");

      const result = await refineReviewDraft({
        reviewId: review.id,
        feedback: "",
        messages: [],
        demoReview: review,
      });
      setReviews((current) =>
        current.map((item) =>
          item.id === review.id
            ? { ...item, draftResponse: result.draft, sentiment: result.sentiment }
            : item,
        ),
      );
      setNotice({ tone: "success", message: "ReviewAgent drafted a response." });
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Unable to simulate a review.",
      });
    } finally {
      setAddingReview(false);
      setWorking(null);
    }
  }, [addingReview, mode, working]);

  const handleRefine = useCallback(
    async (instruction: string) => {
      if (!selectedReview || working) return;
      const review = selectedReview;
      const actionHistory = threads[review.id] ?? [];
      const history =
        actionHistory.length > 0
          ? actionHistory
          : review.draftResponse
            ? [{ role: "assistant" as const, content: review.draftResponse }]
            : [];
      setWorking("refine");
      setNotice(null);

      try {
        const result = await refineReviewDraft({
          reviewId: review.id,
          feedback: instruction,
          messages: history,
          demoReview: mode === "demo" ? review : undefined,
        });
        const nextMessages: ThreadMessage[] = [
          ...history,
          ...(instruction ? [{ role: "user" as const, content: instruction }] : []),
          { role: "assistant", content: result.draft },
        ];
        setThreads((current) => ({ ...current, [review.id]: nextMessages }));
        setReviews((current) =>
          current.map((item) =>
            item.id === review.id
              ? { ...item, draftResponse: result.draft, sentiment: result.sentiment }
              : item,
          ),
        );
        setFeedback("");
        setRefactorOpenId(null);
        setNotice({
          tone: "success",
          message: mode === "demo" ? "Demo draft refined." : "Draft updated.",
        });
      } catch (error) {
        setNotice({
          tone: "error",
          message:
            error instanceof Error ? error.message : "Unable to generate a response.",
        });
      } finally {
        setWorking(null);
      }
    },
    [mode, selectedReview, threads, working],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        !selectedReview ||
        working
      ) {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "a" && selectedReview.status === "PENDING_REVIEW") {
        event.preventDefault();
        void handleStatus("APPROVED");
      } else if (key === "r" && selectedReview.status === "PENDING_REVIEW") {
        event.preventDefault();
        void handleStatus("REJECTED");
      } else if (key === "f" && selectedReview.status === "PENDING_REVIEW") {
        event.preventDefault();
        setRefactorOpenId(selectedReview.id);
        setNotice(null);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleStatus, selectedReview, working]);

  function submitRefactor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const instruction = feedback.trim();
    if (instruction) void handleRefine(instruction);
  }

  function selectReview(review: Review) {
    setSelectedId(review.id);
    setFeedback("");
    setRefactorOpenId(null);
    setMobileThreadOpen(true);
    setNotice(null);
  }

  const sentiment = selectedReview
    ? sentimentFromRating(selectedReview.rating)
    : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background px-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/"
            className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"
            aria-label="Review Pulse home"
          >
            <BrandMark className="size-8 rounded-none bg-transparent" />
          </Link>
          <span className="text-sm font-semibold tracking-[-0.03em]">Review Pulse</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">/</span>
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            {mode === "demo" ? "Saffron & Salt Cafe" : "Business workspace"}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3 text-xs sm:gap-6">
          <span className="hidden sm:inline">
            <strong>{pendingCount}</strong> need you
          </span>
          <span className="hidden sm:inline">
            <strong>{approvedCount}</strong> approved
          </span>
          <span className="rounded-full border border-border bg-muted/60 px-3 py-1.5">
            Synced just now
          </span>
          {mode === "supabase" ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm" className="rounded-full">
                Sign out
              </Button>
            </form>
          ) : null}
        </div>
      </header>

      <div className="grid min-h-[calc(100dvh-64px)] lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[360px_minmax(0,1fr)_300px]">
        <aside
          className={cn(
            "min-h-[calc(100dvh-64px)] flex-col border-r border-border bg-[#fafafa]",
            mobileThreadOpen ? "hidden" : "flex",
            "lg:flex",
          )}
        >
          <div className="px-3.5 pb-3 pt-4">
            <div className="flex gap-1">
              {reviewTabs.map(({ label, status }) => {
                const count = reviews.filter((review) => review.status === status).length;
                const active = filter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFilter(status)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-w-0 items-center gap-1.5 rounded-full border px-2.5 py-2 text-xs transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-transparent hover:bg-white",
                    )}
                  >
                    <span className="truncate">{label}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex h-9 items-center gap-2 rounded-full border border-input bg-white px-3 text-muted-foreground focus-within:border-ring">
              <Search size={14} />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reviews"
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
                aria-label="Search reviews"
              />
              {mode === "demo" ? (
                <button
                  type="button"
                  aria-label="Add a sample review"
                  onClick={() => void handleAddDemoReview()}
                  disabled={addingReview || working !== null}
                  className="grid size-6 shrink-0 place-items-center rounded-full hover:bg-muted disabled:opacity-50"
                  title="Add a sample review"
                >
                  <Plus size={14} />
                </button>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3.5 pb-3">
            <div className="mb-2 flex items-center justify-between px-1 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {reviewTabs.find((tab) => tab.status === filter)?.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {filteredReviews.length}
              </span>
            </div>
            <AnimatePresence initial={false}>
              {filteredReviews.map((review) => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  selected={selectedReview?.id === review.id}
                  onSelect={() => selectReview(review)}
                />
              ))}
            </AnimatePresence>

            {filteredReviews.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto grid size-9 place-items-center rounded-xl border border-border bg-white text-muted-foreground">
                  <Inbox size={16} />
                </span>
                <p className="mt-3 text-sm font-medium">
                  {reviews.length ? "No matching reviews" : "You're all caught up"}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {reviews.length
                    ? "Try another search or choose a different tab."
                    : "New customer feedback will appear here."}
                </p>
              </div>
            ) : null}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock3 size={13} />
              <span>Last synced just now</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-600" />
                {mode === "demo" ? "Sample reviews" : "Connected"}
              </span>
            </div>
          </div>
        </aside>

        <section
          className={cn(
            "min-w-0 flex-col bg-background",
            mobileThreadOpen ? "flex" : "hidden",
            "lg:flex",
          )}
        >
          {selectedReview ? (
            <>
              <div className="flex h-[54px] shrink-0 items-center justify-between border-b border-border px-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileThreadOpen(false)}
                    className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted lg:hidden"
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-xs font-medium text-muted-foreground">
                    Customer review
                  </span>
                </div>
                {mode === "demo" ? (
                  <span className="text-xs text-muted-foreground">Sample workspace</span>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto max-w-[820px] px-4 py-6 sm:px-8 sm:py-8">
                  {notice ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      role={notice.tone === "error" ? "alert" : "status"}
                      className={cn(
                        "mb-5 flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-sm",
                        notice.tone === "error"
                          ? "border-rose-200 bg-rose-50 text-rose-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-900",
                      )}
                    >
                      <span className="leading-5">{notice.message}</span>
                      <button
                        type="button"
                        aria-label="Dismiss message"
                        onClick={() => setNotice(null)}
                        className="shrink-0 opacity-60 hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </motion.div>
                  ) : null}

                  <div className="relative space-y-6 before:absolute before:bottom-4 before:left-[7px] before:top-4 before:border-l before:border-border">
                    <section className="relative pl-8">
                      <span className="absolute left-0 top-1.5 size-4 rounded-full border-2 border-primary bg-primary" />
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Customer
                      </p>
                      <div className="rounded-[22px] border border-border bg-white p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h1 className="text-lg font-semibold tracking-[-0.03em]">
                              {selectedReview.authorName}
                            </h1>
                            <p className="mt-1 text-xs text-muted-foreground">
                              <RelativeTime value={selectedReview.reviewDate} />
                            </p>
                          </div>
                          <RatingStars rating={selectedReview.rating} size={17} />
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6">
                          {selectedReview.reviewText}
                        </p>
                      </div>
                    </section>

                    {visibleMessages.map((message, index) => {
                      if (message.role === "user") {
                        return (
                          <section key={`${selectedReview.id}-user-${index}`} className="relative pl-8">
                            <span className="absolute left-0 top-1.5 size-4 rounded-full border-2 border-border bg-background" />
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                              Your feedback
                            </p>
                            <div className="rounded-[22px] bg-muted px-5 py-4 text-sm leading-6">
                              {message.content}
                            </div>
                          </section>
                        );
                      }

                      const version = visibleMessages
                        .slice(0, index + 1)
                        .filter((item) => item.role === "assistant").length;
                      return (
                        <DraftTurn
                          key={`${selectedReview.id}-assistant-${index}`}
                          content={message.content}
                          version={version}
                          isLatest={index === latestAssistantIndex}
                          isApproved={
                            index === latestAssistantIndex &&
                            selectedReview.status === "APPROVED"
                          }
                          isPending={selectedReview.status === "PENDING_REVIEW"}
                          refactorOpen={refactorOpenId === selectedReview.id}
                          feedback={feedback}
                          onApprove={() => void handleStatus("APPROVED")}
                          onReject={() => void handleStatus("REJECTED")}
                          onOpenRefactor={() => {
                            setRefactorOpenId((current) =>
                              current === selectedReview.id ? null : selectedReview.id,
                            );
                            setNotice(null);
                          }}
                          onFeedbackChange={setFeedback}
                          onSubmitRefactor={submitRefactor}
                          onCancelRefactor={() => {
                            setRefactorOpenId(null);
                            setFeedback("");
                          }}
                          working={working}
                        />
                      );
                    })}

                    {working === "refine" ? (
                      <div
                        className="relative flex items-center gap-2 pl-8 text-sm text-muted-foreground"
                        role="status"
                        aria-live="polite"
                      >
                        <WandSparkles size={15} className="animate-pulse text-accent-foreground" />
                        ReviewAgent is refining the response…
                      </div>
                    ) : null}

                    {visibleMessages.length === 0 && working !== "refine" ? (
                      <section className="relative pl-8">
                        <span className="absolute left-0 top-1.5 size-4 rounded-full border-2 border-primary bg-background" />
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Agent draft response
                        </p>
                        <div className="rounded-[22px] border border-border bg-white p-5 sm:p-6">
                          <p className="text-sm text-muted-foreground">
                            Generate a response draft from this customer&apos;s review.
                          </p>
                          <Button
                            size="sm"
                            onClick={() => void handleRefine("")}
                            className="mt-4 rounded-full"
                          >
                            <WandSparkles size={14} />
                            Generate a draft
                          </Button>
                        </div>
                      </section>
                    ) : null}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8">
              <div className="max-w-sm text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-muted text-muted-foreground">
                  <Inbox size={21} />
                </span>
                <h2 className="mt-4 text-sm font-semibold">
                  {reviews.length ? "No reviews in this tab" : "Your inbox is clear"}
                </h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {reviews.length
                    ? "Choose another tab to see more reviews."
                    : "When a new review arrives, it will be ready for you here."}
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="hidden border-l border-border bg-[#fafafa] px-5 py-7 xl:block">
          {selectedReview && sentiment ? (
            <>
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Agent triage
              </h2>
              <dl className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">Sentiment</dt>
                  <dd>
                    <SentimentPill sentiment={sentiment} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">Topic</dt>
                  <dd className="rounded-full border border-border bg-white px-2.5 py-1 text-xs">
                    {reviewTopic(selectedReview)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm text-muted-foreground">Priority</dt>
                  <dd
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs",
                      selectedReview.rating <= 2
                        ? "bg-primary/25 text-amber-900"
                        : "border border-border bg-white",
                    )}
                  >
                    {priorityFromRating(selectedReview.rating)}
                  </dd>
                </div>
              </dl>

              <h2 className="mt-7 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Why this draft
              </h2>
              <div className="mt-3 space-y-2">
                {[
                  `Responds to the ${reviewTopic(selectedReview).toLowerCase()} feedback.`,
                  `${sentiment} tone based on the customer's rating.`,
                  "You can refine it before approving.",
                ].map((reason) => (
                  <p
                    key={reason}
                    className="rounded-2xl border border-border bg-white px-3.5 py-3 text-sm leading-5"
                  >
                    {reason}
                  </p>
                ))}
              </div>

              <h2 className="mt-7 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Guardrails
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {[
                  "Human approval required",
                  "No automatic publishing",
                  "Review before sending",
                ].map((guardrail) => (
                  <li key={guardrail} className="flex items-center gap-2">
                    <ShieldCheck size={14} className="shrink-0 text-amber-700" />
                    {guardrail}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a review to see its triage details.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
