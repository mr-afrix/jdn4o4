import { useMemo, useState } from "react";
import { GitCommit, GitPullRequest, AlertCircle, Star, GitBranch, GitFork, Package, Radio, Search, Plus } from "lucide-react";
import { useGitHubEvents } from "@/hooks/useGitHub";
import { eventLabel, timeAgo, type GitHubEvent } from "@/lib/github";
import { Reveal } from "./Reveal";

const ICON: Record<string, { Icon: any; color: string }> = {
  PushEvent: { Icon: GitCommit, color: "hsl(155 90% 55%)" },
  PullRequestEvent: { Icon: GitPullRequest, color: "hsl(175 85% 50%)" },
  IssuesEvent: { Icon: AlertCircle, color: "hsl(45 100% 60%)" },
  WatchEvent: { Icon: Star, color: "hsl(48 100% 55%)" },
  CreateEvent: { Icon: GitBranch, color: "hsl(280 75% 60%)" },
  ForkEvent: { Icon: GitFork, color: "hsl(210 100% 60%)" },
  ReleaseEvent: { Icon: Package, color: "hsl(155 90% 55%)" },
};

const PAGE = 6;
const TYPES = ["all", "PushEvent", "PullRequestEvent", "IssuesEvent", "WatchEvent", "CreateEvent", "ForkEvent", "ReleaseEvent"] as const;
const TYPE_LABEL: Record<string, string> = {
  all: "all", PushEvent: "push", PullRequestEvent: "pr", IssuesEvent: "issue",
  WatchEvent: "star", CreateEvent: "create", ForkEvent: "fork", ReleaseEvent: "release",
};

export const RecentEvents = () => {
  const { data, isLoading } = useGitHubEvents();
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("all");
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => {
    const list = data ?? [];
    const s = q.trim().toLowerCase();
    return list.filter((e) => {
      if (type !== "all" && e.type !== type) return false;
      if (!s) return true;
      return e.repo.name.toLowerCase().includes(s) || e.type.toLowerCase().includes(s);
    });
  }, [data, q, type]);

  const visible = filtered.slice(0, shown);
  const more = filtered.length - visible.length;

  return (
    <section className="px-4 py-6 max-w-3xl mx-auto">
      <Reveal>
        <div className="flex items-center gap-2 mb-3">
          <Radio className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Recent Activity</h2>
          <span className="ml-auto text-[10px] smallcaps text-muted-foreground">{filtered.length} events · live</span>
        </div>
      </Reveal>

      <Reveal delay={60}>
        <div className="space-y-2 mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => { setQ(e.target.value); setShown(PAGE); }}
              placeholder="search events..."
              className="w-full pl-9 pr-3 py-2 bg-muted/40 border border-border rounded-lg text-sm smallcaps focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => { setType(t); setShown(PAGE); }}
                className={`shrink-0 px-2.5 py-1 text-[10px] smallcaps rounded-full border transition ${
                  type === t
                    ? "bg-primary/15 border-primary/50 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]"
                    : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>
      </Reveal>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 glass-card">
              <div className="w-9 h-9 rounded-lg bg-muted/60 animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-24 rounded bg-muted/60 animate-pulse" />
                <div className="h-3 w-3/5 rounded bg-muted/50 animate-pulse" />
              </div>
              <div className="h-2.5 w-10 rounded bg-muted/40 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground smallcaps">
          no events match your search
        </div>
      )}

      <div className="space-y-2">
        {visible.map((e, i) => {
          const meta = ICON[e.type] || { Icon: Radio, color: "hsl(var(--primary))" };
          const Icon = meta.Icon;
          return (
            <Reveal key={e.id} delay={i * 40}>
              <a
                href={`https://github.com/${e.repo.name}`}
                target="_blank" rel="noopener noreferrer"
                className="group flex items-center gap-3 p-3 glass-card hover:border-primary/40 hover:-translate-y-0.5 transition"
              >
                <div
                  className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: `${meta.color}1f`, border: `1px solid ${meta.color}55` }}
                >
                  <Icon className="w-4 h-4" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground smallcaps">{eventLabel(e)}</div>
                  <div className="text-sm font-semibold truncate group-hover:text-primary transition">{e.repo.name}</div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground shrink-0">{timeAgo(e.created_at)}</div>
              </a>
            </Reveal>
          );
        })}
      </div>

      {more > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => setShown((s) => s + PAGE)}
            className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/40 bg-primary/5 text-xs smallcaps text-primary hover:bg-primary/15 hover:shadow-[0_0_18px_hsl(var(--primary)/0.35)] transition"
          >
            <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition" />
            load {Math.min(more, PAGE)} more · {more} left
          </button>
        </div>
      )}
    </section>
  );
};
