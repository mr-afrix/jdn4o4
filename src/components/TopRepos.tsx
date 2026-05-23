import { useEffect, useState, useCallback, useMemo } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star, GitFork, ExternalLink, Flame, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useGitHubRepos } from "@/hooks/useGitHub";
import { LANGUAGE_COLORS, timeAgo, formatNumber } from "@/lib/github";
import { Reveal } from "./Reveal";

type Sort = "stars" | "recent" | "forks";

export const TopRepos = () => {
  const { data: repos, isLoading } = useGitHubRepos();
  const [lang, setLang] = useState<string>("All");
  const [sort, setSort] = useState<Sort>("stars");
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false, dragFree: true });
  const [selected, setSelected] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelected(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  const allLangs = useMemo(() => {
    const s = new Set<string>();
    repos?.filter((r) => !r.fork).forEach((r) => r.language && s.add(r.language));
    return ["All", ...Array.from(s).sort()];
  }, [repos]);

  const top = useMemo(() => {
    if (!repos) return [];
    let r = repos.filter((x) => !x.fork);
    if (lang !== "All") r = r.filter((x) => x.language === lang);
    r = [...r].sort((a, b) => {
      if (sort === "stars") return b.stargazers_count - a.stargazers_count;
      if (sort === "forks") return b.forks_count - a.forks_count;
      return new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();
    });
    return r.slice(0, 8);
  }, [repos, lang, sort]);

  useEffect(() => { emblaApi?.scrollTo(0); }, [lang, sort, emblaApi]);

  return (
    <section className="px-4 py-6 max-w-3xl mx-auto">
      <Reveal>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold">Top Repositories</h2>
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => emblaApi?.scrollPrev()}
              className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-primary/40 transition"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => emblaApi?.scrollNext()}
              className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted border border-border hover:border-primary/40 transition"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={40}>
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {(["stars","recent","forks"] as Sort[]).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`shrink-0 px-2.5 py-1 text-[10px] smallcaps rounded-full border transition ${
                sort === s
                  ? "bg-accent/15 border-accent/50 text-accent shadow-[0_0_10px_hsl(45_100%_60%/0.25)]"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-accent/40"
              }`}
            >
              {s === "stars" ? "★ stars" : s === "recent" ? "↻ recency" : "⑂ forks"}
            </button>
          ))}
          <span className="mx-1 text-muted-foreground/40">·</span>
          {allLangs.slice(0, 8).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`shrink-0 px-2.5 py-1 text-[10px] smallcaps rounded-full border transition ${
                lang === l
                  ? "bg-primary/15 border-primary/50 text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:border-primary/30"
              }`}
            >
              {l.toLowerCase()}
            </button>
          ))}
        </div>
      </Reveal>

      {isLoading && (
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shrink-0 w-[78%] sm:w-[48%] glass-card p-4 space-y-3">
              <div className="h-4 w-2/3 rounded bg-muted/60 animate-pulse" />
              <div className="h-3 w-full rounded bg-muted/40 animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-muted/40 animate-pulse" />
              <div className="h-2.5 w-3/4 rounded bg-muted/30 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && top.length === 0 && (
        <div className="glass-card p-6 text-center text-sm text-muted-foreground smallcaps">
          no repos match these filters
        </div>
      )}

      {!isLoading && top.length > 0 && (
      <Reveal delay={100}>
        <div className="overflow-hidden -mx-4 px-4" ref={emblaRef}>
          <div className="flex gap-3">
            {top.map((r, i) => {
              const color = LANGUAGE_COLORS[r.language || ""] || LANGUAGE_COLORS.default;
              return (
                <a
                  key={r.id}
                  href={r.html_url}
                  target="_blank" rel="noopener noreferrer"
                  className="group relative shrink-0 w-[78%] sm:w-[48%] glass-card p-4 transition hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="absolute top-3 right-3 text-xs font-mono text-muted-foreground">#{i + 1}</div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg" style={{ background: `${color}22`, border: `1px solid ${color}55` }}>
                      <Star className="w-4 h-4" style={{ color }} fill={color} />
                    </div>
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition">{r.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.4em] mb-3">
                    {r.description || "No description provided"}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    {r.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                        {r.language}
                      </span>
                    )}
                    <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{formatNumber(r.stargazers_count)}</span>
                    <span className="flex items-center gap-0.5"><GitFork className="w-3 h-3" />{formatNumber(r.forks_count)}</span>
                    <span className="flex items-center gap-0.5 ml-auto"><Eye className="w-3 h-3" />{timeAgo(r.pushed_at)}</span>
                  </div>
                  <ExternalLink className="absolute bottom-3 right-3 w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                </a>
              );
            })}
          </div>
        </div>
      </Reveal>
      )}

      {/* Dots */}
      {top.length > 0 && (
      <div className="flex justify-center gap-1.5 mt-3">
        {top.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi?.scrollTo(i)}
            className={`h-1.5 rounded-full transition-all ${i === selected ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
      )}
    </section>
  );
};
