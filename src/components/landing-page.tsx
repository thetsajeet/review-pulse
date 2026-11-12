"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronRight,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  WandSparkles,
} from "lucide-react";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const reviewPreview = [
  {
    initials: "OC",
    name: "Olivia Chen",
    note: "The team made our anniversary dinner feel special...",
    sentiment: "Positive",
    color: "text-emerald-200",
    stars: 5,
  },
  {
    initials: "MW",
    name: "Marcus Williams",
    note: "We waited nearly 40 minutes after ordering...",
    sentiment: "Needs care",
    color: "text-rose-200",
    stars: 2,
  },
  {
    initials: "PP",
    name: "Priya Patel",
    note: "Lovely atmosphere and a great brunch menu...",
    sentiment: "Positive",
    color: "text-emerald-200",
    stars: 4,
  },
];

export function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <BackgroundBeams
        className="pointer-events-none opacity-20 [mask-image:linear-gradient(to_bottom,white,transparent_78%)]"
      />

      <header className="relative z-10 mx-auto flex h-[82px] max-w-7xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Review Pulse home">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <MessageSquareText size={18} strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.03em] text-foreground">
            review<span className="text-emerald-300">pulse</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] text-muted-foreground sm:flex">
          <a className="transition hover:text-white" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-white" href="#built-for-trust">
            Built for trust
          </a>
        </nav>

        <Button variant="outline" size="sm" asChild>
          <Link href="/triage">
            Open workspace
            <ArrowRight size={14} />
          </Link>
        </Button>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-16 sm:px-10 sm:pt-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:pb-32 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[620px]"
        >
          <Badge variant="outline" className="mb-7 h-auto gap-2 border-primary/20 bg-primary/5 px-3 py-1.5 text-[11px] font-medium tracking-wide text-primary">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-300 opacity-60" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-300" />
            </span>
            YOUR REVIEWS, WITH A HUMAN TOUCH
          </Badge>

          <h1 className="max-w-[650px] text-[clamp(2.8rem,6.2vw,5.25rem)] font-semibold leading-[0.99] tracking-[-0.075em] text-white">
            Every review deserves a{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-100 to-foreground bg-clip-text text-transparent">
              thoughtful reply.
            </span>
          </h1>

          <p className="mt-7 max-w-[500px] text-base leading-7 text-muted-foreground sm:text-[17px] sm:leading-8">
            Turn customer reviews into automated, brand-aligned responses
            instantly. ReviewAgent helps you respond faster without sounding
            like a robot.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <motion.div whileHover={{ y: -2, scale: 1.015 }} whileTap={{ scale: 0.985 }}>
              <Button asChild size="lg" className="h-12 px-5 text-sm">
                <Link href="/triage">
                  Get Started <ArrowRight size={16} />
                </Link>
              </Button>
            </motion.div>
            <span className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={15} className="text-slate-400" />
              You stay in control of every reply
            </span>
          </div>

          <div className="mt-11 flex items-center gap-4 border-t border-white/[0.07] pt-6">
            <div className="flex -space-x-2">
              {["bg-violet-300", "bg-sky-300", "bg-amber-200", "bg-rose-300"].map(
                (color, index) => (
                  <span
                    key={color}
                    className={`grid size-7 place-items-center rounded-full border-2 border-[#0b0d12] ${color} text-[9px] font-bold text-slate-900`}
                    aria-hidden
                  >
                    {["M", "A", "J", "S"][index]}
                  </span>
                ),
              )}
            </div>
            <p className="text-xs text-slate-500">
              <span className="font-medium text-slate-200">Made for people</span>
              {" "}who care about their customers
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 28, rotateX: 5 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[570px] [perspective:1200px]"
          aria-label="Preview of the Review Pulse review inbox"
        >
          <Card className="relative overflow-hidden rounded-[22px] border-border bg-card p-0 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-lg border border-border bg-muted text-primary">
                  <MessageSquareText size={15} />
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-100">Review inbox</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">The Juniper Table</p>
                </div>
              </div>
              <Badge variant="outline" className="h-auto border-primary/20 bg-primary/5 px-2.5 py-1 text-[9px] font-medium text-primary">
                12 to review
              </Badge>
            </div>

            <div className="grid min-h-[348px] grid-cols-[0.92fr_1.08fr] gap-0">
              <div className="border-r border-white/[0.07] p-3">
                <div className="mb-2 flex items-center justify-between px-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Recent
                  </span>
                  <span className="text-[9px] text-slate-600">View all</span>
                </div>
                <div className="space-y-1">
                  {reviewPreview.map((review, index) => (
                    <motion.div
                      key={review.name}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + index * 0.1 }}
                      className={`rounded-xl p-2.5 ${index === 0 ? "border border-emerald-200/10 bg-emerald-200/[0.055]" : "border border-transparent"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[10px] font-medium text-slate-200">
                          {review.name}
                        </span>
                        <span className="flex shrink-0 gap-0.5 text-amber-200">
                          {Array.from({ length: 5 }).map((_, star) => (
                            <Star
                              key={star}
                              size={7}
                              fill={star < review.stars ? "currentColor" : "transparent"}
                              className={star < review.stars ? "" : "text-slate-700"}
                            />
                          ))}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[9px] leading-4 text-slate-500">
                        {review.note}
                      </p>
                      <span className={`mt-1.5 block text-[8px] ${review.color}`}>
                        {review.sentiment}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-secondary text-[8px] font-bold text-secondary-foreground">
                    OC
                  </span>
                  <div>
                    <p className="text-[10px] font-medium text-slate-200">Olivia Chen</p>
                    <div className="mt-0.5 flex gap-0.5 text-amber-200">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star key={index} size={8} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-[10px] leading-[1.8] text-slate-400">
                  The team made our anniversary dinner feel special from the
                  moment we walked in. We will absolutely be back.
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 }}
                  className="mt-auto rounded-xl border border-violet-300/10 bg-violet-300/[0.045] p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[9px] font-semibold text-violet-100">
                      <WandSparkles size={11} className="text-violet-200" />
                      ReviewAgent draft
                    </span>
                    <span className="rounded-full bg-emerald-300/[0.08] px-1.5 py-0.5 text-[8px] text-emerald-200">
                      On brand
                    </span>
                  </div>
                  <p className="text-[9px] leading-[1.8] text-slate-400">
                    Olivia, thank you for celebrating with us. We are so glad
                    you enjoyed your evening, and we look forward to welcoming
                    you back.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 border-t border-white/[0.07] pt-2.5">
                    <span className="grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check size={9} strokeWidth={3} />
                    </span>
                    <span className="text-[8px] text-slate-500">
                      Human-approved, always
                    </span>
                    <ChevronRight size={10} className="ml-auto text-slate-600" />
                  </div>
                </motion.div>
              </div>
              </div>

            <div className="flex items-center gap-2 border-t border-white/[0.07] bg-black/10 px-4 py-3">
              <Sparkles size={12} className="text-emerald-200" />
              <span className="text-[9px] text-slate-500">
                Thoughtful replies, ready when you are.
              </span>
              <span className="ml-auto flex items-center gap-1 text-[8px] text-slate-600">
                <span className="size-1 rounded-full bg-emerald-300" />
                Gemini powered
              </span>
            </div>
          </Card>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.35 }}
            className="absolute -bottom-5 -left-6 hidden items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 shadow-xl sm:flex"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck size={16} />
            </span>
            <span>
              <span className="block text-[10px] font-semibold text-slate-100">
                You approve every reply
              </span>
              <span className="mt-1 block text-[9px] text-slate-500">
                No auto-posting. No surprises.
              </span>
            </span>
          </motion.div>
        </motion.div>
      </section>

      <section
        id="how-it-works"
        className="relative z-10 border-t border-white/[0.06] bg-[#0b0d12]/80"
      >
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:py-24">
          <div className="mx-auto max-w-xl text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
              A better way to respond
            </span>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              From review to reply,
              <br className="hidden sm:block" /> without the busywork.
            </h2>
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: MessageSquareText,
                title: "Everything in one inbox",
                text: "See new feedback, ratings, and sentiment in a single calm workspace.",
              },
              {
                icon: WandSparkles,
                title: "A draft that sounds like you",
                text: "Get a thoughtful first response, then refine it with plain-language guidance.",
              },
              {
                icon: ShieldCheck,
                title: "You make the final call",
                text: "Approve, edit, or dismiss. Your voice stays yours, and every reply stays yours.",
              },
            ].map(({ icon: Icon, title, text }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: index * 0.08 }}
                className="rounded-2xl"
              >
                <Card className="h-full border-border bg-card">
                  <CardContent className="p-6">
                    <span className="grid size-10 place-items-center rounded-xl border border-primary/10 bg-primary/5 text-primary">
                      <Icon size={18} />
                    </span>
                    <h3 className="mt-5 text-sm font-semibold text-card-foreground">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
                  </CardContent>
                </Card>
              </motion.article>
            ))}
          </div>

          <div
            id="built-for-trust"
            className="mt-14 flex flex-col items-center justify-between gap-5 rounded-2xl border border-white/[0.07] bg-gradient-to-r from-emerald-300/[0.04] via-white/[0.025] to-violet-300/[0.04] p-6 sm:flex-row sm:px-8"
          >
            <div className="flex items-center gap-4">
              <span className="grid size-11 place-items-center rounded-full border border-primary/10 bg-primary/5 text-primary">
                <ShieldCheck size={19} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">
                  Designed for trust, not autopilot
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  ReviewAgent helps you respond. You stay in control.
                </p>
              </div>
            </div>
            <Button variant="link" asChild className="group h-auto p-0 text-xs font-semibold text-primary">
              <Link href="/triage">
                Explore the workspace
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 text-[10px] text-slate-600 sm:flex-row sm:px-10">
          <span>© Review Pulse</span>
          <span className="flex items-center gap-1.5">
            <Star size={10} className="text-emerald-300" />
            Thoughtful replies. Stronger relationships.
          </span>
          <Link className="inline-flex items-center gap-1 hover:text-slate-400" href="/triage">
            Open demo <ChevronRight size={11} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
