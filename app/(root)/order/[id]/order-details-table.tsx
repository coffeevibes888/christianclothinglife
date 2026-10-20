'use client';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDateTime, formatId } from '@/lib/utils';
import { Order } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useTransition, useState } from 'react';
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';
import {
  createPayPalOrder,
  approvePayPalOrder,
  updateOrderToPaidCOD,
  deliverOrder,
  updateOrderShippingAddress,
} from '@/lib/actions/order-actions';
import { ShippingAddress } from '@/types';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import StripePayment from './stripe-payment';

const OrderDetailsTable = ({
  order,
  paypalClientId,
  isAdmin,
  stripeClientSecret,
}: {
  order: Omit<Order, 'paymentResult'>;
  paypalClientId: string;
  isAdmin: boolean;
  stripeClientSecret: string | null;
}) => {
  const {
    id,
    shippingAddress,
    orderitems,
    itemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice,
    paymentMethod,
    isDelivered,
    deliveredAt,
    isPaid,
    paidAt,
    createdAt,
  } = order;

  // Tracking fields aren't on the base Order type but exist at runtime.
  const tracking = order as unknown as {
    trackingNumber?: string | null;
    trackingStatus?: string | null;
  };
  const trackingStatusText = (tracking.trackingStatus || '').toLowerCase();
  const isShipped =
    isDelivered ||
    ['shipped', 'in transit', 'in_transit', 'out for delivery', 'out_for_delivery', 'accepted'].some(
      (s) => trackingStatusText.includes(s)
    );

  const statusSteps = [
    { label: 'Placed', done: true, at: createdAt as Date | string | null },
    { label: 'Paid', done: isPaid, at: paidAt as Date | string | null },
    { label: 'Shipped', done: isShipped, at: null as Date | string | null },
    { label: 'Delivered', done: isDelivered, at: deliveredAt as Date | string | null },
  ];

  const [editAddress, setEditAddress] = useState<ShippingAddress>(shippingAddress);
  const [isSavingAddress, startSaveAddress] = useTransition();
  const [showEditAddress, setShowEditAddress] = useState(false);
  const router = useRouter();

  const { toast } = useToast();

  const PrintLoadingState = () => {
    const [{ isPending, isRejected }] = usePayPalScriptReducer();
    let status = '';

    if (isPending) {
      status = 'Loading PayPal...';
    } else if (isRejected) {
      status = 'Error Loading PayPal';
    }
    return status;
  };

  const handleCreatePayPalOrder = async () => {
    const res = await createPayPalOrder(order.id);

    if (!res.success) {
      toast({
        variant: 'destructive',
        description: res.message,
      });
    }

    return res.data;
  };

  const handleApprovePayPalOrder = async (data: { orderID: string }) => {
    const res = await approvePayPalOrder(order.id, data);

    toast({
      variant: res.success ? 'default' : 'destructive',
      description: res.message,
    });
  };

  // Button to mark order as paid
  const MarkAsPaidButton = () => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    return (
      <Button
        type='button'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await updateOrderToPaidCOD(order.id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
      >
        {isPending ? 'processing...' : 'Mark As Paid'}
      </Button>
    );
  };

  // Button to mark order as delivered
  const MarkAsDeliveredButton = () => {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    return (
      <Button
        type='button'
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const res = await deliverOrder(order.id);
            toast({
              variant: res.success ? 'default' : 'destructive',
              description: res.message,
            });
          })
        }
      >
        {isPending ? 'processing...' : 'Mark As Delivered'}
      </Button>
    );
  };

  return (
    <>
      <h1 className='py-4 text-2xl'>Order {formatId(id)}</h1>
      <div className='grid md:grid-cols-3 md:gap-5'>
        <div className='col-span-2 space-4-y overlow-x-auto'>
          <Card className='my-2'>
            <CardContent className='p-4'>
              <h2 className='text-xl pb-4'>Order Status</h2>
              <div className='flex items-center justify-between'>
                {statusSteps.map((step, index) => (
                  <div key={step.label} className='flex flex-1 items-center last:flex-none'>
                    <div className='flex flex-col items-center'>
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                          step.done
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-slate-300 bg-white text-slate-400'
                        }`}
                      >
                        {step.done ? '✓' : index + 1}
                      </div>
                      <span
                        className={`mt-1 text-xs font-medium ${
                          step.done ? 'text-slate-900' : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.at && (
                        <span className='text-[10px] text-slate-400'>
                          {formatDateTime(new Date(step.at)).dateOnly}
                        </span>
                      )}
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`mx-1 h-0.5 flex-1 ${
                          statusSteps[index + 1].done ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {tracking.trackingNumber && (
                <div className='mt-5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <div>
                      <p className='text-xs text-slate-500'>Tracking number</p>
                      <p className='font-mono font-medium text-slate-900'>
                        {tracking.trackingNumber}
                      </p>
                    </div>
                    {tracking.trackingStatus && (
                      <span className='rounded-full bg-slate-900 px-3 py-1 text-xs font-medium capitalize text-white'>
                        {tracking.trackingStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className='my-2'>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4'>Shipping Address</h2>
              <p>{shippingAddress.fullName}</p>
              <p className='mb-2'>
                {shippingAddress.streetAddress}, {shippingAddress.city}
                {shippingAddress.state ? `, ${shippingAddress.state}` : ''}{' '}
                {shippingAddress.postalCode}, {shippingAddress.country}
              </p>

              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setShowEditAddress((prev) => !prev)}
              >
                {showEditAddress ? 'Cancel' : 'Edit Shipping Address'}
              </Button>

              {showEditAddress && (
                <div className='mt-4 space-y-2'>
                  <h3 className='font-semibold text-sm'>Update Shipping Address</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
                    <Input
                      placeholder='Full Name'
                      value={editAddress.fullName}
                      onChange={(e) =>
                        setEditAddress({ ...editAddress, fullName: e.target.value })
                      }
                    />
                    <Input
                      placeholder='Street Address'
                      value={editAddress.streetAddress}
                      onChange={(e) =>
                        setEditAddress({
                          ...editAddress,
                          streetAddress: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder='City'
                      value={editAddress.city}
                      onChange={(e) =>
                        setEditAddress({ ...editAddress, city: e.target.value })
                      }
                    />
                    <Input
                      placeholder='Postal Code'
                      value={editAddress.postalCode}
                      onChange={(e) =>
                        setEditAddress({
                          ...editAddress,
                          postalCode: e.target.value,
                        })
                      }
                    />
                    <Input
                      placeholder='Country'
                      value={editAddress.country}
                      onChange={(e) =>
                        setEditAddress({ ...editAddress, country: e.target.value })
                      }
                    />
                  </div>
                  <Button
                    type='button'
                    size='sm'
                    disabled={isSavingAddress}
                    onClick={() =>
                      startSaveAddress(async () => {
                        const res = await updateOrderShippingAddress(id, editAddress);
                        toast({
                          variant: res.success ? 'default' : 'destructive',
                          description: res.message,
                        });

                        if (res.success) {
                          setShowEditAddress(false);
                          router.refresh();
                        }
                      })
                    }
                  >
                    {isSavingAddress ? 'Saving...' : 'Save Address'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4 gap-4'>
              <h2 className='text-xl pb-4'>Order Items</h2>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orderitems.map((item) => (
                    <TableRow key={item.slug}>
                      <TableCell>
                        <Link
                          href={`/product/{item.slug}`}
                          className='flex items-center'
                        >
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={50}
                            height={50}
                          />
                          <span className='px-2'>{item.name}</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <span className='px-2'>{item.qty}</span>
                      </TableCell>
                      <TableCell className='text-right'>
                        ${item.price}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className='p-4 gap-4 space-y-4'>
              <div className='flex justify-between'>
                <div>Items</div>
                <div>{formatCurrency(itemsPrice)}</div>
              </div>
              <div className='flex justify-between'>
                <div>Tax</div>
                <div>{formatCurrency(taxPrice)}</div>
              </div>
              <div className='flex justify-between'>
                <div>Shipping</div>
                <div>{formatCurrency(shippingPrice)}</div>
              </div>
              <div className='flex justify-between'>
                <div>Total</div>
                <div>{formatCurrency(totalPrice)}</div>
              </div>

              {/* PayPal Payment */}
              {!isPaid && paymentMethod === 'PayPal' && (
                <div>
                  <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                    <PrintLoadingState />
                    <PayPalButtons
                      createOrder={handleCreatePayPalOrder}
                      onApprove={handleApprovePayPalOrder}
                    />
                  </PayPalScriptProvider>
                </div>
              )}

              {/* Stripe Payment */}
              {!isPaid && paymentMethod === 'Stripe' && stripeClientSecret && (
                <StripePayment
                  priceInCents={Number(order.totalPrice) * 100}
                  orderId={order.id}
                  clientSecret={stripeClientSecret}
                />
              )}

              {/* Cash On Delivery */}
              {isAdmin && !isPaid && paymentMethod === 'CashOnDelivery' && (
                <MarkAsPaidButton />
              )}
              {isAdmin && isPaid && !isDelivered && <MarkAsDeliveredButton />}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OrderDetailsTable;
