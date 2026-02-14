import { PenLine, ToggleRight, Bot, Presentation } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const steps = [
  { icon: PenLine, label: "Enter Idea", desc: "Describe your concept in plain language" },
  { icon: ToggleRight, label: "Enable Pitch Mode", desc: "Activate our AI refinement engine" },
  { icon: Bot, label: "AI Generates Draft", desc: "Get a structured pitch in seconds" },
  { icon: Presentation, label: "Present Confidently", desc: "Deliver with clarity and impact" },
];

const HowItWorksSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="how-it-works" className="py-28 relative">
      <div className="container mx-auto px-6" ref={ref}>
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">Process</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From raw idea to polished pitch in four simple steps
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-px bg-gradient-to-r from-[hsl(230,80%,55%)] via-[hsl(260,75%,55%)] to-[hsl(280,70%,50%)] opacity-30" />

          {steps.map((s, i) => (
            <div
              key={s.label}
              className={`relative text-center transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              <div className="glass rounded-2xl p-7 hover:bg-white/10 transition-all duration-300 group h-full">
                <div className="w-14 h-14 rounded-2xl gradient-btn mx-auto mb-5 flex items-center justify-center relative group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-110">
                  <s.icon className="w-6 h-6 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center shadow-md">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2 text-lg">{s.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
