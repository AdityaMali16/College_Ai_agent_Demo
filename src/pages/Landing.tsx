import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const capabilities = [
  {
    icon: BookOpen,
    title: "Answers from your college's own documents",
    body: "Attendance rules, fee deadlines, leave policy, library hours — retrieved from a curated knowledge base, with sources shown.",
  },
  {
    icon: CalendarDays,
    title: "Reads your ERP records on request",
    body: "Ask about your timetable, attendance percentage, fees due, or exam schedule and the agent pulls your live records.",
  },
  {
    icon: ShieldCheck,
    title: "Asks before it acts",
    body: "Course registration, leave applications, tickets, notices — nothing executes without your explicit confirmation.",
  },
];

const examples = [
  "\u201cWhat's my attendance in CS305?\u201d",
  "\u201cHow many days of leave can I take per semester?\u201d",
  "\u201cRegister me for CS322 Machine Learning.\u201d",
  "\u201cWhen is the library open during exams?\u201d",
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-background text-foreground"
    >
      {/* Nav */}
      <header className="border-b border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="size-4" strokeWidth={1.75} />
            <span className="text-sm font-medium tracking-tight">Campus</span>
          </div>
          <nav className="flex items-center gap-1">
            {!isLoading && isAuthenticated ? (
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">Open workspace</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border/70">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-28 text-center md:py-36">
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
          >
            One agent for your entire college
          </motion.p>
          <motion.h1
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl"
          >
            Your campus, on call.
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.16 }}
            className="mt-6 max-w-xl text-pretty text-base leading-7 text-muted-foreground md:text-lg md:leading-8"
          >
            An AI agent that knows your college's rules, reads your records, and
            completes the paperwork — with your approval at every step.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.5, delay: 0.24 }}
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg" className="h-11 px-8 text-sm">
              <Link to="/auth">
                Start asking
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-11 px-8 text-sm text-muted-foreground">
              <Link to="/auth">Continue as guest</Link>
            </Button>
          </motion.div>

          <motion.div
            {...fadeUp}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-16 w-full max-w-2xl rounded-lg border border-border/80 bg-card p-6 text-left"
          >
            <div className="flex items-center gap-3 border-b border-border/70 pb-4">
              <MessageSquare className="size-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-sm font-medium">Ask your campus anything</span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              {examples.slice(0, 2).map((example) => (
                <div
                  key={example}
                  className="rounded-md border border-border/60 bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground"
                >
                  {example}
                </div>
              ))}
              <div className="flex items-start gap-3 pt-1 pl-1">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                <p className="text-sm leading-6">
                  You were below the 75% attendance threshold in one course — here
                  is the condonation policy, and the forms to request it.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-b border-border/70">
        <div className="mx-auto w-full max-w-5xl px-6 py-24">
          <div className="grid gap-px overflow-hidden rounded-lg border border-border/80 bg-border/80 md:grid-cols-3">
            {capabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                className="bg-card p-8"
              >
                <capability.icon className="size-5" strokeWidth={1.5} />
                <h3 className="mt-6 text-sm font-semibold leading-6">
                  {capability.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {capability.body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Examples strip */}
      <section className="border-b border-border/70">
        <div className="mx-auto w-full max-w-5xl px-6 py-24">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Try asking
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {examples.map((example, index) => (
              <motion.div
                key={example}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: index * 0.06 }}
                className="rounded-lg border border-border/70 px-5 py-4 text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
              >
                {example}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section>
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-6 py-28 text-center">
          <h2 className="max-w-xl text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Stop searching the portal. Just ask.
          </h2>
          <p className="mt-4 max-w-md text-pretty text-sm leading-6 text-muted-foreground">
            Sign in with your email — the agent sets up your workspace in
            seconds.
          </p>
          <Button asChild size="lg" className="mt-8 h-11 px-8 text-sm">
            <Link to="/auth">
              Get started
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6 text-xs text-muted-foreground">
          <span>Campus — AI agent for your college</span>
          <span>Demo build</span>
        </div>
      </footer>
    </motion.div>
  );
}
