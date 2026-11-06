import { useEffect } from "react";
import { Outlet } from "react-router";
import { supabase } from "./lib/supabase";
import { notify } from "./lib/notifications";

export default function App() {
  useEffect(() => {
    let channel: any;

    async function setupRealtimeListener() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const currentUserId = session.user.id;

      // Global listener for transactions
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
            // Notify if someone requested a tab from you
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
            // Notify if your tab was approved
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

    // Re-connect when logging in, disconnect when logging out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  return <Outlet />;
}