// Central FAQ knowledge base. Used by both the chat widget (quick replies +
// keyword matching) and the public /faq page. Keep answers accurate to store
// policy; update here and both surfaces stay in sync.

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
};

export const FAQS: FaqItem[] = [
  // ---- Orders & Tracking ----
  {
    id: 'track-order',
    category: 'Orders & Tracking',
    question: 'How do I track my order?',
    answer:
      "Once your order ships you'll get a tracking link by email. You can also see your orders and their status anytime under Account → My Orders. Carriers can take 24–48 hours to show the first scan after a label is created.",
    keywords: ['track', 'tracking', 'where is my order', 'where is my package', 'status of my order'],
  },
  {
    id: 'change-cancel',
    category: 'Orders & Tracking',
    question: 'Can I change or cancel my order?',
    answer:
      'Our items are made to order and go into production quickly, so we can only change or cancel within a short window after purchase. Contact us as soon as possible with your order number and we’ll do our best — once an item is in production it can’t be changed.',
    keywords: ['cancel', 'change my order', 'edit order', 'modify order', 'cancel order'],
  },
  {
    id: 'order-confirmation',
    category: 'Orders & Tracking',
    question: "I didn't get an order confirmation email.",
    answer:
      'Check your spam and promotions folders first. Confirmations are sent to the email used at checkout. If it’s still missing after a few minutes, contact us with the name and email you used and we’ll resend it.',
    keywords: ['confirmation', 'no email', 'receipt', 'didnt get email', "didn't get email"],
  },

  // ---- Shipping ----
  {
    id: 'shipping-time',
    category: 'Shipping',
    question: 'How long does shipping take?',
    answer:
      'Because each item is printed to order, allow about 2–5 business days for production, plus 3–7 business days for US shipping (longer for international). You’ll get a tracking link as soon as it ships.',
    keywords: ['how long', 'shipping take', 'delivery time', 'when will it arrive', 'how fast'],
  },
  {
    id: 'free-shipping',
    category: 'Shipping',
    question: 'Do you offer free shipping?',
    answer:
      'Yes — US orders over $75 ship free. Under that, shipping is calculated at checkout based on your items and address.',
    keywords: ['free shipping', 'shipping cost', 'shipping fee', 'shipping price'],
  },
  {
    id: 'ship-where',
    category: 'Shipping',
    question: 'Where do you ship?',
    answer:
      'We ship across the US and to many international destinations. Add your items to the cart and enter your address at checkout to see live shipping options and rates for your location.',
    keywords: ['ship to', 'international', 'do you ship', 'countries', 'outside us', 'canada'],
  },

  // ---- Returns & Exchanges ----
  {
    id: 'return-policy',
    category: 'Returns & Exchanges',
    question: 'What is your return policy?',
    answer:
      'Unworn items in original condition can be returned within 30 days. Because products are made to order, we can’t accept returns for buyer’s remorse on worn or washed items — but if anything arrives wrong or damaged, we’ll make it right.',
    keywords: ['return policy', 'returns', 'refund', '30 day', 'money back'],
  },
  {
    id: 'how-to-return',
    category: 'Returns & Exchanges',
    question: 'How do I return or exchange an item?',
    answer:
      'Contact us with your order number and what you’d like to do (return or exchange). We’ll send instructions. Keep items unworn and in original condition. For exchanges, let us know the size/color you’d like instead.',
    keywords: ['how to return', 'exchange', 'wrong size', 'swap', 'different size'],
  },
  {
    id: 'damaged',
    category: 'Returns & Exchanges',
    question: 'My item arrived damaged or incorrect.',
    answer:
      'We’re sorry about that! Contact us within 7 days with your order number and a photo of the issue. For misprints, damage, or the wrong item, we’ll send a free replacement or a refund.',
    keywords: ['damaged', 'defective', 'wrong item', 'misprint', 'broken', 'ripped', 'stain'],
  },

  // ---- Sizing & Fit ----
  {
    id: 'sizing',
    category: 'Sizing & Fit',
    question: 'How do your sizes fit?',
    answer:
      'Each product page has a size chart with exact measurements — that’s the best guide. Our tees are generally true to size. If you’re between sizes or like a relaxed fit, size up.',
    keywords: ['size', 'sizing', 'fit', 'size chart', 'true to size', 'runs small', 'runs large'],
  },

  // ---- Products & Colors ----
  {
    id: 'colors',
    category: 'Products',
    question: 'How do I choose a color?',
    answer:
      'On the product page, pick a color swatch and size. The main image updates to the color you select. If a color isn’t selectable, it’s currently unavailable for that size.',
    keywords: ['color', 'colour', 'colors', 'swatch'],
  },
  {
    id: 'made-to-order',
    category: 'Products',
    question: 'Are your products made to order?',
    answer:
      'Yes. Each piece is printed on demand just for you, which keeps designs fresh and reduces waste. That’s also why production takes a few days before shipping.',
    keywords: ['made to order', 'print on demand', 'printed', 'how are they made', 'in stock'],
  },
  {
    id: 'care',
    category: 'Products',
    question: 'How do I care for my shirt?',
    answer:
      'To keep prints looking great: machine wash cold, inside out, with like colors; tumble dry low or hang dry; and avoid ironing directly over the print.',
    keywords: ['care', 'wash', 'washing', 'laundry', 'dry', 'iron', 'shrink'],
  },
  {
    id: 'restock',
    category: 'Products',
    question: 'Will sold-out items be restocked?',
    answer:
      'Most designs are made to order, so availability can change by size and color. If something you want isn’t available, contact us — we can often tell you if and when it’s coming back.',
    keywords: ['restock', 'sold out', 'out of stock', 'back in stock', 'when available'],
  },

  // ---- Payments & Security ----
  {
    id: 'payment-methods',
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer:
      'Checkout is powered by Stripe, so we accept major credit/debit cards and supported wallets. Your payment details are handled securely by Stripe and never stored on our servers.',
    keywords: ['payment', 'pay', 'credit card', 'debit', 'apple pay', 'google pay', 'paypal', 'stripe'],
  },
  {
    id: 'secure-checkout',
    category: 'Payments',
    question: 'Is checkout secure?',
    answer:
      'Yes. Payments are processed by Stripe over an encrypted connection. We don’t see or store your full card number.',
    keywords: ['secure', 'safe', 'security', 'is it safe', 'encrypted'],
  },
  {
    id: 'promo-code',
    category: 'Payments',
    question: 'How do I use a promo code?',
    answer:
      'Add your items to the cart, then enter your promo code at checkout to see the discount applied before you pay. One code per order; expired or fully-used codes won’t apply.',
    keywords: ['promo', 'coupon', 'discount code', 'promo code', 'voucher'],
  },

  // ---- Account ----
  {
    id: 'reset-password',
    category: 'Account',
    question: 'How do I reset my password?',
    answer:
      'On the sign-in page, click “Forgot password?” and enter the email you signed up with. You’ll get a secure reset link (check spam if you don’t see it). The link expires after an hour for safety.',
    keywords: ['password', 'reset', 'log in', 'login', 'sign in', "can't log in", 'forgot'],
  },
  {
    id: 'guest-checkout',
    category: 'Account',
    question: 'Do I need an account to order?',
    answer:
      'You can check out as a guest — just provide your email and shipping details. Creating an account lets you track orders and reorder faster later.',
    keywords: ['account', 'guest', 'sign up', 'register', 'do i need an account'],
  },

  // ---- Contact / Support ----
  {
    id: 'contact',
    category: 'Support',
    question: 'How do I reach a human?',
    answer:
      'Visit our Contact page to send a message, or reply to any order email. Live support is available Mon–Fri, 9am–6pm. Outside those hours, leave a message and we’ll get back to you as soon as we’re online.',
    keywords: ['human', 'agent', 'contact', 'support', 'talk to someone', 'customer service', 'help'],
  },
];

