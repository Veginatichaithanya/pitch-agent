import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="cta" className="py-28 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(230,80%,18%)] via-[hsl(260,70%,15%)] to-[hsl(280,60%,12%)]" />
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary opacity-[0.08] blur-[180px]" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[hsl(280,70%,50%)] opacity-[0.05] blur-[120px]" />
      </div>

      <div
        className={`container mx-auto px-6 relative z-10 text-center transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
        ref={ref}
      >
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Great Ideas Deserve{" "}
            <span className="gradient-text">Great Presentation</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
            Stop struggling with pitch decks. Let AI transform your vision into a compelling narrative that wins.
          </p>
          <Button className="gradient-btn rounded-full px-12 py-7 text-lg shadow-xl shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-105 group">
            Start Now <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
