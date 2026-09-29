import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { CampusGate } from "@/components/CampusGate";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAction, useMutation, useQuery } from "convex/react";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function actionTitle(type: string): string {
  switch (type) {
    case "register_course":
      return "Course registration";
    case "apply_leave":
      return "Leave application";
    case "raise_ticket":
      return "Support ticket";
    case "send_notice":
      return "Publish notice";
    case "pay_fee":
      return "Fee payment";
    case "submit_complaint":
      return "Complaint registration";
    case "book_guest_house":
      return "Guest house booking";
    case "book_equipment":
      return "Equipment booking";
    case "connect_request":
      return "CONNECT wellness request";
    case "register_exam":
      return "Exam registration";
    default:
      return type;
  }
}

const statusStyle: Record<string, string> = {
  pending: "border-foreground/40 text-foreground",
  approved: "border-foreground/40 text-foreground",
  executed: "text-muted-foreground",
  declined: "text-destructive",
  failed: "text-destructive",
};

export default function Approvals() {
  const profile = useQuery(api.campus.myProfile);
  const actions = useQuery(api.erp.myActions);
  const resolve = useMutation(api.agent.resolveAction);
  const execute = useAction(api.executeAction.runApprovedAction);
  const [busyId, setBusyId] = useState<Id<"actions"> | null>(null);

  const handleConfirm = async (actionId: Id<"actions">) => {
    setBusyId(actionId);
    try {
      await resolve({ actionId, approved: true });
      const result = await execute({ actionId });
      if (result.ok) toast.success(result.result);
      else toast.error(result.result);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Execution failed.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (actionId: Id<"actions">) => {
    setBusyId(actionId);
    try {
      await resolve({ actionId, approved: false });
      toast("Action declined.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Could not decline.");
    } finally {
      setBusyId(null);
    }
  };

  const pending = (actions ?? []).filter((a) => a.status === "pending");
  const history = (actions ?? []).filter((a) => a.status !== "pending");

  return (
    <AppShell>
      <CampusGate profile={profile}>
        <div className="flex flex-col gap-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Nothing runs without you. Confirm, decline, or review every action
              the agent proposed.
            </p>
          </div>

          <section>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Awaiting confirmation
            </p>
            <div className="mt-4">
              {pending.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border/80 py-10 text-center text-sm text-muted-foreground">
                  No pending actions.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {pending.map((action) => {
                    const payload = action.payload as Record<string, unknown>;
                    return (
                      <div
                        key={action._id}
                        className="rounded-lg border border-foreground/25 bg-card p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="size-4" strokeWidth={1.75} />
                            <span className="text-sm font-medium">
                              {actionTitle(action.type)}
                            </span>
                          </div>
                          <Badge variant="outline" className={statusStyle[action.status]}>
                            {action.status}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                          {String(payload.summary ?? "Proposed action")}
                        </p>
                        <div className="mt-4 flex gap-2">
                          <Button
                            size="sm"
                            className="h-8 rounded-md text-xs"
                            onClick={() => handleConfirm(action._id)}
                            disabled={busyId === action._id}
                          >
                            {busyId === action._id ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="size-3.5" />
                            )}
                            Confirm & execute
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-md text-xs"
                            onClick={() => handleDecline(action._id)}
                            disabled={busyId === action._id}
                          >
                            <XCircle className="size-3.5" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              History
            </p>
            <div className="mt-4 rounded-lg border border-border/80 bg-card px-5">
              {history.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">
                  Resolved actions will appear here with their outcomes — your
                  audit trail.
                </p>
              ) : (
                history.map((action) => {
                  const payload = action.payload as Record<string, unknown>;
                  return (
                    <div
                      key={action._id}
                      className="flex items-start justify-between gap-4 border-b border-border/60 py-4 last:border-b-0"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {actionTitle(action.type)}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                          {action.result ?? String(payload.summary ?? "")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {new Date(
                            action.resolvedAt ?? action.createdAt,
                          ).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className={statusStyle[action.status]}
                        >
                          {action.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </CampusGate>
    </AppShell>
  );
}
