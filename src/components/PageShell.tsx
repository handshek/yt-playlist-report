import type { ReactNode } from "react";
import Footer from "./Footer";
import HeaderNav from "./HeaderNav";

const PageShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-dvh bg-[radial-gradient(circle_at_top,_rgba(220,38,38,0.09),_transparent_32rem)]">
    <HeaderNav />
    {children}
    <Footer />
  </div>
);

export default PageShell;
