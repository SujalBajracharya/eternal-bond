import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function PaymentSuccess() {
  const { entitlements, refresh } = useEntitlements();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      for (let attempt = 0; attempt < 5 && !cancelled; attempt += 1) {
        await refresh();
        await new Promise((resolve) => window.setTimeout(resolve, 1500));
      }
      if (!cancelled) setChecking(false);
    };
    verify();
    return () => { cancelled = true; };
  }, [refresh]);

  const isPremium = entitlements?.premium === true;
  return <div className="min-h-screen bg-gradient-blush flex items-center justify-center px-6"><main className="w-full max-w-md rounded-3xl border border-border/60 bg-card/80 backdrop-blur p-8 text-center shadow-[var(--shadow-card)]">{checking ? <><Loader2 className="h-10 w-10 text-primary animate-spin mx-auto" /><h1 className="font-[Fraunces] text-2xl text-foreground mt-5">Confirming your payment</h1><p className="text-sm text-muted-foreground mt-2">We’re waiting for secure confirmation from our billing service.</p></> : isPremium ? <><div className="h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto"><Check className="h-8 w-8" strokeWidth={3} /></div><h1 className="font-[Fraunces] text-2xl text-foreground mt-5">Payment Successful</h1><p className="text-sm text-muted-foreground mt-2">Your Premium membership is now active.</p><Button asChild className="mt-6 rounded-full"><Link to="/pricing">Continue</Link></Button></> : <><h1 className="font-[Fraunces] text-2xl text-foreground">Payment received</h1><p className="text-sm text-muted-foreground mt-2">Your payment is still being confirmed. Premium will appear automatically as soon as confirmation arrives.</p><Button asChild className="mt-6 rounded-full"><Link to="/billing">Check membership</Link></Button></>}</main></div>;
}