// Short list of starter questions shown as quick-reply buttons in the chat.
export const SUGGESTED_QUESTIONS: string[] = [
  'How long does shipping take?',
  'What is your return policy?',
  'How do your sizes fit?',
  'How do I track my order?',
  'Do you offer free shipping?',
];

// Match a free-text message to the best FAQ answer, or null if nothing fits.
export function findFaqAnswer(message: string): FaqItem | null {
  const lower = message.toLowerCase().trim();
  if (!lower) return null;

  let best: { item: FaqItem; score: number } | null = null;

  for (const item of FAQS) {
    let score = 0;

    // Strong signal: the user basically typed the question.
    if (lower === item.question.toLowerCase()) score += 1000;

    for (const kw of item.keywords) {
      if (lower.includes(kw)) score += kw.length; // longer phrase = stronger match
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { item, score };
    }
  }

  return best?.item ?? null;
}

// Group FAQs by category, preserving first-seen order — handy for the FAQ page.
export function groupFaqsByCategory(): { category: string; items: FaqItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, FaqItem[]>();

  for (const item of FAQS) {
    if (!map.has(item.category)) {
      map.set(item.category, []);
      order.push(item.category);
    }
    map.get(item.category)!.push(item);
  }

  return order.map((category) => ({ category, items: map.get(category)! }));
}
