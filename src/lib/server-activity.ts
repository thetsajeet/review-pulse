import "server-only";

import { randomUUID } from "node:crypto";

export type Activity = {
  requestId: string;
  operation: string;
};

export function httpStatusFromError(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number" &&
    Number.isInteger(error.status) &&
    error.status >= 100 &&
    error.status <= 599
  ) {
    return error.status;
  }
}

export function logActivity(
  activity: Activity,
  event: string,
  details: Record<string, string | number | boolean> = {},
) {
  console.info("[Review Pulse]", { ...activity, event, ...details });
}

export async function withServerActivity<T>(
  operation: string,
  run: (activity: Activity) => Promise<T>,
): Promise<T> {
  const activity = { requestId: randomUUID(), operation };
  const started = Date.now();
  logActivity(activity, "started");
  try {
    const result = await run(activity);
    logActivity(activity, "completed", { durationMs: Date.now() - started });
    return result;
  } catch (error) {
    const status = httpStatusFromError(error);
    console.error("[Review Pulse]", {
      ...activity,
      event: "failed",
      durationMs: Date.now() - started,
      errorType: error instanceof Error ? "Error" : "unknown",
      ...(status === undefined ? {} : { status }),
    });
    throw error;
  }
}
