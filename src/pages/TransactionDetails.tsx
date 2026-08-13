import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Download, CreditCard, Calendar, ShoppingBag, ReceiptText } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import NavbarAuthenticated from "@/components/userSide/NavbarAuthenticated";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

type Transaction = {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  description: string;
  stripePaymentIntentId: string;
};

const TransactionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { user, session } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Transaction Details — EternalBond";
    const fetchTransaction = async () => {
      if (!user || !id) return;
      try {
        const response = await fetch(`${API_BASE_URL}/api/transactions/${id}`, {
          headers: {
            "Authorization": `Bearer ${session?.access_token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch transaction details");
        }
        
        const data = await response.json();
        setTransaction(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransaction();
  }, [id, user]);

  const handleDownloadReceipt = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/receipt`, {
        headers: {
          "Authorization": `Bearer ${session?.access_token}`
        }
      });
      if (!response.ok) throw new Error("Failed to download receipt");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Receipt downloaded successfully");
    } catch (err: any) {
      toast.error("Failed to download receipt: " + err.message);
    }
  };

  if (!user) return null;

  return (
    <>
      <NavbarAuthenticated />
      <main className="min-h-screen text-foreground bg-secondary/20 pb-20 pt-8">
        <div className="container max-w-2xl">
          <Link
            to="/notifications"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Notifications
          </Link>
          
          <div className="bg-background rounded-3xl border border-border/60 shadow-xl overflow-hidden relative">
            {/* Header decoration */}
            <div className="h-32 bg-gradient-to-br from-primary/80 to-primary/40 relative">
              <div className="absolute -bottom-8 left-8 p-4 bg-background rounded-2xl border border-border shadow-sm">
                <ReceiptText className="w-10 h-10 text-primary" />
              </div>
            </div>
            
            <div className="pt-12 px-8 pb-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h1 className="font-serif text-3xl font-medium text-foreground">Transaction Receipt</h1>
                  <p className="text-muted-foreground mt-1 font-mono text-xs opacity-70">ID: {id}</p>
                </div>
                {transaction && (
                  <Badge className={`${transaction.status === 'succeeded' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-amber-500 hover:bg-amber-600'} text-white border-0 shadow-sm px-3 py-1 uppercase tracking-widest text-xs`}>
                    {transaction.status}
                  </Badge>
                )}
              </div>

              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-12 bg-secondary/60 rounded-xl" />
                  <div className="h-24 bg-secondary/60 rounded-xl" />
                  <div className="h-12 bg-secondary/60 rounded-xl" />
                </div>
              ) : error ? (
                <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-2xl text-center">
                  <p className="text-destructive font-medium">Could not load transaction</p>
                  <p className="text-sm text-destructive/80 mt-1">{error}</p>
                </div>
              ) : transaction ? (
                <div className="space-y-6">
                  
                  {/* Amount Section */}
                  <div className="p-6 bg-secondary/30 rounded-2xl border border-border/50 flex flex-col items-center justify-center">
                    <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-1">Amount Paid</p>
                    <div className="text-4xl font-serif text-foreground font-semibold">
                      {(transaction.amount / 100).toFixed(2)} <span className="text-2xl font-sans text-muted-foreground">{transaction.currency.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-5 rounded-2xl border border-border/60 bg-background flex items-start gap-3">
                      <div className="p-2 bg-secondary/50 rounded-xl">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Product</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">{transaction.productId}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{transaction.description}</p>
                      </div>
                    </div>
                    
                    <div className="p-5 rounded-2xl border border-border/60 bg-background flex items-start gap-3">
                      <div className="p-2 bg-secondary/50 rounded-xl">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date & Time</p>
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {new Date(transaction.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(transaction.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Reference */}
                  <div className="p-5 rounded-2xl border border-border/60 bg-background flex items-center gap-3">
                    <div className="p-2 bg-secondary/50 rounded-xl">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Stripe Reference</p>
                      <p className="text-sm font-mono text-muted-foreground mt-0.5">{transaction.stripePaymentIntentId || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Action */}
                  <div className="pt-6">
                    <Button onClick={handleDownloadReceipt} className="w-full h-12 rounded-xl text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                      <Download className="w-5 h-5 mr-2" />
                      Download PDF Receipt
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default TransactionDetails;
