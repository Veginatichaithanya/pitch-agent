import { useState, useEffect } from "react";
import { Menu, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4 transition-all duration-500">
      <div
        className={`flex items-center justify-between w-full max-w-5xl rounded-full glass-strong px-6 transition-all duration-500 ${
          scrolled ? "py-2 shadow-lg shadow-primary/10" : "py-3"
        }`}
      >
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-foreground text-lg hidden sm:inline">
            Pitch Agent
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <a href="#cta" className="hidden md:block">
          <Button className="gradient-btn rounded-full px-6 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
            Get Started
          </Button>
        </a>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-foreground p-2"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-4 right-4 mt-2 glass-strong rounded-2xl p-4 md:hidden">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
          <a href="#cta" onClick={() => setMobileOpen(false)}>
            <Button className="gradient-btn rounded-full w-full mt-2">Get Started</Button>
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
