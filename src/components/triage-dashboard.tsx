"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock3,
  Inbox,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  Star,
  ThumbsDown,
  WandSparkles,
  X,
} from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { sentimentFromRating } from "@/lib/reviews/sentiment";
import type { Review, Sentiment, ThreadMessage } from "@/lib/reviews/types";
import { cn } from "@/lib/utils";

type Props = {
  initialReviews: Review[];
  mode: "demo" | "supabase";
};

type SentimentFilter = "All" | Sentiment;
type Notice = { tone: "success" | "error"; message: string };
type Action = "approve" | "reject" | "refine";

const filters: SentimentFilter[] = ["All", "Positive", "Neutral", "Negative"];

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

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SentimentBadge({ sentiment }: { sentiment: Sentiment }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        sentiment === "Positive" &&
          "border-emerald-300/20 bg-emerald-300/10 text-emerald-700",
        sentiment === "Neutral" &&
          "border-amber-300/20 bg-amber-300/10 text-amber-800",
        sentiment === "Negative" &&
          "border-destructive/20 bg-destructive/10 text-destructive",
      )}
    >
      <span className="size-1 rounded-full bg-current" />
      {sentiment}
    </Badge>
  );
}

function RatingStars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={size}
          strokeWidth={1.7}
          className={index < rating ? "fill-amber-600 text-amber-600" : "text-muted-foreground/40"}
        />
      ))}
    </span>
  );
}

function ReviewCard({
  review,
  selected,
  onSelect,
}: {
  review: Review;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-[15px] border p-3.5 text-left transition",
        selected
          ? "border-primary/20 bg-primary/5"
          : "border-transparent hover:border-border hover:bg-accent/50",
      )}
    >
      <Card className="gap-0 rounded-[15px] border-0 bg-transparent p-0 shadow-none">
      <CardContent className="p-0">
      <div className="flex items-start gap-3">
        <Avatar className="size-9 shrink-0">
          <AvatarFallback className="text-[10px]">
            {initials(review.authorName)}
          </AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-semibold text-foreground">
              {review.authorName}
            </span>
            <span className="shrink-0 text-[10px] text-muted-foreground">
              <RelativeTime value={review.reviewDate} />
            </span>
          </span>
          <span className="mt-1.5 flex items-center justify-between gap-2">
            <RatingStars rating={review.rating} size={10} />
            <span className="text-[9px] text-muted-foreground">Google</span>
          </span>
          <span className="mt-2 block line-clamp-2 text-[11px] leading-[1.65] text-muted-foreground">
            {review.reviewText}
          </span>
          <span className="mt-2.5 flex items-center justify-between">
            <SentimentBadge sentiment={sentimentFromRating(review.rating)} />
            <span
              className={cn(
                "text-[9px]",
                review.status === "REJECTED"
                  ? "text-destructive"
                  : review.status === "APPROVED"
                    ? "text-accent-foreground"
                    : "text-muted-foreground",
              )}
            >
              {review.status === "PENDING_REVIEW"
                ? "New review"
                : review.status === "APPROVED"
                  ? "Approved"
                  : "Rejected"}
            </span>
          </span>
        </span>
      </div>
      </CardContent>
      </Card>
    </motion.button>
  );
}

