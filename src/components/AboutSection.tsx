import { Lightbulb, Target, Zap } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const cards = [
  {
    icon: Lightbulb,
    title: "The Problem",
    text: "Students and innovators have brilliant ideas but often struggle to present them clearly and persuasively.",
  },
  {
    icon: Target,
    title: "The Solution",
    text: "Our AI agent structures your raw ideas into professional, investor-ready pitch drafts in seconds.",
  },
  {
    icon: Zap,
    title: "The Impact",
    text: "Empowering the next generation of creators to communicate their vision with clarity and confidence.",
  },
];

const AboutSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section id="about" className="py-24 relative">
      <div className="container mx-auto px-6" ref={ref}>
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent uppercase tracking-widest mb-3">About</p>
          <h2 className="font-display text-4xl sm:text-5xl font-bold gradient-text">
            Why Pitch Agent?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className={`glass rounded-2xl p-8 hover:bg-white/8 transition-all duration-500 group ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="w-12 h-12 rounded-xl gradient-btn flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
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
