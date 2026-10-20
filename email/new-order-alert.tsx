import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { Order } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

type NewOrderAlertProps = {
  order: Order;
};

export default function NewOrderAlertEmail({ order }: NewOrderAlertProps) {
  const addr = order.shippingAddress;

  return (
    <Html>
      <Preview>
        New order {String(order.id)} — {formatCurrency(order.totalPrice)}
      </Preview>
      <Tailwind>
        <Head />
        <Body className='font-sans bg-white'>
          <Container className='max-w-xl'>
            <Heading>🛒 New Order Received</Heading>
            <Text className='text-gray-600'>
              You just got a new order on {APP_NAME}.
            </Text>

            <Section className='border border-solid border-gray-300 rounded-lg p-4 my-4'>
              <Row className='py-1'>
                <Column className='text-gray-500'>Order ID</Column>
                <Column align='right'>{String(order.id)}</Column>
              </Row>
              <Row className='py-1'>
                <Column className='text-gray-500'>Placed</Column>
                <Column align='right'>
                  {dateFormatter.format(new Date(order.createdAt))}
                </Column>
              </Row>
              <Row className='py-1'>
                <Column className='text-gray-500'>Customer</Column>
                <Column align='right'>
                  {order.user?.name} ({order.user?.email})
                </Column>
              </Row>
              <Row className='py-1'>
                <Column className='text-gray-500'>Payment</Column>
                <Column align='right'>{order.paymentMethod}</Column>
              </Row>
              <Row className='py-1'>
                <Column className='text-gray-500'>Total</Column>
                <Column align='right'>
                  <strong>{formatCurrency(order.totalPrice)}</strong>
                </Column>
              </Row>
            </Section>

            <Section className='border border-solid border-gray-300 rounded-lg p-4 my-4'>
              <Heading as='h3' className='text-base'>
                Items
              </Heading>
              {order.orderitems.map((item) => (
                <Row key={item.productId} className='py-1'>
                  <Column className='align-top'>
                    {item.name} × {item.qty}
                  </Column>
                  <Column align='right' className='align-top'>
                    {formatCurrency(item.price)}
                  </Column>
                </Row>
              ))}
            </Section>

            {addr && (
              <Section className='border border-solid border-gray-300 rounded-lg p-4 my-4'>
                <Heading as='h3' className='text-base'>
                  Ship to
                </Heading>
                <Text className='m-0'>{addr.fullName}</Text>
                <Text className='m-0'>{addr.streetAddress}</Text>
                <Text className='m-0'>
                  {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postalCode}
                </Text>
                <Text className='m-0'>{addr.country}</Text>
              </Section>
            )}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
