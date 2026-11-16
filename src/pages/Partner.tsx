import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { AppHeader } from "@/components/layout/AppHeader";
import { BalanceHero } from "@/components/BalanceHero";
import { CreateTabCard } from "@/components/CreateTabCard";
import { TransactionItem } from "@/components/TransactionItem";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { History, ChevronDown, ChevronUp } from "lucide-react";

export default function Partner() {
  const location = useLocation();
  const navigate = useNavigate();

  const [debt, setDebt] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("User");
  const [showAll, setShowAll] = useState(false);

  const partner = location.state?.partner;
  const partnerId = location.state?.partnerId;

  useEffect(() => {
    if (!partnerId) {
      navigate("/");
      return;
    }

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      setUserId(session.user.id);
      setUsername(session.user.user_metadata?.username || "User");
      fetchBalance(session.user.id, partnerId);
      fetchTransactions(session.user.id, partnerId);
    }
    init();
  }, [partnerId, navigate]);

  const fetchBalance = async (uid: string, pid: string) => {
    const [userA, userB] = uid < pid ? [uid, pid] : [pid, uid];

    const { data } = await supabase
      .from("debts")
      .select("balance")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();

    if (!data) {
      setDebt(0);
      return;
    }

    const val = parseFloat(data.balance) || 0;
    if (userA === uid) {
      setDebt(val);
    } else {
      setDebt(-val);
    }
  };

  const fetchTransactions = async (uid: string, pid: string) => {
    const { data } = await supabase
      .from("transactions")
      .select("id, payee_id, recipient_id, creator_id, amount, explanation, created_at, approval")
      .or(`and(payee_id.eq.${uid},recipient_id.eq.${pid}),and(payee_id.eq.${pid},recipient_id.eq.${uid})`)
      .order("created_at", { ascending: false });

    if (data) setTransactions(data);
  };

  const handleCreateTransaction = async (
    amountVal: string,
    reason: string,
    isPay: boolean
  ) => {
    const payload = isPay
      ? {
          payee_id: userId,
          recipient_id: partnerId,
          creator_id: userId,
          amount: amountVal,
          explanation: reason || "No explanation provided",
          approval: "false",
        }
      : {
          payee_id: partnerId,
          recipient_id: userId,
          creator_id: userId,
          amount: amountVal,
          explanation: reason || "No explanation provided",
          approval: "false",
        };

    const { error } = await supabase.from("transactions").insert([payload]);
    if (error) throw error;
    fetchTransactions(userId, partnerId);
  };

  const handleApproval = async (transaction: any, approval: boolean) => {
    if (approval) {
      await supabase
        .from("transactions")
        .update({ approval: "true" })
        .eq("id", transaction.id);

      const [userA, userB] = userId < partnerId ? [userId, partnerId] : [partnerId, userId];

      const { data: debtRecord } = await supabase
        .from("debts")
        .select("balance")
        .eq("user_a", userA)
        .eq("user_b", userB)
        .maybeSingle();

      const currentBalance = debtRecord ? parseFloat(debtRecord.balance) : 0;
      let truedebt = "";

      if (userA === transaction.payee_id) {
        truedebt = (currentBalance + parseFloat(transaction.amount)).toFixed(2);
      } else if (userA === transaction.recipient_id) {
        truedebt = (currentBalance - parseFloat(transaction.amount)).toFixed(2);
      }

      await supabase.from("debts").upsert(
        {
          user_a: userA,
          user_b: userB,
          balance: truedebt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_a,user_b",
        }
      );

      toast.success("Tab approved!");
      fetchBalance(userId, partnerId);
      fetchTransactions(userId, partnerId);
    } else {
      await supabase
        .from("transactions")
        .update({ approval: "declined" })
        .eq("id", transaction.id);

      toast.info("Tab declined.");
      fetchTransactions(userId, partnerId);
    }
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    const getPriority = (t: any) => {
      if (t.approval === "false") {
        return t.creator_id !== userId ? 1 : 2;
      }
      return 3;
    };

    const prioA = getPriority(a);
    const prioB = getPriority(b);
    if (prioA !== prioB) return prioA - prioB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const displayedTransactions = showAll
    ? sortedTransactions
    : sortedTransactions.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader username={username} backTo="/" title={partner} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <BalanceHero
          mode="partner"
          partnerName={partner}
          balance={debt}
        />

        <CreateTabCard
          partnerName={partner}
          onSubmit={handleCreateTransaction}
        />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-bold tracking-tight">Transaction History</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {transactions.length} total
            </span>
          </div>

          {sortedTransactions.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card/30 space-y-2">
              <History className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No transaction history</p>
              <p className="text-xs text-muted-foreground">
                Create a tab above to start keeping track
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {displayedTransactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  currentUserId={userId}
                  onApprove={(t) => handleApproval(t, true)}
                  onDeny={(t) => handleApproval(t, false)}
                />
              ))}
            </div>
          )}

          {transactions.length > 5 && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="gap-1.5"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show {transactions.length - 5} More
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
