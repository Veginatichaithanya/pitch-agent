import { Sparkles, ToggleRight, FileText, Globe, Zap, AlignLeft } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  { icon: Sparkles, title: "AI Pitch Generator", desc: "Transform raw concepts into polished pitch narratives with advanced AI." },
  { icon: ToggleRight, title: "Pitch Mode Toggle", desc: "Switch between casual brainstorm and formal pitch output instantly." },
  { icon: FileText, title: "Structured Draft Output", desc: "Receive organized drafts with clear problem, solution, and value sections." },
  { icon: Globe, title: "Web-Enhanced Context", desc: "AI enriches your pitch with relevant market data and trends." },
  { icon: Zap, title: "Instant Results", desc: "Generate a complete pitch draft in under 30 seconds." },
  { icon: AlignLeft, title: "Clean Formatting", desc: "Publication-ready formatting for presentations and documents." },
];

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="features" className="py-28 relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-[hsl(260,75%,50%)] opacity-[0.03] blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10" ref={ref}>
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">Features</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-4">
            Everything You Need
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed to make your pitch stand out from the crowd
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`glass rounded-2xl p-7 group hover:bg-white/10 transition-all duration-500 relative overflow-hidden ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl" />
              {/* Bottom gradient line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[hsl(230,80%,55%)] to-[hsl(280,70%,50%)] opacity-0 group-hover:opacity-60 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-11 h-11 rounded-xl gradient-btn flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-110">
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
