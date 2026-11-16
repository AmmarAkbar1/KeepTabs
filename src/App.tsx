import { useEffect } from "react";
import { Outlet } from "react-router";
import { supabase } from "./lib/supabase";
import { notify } from "./lib/notifications";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  useEffect(() => {
    let channel: any;

    async function setupRealtimeListener() {
      if (channel) {
        supabase.removeChannel(channel);
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const currentUserId = session.user.id;

      channel = supabase
        .channel("global-realtime-transactions")
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
                `A partner requested \$${parseFloat(newTx.amount).toFixed(2)}: "${newTx.explanation || "No reason"}"`
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
                `Your tab for \$${parseFloat(updatedTx.amount).toFixed(2)} was approved.`
              );
            }
          }
        )
        .subscribe();
    }

    setupRealtimeListener();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setupRealtimeListener();
      } else if (channel) {
        supabase.removeChannel(channel);
      }
    });

    return () => {
      if (channel) supabase.removeChannel(channel);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <Outlet />
      <Toaster position="top-center" richColors theme="dark" />
    </div>
  );
}
