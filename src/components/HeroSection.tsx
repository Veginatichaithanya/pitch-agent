import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

const HeroSection = () => (
  <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
    {/* Background effects */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[hsl(250,70%,50%)] opacity-10 blur-[120px] float-animation" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full bg-[hsl(230,80%,55%)] opacity-10 blur-[100px] float-animation-delayed" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 rounded-full bg-[hsl(280,70%,50%)] opacity-10 blur-[80px] float-animation" />
    </div>

    <div className="container mx-auto px-6 relative z-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        {/* Left */}
        <div className="space-y-8" style={{ animation: "slide-up 0.8s ease-out" }}>
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            AI-Powered Pitch Refinement
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            Turn Your Ideas into{" "}
            <span className="gradient-text">Winning Pitches</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            An AI platform that converts raw ideas into structured, compelling pitch drafts — built for students, innovators, and ambitious creators.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button className="gradient-btn rounded-full px-8 py-6 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105">
              Generate Pitch <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full px-8 py-6 text-base border-white/10 bg-white/5 hover:bg-white/10 text-foreground backdrop-blur-sm transition-all hover:scale-105"
            >
              <Play className="w-4 h-4 mr-1" /> View Demo
            </Button>
          </div>
        </div>

        {/* Right — abstract orbs */}
        <div className="relative hidden lg:flex items-center justify-center h-[500px]">
          <div className="absolute w-72 h-72 rounded-full bg-gradient-to-br from-[hsl(230,80%,55%)] to-[hsl(260,75%,55%)] opacity-30 blur-xl float-animation" />
          <div className="absolute w-56 h-56 rounded-full bg-gradient-to-br from-[hsl(260,75%,55%)] to-[hsl(280,70%,50%)] opacity-25 blur-lg float-animation-delayed translate-x-16 -translate-y-8" />
          <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-[hsl(42,70%,55%)] to-[hsl(250,70%,60%)] opacity-20 blur-md float-animation -translate-x-12 translate-y-12" />
          {/* Glass card overlay */}
          <div className="relative glass-strong rounded-3xl p-8 w-72 text-center" style={{ animation: "slide-up 1s ease-out 0.3s both" }}>
            <div className="w-16 h-16 rounded-2xl gradient-btn mx-auto mb-4 flex items-center justify-center">
              <Sparkle />
            </div>
            <p className="font-display font-semibold text-foreground">AI Draft Ready</p>
            <p className="text-sm text-muted-foreground mt-1">Your pitch has been structured</p>
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
