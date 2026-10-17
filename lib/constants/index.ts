export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Rocken My Vibe';
export const APP_DESCRIPTION = process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  'Style Your Soul & Your Body Will Thank You For';
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || 'https://www.christianclothinglife.com';
export const LATEST_PRODUCTS_LIMIT =
  Number(process.env.LATEST_PRODUCTS_LIMIT) || 4;


export const NEXTAUTH_URL =
  process.env.NEXT_PUBLIC_NEXTAUTH_URL || 'https://www.christianclothinglife.com';
// export const signInDefaultValues = {
//   email: 'allenyoung1979@yahoo.com',
//   password: 'NewLove2044$&@*',
// };

export const signUpDefaultValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const shippingAddressDefaultValues = {
  fullName: '',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: '',
};

export const PAYMENT_METHODS = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(', ')
  : ['PayPal', 'Stripe', 'CashOnDelivery'];
export const DEFAULT_PAYMENT_METHOD =
  process.env.DEFAULT_PAYMENT_METHOD || 'Stripe';

export const PAGE_SIZE = Number(process.env.PAGE_SIZE) || 12;

// Fixed product categories (keep these in sync with the homepage rows and nav)
export const PRODUCT_CATEGORIES = [
  'T-Shirts',
  'Hoodies',
  'Coffee Mugs',
  'Seasonal',
  'Christian Humor',
  'Positive Vibes',
] as const;

// Weight-based shipping configuration.
// Tax is 0. Shipping is a flat handling fee plus a per-pound rate based on the
// estimated weight of the items in the cart. Tune these to match your carrier
// (Printful / Amazon Merch) rates. Values can be overridden via env.
export const SHIPPING_BASE_HANDLING =
  Number(process.env.SHIPPING_BASE_HANDLING) || 3.99;
export const SHIPPING_RATE_PER_LB =
  Number(process.env.SHIPPING_RATE_PER_LB) || 2.5;
export const DEFAULT_ITEM_WEIGHT_OZ =
  Number(process.env.DEFAULT_ITEM_WEIGHT_OZ) || 10;

// Estimated per-item weight (in ounces) by category, including packaging.
export const CATEGORY_WEIGHTS_OZ: Record<string, number> = {
  't-shirts': 7,
  't-shirt': 7,
  hoodies: 24,
  hoodie: 24,
  'coffee mugs': 20,
  'coffee mug': 20,
};

export const productDefaultValues = {
  name: '',
  slug: '',
  category: '',
  subCategory: '',
  images: [],
  imageColors: [],
  brand: '',
  description: '',
  price: 0,
  stock: 0,
  rating: 0,
  numReviews: 0,
  isFeatured: false,
  banner: null,
  colorIds: [],
  sizeIds: [],
  onSale: false,
  salePercent: undefined as number | undefined,
  saleUntil: null as string | null,
  saleDiscountType: 'percentage' as 'percentage' | 'amount',
};

export const USER_ROLES = process.env.USER_ROLES
  ? process.env.USER_ROLES.split(', ')
  : ['admin', 'user'];

export const reviewFormDefaultValues = {
  title: '',
  comment: '',
  rating: 0,
};

export const SENDER_EMAIL = process.env.SENDER_EMAIL || 'yourebeautiful@rockenmyvibe.com';
