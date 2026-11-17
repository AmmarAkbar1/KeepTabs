import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface GlobalBalanceHeroProps {
  mode: "global";
  totalNet: number;
  totalOwed: number;
  totalOwing: number;
}

interface PartnerBalanceHeroProps {
  mode: "partner";
  partnerName: string;
  balance: number;
}

export type BalanceHeroProps = GlobalBalanceHeroProps | PartnerBalanceHeroProps;

export function BalanceHero(props: BalanceHeroProps) {
  if (props.mode === "partner") {
    const isPositive = props.balance > 0.005;
    const isNegative = props.balance < -0.005;

    const formattedAmount = isPositive
      ? `+$${props.balance.toFixed(2)}`
      : isNegative
      ? `-$${Math.abs(props.balance).toFixed(2)}`
      : "$0.00";

    return (
      <Card className="border-border bg-card/60 backdrop-blur shadow-md">
        <CardContent className="p-6 text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
              Balance with {props.partnerName}
            </span>
            <Badge
              variant={isPositive ? "success" : isNegative ? "danger" : "outline"}
            >
              {isPositive
                ? "Owed to you"
                : isNegative
                ? "You owe"
                : "Settled"}
            </Badge>
          </div>

          <div
            className={cn(
              "text-4xl sm:text-5xl font-black tracking-tight",
              isPositive
                ? "text-emerald-400"
                : isNegative
                ? "text-rose-400"
                : "text-muted-foreground"
            )}
          >
            {formattedAmount}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Global mode
  const isNetPositive = props.totalNet > 0.005;
  const isNetNegative = props.totalNet < -0.005;

  const formattedNet = isNetPositive
    ? `+$${props.totalNet.toFixed(2)}`
    : isNetNegative
    ? `-$${Math.abs(props.totalNet).toFixed(2)}`
    : "$0.00";

  return (
    <Card className="border-border bg-card/60 backdrop-blur shadow-md overflow-hidden">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">
            Total Net Balance
          </span>
          <Badge
            variant={isNetPositive ? "success" : isNetNegative ? "danger" : "outline"}
          >
            {isNetPositive
              ? "Owed to you"
              : isNetNegative
              ? "You owe overall"
              : "All Settled"}
          </Badge>
        </div>

        <div
          className={cn(
            "text-4xl sm:text-5xl font-black tracking-tight",
            isNetPositive
              ? "text-emerald-400"
              : isNetNegative
              ? "text-rose-400"
              : "text-muted-foreground"
          )}
        >
          {formattedNet}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/80">
          <div>
            <p className="text-xs text-muted-foreground font-medium">You are owed</p>
            <p className="text-lg sm:text-xl font-bold text-emerald-400">
              +${props.totalOwed.toFixed(2)}
            </p>
          </div>
          <div className="border-l border-border/80 pl-4">
            <p className="text-xs text-muted-foreground font-medium">You owe</p>
            <p className="text-lg sm:text-xl font-bold text-rose-400">
              -${props.totalOwing.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
