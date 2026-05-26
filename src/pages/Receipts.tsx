import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getPurchases,
  clearPurchases,
  type PurchaseRecord,
} from "@/lib/purchase-history";
import { t, formatFullTimestamp } from "@/lib/i18n-receipts";

export default function Receipts() {
  const [items, setItems] = useState<PurchaseRecord[]>([]);

  useEffect(() => {
    setItems(getPurchases());
  }, []);

  return (
    <div className="min-h-screen bg-gradient-blush">
      <header className="px-6 py-5 max-w-3xl mx-auto flex items-center gap-3">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link to="/premium" aria-label={t.back}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="font-[Fraunces] text-2xl text-foreground">{t.receipts}</h1>
          <p className="text-sm text-muted-foreground">{t.purchaseHistory}</p>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              clearPurchases();
              setItems([]);
            }}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t.clearHistory}
          </Button>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-6 pb-20">
        {items.length === 0 ? (
          <div className="rounded-2xl bg-card/70 backdrop-blur border border-border/60 p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ReceiptIcon className="h-5 w-5" />
            </div>
            <div className="font-[Fraunces] text-lg text-foreground">{t.noPurchasesYet}</div>
            <p className="text-sm text-muted-foreground mt-1.5">{t.noPurchasesHint}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((p) => (
              <li
                key={p.id}
                className="rounded-2xl bg-card/80 backdrop-blur border border-border/60 p-5 flex items-start gap-4"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ReceiptIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-[Fraunces] text-base text-foreground">{p.label}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {t.appliesLabel}: {p.appliesWhen}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {t.paid} {p.price} · {t.on} {formatFullTimestamp(p.timestamp)}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
