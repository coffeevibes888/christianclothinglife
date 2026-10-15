"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader } from "lucide-react";
import Link from "next/link";

const PaymentSuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    
    if (!paymentIntent) {
      setError("No payment information found");
      setIsVerifying(false);
      return;
    }

    // Give webhook time to process and create order
    const timer = setTimeout(() => {
      sessionStorage.removeItem("guestDetails");
      setIsVerifying(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  if (isVerifying) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <Loader className="w-12 h-12 animate-spin mx-auto text-primary" />
            <h2 className="text-2xl font-semibold">Processing Your Payment</h2>
            <p className="text-slate-600">
              Please wait while we confirm your order...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-destructive text-3xl">✕</span>
            </div>
            <h2 className="text-2xl font-semibold">Payment Error</h2>
            <p className="text-slate-600">{error}</p>
            <Button onClick={() => router.push("/cart")}>Return to Cart</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-20">
      <Card>
        <CardContent className="p-10 text-center space-y-6">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold">Payment Successful!</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Thank you for your purchase. Your order has been confirmed and you will
            receive a confirmation email shortly.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button asChild variant="outline">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
          <p className="text-xs text-slate-500 pt-4">
            Your cart has been cleared. Check your email for order details and tracking
            information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
