import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function PaymentCancelled() {
  return <div className="min-h-screen bg-gradient-blush flex items-center justify-center px-6"><main className="w-full max-w-md rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-8 text-center shadow-[var(--shadow-card)]"><h1 className="font-[Fraunces] text-2xl text-foreground">Payment cancelled</h1><p className="text-sm text-muted-foreground mt-2">No charges were made.</p><Button asChild className="mt-6 rounded-full bg-gradient-sunset text-white hover:opacity-90"><Link to="/pricing">Return to Pricing</Link></Button></main></div>;
}
