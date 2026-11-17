import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PlusCircle, MinusCircle } from "lucide-react";

interface CreateTabCardProps {
  partnerName: string;
  onSubmit: (amount: string, explanation: string, isPay: boolean) => Promise<void>;
}

export function CreateTabCard({ partnerName, onSubmit }: CreateTabCardProps) {
  const [amount, setAmount] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const dollarRegex = /^\d*\.?\d{0,2}$/;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (dollarRegex.test(val)) {
      setAmount(val);
    }
  };

  const handleSubmit = async (isPay: boolean) => {
    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      toast.error("Please enter a valid amount greater than $0.00");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(amount, explanation.trim(), isPay);
      setAmount("");
      setExplanation("");
      toast.success(
        isPay
          ? `Tab created: ${partnerName} owes you $${num.toFixed(2)}`
          : `Tab created: You owe ${partnerName} $${num.toFixed(2)}`
      );
    } catch (err: any) {
      toast.error("Failed to submit tab: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border bg-card/60 backdrop-blur shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">New Tab</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-muted-foreground">
                $
              </span>
              <Input
                type="text"
                placeholder="0.00"
                value={amount}
                onChange={handleAmountChange}
                inputMode="decimal"
                className="pl-7 font-semibold text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Reason / Explanation
            </label>
            <Textarea
              placeholder="e.g. Lunch, Groceries, Movie ticket"
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="resize-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            type="button"
            variant="default"
            disabled={submitting}
            onClick={() => handleSubmit(true)}
            className="font-semibold gap-1.5"
          >
            <PlusCircle className="h-4 w-4" />
            They Owe Me
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={submitting}
            onClick={() => handleSubmit(false)}
            className="font-semibold gap-1.5 border border-border"
          >
            <MinusCircle className="h-4 w-4" />
            I Owe Them
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
