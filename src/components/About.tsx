import { Quote, Sparkles, Terminal } from "lucide-react";
import { Reveal } from "./Reveal";

export const About = () => {
  return (
    <section className="px-4 py-6 max-w-3xl mx-auto">
      <Reveal>
        <div className="relative overflow-hidden glass-card p-5 sm:p-6">
          {/* corner deco */}
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 blur-3xl rounded-full" />
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-secondary/10 blur-3xl rounded-full" />
          {/* scanline */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
            <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-primary to-transparent animate-scan" />
          </div>

          {/* header bar — telegram-style quoted block */}
          <div className="flex items-center gap-2 mb-3">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="smallcaps text-[11px] font-semibold text-primary">about.me</span>
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] smallcaps text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              live · zw
            </span>
          </div>

          {/* the quote — left border like telegram reply */}
          <blockquote className="relative pl-4 border-l-2 border-primary/70">
            <Quote className="absolute -left-[11px] -top-2 w-4 h-4 text-primary bg-card rounded-sm" />
            <p className="smallcaps text-[15px] sm:text-base leading-relaxed text-foreground/90 lowercase">
              hey guys, am jaden — a full stack dev straight out of zimbabwe, building wild things with python, typescript & a lot of coffee. i live in the terminal, ship at 3am, and turn caffeine into commits. if it runs on the web, i can break it, fix it, and ship a cleaner version before sunrise.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] smallcaps text-muted-foreground">
              <Sparkles className="w-3 h-3 text-accent" />
              <span>— jaden · @jdn404 · harare, zw</span>
            </div>
          </blockquote>

          {/* meta chips */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {[
              { k: "stack", v: "fullstack" },
              { k: "vibe", v: "nocturnal" },
              { k: "fuel", v: "espresso × 4" },
              { k: "status", v: "shipping" },
            ].map((c) => (
              <span key={c.k} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 border border-border/60 text-[10px] smallcaps">
                <span className="text-muted-foreground">{c.k}:</span>
                <span className="text-primary font-semibold">{c.v}</span>
              </span>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
};
