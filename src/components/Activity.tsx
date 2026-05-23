import { useState } from "react";
import { Activity as ActivityIcon, GitCommit, Zap, Heart, Droplet, ChevronDown } from "lucide-react";
import { useGitHubEvents, useGitHubRepos } from "@/hooks/useGitHub";
import { buildActivityBuckets, eventStats, totalStars } from "@/lib/github";
import { Reveal } from "./Reveal";

const RingMetric = ({
  value, max, label, sub, color, icon: Icon,
}: { value: number; max: number; label: string; sub?: string; color: string; icon: any }) => {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  const C = 2 * Math.PI * 36;
  return (
    <div className="glass-card p-3 flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="5" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * C} ${C}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 1.2s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-lg font-bold leading-none">{value}</div>
          {sub && <div className="text-[9px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1 text-[10px] smallcaps text-muted-foreground">
        <Icon className="w-3 h-3" style={{ color }} />
        {label}
      </div>
    </div>
  );
};

export const Activity = () => {
  const { data: events, isLoading } = useGitHubEvents();
  const { data: repos } = useGitHubRepos();
  const [expanded, setExpanded] = useState(false);
  const days = expanded ? 14 : 7;

  const buckets = events ? buildActivityBuckets(events, days) : [];
  const stats = events ? eventStats(events) : { push: 0, pr: 0, issue: 0, star: 0, create: 0, commits: 0 };
  const maxBar = Math.max(1, ...buckets.map((b) => b.commits));
  const stars = repos ? totalStars(repos) : 0;

  // sparkline for events
  const evtSeries = buckets.map((b) => b.events);
  const evtMax = Math.max(1, ...evtSeries);
  const W = 280, H = 60;
  const sparkPath = evtSeries.map((v, i) => {
    const x = (i / Math.max(1, evtSeries.length - 1)) * W;
    const y = H - (v / evtMax) * (H - 8) - 4;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");

  return (
    <section className="px-4 py-6 max-w-3xl mx-auto">
      <Reveal>
        <div className="flex items-center gap-2 mb-3">
          <ActivityIcon className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Live Activity</h2>
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] smallcaps text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            realtime
          </span>
        </div>
      </Reveal>

      {/* Performance metrics — ring cluster */}
      <Reveal delay={60}>
        <div className="grid grid-cols-4 gap-2 mb-3">
          <RingMetric value={stats.commits} max={Math.max(stats.commits, 30)} label="commits" sub={`${days}d`} color="hsl(155 90% 55%)" icon={GitCommit} />
          <RingMetric value={stats.pr} max={Math.max(stats.pr, 10)} label="pulls" sub={`${days}d`} color="hsl(175 85% 50%)" icon={Zap} />
          <RingMetric value={stats.star} max={Math.max(stats.star, 10)} label="starred" sub={`${days}d`} color="hsl(45 100% 60%)" icon={Heart} />
          <RingMetric value={stats.create} max={Math.max(stats.create, 10)} label="created" sub={`${days}d`} color="hsl(280 75% 60%)" icon={Droplet} />
        </div>
      </Reveal>

      {/* Activity Breakdown — bar chart */}
      <Reveal delay={120}>
        <div className="glass-card p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="smallcaps text-[11px] text-muted-foreground">activity breakdown</div>
              <div className="text-2xl font-bold">{stats.commits}<span className="text-xs text-muted-foreground font-normal ml-1">commits / {days}d</span></div>
            </div>
            <div className="text-right">
              <div className="text-[10px] smallcaps text-muted-foreground">total events</div>
              <div className="text-base font-bold text-primary">{events?.length ?? 0}</div>
            </div>
          </div>

          {isLoading ? (
            <div className="h-24 bg-muted/30 rounded animate-pulse" />
          ) : (
            <div className="flex items-end justify-between gap-1.5 h-24">
              {buckets.map((b, i) => {
                const h = (b.commits / maxBar) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex-1 flex items-end">
                      <div
                        className="w-full rounded-t-sm transition-all duration-700"
                        style={{
                          height: `${Math.max(h, 4)}%`,
                          background: `linear-gradient(to top, hsl(155 90% 45%), hsl(155 90% 65%))`,
                          boxShadow: b.commits > 0 ? "0 0 8px hsl(155 90% 55% / 0.6)" : undefined,
                        }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-card border border-border text-[9px] font-mono opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap">
                        {b.commits}c · {b.events}e
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground font-mono">{b.day}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Reveal>

      {/* Event sparkline */}
      <Reveal delay={180}>
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="smallcaps text-[11px] text-muted-foreground">event rhythm</div>
            <div className="text-[10px] smallcaps text-primary">last {days} days</div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-16" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sparkfill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="hsl(175 85% 50%)" stopOpacity="0.4" />
                <stop offset="100%" stopColor="hsl(175 85% 50%)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${sparkPath} L ${W} ${H} L 0 ${H} Z`} fill="url(#sparkfill)" />
            <path d={sparkPath} fill="none" stroke="hsl(175 85% 50%)" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 4px hsl(175 85% 50%))" }} />
            {evtSeries.map((v, i) => {
              const x = (i / Math.max(1, evtSeries.length - 1)) * W;
              const y = H - (v / evtMax) * (H - 8) - 4;
              return <circle key={i} cx={x} cy={y} r="1.8" fill="hsl(175 85% 60%)" />;
            })}
          </svg>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center">
            <div><div className="text-sm font-bold text-primary">{stats.push}</div><div className="text-[9px] smallcaps text-muted-foreground">pushes</div></div>
            <div><div className="text-sm font-bold text-accent">{stats.pr + stats.issue}</div><div className="text-[9px] smallcaps text-muted-foreground">pr · iss</div></div>
            <div><div className="text-sm font-bold" style={{color:"hsl(280 75% 70%)"}}>{stars}</div><div className="text-[9px] smallcaps text-muted-foreground">total stars</div></div>
          </div>
        </div>
      </Reveal>

      {/* Subtle, unlabeled expand toggle */}
      <div className="mt-2 flex justify-center">
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? "collapse" : "expand"}
          className="group p-1 rounded-full border border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-primary/10 transition"
        >
          <ChevronDown
            className={`w-3 h-3 text-muted-foreground group-hover:text-primary transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </section>
  );
};
