import { Lightbulb, Target, Zap } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const cards = [
  {
    icon: Lightbulb,
    title: "The Problem",
    text: "Students and innovators have brilliant ideas but often struggle to present them clearly and persuasively.",
    gradient: "from-[hsl(230,80%,55%)] to-[hsl(250,70%,60%)]",
  },
  {
    icon: Target,
    title: "The Solution",
    text: "Our AI agent structures your raw ideas into professional, investor-ready pitch drafts in seconds.",
    gradient: "from-[hsl(250,70%,60%)] to-[hsl(270,65%,55%)]",
  },
  {
    icon: Zap,
    title: "The Impact",
    text: "Empowering the next generation of creators to communicate their vision with clarity and confidence.",
    gradient: "from-[hsl(270,65%,55%)] to-[hsl(280,70%,50%)]",
  },
];

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="about" className="py-28 relative">
      {/* Subtle background accent */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary opacity-[0.03] blur-[150px] rounded-full" />
      </div>

      <div className="container mx-auto px-6 relative z-10" ref={ref}>
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">About</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold gradient-text mb-4">
            Why Pitch Agent?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We believe every great idea deserves to be heard. Our AI makes sure yours is presented at its best.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className={`relative glass rounded-2xl p-8 hover:bg-white/10 transition-all duration-500 group overflow-hidden ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              {/* Top gradient line */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${c.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300 group-hover:scale-110">
                <c.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">{c.title}</h3>
              <p className="text-muted-foreground leading-relaxed text-sm">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
