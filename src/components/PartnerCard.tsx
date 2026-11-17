import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getAvatarColor, getInitials } from "@/components/layout/AppHeader";
import { ChevronRight } from "lucide-react";

interface PartnerCardProps {
  id: string;
  username: string;
  email: string;
  balance: number;
  onClick: () => void;
}

export function PartnerCard({
  username,
  email,
  balance,
  onClick,
}: PartnerCardProps) {
  const isPositive = balance > 0.005;
  const isNegative = balance < -0.005;

  const formattedBalance = isPositive
    ? `+$${balance.toFixed(2)}`
    : isNegative
    ? `-$${Math.abs(balance).toFixed(2)}`
    : "$0.00";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex items-center justify-between p-4 rounded-xl border border-border bg-card/50 hover:bg-card/90 transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <Avatar className="h-11 w-11 shadow-sm">
          <AvatarFallback style={{ backgroundColor: getAvatarColor(username) }}>
            {getInitials(username)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <h4 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors truncate">
            {username}
          </h4>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Badge
          variant={isPositive ? "success" : isNegative ? "danger" : "outline"}
          className="text-xs px-2.5 py-1 font-semibold"
        >
          {formattedBalance}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
      </div>
    </div>
  );
}
