import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/AppShell";
import { CampusGate } from "@/components/CampusGate";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";

export default function Knowledge() {
  const profile = useQuery(api.campus.myProfile);
  const documents = useQuery(api.erp.listDocuments);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!documents) return [];
    if (!q) return documents;
    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(q) ||
        doc.category.toLowerCase().includes(q) ||
        doc.content.toLowerCase().includes(q),
    );
  }, [documents, query]);

  if (profile === undefined || documents === undefined) {
    return (
      <AppShell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <CampusGate profile={profile}>
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Knowledge base
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              The documents the agent searches before answering policy
              questions. {documents.length} documents indexed.
            </p>
          </div>

          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policies…"
              className="h-10 rounded-md pl-9"
            />
          </div>

          <div className="columns-1 gap-6 md:columns-2">
            {filtered.map((doc) => (
              <section
                key={doc._id}
                className="mb-6 break-inside-avoid rounded-lg border border-border/80 bg-card p-6"
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {doc.category}
                </p>
                <h2 className="mt-2 text-sm font-semibold">{doc.title}</h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {doc.content}
                </p>
              </section>
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No documents match “{query}”.
            </p>
          )}
        </div>
      </CampusGate>
    </AppShell>
  );
}
