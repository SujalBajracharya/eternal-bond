import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Marquee from "@/components/landing/Marquee";
import TrustSection from "@/components/landing/TrustSection";
import HowItWorks from "@/components/landing/HowItWorks";
import Compatibility from "@/components/landing/Compatibility";
import Stories from "@/components/landing/Stories";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";
import { useRevealAll } from "@/hooks/use-reveal";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAdmin } from "@/hooks/use-admin";
import { Navigate } from "react-router-dom";
import Home from "./Home";

const Index = () => {
  const { user, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  useRevealAll();

  useEffect(() => {
    document.title = "EternalBond — Matrimony where heartbeats find their rhythm";
    const desc = "EternalBond is a thoughtful matrimonial platform — handcrafted matchmaking, verified profiles, and meaningful conversations that lead to lifelong partnerships.";
    let m = document.querySelector('meta[name="description"]');
    if (!m) {
      m = document.createElement("meta");
      m.setAttribute("name", "description");
      document.head.appendChild(m);
    }
    m.setAttribute("content", desc);
  }, []);

  if (!loading && user) {
    if (!adminLoading && isAdmin) return <Navigate to="/admin" replace />;
    return <Home />;
  }

  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <h1 className="sr-only">EternalBond — A modern, soulful matrimonial platform</h1>
      <Navbar />
      <Hero />
      <Marquee />
      <TrustSection />
      <HowItWorks />
      <Compatibility />
      <Stories />
      <CTASection />
      <Footer />
    </main>
  );
};

export default Index;
