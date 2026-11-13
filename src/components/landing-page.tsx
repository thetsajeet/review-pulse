"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const steps = [
  {
    number: "01 · TRIAGE",
    title: "Sorted by what matters",
    description:
      "Urgent complaints rise to the top. Easy praise is flagged as safe.",
  },
  {
    number: "02 · DRAFT",
    title: "Replies in your voice",
    description:
      "Specific, warm, and free of promises you did not approve.",
  },
  {
    number: "03 · DECIDE",
    title: "You stay in control",
    description:
      "Approve, reject, or leave a comment and the agent rewrites it.",
  },
];

export function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex h-[92px] max-w-6xl items-center justify-between px-6 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Review Pulse home">
          <BrandMark className="size-8" />
          <span className="text-[15px] font-semibold tracking-[-0.03em]">
            Review Pulse
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a className="transition hover:text-foreground" href="#how-it-works">
            How it works
          </a>
          <a className="transition hover:text-foreground" href="#trust">
            Why Review Pulse
          </a>
        </nav>

        <Button variant="outline" asChild className="h-10 rounded-full px-5">
          <Link href="/triage">Open workspace</Link>
        </Button>
      </header>

      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-14 text-center sm:px-10 sm:pt-16">
        <span className="rounded-full bg-primary/20 px-3 py-1 text-sm font-medium text-accent-foreground">
          Google Business reviews
        </span>
        <h1 className="mt-7 max-w-3xl text-[clamp(2.6rem,6.2vw,4.4rem)] font-semibold leading-[1.04] tracking-[-0.075em]">
          Every review answered.
          <br />
          Nothing sent without you.
        </h1>
        <p className="mt-5 max-w-[570px] text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          An agent reads each new review, drafts a reply in your voice, and
          waits. You approve, reject, or refine it with a comment.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="h-[52px] rounded-full px-7">
            <Link href="/triage">
              Open workspace <ArrowRight size={16} />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
            className="h-[52px] rounded-full px-7"
          >
            <a href="#how-it-works">See how it works</a>
          </Button>
        </div>

        <Card className="mt-16 w-full max-w-[696px] rounded-[22px] border-border bg-card p-0 text-left shadow-none">
          <div className="px-7 pb-5 pt-7 sm:px-8">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-semibold">Marcus T.</span>
              <span
                className="flex shrink-0 gap-0.5 text-amber-600"
                aria-label="2 out of 5 stars"
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={14}
                    strokeWidth={1.8}
                    fill={index < 2 ? "currentColor" : "transparent"}
                  />
                ))}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Waited 40 minutes for a table even with a booking. Food was good,
              but nobody kept us updated.
            </p>
            <div className="my-5 border-t border-border" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-foreground">
              Agent draft
            </span>
            <p className="mt-2 text-sm leading-6">
              Hi Marcus, thank you for telling us, and I&apos;m sorry about the
              wait. We should have kept you updated. We&apos;d love to welcome
              you back.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <span className="inline-flex h-10 items-center rounded-full border border-border px-5 text-sm font-medium">
                Refactor
              </span>
              <span className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground">
                Approve
              </span>
            </div>
          </div>
        </Card>
      </section>

      <section
        id="how-it-works"
        className="mx-auto grid max-w-6xl gap-8 px-6 pb-24 pt-4 sm:grid-cols-3 sm:px-10 sm:pt-12"
      >
        {steps.map((step) => (
          <article key={step.number}>
            <p className="text-[10px] font-semibold tracking-[0.13em] text-muted-foreground">
              {step.number}
            </p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.03em]">
              {step.title}
            </h2>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
              {step.description}
            </p>
          </article>
        ))}
      </section>

      <footer
        id="trust"
        className="border-t border-border px-6 py-7 text-sm text-muted-foreground sm:px-10"
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>Review Pulse</span>
          <span className="flex items-center gap-1">
            Every reply stays in your hands.
          </span>
        </div>
      </footer>
    </main>
  );
}
