"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, MessageSquareText } from "lucide-react";
import { sendSignInLink } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginForm({ hasCallbackError }: { hasCallbackError: boolean }) {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(
    hasCallbackError ? "That sign-in link is invalid or has expired. Request a new one." : "",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    setError("");

    try {
      const result = await sendSignInLink(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to send a sign-in link. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="relative z-10 w-full max-w-[410px] border-border bg-card/95 shadow-2xl backdrop-blur-xl">
      <CardContent className="p-7 sm:p-9">
      <Link
        href="/"
        className="mb-9 inline-flex items-center gap-2 text-xs text-slate-500 transition hover:text-slate-200"
      >
        <ArrowLeft size={14} />
        Back to home
      </Link>

      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <MessageSquareText size={17} />
        </span>
        <span className="text-sm font-semibold tracking-[-0.03em] text-white">
          review<span className="text-emerald-300">pulse</span>
        </span>
      </Link>

      {sent ? (
        <div className="py-2">
          <span className="grid size-11 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-200">
            <CheckCircle2 size={21} />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-white">
            Check your inbox
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            We sent a secure sign-in link to{" "}
            <span className="font-medium text-slate-200">{email}</span>. It will
            take you straight to your review workspace.
          </p>
        </div>
      ) : (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/10 bg-emerald-200/[0.05] px-2.5 py-1 text-[10px] font-medium text-emerald-100">
            <Mail size={11} />
            Private workspace
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in with a one-time email link. No password to remember.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-xs font-medium text-slate-300" htmlFor="email">
              Work email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="h-11"
            />
            {error ? (
              <p role="alert" className="text-xs leading-5 text-rose-300">
                {error}
              </p>
            ) : null}
            <Button
              className="h-11 w-full"
              type="submit"
              disabled={isSending}
            >
              {isSending ? "Sending link…" : "Email me a sign-in link"}
              {!isSending ? <ArrowRight size={15} /> : null}
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] leading-5 text-slate-600">
            By continuing, you agree to keep every customer reply thoughtful
            and respectful.
          </p>
        </>
      )}
      </CardContent>
    </Card>
  );
}
