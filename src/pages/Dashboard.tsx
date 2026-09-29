import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AppShell } from "@/components/AppShell";
import { CampusGate } from "@/components/CampusGate";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Database,
  Loader2,
  MessageSquarePlus,
  Plus,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

type AgentResult = {
  reply: string;
  sources: { id: string; title: string }[];
  tools: string[];
  pendingAction: {
    actionId: string;
    type: string;
    payload: Record<string, unknown>;
    summary: string;
  } | null;
};

const toolMeta: Record<string, { label: string; icon: typeof BookOpen }> = {
  knowledge_rag: { label: "Knowledge base", icon: BookOpen },
  erp_tools: { label: "ERP records", icon: Database },
  human_approval: { label: "Approval required", icon: ShieldCheck },
};

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

function ActionCard({
  action,
  onResolved,
}: {
  action: Doc<"actions">;
  onResolved: () => void;
}) {
  const resolve = useMutation(api.agent.resolveAction);
  const execute = useAction(api.executeAction.runApprovedAction);
  const [busy, setBusy] = useState(false);

  const payload = action.payload as Record<string, unknown>;
  const summary = String(payload.summary ?? actionTitle(action.type));

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await resolve({ actionId: action._id, approved: true });
      const result = await execute({ actionId: action._id });
      if (result.ok) {
        toast.success(result.result);
      } else {
        toast.error(result.result);
      }
      onResolved();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not execute action.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleDecline = async () => {
    setBusy(true);
    try {
      await resolve({ actionId: action._id, approved: false });
      toast("Action declined.");
      onResolved();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Could not decline action.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (action.status === "pending") {
    return (
      <div className="mt-3 rounded-lg border border-foreground/25 bg-card p-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4" strokeWidth={1.75} />
          <span className="text-sm font-medium">Confirm action</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
        <div className="mt-4 flex gap-2">
          <Button size="sm" className="h-8 rounded-md text-xs" onClick={handleConfirm} disabled={busy}>
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
            Confirm & execute
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-md text-xs"
            onClick={handleDecline}
            disabled={busy}
          >
            <XCircle className="size-3.5" />
            Decline
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
      {action.status === "executed" && (
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="size-3.5" />
          Executed — {action.result ?? summary}
        </span>
      )}
      {action.status === "approved" && (
        <span className="flex items-center gap-1.5">
          <Loader2 className="size-3.5 animate-spin" />
          Executing…
        </span>
      )}
      {action.status === "declined" && (
        <span className="flex items-center gap-1.5">
          <XCircle className="size-3.5" />
          Declined
        </span>
      )}
      {action.status === "failed" && (
        <span className="flex items-center gap-1.5 text-destructive">
          <XCircle className="size-3.5" />
          Failed — {action.result ?? "unknown error"}
        </span>
      )}
    </div>
  );
}

function ChatMessage({ message }: { message: Doc<"messages"> }) {
  const actionRecord = useQuery(
    api.agent.getAction,
    message.pendingActionId ? { actionId: message.pendingActionId } : "skip",
  );

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg bg-primary px-4 py-2.5 text-sm leading-6 text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {message.tools && message.tools.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {message.tools.map((tool) => {
            const meta = toolMeta[tool];
            if (!meta) return null;
            const Icon = meta.icon;
            return (
              <span
                key={tool}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                <Icon className="size-3" />
                {meta.label}
              </span>
            );
          })}
        </div>
      )}

      <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>

      {message.sources && message.sources.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="uppercase tracking-widest">Sources</span>
          {message.sources.map((source) => (
            <span
              key={source.id}
              className="rounded border border-border/60 px-1.5 py-0.5"
            >
              {source.title}
            </span>
          ))}
        </div>
      )}

      {actionRecord && (
        <ActionCard action={actionRecord} onResolved={() => {}} />
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const profile = useQuery(api.campus.myProfile);
  const conversations = useQuery(api.agent.listConversations);
  const createConversation = useMutation(api.agent.createConversation);
  const deleteConversation = useMutation(api.agent.deleteConversation);
  const appendUserMessage = useMutation(api.agent.appendUserMessage);
  const appendAssistantMessage = useMutation(api.agent.appendAssistantMessage);
  const askAgent = useAction(api.agent.askAgent);

  const [activeId, setActiveId] = useState<Id<"conversations"> | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations?.find((c) => c._id === activeId) ?? null;
  const messages = useQuery(
    api.agent.getMessages,
    activeConversation ? { conversationId: activeConversation._id } : "skip",
  );

  // Auto-select the newest conversation, or create one on first visit.
  const autoCreatedRef = useRef(false);
  useEffect(() => {
    if (conversations === undefined) return;
    if (conversations.length === 0) {
      if (autoCreatedRef.current) return;
      autoCreatedRef.current = true;
      createConversation({}).catch(console.error);
      return;
    }
    setActiveId((current) =>
      current && conversations.some((c) => c._id === current)
        ? current
        : conversations[0]._id,
    );
  }, [conversations, createConversation]);

  // Scroll to bottom on new messages.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages?.length, thinking]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking || !activeConversation) return;
    setInput("");
    setThinking(true);
    try {
      await appendUserMessage({
        conversationId: activeConversation._id,
        content: text,
      });
      const result: AgentResult = await askAgent({
        conversationId: activeConversation._id,
        message: text,
      });
      await appendAssistantMessage({
        conversationId: activeConversation._id,
        content: result.reply,
        sources: result.sources.map((source) => ({
          id: source.id as Id<"documents">,
          title: source.title,
        })),
        tools: result.tools,
        pendingActionId: result.pendingAction?.actionId as
          | Id<"actions">
          | undefined,
      });
    } catch (error) {
      console.error("Agent error:", error);
      toast.error(
        error instanceof Error ? error.message : "The agent could not reply.",
      );
    } finally {
      setThinking(false);
    }
  };

  return (
    <AppShell>
      <CampusGate profile={profile}>
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="hidden flex-col gap-2 lg:flex">
            <Button
              variant="outline"
              className="h-9 justify-start gap-2 rounded-md text-sm"
              onClick={() =>
                createConversation({})
                  .then((id) => setActiveId(id))
                  .catch(console.error)
              }
            >
              <Plus className="size-3.5" />
              New chat
            </Button>
            <Separator className="my-1" />
            <div className="flex flex-col">
              {(conversations ?? []).map((conversation) => (
                <div
                  key={conversation._id}
                  className={`group flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors ${
                    conversation._id === activeId
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  }`}
                >
                  <button
                    className="flex-1 truncate text-left"
                    onClick={() => setActiveId(conversation._id)}
                  >
                    {conversation.title}
                  </button>
                  <button
                    aria-label="Delete conversation"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => {
                      deleteConversation({ conversationId: conversation._id }).catch(
                        console.error,
                      );
                      if (conversation._id === activeId) setActiveId(null);
                    }}
                  >
                    <XCircle className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </aside>

          {/* Chat panel */}
          <section className="flex min-h-[70vh] flex-col rounded-lg border border-border/80 bg-card">
            <header className="flex items-center justify-between border-b border-border/70 px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {activeConversation?.title ?? "New chat"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-muted-foreground lg:hidden"
                onClick={() =>
                  createConversation({})
                    .then((id) => setActiveId(id))
                    .catch(console.error)
                }
              >
                <MessageSquarePlus className="size-3.5" />
                New
              </Button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-8 overflow-y-auto px-5 py-6">
              {!messages || messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 py-16 text-center">
                  <p className="text-sm font-medium">Ask your campus anything</p>
                  <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                    Try a policy question, ask about your records, or request an
                    action — the agent will confirm before executing.
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {[
                      "What's my roll number and section?",
                      "When is my next assignment due?",
                      "File a complaint about the wifi in room B-214",
                      "Book the guest house for my father from 2026-10-10 to 2026-10-12",
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {(messages ?? []).map((message) => (
                    <ChatMessage key={message._id} message={message} />
                  ))}
                  {thinking && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Thinking…
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="border-t border-border/70 p-4">
              <form
                className="relative"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSend();
                }}
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about policies, records, or request an action…"
                  className="h-12 rounded-md pr-12 text-sm"
                  disabled={thinking || !activeConversation}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="absolute right-1.5 top-1.5 size-9 rounded-md"
                  disabled={thinking || !input.trim() || !activeConversation}
                >
                  {thinking ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
                </Button>
              </form>
              <p className="mt-2 pl-1 text-[11px] text-muted-foreground">
                Signed in as {user?.email ?? "guest"} · actions require your
                confirmation
              </p>
            </div>
          </section>
        </div>
      </CampusGate>
    </AppShell>
  );
}
