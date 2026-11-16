import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notifications";
import { AppHeader } from "@/components/layout/AppHeader";
import { BalanceHero } from "@/components/BalanceHero";
import { PartnerCard } from "@/components/PartnerCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Loader2 } from "lucide-react";

interface PartnerUser {
  id: string;
  username: string;
  email: string;
}

export default function Home() {
  const [username, setUsername] = useState<string>("Loading...");
  const [partners, setPartners] = useState<PartnerUser[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // Load user profile
  useEffect(() => {
    async function loadUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", session.user.id)
        .single();

      if (profile && !error) {
        setUsername(profile.username);
      } else {
        setUsername(session.user.email?.split("@")[0] || "User");
      }
    }

    loadUser();
  }, [navigate]);

  // Fetch debts for current user
  async function fetchDebts(currentUid: string) {
    try {
      const { data: debts, error } = await supabase
        .from("debts")
        .select("user_a, user_b, balance")
        .or(`user_a.eq.${currentUid},user_b.eq.${currentUid}`);

      if (error) {
        console.error("Error fetching debts:", error);
        return;
      }

      const balMap: Record<string, number> = {};
      if (debts) {
        for (const d of debts) {
          const raw = parseFloat(d.balance) || 0;
          if (d.user_a === currentUid) {
            balMap[d.user_b] = raw;
          } else if (d.user_b === currentUid) {
            balMap[d.user_a] = -raw;
          }
        }
      }
      setBalances(balMap);
    } catch (err) {
      console.error("Failed to load debts", err);
    }
  }

  // Load partners & debts
  useEffect(() => {
    async function loadData() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username, email")
          .neq("id", session.user.id)
          .order("username", { ascending: true });

        if (error) throw error;
        setPartners(data || []);
        await fetchDebts(session.user.id);
      } catch (err) {
        console.error("Error loading partners:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [navigate]);

  // Realtime listeners
  useEffect(() => {
    let txChannel: any;
    let debtsChannel: any;

    async function setupRealtimeListeners() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const currentUserId = session.user.id;

      txChannel = supabase
        .channel("realtime-transactions")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const newTx = payload.new;
            if (newTx.recipient_id === currentUserId && newTx.creator_id !== currentUserId) {
              notify(
                "New Tab Request",
                `A partner requested $${parseFloat(newTx.amount).toFixed(2)}: "${newTx.explanation || "No reason"}"`
              );
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "transactions",
          },
          (payload) => {
            const updatedTx = payload.new;
            if (updatedTx.payee_id === currentUserId && updatedTx.approval === "true") {
              notify(
                "Tab Approved! 🎉",
                `Your tab for $${parseFloat(updatedTx.amount).toFixed(2)} was approved.`
              );
            }
          }
        )
        .subscribe();

      debtsChannel = supabase
        .channel("realtime-debts-home")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "debts",
          },
          () => {
            fetchDebts(currentUserId);
          }
        )
        .subscribe();
    }

    setupRealtimeListeners();

    return () => {
      if (txChannel) supabase.removeChannel(txChannel);
      if (debtsChannel) supabase.removeChannel(debtsChannel);
    };
  }, []);

  function openPartner(partner: PartnerUser) {
    navigate("/partner", {
      state: {
        partner: partner.username,
        partnerId: partner.id,
      },
    });
  }

  // Net Balance summary calculation
  const balanceValues = Object.values(balances);
  const totalNet = balanceValues.reduce((acc, v) => acc + v, 0);
  const totalOwed = balanceValues.filter((v) => v > 0).reduce((acc, v) => acc + v, 0);
  const totalOwing = balanceValues.filter((v) => v < 0).reduce((acc, v) => acc + Math.abs(v), 0);

  // Filter partners
  const filteredPartners = partners.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.username && p.username.toLowerCase().includes(q)) ||
      (p.email && p.email.toLowerCase().includes(q))
    );
  });

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader username={username} />

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <BalanceHero
          mode="global"
          totalNet={totalNet}
          totalOwed={totalOwed}
          totalOwing={totalOwing}
        />

        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Partners</h2>
              <Badge variant="secondary" className="px-2 py-0.5 text-xs font-semibold">
                {partners.length}
              </Badge>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-sm">Loading partners...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-border rounded-xl bg-card/30 space-y-2">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium text-foreground">No partners found</p>
              <p className="text-xs text-muted-foreground">
                {searchQuery
                  ? "Try searching with a different term"
                  : "Invite friends or wait for members to join"}
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {filteredPartners.map((partner) => (
                <PartnerCard
                  key={partner.id}
                  id={partner.id}
                  username={partner.username}
                  email={partner.email}
                  balance={balances[partner.id] || 0}
                  onClick={() => openPartner(partner)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
