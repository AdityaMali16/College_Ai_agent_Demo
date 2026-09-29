import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import type { CampusRole } from "@/convex/schema";
import { sampleErpProfile } from "@/convex/sampleData/erp";
import { GraduationCap, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAction, useMutation } from "convex/react";
import type { Doc } from "@/convex/_generated/dataModel";

const roleOptions: {
  value: CampusRole;
  title: string;
  description: string;
}[] = [
  {
    value: "student",
    title: "Student",
    description: "Timetable, attendance, fees, leave, registration, tickets.",
  },
  {
    value: "faculty",
    title: "Faculty",
    description: "Post notices, answer student queries, publish circulars.",
  },
  {
    value: "admin",
    title: "Administrator",
    description: "Full access — notices, records, and campus-wide actions.",
  },
];

export function CampusGate({
  profile,
  children,
}: {
  profile: Doc<"campusProfiles"> | null | undefined;
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const createProfile = useMutation(api.campus.createProfile);
  const seedCampusData = useAction(api.seed.seedCampusData);

  const [campusRole, setCampusRole] = useState<CampusRole>("student");
  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (profile === undefined) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (profile) return <>{children}</>;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createProfile({
        campusRole,
        displayName: displayName || user?.name || "Member",
        department: department || undefined,
        // ERP portal identity, from the seeded portal data
        rollNumber: sampleErpProfile.rollNumber,
        program: sampleErpProfile.program,
        semester: sampleErpProfile.semester,
        section: sampleErpProfile.section,
        hostel: sampleErpProfile.hostel,
        mentor: sampleErpProfile.mentor,
        portalEmail: sampleErpProfile.email,
      });
      await seedCampusData({});
    } catch (err) {
      console.error("Onboarding error:", err);
      setError(
        err instanceof Error ? err.message : "Could not create your profile.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl py-10">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Set up your workspace
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        Who are you on campus?
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Your role decides what the agent can do on your behalf. You can&apos;t
        change this later in the demo build.
      </p>

      <form onSubmit={handleSubmit} className="mt-8">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border/80 bg-border/80">
          {roleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setCampusRole(option.value)}
              className={`flex items-start gap-4 bg-card p-5 text-left transition-colors ${
                campusRole === option.value ? "bg-muted/60" : "hover:bg-muted/30"
              }`}
            >
              <span
                className={`mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border ${
                  campusRole === option.value
                    ? "border-foreground"
                    : "border-muted-foreground/40"
                }`}
              >
                {campusRole === option.value && (
                  <span className="size-2 rounded-full bg-foreground" />
                )}
              </span>
              <span>
                <span className="block text-sm font-medium">
                  {option.title}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {option.description}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Display name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user?.name ?? "Your name"}
              className="mt-2 h-10 rounded-md"
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Department <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Computer Science"
              className="mt-2 h-10 rounded-md"
            />
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          size="lg"
          className="mt-8 h-11 px-8 text-sm"
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <GraduationCap className="mr-2 size-4" />
              Enter workspace
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