function DraftTurn({
  content,
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
  isDemo,
}: {
  content: string;
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
  isDemo: boolean;
}) {
  return (
    <motion.article
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="flex gap-3"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-accent-foreground">
        <WandSparkles size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-foreground">ReviewAgent</span>
          <span className="text-[10px] text-muted-foreground">·</span>
          <span className="text-[10px] text-muted-foreground">
            {isLatest ? (isDemo ? "Demo draft" : "Suggested response") : "Previous draft"}
          </span>
        </div>
        <Card
          className={cn(
            "rounded-2xl rounded-tl-md p-0 text-[13px] leading-[1.8]",
            isLatest
              ? "border-primary/10 bg-card"
              : "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          <CardContent className="p-4">{content}</CardContent>
        </Card>
        {isLatest && isApproved ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.06] px-3.5 py-3">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-300 text-[#07120d]">
              <Check size={12} strokeWidth={3} />
            </span>
            <span>
              <span className="block text-xs font-semibold text-emerald-700">
                Sent to Google Business Profile
              </span>
              <span className="mt-1 block text-[10px] leading-4 text-emerald-700">
                MVP delivery is simulated. Connect Google Business Profile to publish live.
              </span>
            </span>
          </div>
        ) : null}
        {isLatest && isPending ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                onClick={onApprove}
                disabled={working !== null}
                className="h-8 rounded-lg px-3 text-[11px]"
              >
                {working === "approve" ? (
                  <span className="size-3 animate-spin rounded-full border border-slate-900/30 border-t-slate-900" />
                ) : (
                  <Check size={13} strokeWidth={2.5} />
                )}
                Approve
                <kbd className="ml-1 rounded border border-slate-900/15 px-1 py-0.5 text-[9px] font-medium text-slate-800/70">
                  A
                </kbd>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onReject}
                disabled={working !== null}
                className="h-8 rounded-lg px-3 text-[11px]"
              >
                {working === "reject" ? (
                  <span className="size-3 animate-spin rounded-full border border-secondary-foreground/30 border-t-secondary-foreground" />
                ) : (
                  <ThumbsDown size={12} />
                )}
                Reject
                <kbd className="ml-1 rounded border border-border px-1 py-0.5 text-[9px] text-muted-foreground">
                  R
                </kbd>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenRefactor}
                disabled={working !== null}
                aria-expanded={refactorOpen}
                className="h-8 rounded-lg px-3 text-[11px]"
              >
                <WandSparkles size={12} />
                Refactor
                <kbd className="ml-1 rounded border border-border px-1 py-0.5 text-[9px] text-muted-foreground">
                  F
                </kbd>
              </Button>
            </div>
            {refactorOpen ? (
              <form
                onSubmit={onSubmitRefactor}
                className="mt-3 rounded-xl border border-border bg-background/70 p-3"
              >
                <Textarea
                  autoFocus
                  value={feedback}
                  onChange={(event) => onFeedbackChange(event.target.value)}
                  maxLength={1200}
                  placeholder="What should change in this response?"
                  aria-label="Refactor instructions"
                  className="min-h-20 border-0 bg-transparent text-xs shadow-none focus-visible:ring-0"
                  disabled={working !== null}
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    Your instructions guide the next draft.
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onCancelRefactor}
                      disabled={working !== null}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!feedback.trim() || working !== null}
                    >
                      {working === "refine" ? "Generating…" : "Regenerate"}
                    </Button>
                  </div>
                </div>
              </form>
            ) : null}
          </>
        ) : null}
      </div>
    </motion.article>
  );
}

