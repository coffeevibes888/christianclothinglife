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
  state: '',
  postalCode: '',
  country: 'US',
};

// US states + DC, as { code, name }. Printful requires the 2-letter state code
// for US orders, so we store the code as the address `state` value.
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;

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
