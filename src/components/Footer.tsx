import { Sparkles } from "lucide-react";

const Footer = () => (
  <footer id="contact" className="border-t border-white/5 relative">
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    <div className="container mx-auto px-6 py-14">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-foreground text-lg">Pitch Agent</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            AI-powered pitch refinement for the next generation of innovators.
          </p>
        </div>

        {/* Links */}
        <div>
          <h4 className="font-display font-semibold text-foreground mb-4">Product</h4>
          <div className="space-y-2">
            {["Features", "How It Works", "Pricing", "FAQ"].map((l) => (
              <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold text-foreground mb-4">Company</h4>
          <div className="space-y-2">
            {["About", "Blog", "Careers", "Contact"].map((l) => (
              <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold text-foreground mb-4">Connect</h4>
          <div className="space-y-2">
            {["Twitter", "LinkedIn", "GitHub", "Discord"].map((l) => (
              <a key={l} href="#" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
        © 2026 Pitch Agent. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
