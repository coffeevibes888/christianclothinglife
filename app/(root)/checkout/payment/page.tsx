"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";
import { SERVER_URL } from "@/lib/constants";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const guestDetails = sessionStorage.getItem("guestDetails");
    if (guestDetails) {
      try {
        const parsed = JSON.parse(guestDetails);
        if (parsed.email) {
          setEmail(parsed.email);
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${SERVER_URL}/checkout/payment-success`,
        },
      })
      .then(({ error }) => {
        if (error?.type === "card_error" || error?.type === "validation_error") {
          setErrorMessage(error?.message ?? "An unknown error occurred");
        } else if (error) {
          setErrorMessage("An unknown error occurred");
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">Complete Your Payment</h2>
      {errorMessage && (
        <div className="text-destructive bg-destructive/10 p-3 rounded">
          {errorMessage}
        </div>
      )}
      <PaymentElement />
      <LinkAuthenticationElement
        onChange={(e) => setEmail(e.value.email)}
        options={{ defaultValues: { email } }}
      />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || !elements || isLoading}
      >
        {isLoading ? (
          <>
            <Loader className="w-4 h-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
      <p className="text-xs text-slate-500 text-center">
        Your payment is secured by Stripe. You will receive a confirmation email
        after successful payment.
      </p>
    </form>
  );
};

const PaymentPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  useEffect(() => {
    const secret = searchParams.get("clientSecret");
    if (!secret) {
      router.push("/checkout");
      return;
    }
    setClientSecret(secret);
  }, [searchParams, router]);

  if (!clientSecret) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10">
      <Card>
        <CardContent className="p-6">
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme:
                  theme === "dark"
                    ? "night"
                    : theme === "light"
                    ? "stripe"
                    : systemTheme === "light"
                    ? "stripe"
                    : "night",
              },
            }}
          >
            <PaymentForm />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