export function TriageDashboard({ initialReviews, mode }: Props) {
  const [reviews, setReviews] = useState(initialReviews);
  const [selectedId, setSelectedId] = useState(initialReviews[0]?.id ?? "");
  const [threads, setThreads] = useState<Record<string, ThreadMessage[]>>({});
  const [filter, setFilter] = useState<SentimentFilter>("All");
  const [query, setQuery] = useState("");
  const [feedback, setFeedback] = useState("");
  const [refactorOpenId, setRefactorOpenId] = useState<string | null>(null);
  const [working, setWorking] = useState<Action | null>(null);
  const [addingReview, setAddingReview] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return reviews.filter((review) => {
      const matchesFilter =
        filter === "All" || sentimentFromRating(review.rating) === filter;
      const matchesQuery =
        !normalizedQuery ||
        `${review.authorName} ${review.reviewText}`.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
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

  const handleStatus = useCallback(
    async (status: "APPROVED" | "REJECTED") => {
      if (!selectedReview || working) return;
      const review = selectedReview;
      const action: Action = status === "APPROVED" ? "approve" : "reject";
      setWorking(action);
      setNotice(null);

      try {
        await updateReviewStatus(review.id, status);
        if (status === "REJECTED") {
          setReviews((current) =>
            current.map((item) =>
              item.id === review.id ? { ...item, status: "REJECTED" } : item,
            ),
          );
          setRefactorOpenId(null);
          setNotice({ tone: "success", message: "Review marked as rejected." });
        } else {
          setReviews((current) =>
            current.map((item) =>
              item.id === review.id ? { ...item, status: "APPROVED" } : item,
            ),
          );
          setNotice({
            tone: "success",
            message: "Response approved. MVP delivery is simulated.",
          });
        }
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
      setFilter("All");
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

  const pendingCount = reviews.filter((review) => review.status === "PENDING_REVIEW").length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-[66px] items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid size-8 place-items-center rounded-[10px] bg-primary text-primary-foreground">
            <MessageSquareText size={15} strokeWidth={2.2} />
          </span>
          <span className="text-[13px] font-semibold tracking-[-0.03em] text-foreground">
            review<span className="text-accent-foreground">pulse</span>
          </span>
          <span className="mx-1 hidden h-5 w-px bg-muted/50 sm:block" />
          <span className="hidden text-xs text-muted-foreground sm:block">Review inbox</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Badge variant={mode === "demo" ? "secondary" : "outline"} className="hidden sm:inline-flex">
            <span className="size-1 rounded-full bg-current" />
            {mode === "demo" ? "Demo workspace" : "Private workspace"}
          </Badge>
          {mode === "supabase" ? (
            <form action={signOut}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          ) : (
            <span className="grid size-8 place-items-center rounded-full border border-border bg-muted/50 text-[10px] font-semibold text-foreground">
              RP
            </span>
          )}
        </div>
      </header>

      <div className="grid min-h-[calc(100dvh-66px)] lg:grid-cols-[350px_minmax(0,1fr)]">
        <aside
          className={cn(
            "min-h-[calc(100dvh-66px)] flex-col border-r border-sidebar-border bg-sidebar",
            mobileThreadOpen ? "hidden" : "flex",
            "lg:flex",
          )}
        >
          <div className="px-5 pb-3 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                    Review inbox
                  </h1>
                  <span className="rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {pendingCount}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Keep every customer heard.
                </p>
              </div>
              {mode === "demo" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleAddDemoReview()}
                  disabled={addingReview || working !== null}
                  className="h-8 rounded-lg px-2.5 text-[10px]"
                >
                  {addingReview ? (
                    <span className="size-3 animate-spin rounded-full border border-slate-900/30 border-t-slate-900" />
                  ) : (
                    <Plus size={13} />
                  )}
                  Add review
                </Button>
              ) : null}
            </div>

            <label className="mt-5 flex h-9 items-center gap-2 rounded-lg border border-input bg-background px-2.5 text-muted-foreground focus-within:border-ring">
              <Search size={14} />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search reviews..."
                className="h-full min-w-0 flex-1 border-0 bg-transparent text-[11px] shadow-none focus-visible:ring-0"
                aria-label="Search reviews"
              />
            </label>

            <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
              {filters.map((item) => (
                <Button
                  variant={filter === item ? "secondary" : "ghost"}
                  size="sm"
                  type="button"
                  key={item}
                  onClick={() => setFilter(item)}
                  aria-pressed={filter === item}
                  className="whitespace-nowrap text-[10px]"
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1 px-2.5 pb-5">
            <div className="mb-2 flex items-center gap-2 px-2.5 pt-1.5">
              <Inbox size={12} className="text-muted-foreground" />
              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Reviews
              </span>
              <span className="ml-auto text-[9px] text-muted-foreground">
                {filteredReviews.length}
              </span>
            </div>
            <AnimatePresence initial={false}>
              {filteredReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  selected={selectedReview?.id === review.id}
                  onSelect={() => selectReview(review)}
                />
              ))}
            </AnimatePresence>

            {filteredReviews.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <span className="mx-auto grid size-9 place-items-center rounded-xl border border-border bg-muted/50 text-muted-foreground">
                  <Inbox size={16} />
                </span>
                <p className="mt-3 text-xs font-medium text-foreground">
                  {reviews.length ? "No matching reviews" : "You're all caught up"}
                </p>
                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  {reviews.length
                    ? "Try another search or sentiment filter."
                    : "New customer feedback will appear here."}
                </p>
              </div>
            ) : null}
          </ScrollArea>

          <div className="border-t border-border px-4 py-3">
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <Clock3 size={11} />
              <span>Last synced just now</span>
              <span className="ml-auto flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-emerald-300/80" />
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
              <div className="flex h-[60px] shrink-0 items-center justify-between border-b border-border px-4 sm:px-7">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileThreadOpen(false)}
                    className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground lg:hidden"
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Review thread</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      Google Business Profile <span className="mx-1">·</span> Review #
                      {selectedReview.id.slice(0, 6)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SentimentBadge sentiment={sentimentFromRating(selectedReview.rating)} />
                  {selectedReview.status !== "PENDING_REVIEW" ? (
                    <Badge
                      variant={selectedReview.status === "REJECTED" ? "destructive" : "secondary"}
                    >
                      {selectedReview.status === "REJECTED" ? "Rejected" : "Approved"}
                    </Badge>
                  ) : null}
                </div>
              </div>

              <ScrollArea className="min-h-0 flex-1">
              <div className="px-4 py-6 sm:px-7 sm:py-8">
                <div className="mx-auto max-w-[760px]">
                  {notice ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.16, ease: "easeOut" }}
                      role={notice.tone === "error" ? "alert" : "status"}
                      className={cn(
                        "mb-5 flex items-start justify-between gap-3 rounded-xl border px-3.5 py-3 text-xs",
                        notice.tone === "error"
                          ? "border-rose-300/15 bg-rose-300/[0.06] text-rose-700"
                          : "border-emerald-300/15 bg-emerald-300/[0.055] text-emerald-700",
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

                  <div className="mb-7 flex items-center gap-3">
                    <Avatar className="size-10">
                      <AvatarFallback>{initials(selectedReview.authorName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {selectedReview.authorName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <RatingStars rating={selectedReview.rating} size={12} />
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          <RelativeTime value={selectedReview.reviewDate} />
                        </span>
                      </div>
                    </div>
                    <span className="ml-auto hidden rounded-full border border-border px-2.5 py-1 text-[9px] text-muted-foreground sm:inline-flex">
                      Customer review
                    </span>
                  </div>

                  <motion.article
                    key={`review-${selectedReview.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-border bg-card">
                      <CardContent className="p-5 sm:p-6">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            Original review
                          </span>
                          <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                            <span className="grid size-4 place-items-center rounded-full bg-muted text-[8px] font-bold text-foreground">
                              G
                            </span>
                            Google
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap text-[13px] leading-[1.85] text-card-foreground sm:text-sm">
                          {selectedReview.reviewText}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.article>

                  <div className="my-7 flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Response draft
                    </span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="space-y-5">
                    <AnimatePresence initial={false}>
                      {visibleMessages.map((message, index) =>
                        message.role === "assistant" ? (
                          <DraftTurn
                            key={`${selectedReview.id}-assistant-${index}`}
                            content={message.content}
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
                            isDemo={mode === "demo"}
                          />
                        ) : (
                          <motion.div
                            key={`${selectedReview.id}-user-${index}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.16, ease: "easeOut" }}
                            className="ml-8 flex justify-end"
                          >
                            <div className="max-w-[85%] rounded-2xl rounded-tr-md border border-primary/10 bg-primary/5 px-4 py-3 text-[12px] leading-[1.75] text-foreground">
                              <div className="mb-1.5 flex items-center justify-end gap-1.5 text-[9px] font-medium text-muted-foreground">
                                Your guidance <CheckCheck size={11} />
                              </div>
                              {message.content}
                            </div>
                          </motion.div>
                        ),
                      )}
                    </AnimatePresence>

                    {working === "refine" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3"
                        role="status"
                        aria-live="polite"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/10 text-accent-foreground">
                          <Sparkles size={14} className="animate-pulse" />
                        </span>
                        <span className="flex items-center gap-2 self-center text-xs text-muted-foreground">
                          <span className="flex gap-1">
                            <span className="size-1 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.2s]" />
                            <span className="size-1 animate-bounce rounded-full bg-primary/70 [animation-delay:-0.1s]" />
                            <span className="size-1 animate-bounce rounded-full bg-primary/70" />
                          </span>
                          ReviewAgent is refining the response
                        </span>
                      </motion.div>
                    ) : null}

                    {visibleMessages.length === 0 && working !== "refine" ? (
                      <div className="rounded-2xl border border-dashed border-border bg-muted/50 px-5 py-6 text-center">
                        <span className="mx-auto grid size-9 place-items-center rounded-xl border border-primary/10 bg-primary/5 text-accent-foreground">
                          <WandSparkles size={16} />
                        </span>
                        <p className="mt-3 text-xs font-semibold text-foreground">
                          Ready for a thoughtful first draft
                        </p>
                        <p className="mx-auto mt-1.5 max-w-sm text-[10px] leading-5 text-muted-foreground">
                          Generate a response draft from this customer&apos;s review.
                        </p>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleRefine("")}
                          className="mt-4"
                        >
                          <Sparkles size={13} />
                          Generate a draft
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
              </ScrollArea>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8">
              <div className="max-w-sm text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border bg-muted/50 text-muted-foreground">
                  <Inbox size={21} />
                </span>
                <h2 className="mt-4 text-sm font-semibold text-foreground">
                  {reviews.length ? "Select a review" : "Your inbox is clear"}
                </h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {reviews.length
                    ? "Choose a review from the inbox to see its conversation."
                    : "When a new review arrives, it will be ready for you here."}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
