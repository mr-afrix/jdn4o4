import { Award, Sparkles, GitBranch, Star as StarIcon, GitFork as ForkIcon, Trophy } from "lucide-react";
import { useGitHubEvents, useGitHubRepos } from "@/hooks/useGitHub";
import { buildContributionWeeks, computeGrade, languageBreakdown } from "@/lib/github";
import { Reveal } from "./Reveal";

const heatColor = (v: number, max: number) => {
  if (v === 0) return "hsl(220 18% 14%)";
  const t = Math.min(1, v / Math.max(1, max));
  // teal -> green -> gold ramp
  if (t < 0.34) return `hsl(175 85% ${30 + t * 60}%)`;
  if (t < 0.67) return `hsl(155 90% ${35 + (t - 0.34) * 50}%)`;
  return `hsl(45 100% ${50 + (t - 0.67) * 30}%)`;
};

const MiniRing = ({ value, max, label, color }: { value: number; max: number; label: string; color: string }) => {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  const C = 2 * Math.PI * 24;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-14">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
          <circle
            cx="28" cy="28" r="24" fill="none"
            stroke={color} strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * C} ${C}`}
            style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: "stroke-dasharray 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{value}</div>
      </div>
      <div className="mt-1 text-[9px] smallcaps text-muted-foreground">{label}</div>
    </div>
  );
};

export const Contributions = () => {
  const { data: events, isLoading: lE } = useGitHubEvents();
  const { data: repos, isLoading: lR } = useGitHubRepos();
  const loading = lE || lR;

  const weeks = events ? buildContributionWeeks(events, 12) : [];
  const flat = weeks.flat();
  const maxDay = Math.max(1, ...flat.map((d) => d.value));
  const totalContribs = flat.reduce((s, d) => s + d.value, 0);
  const activeDays = flat.filter((d) => d.value > 0).length;

  // streak (current consecutive active days from latest going back)
  let streak = 0;
  for (let i = flat.length - 1; i >= 0; i--) {
    if (flat[i].value > 0) streak++;
    else break;
  }

  const owned = repos?.filter((r) => !r.fork) ?? [];
  const totalStars = owned.reduce((s, r) => s + r.stargazers_count, 0);
  const totalForks = owned.reduce((s, r) => s + r.forks_count, 0);
  const langs = repos ? languageBreakdown(repos) : [];
  const grade = events && repos ? computeGrade(repos, events) : null;

  // donut for top 5 languages
  const donutLangs = langs.slice(0, 5);
  const donutTotal = donutLangs.reduce((s, l) => s + l.percentage, 0) || 1;
  const C = 2 * Math.PI * 36;
  let offset = 0;

  return (
    <section className="px-4 py-6 max-w-3xl mx-auto">
      <Reveal>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold">Contributions</h2>
          <span className="ml-auto text-[10px] smallcaps text-muted-foreground">12 weeks · real-time</span>
        </div>
      </Reveal>

      {/* Grade card + ring breakdown */}
      <Reveal delay={60}>
        <div className="glass-card p-4 mb-3">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full blur-2xl opacity-60" style={{ background: grade?.color || "hsl(var(--primary))" }} />
              <div className="relative w-24 h-24">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke={grade?.color || "hsl(var(--primary))"}
                    strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={`${((grade?.score ?? 0) / 100) * 276.5} 276.5`}
                    style={{ filter: `drop-shadow(0 0 8px ${grade?.color || "hsl(var(--primary))"})`, transition: "stroke-dasharray 1.4s ease-out" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {loading ? (
                    <div className="h-7 w-10 rounded bg-muted/60 animate-pulse" />
                  ) : (
                    <>
                      <div className="text-3xl font-black leading-none" style={{ color: grade?.color }}>
                        {grade?.letter}
                      </div>
                      <div className="text-[9px] smallcaps text-muted-foreground mt-0.5">{grade?.score}/100</div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-2">
                <Award className="w-3.5 h-3.5 text-accent" />
                <span className="text-[10px] smallcaps text-muted-foreground">dev grade</span>
              </div>
              <div className="space-y-1.5">
                {(grade?.breakdown ?? []).map((b) => (
                  <div key={b.label}>
                    <div className="flex items-center justify-between text-[10px] smallcaps">
                      <span className="text-muted-foreground">{b.label}</span>
                      <span className="font-mono" style={{ color: b.color }}>{b.value}</span>
                    </div>
                    <div className="h-1 rounded-full bg-muted/50 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: `${b.value}%`, background: b.color, boxShadow: `0 0 6px ${b.color}` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Mini ring cluster */}
      <Reveal delay={120}>
        <div className="glass-card p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="smallcaps text-[11px] text-muted-foreground">impact rings</div>
            <div className="text-[10px] smallcaps text-accent">{owned.length} repos</div>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <MiniRing value={totalStars} max={Math.max(20, totalStars)} label="stars" color="hsl(45 100% 60%)" />
            <MiniRing value={totalForks} max={Math.max(10, totalForks)} label="forks" color="hsl(210 100% 60%)" />
            <MiniRing value={streak} max={Math.max(7, streak)} label="streak" color="hsl(155 90% 55%)" />
            <MiniRing value={activeDays} max={Math.max(20, activeDays)} label="active" color="hsl(175 85% 50%)" />
            <MiniRing value={langs.length} max={Math.max(5, langs.length)} label="langs" color="hsl(280 75% 60%)" />
          </div>
        </div>
      </Reveal>

      {/* Contribution heatmap — the second graph */}
      <Reveal delay={180}>
        <div className="glass-card p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="smallcaps text-[11px] text-muted-foreground">contribution graph</div>
              <div className="text-xl font-bold">{totalContribs}<span className="text-xs text-muted-foreground font-normal ml-1">contributions / 12w</span></div>
            </div>
            <div className="flex items-center gap-1 text-[9px] smallcaps text-muted-foreground">
              less
              {[0, 0.2, 0.45, 0.7, 1].map((t, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: heatColor(Math.round(t * maxDay), maxDay) }} />
              ))}
              more
            </div>
          </div>

          {loading ? (
            <div className="h-24 bg-muted/30 rounded animate-pulse" />
          ) : (
            <div className="flex gap-[3px]">
              {weeks.map((week, ci) => (
                <div key={ci} className="flex flex-col gap-[3px]">
                  {week.map((d, ri) => (
                    <div
                      key={ri}
                      title={`${d.date.toDateString()}: ${d.value}`}
                      className="w-2.5 h-2.5 rounded-sm transition-all hover:scale-150 hover:ring-1 hover:ring-primary"
                      style={{
                        background: heatColor(d.value, maxDay),
                        boxShadow: d.value > 0 ? `0 0 4px ${heatColor(d.value, maxDay)}` : undefined,
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </Reveal>

      {/* Donut: language share */}
      <Reveal delay={240}>
        <div className="glass-card p-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 w-24 h-24">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                {donutLangs.map((l) => {
                  const len = (l.percentage / donutTotal) * C;
                  const seg = (
                    <circle
                      key={l.name}
                      cx="40" cy="40" r="36" fill="none"
                      stroke={l.color} strokeWidth="8" strokeLinecap="butt"
                      strokeDasharray={`${len} ${C - len}`}
                      strokeDashoffset={-offset}
                      style={{ filter: `drop-shadow(0 0 4px ${l.color})` }}
                    />
                  );
                  offset += len;
                  return seg;
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-base font-bold">{langs.length}</div>
                <div className="text-[9px] smallcaps text-muted-foreground">langs</div>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="smallcaps text-[11px] text-muted-foreground mb-1">language share</div>
              {donutLangs.map((l) => (
                <div key={l.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color, boxShadow: `0 0 4px ${l.color}` }} />
                  <span className="truncate flex-1">{l.name}</span>
                  <span className="font-mono text-muted-foreground">{l.percentage.toFixed(0)}%</span>
                </div>
              ))}
              {donutLangs.length === 0 && !loading && (
                <div className="text-xs text-muted-foreground smallcaps">no language data</div>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
            <div className="flex flex-col items-center gap-0.5">
              <Trophy className="w-3 h-3 text-accent" />
              <div className="text-sm font-bold">{totalStars}</div>
              <div className="text-[9px] smallcaps text-muted-foreground">stars</div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <GitBranch className="w-3 h-3 text-primary" />
              <div className="text-sm font-bold">{owned.length}</div>
              <div className="text-[9px] smallcaps text-muted-foreground">repos</div>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <ForkIcon className="w-3 h-3" style={{ color: "hsl(280 75% 70%)" }} />
              <div className="text-sm font-bold">{totalForks}</div>
              <div className="text-[9px] smallcaps text-muted-foreground">forks</div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
