"use client";

import { useEffect, useState, useTransition, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader, Check, Edit } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Cart } from "@/types";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTheme } from "next-themes";
import { SERVER_URL } from "@/lib/constants";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string
);

// NOTE: This is a client wrapper that relies on the existing cart API routes/actions via fetch.
// It keeps implementation minimal while providing a unified checkout surface with guest fields.

type GuestDetails = {
  fullName: string;
  email: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
};

const defaultGuestDetails: GuestDetails = {
  fullName: "",
  email: "",
  phone: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};

// Payment form component that uses Stripe Elements
const PaymentForm = ({
  email,
}: {
  clientSecret: string;
  email: string;
  onSuccess: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handlePayment = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setErrorMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${SERVER_URL}/checkout/payment-success`,
      },
    });

    if (error) {
      setErrorMessage(error.message ?? "Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handlePayment} className="space-y-4">
      {errorMessage && (
        <div className="text-destructive bg-destructive/10 p-3 rounded text-sm">
          {errorMessage}
        </div>
      )}
      <PaymentElement />
      <LinkAuthenticationElement
        options={{ defaultValues: { email } }}
      />
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader className="w-4 h-4 animate-spin mr-2" />
            Processing Payment...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>
    </form>
  );
};

const CheckoutPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, systemTheme } = useTheme();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [isCreatingPayment, startCreatingPayment] = useTransition();
  const [guestDetails, setGuestDetails] = useState<GuestDetails>(defaultGuestDetails);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isFormLocked, setIsFormLocked] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GuestDetails, string>>>({});

  useEffect(() => {
    const loadCart = async () => {
      try {
        const res = await fetch("/api/cart");
        if (!res.ok) {
          throw new Error("Failed to load cart");
        }
        const data = await res.json();
        if (!data || !data.items || data.items.length === 0) {
          router.push("/cart");
          return;
        }
        setCart(data as Cart);
      } catch {
        router.push("/cart");
      } finally {
        setIsLoadingCart(false);
      }
    };

    loadCart();
  }, [router]);

  const handleGuestChange = (field: keyof GuestDetails, value: string) => {
    setGuestDetails((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof GuestDetails, string>> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestDetails.email) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(guestDetails.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation (basic - accepts various formats)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!guestDetails.phone) {
      errors.phone = "Phone number is required";
    } else if (!phoneRegex.test(guestDetails.phone) || guestDetails.phone.replace(/\D/g, "").length < 10) {
      errors.phone = "Please enter a valid phone number";
    }

    // Required fields
    if (!guestDetails.fullName || guestDetails.fullName.trim().length < 2) {
      errors.fullName = "Full name is required";
    }

    if (!guestDetails.streetAddress || guestDetails.streetAddress.trim().length < 5) {
      errors.streetAddress = "Street address is required";
    }

    if (!guestDetails.city || guestDetails.city.trim().length < 2) {
      errors.city = "City is required";
    }

    if (!guestDetails.postalCode || guestDetails.postalCode.trim().length < 3) {
      errors.postalCode = "Postal code is required";
    }

    if (!guestDetails.country || guestDetails.country.trim().length < 2) {
      errors.country = "Country is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        description: "Please fix the errors in the form before proceeding.",
      });
      return;
    }

    startCreatingPayment(async () => {
      try {
        const res = await fetch("/api/checkout/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestDetails }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          toast({
            variant: "destructive",
            description: data.message || "Failed to create payment",
          });
          return;
        }

        sessionStorage.setItem("guestDetails", JSON.stringify(guestDetails));
        setClientSecret(data.clientSecret);
        setIsFormLocked(true);
      } catch {
        toast({
          variant: "destructive",
          description: "Something went wrong. Please try again.",
        });
      }
    });
  };

  const handleEditForm = () => {
    setIsFormLocked(false);
    setClientSecret(null);
  };

  if (isLoadingCart) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!cart) {
    return null;
  }

  const totalItems = cart.items.reduce((acc, item) => acc + item.qty, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 py-4">
        <h1 className="text-2xl">Fast, secure checkout</h1>
        <p className="text-xs text-slate-500">
          Need help?{' '}
          <Link href="/chat" className="underline">
            Chat with us
          </Link>
          .
        </p>
      </div>
      <div className="grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className={isFormLocked ? "opacity-70" : ""}>
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Contact & Guest Details</h2>
                {isFormLocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditForm}
                    className="gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <Input
                    placeholder="Full Name"
                    value={guestDetails.fullName}
                    onChange={(e) => handleGuestChange("fullName", e.target.value)}
                    disabled={isFormLocked}
                    className={formErrors.fullName ? "border-destructive" : ""}
                  />
                  {formErrors.fullName && (
                    <p className="text-xs text-destructive mt-1">{formErrors.fullName}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={guestDetails.email}
                    onChange={(e) => handleGuestChange("email", e.target.value)}
                    disabled={isFormLocked}
                    className={formErrors.email ? "border-destructive" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="tel"
                    placeholder="Phone"
                    value={guestDetails.phone}
                    onChange={(e) => handleGuestChange("phone", e.target.value)}
                    disabled={isFormLocked}
                    className={formErrors.phone ? "border-destructive" : ""}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-destructive mt-1">{formErrors.phone}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isFormLocked ? "opacity-70" : ""}>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
              <div className="space-y-3">
                <div>
                  <Input
                    placeholder="Street Address"
                    value={guestDetails.streetAddress}
                    onChange={(e) => handleGuestChange("streetAddress", e.target.value)}
                    disabled={isFormLocked}
                    className={formErrors.streetAddress ? "border-destructive" : ""}
                  />
                  {formErrors.streetAddress && (
                    <p className="text-xs text-destructive mt-1">{formErrors.streetAddress}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="City"
                    value={guestDetails.city}
                    onChange={(e) => handleGuestChange("city", e.target.value)}
                    disabled={isFormLocked}
                    className={formErrors.city ? "border-destructive" : ""}
                  />
                  {formErrors.city && (
                    <p className="text-xs text-destructive mt-1">{formErrors.city}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Postal Code"
                    value={guestDetails.postalCode}
                    onChange={(e) => handleGuestChange("postalCode", e.target.value)}
                    disabled={isFormLocked}
                    className={formErrors.postalCode ? "border-destructive" : ""}
                  />
                  {formErrors.postalCode && (
                    <p className="text-xs text-destructive mt-1">{formErrors.postalCode}</p>
                  )}
                </div>
                <div>
                  <Input
                    placeholder="Country"
                    value={guestDetails.country}
                    onChange={(e) => handleGuestChange("country", e.target.value)}
                    disabled={isFormLocked}
                    className={formErrors.country ? "border-destructive" : ""}
                  />
                  {formErrors.country && (
                    <p className="text-xs text-destructive mt-1">{formErrors.country}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between">
                <span>Items ({totalItems})</span>
                <span>{formatCurrency(cart.itemsPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>{formatCurrency(cart.taxPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCurrency(cart.shippingPrice)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-1">
                <span>Total</span>
                <span>{formatCurrency(cart.totalPrice)}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Secure checkout powered by Stripe. Wallets like Apple Pay, Google Pay, and Cash App may be available.
              </p>
              {!clientSecret && (
                <Button
                  className="w-full mt-2"
                  disabled={isCreatingPayment}
                  onClick={handleProceedToPayment}
                >
                  {isCreatingPayment ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}{" "}
                  Pay Now
                </Button>
              )}
            </CardContent>
          </Card>

          {clientSecret && (
            <Card className="animate-in slide-in-from-top-5 duration-300">
              <CardContent className="p-4 space-y-4">
                <h2 className="text-lg font-semibold">Payment Details</h2>
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
                  <PaymentForm
                    clientSecret={clientSecret}
                    email={guestDetails.email}
                    onSuccess={() => {}}
                  />
                </Elements>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
