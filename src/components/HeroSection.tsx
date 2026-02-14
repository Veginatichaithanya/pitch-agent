import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star } from "lucide-react";

const HeroSection = () => (
  <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
    {/* Background effects */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-primary opacity-[0.08] blur-[150px] float-animation" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-[hsl(230,80%,55%)] opacity-[0.06] blur-[120px] float-animation-delayed" />
      <div className="absolute top-1/2 right-1/3 w-72 h-72 rounded-full bg-[hsl(280,70%,50%)] opacity-[0.06] blur-[100px] float-animation" />
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
    </div>

    <div className="container mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div className="space-y-8" style={{ animation: "slide-up 0.8s ease-out" }}>
          {/* Social proof badge */}
          <div className="inline-flex items-center gap-3 glass rounded-full px-5 py-2.5 text-sm text-muted-foreground">
            <div className="flex -space-x-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-7 h-7 rounded-full gradient-btn border-2 border-background flex items-center justify-center">
                  <Star className="w-3 h-3 text-white" />
                </div>
              ))}
            </div>
            <span className="border-l border-white/10 pl-3">Trusted by <span className="text-foreground font-medium">2,000+</span> creators</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
            Turn Your Ideas into{" "}
            <span className="gradient-text relative">
              Winning Pitches
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/40" viewBox="0 0 300 12" fill="none">
                <path d="M2 10C50 4 100 2 150 6C200 10 250 4 298 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            An AI platform that converts raw ideas into structured, compelling pitch drafts — built for students, innovators, and ambitious creators.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button className="gradient-btn rounded-full px-8 py-6 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 group">
              Generate Pitch <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-8 py-6 text-base border-white/10 bg-white/5 hover:bg-white/10 text-foreground backdrop-blur-sm transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 mr-1" /> View Demo
            </Button>
          </div>

          {/* Stats row */}
          <div className="flex gap-8 pt-4">
            {[
              { value: "30s", label: "Average generation" },
              { value: "95%", label: "User satisfaction" },
              { value: "10k+", label: "Pitches created" },
            ].map(s => (
              <div key={s.label}>
                <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — abstract orbs + card */}
        <div className="relative hidden lg:flex items-center justify-center h-[520px]">
          <div className="absolute w-80 h-80 rounded-full bg-gradient-to-br from-[hsl(230,80%,55%)] to-[hsl(260,75%,55%)] opacity-25 blur-2xl float-animation" />
          <div className="absolute w-60 h-60 rounded-full bg-gradient-to-br from-[hsl(260,75%,55%)] to-[hsl(280,70%,50%)] opacity-20 blur-xl float-animation-delayed translate-x-20 -translate-y-10" />
          <div className="absolute w-44 h-44 rounded-full bg-gradient-to-br from-accent to-primary opacity-15 blur-lg float-animation -translate-x-16 translate-y-16" />

          {/* Glass card overlay */}
          <div className="relative glass-strong rounded-3xl p-8 w-80 text-center shadow-2xl shadow-primary/10" style={{ animation: "slide-up 1s ease-out 0.3s both" }}>
            <div className="w-16 h-16 rounded-2xl gradient-btn mx-auto mb-5 flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkle />
            </div>
            <p className="font-display font-bold text-foreground text-lg">AI Draft Ready</p>
            <p className="text-sm text-muted-foreground mt-2">Your pitch has been structured</p>
            <div className="mt-5 flex items-center justify-center gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-4 h-4 text-accent fill-accent" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const Sparkle = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
  </svg>
);

export default HeroSection;
