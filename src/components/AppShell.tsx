import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router";

const navItems = [
  { to: "/dashboard", label: "Agent" },
  { to: "/campus", label: "Campus" },
  { to: "/approvals", label: "Approvals" },
  { to: "/knowledge", label: "Knowledge" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 text-sm font-medium tracking-tight"
          >
            <GraduationCap className="size-4" strokeWidth={1.75} />
            Campus
          </Link>

          <nav className="hidden items-center gap-5 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `text-sm transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            {user?.email && (
              <span className="hidden max-w-[220px] truncate text-xs text-muted-foreground md:block">
                {user.email}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="size-3.5" />
              Sign out
            </Button>
          </div>
        </div>
        <nav className="flex items-center gap-5 overflow-x-auto border-t border-border/70 px-6 py-2 sm:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap text-sm transition-colors ${
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">{children}</div>
      </main>

      <footer className="border-t border-border/70">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-6 text-xs text-muted-foreground">
          Campus — AI agent for your college
        </div>
      </footer>
    </div>
  );
}
