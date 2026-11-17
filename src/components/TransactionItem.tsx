import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: {
    id: string;
    payee_id: string;
    recipient_id: string;
    creator_id: string;
    amount: string;
    explanation: string;
    created_at: string;
    approval: string;
  };
  currentUserId: string;
  onApprove: (tx: TransactionItemProps["transaction"]) => void;
  onDeny: (tx: TransactionItemProps["transaction"]) => void;
}

export function TransactionItem({
  transaction,
  currentUserId,
  onApprove,
  onDeny,
}: TransactionItemProps) {
  const isPayee = transaction.payee_id === currentUserId;
  const isCreator = transaction.creator_id === currentUserId;
  const rawAmount = parseFloat(transaction.amount) || 0;

  // Format signed amount
  const displayAmount = isPayee
    ? `+$${rawAmount.toFixed(2)}`
    : `-$${rawAmount.toFixed(2)}`;

  // Determine status
  let status: "pending" | "needs_action" | "approved" | "declined" = "approved";
  if (transaction.approval === "declined") {
    status = "declined";
  } else if (transaction.approval === "false") {
    status = isCreator ? "pending" : "needs_action";
  }

  const formattedDate = new Date(transaction.created_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="p-4 rounded-xl border border-border bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-semibold text-foreground break-words">
          {transaction.explanation || "No explanation provided"}
        </p>
        <p className="text-xs text-muted-foreground">{formattedDate}</p>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
        <span
          className={cn(
            "text-base font-bold",
            status === "declined"
              ? "text-muted-foreground line-through"
              : isPayee
              ? "text-emerald-400"
              : "text-rose-400"
          )}
        >
          {displayAmount}
        </span>

        {status === "needs_action" ? (
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="default"
              className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs"
              onClick={() => onApprove(transaction)}
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-8 px-2.5 gap-1 text-xs"
              onClick={() => onDeny(transaction)}
            >
              <X className="h-3.5 w-3.5" />
              Deny
            </Button>
          </div>
        ) : status === "pending" ? (
          <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
            Pending
          </Badge>
        ) : status === "declined" ? (
          <Badge variant="destructive" className="opacity-80">
            Declined
          </Badge>
        ) : (
          <Badge variant="success">Approved</Badge>
        )}
      </div>
    </div>
  );
}
