import 'server-only';

const PRINTFUL_BASE_URL = 'https://api.printful.com';

function getPrintfulHeaders() {
  const apiKey = process.env.PRINTFUL_SECRET_KEY;
  if (!apiKey) {
    throw new Error('PRINTFUL_SECRET_KEY is not set in environment variables');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Account-level tokens must specify which store to act on. Store-level tokens
  // ignore this header, so it is always safe to send when configured.
  if (process.env.PRINTFUL_STORE_ID) {
    headers['X-PF-Store-Id'] = String(process.env.PRINTFUL_STORE_ID);
  }

  return headers;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch wrapper that automatically retries on 429 (Printful rate limit, ~2
 * req/sec) with exponential backoff, honoring the Retry-After header when the
 * API sends one. Returns the final Response for the caller to handle.
 */
async function printfulFetch(
  path: string,
  init: RequestInit = {},
  retries = 5
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${PRINTFUL_BASE_URL}${path}`, {
      ...init,
      headers: { ...getPrintfulHeaders(), ...(init.headers as Record<string, string>) },
      cache: 'no-store',
    });

    if (res.status !== 429 || attempt >= retries) return res;

    const retryAfter = Number(res.headers.get('retry-after'));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter * 1000
        : Math.min(1000 * 2 ** attempt, 20000);
    await sleep(waitMs);
  }
}

/* ------------------------------------------------------------------ */
/* Response shapes (Printful v1 Sync API)                              */
/* ------------------------------------------------------------------ */

export type PrintfulSyncProductSummary = {
  id: number;
  external_id: string;
  name: string;
  variants: number;
  synced: number;
  thumbnail_url?: string;
};

export type PrintfulSyncVariant = {
  id: number;
  external_id: string;
  sync_product_id: number;
  name: string;
  synced: boolean;
  variant_id: number; // catalog variant id
  retail_price: string;
  sku: string;
  currency?: string;
  product?: { variant_id: number; product_id: number; image?: string; name?: string };
  files?: { type: string; preview_url?: string; thumbnail_url?: string }[];
};

export type PrintfulSyncProductDetail = {
  sync_product: {
    id: number;
    external_id: string;
    name: string;
    thumbnail_url?: string;
  };
  sync_variants: PrintfulSyncVariant[];
};

export type PrintfulCatalogVariant = {
  id: number;
  product_id: number;
  name: string;
  size?: string;
  color?: string;
  color_code?: string;
  image?: string;
};

export type PrintfulOrderItemInput = {
  sync_variant_id: number;
  quantity: number;
};

export type PrintfulRecipient = {
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state_code?: string;
  country_code: string;
  zip: string;
  email?: string;
  phone?: string;
};

export type PrintfulStore = {
  id: number;
  name: string;
  type?: string;
};

/* ------------------------------------------------------------------ */
/* API calls                                                           */
/* ------------------------------------------------------------------ */

// List the stores the current token can access. For an account-level token
// this returns every store on the account; for a store-level token it returns
// just that store. Used for diagnostics / picking the right PRINTFUL_STORE_ID.
export async function fetchPrintfulStores(): Promise<PrintfulStore[]> {
  const res = await printfulFetch('/stores');

  if (!res.ok) {
    throw new Error(`Failed to fetch Printful stores: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { result?: PrintfulStore[] };
  return data.result ?? [];
}

// Fetch list of products from the Printful Sync API.
export async function fetchPrintfulStoreProducts(): Promise<PrintfulSyncProductSummary[]> {
  const res = await printfulFetch('/sync/products');

  if (!res.ok) {
    throw new Error(`Failed to fetch Printful products: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { result?: PrintfulSyncProductSummary[] };
  return data.result ?? [];
}

// Fetch a detailed product (including variants) from the Printful Sync API.
export async function fetchPrintfulStoreProduct(
  id: number | string
): Promise<PrintfulSyncProductDetail> {
  const res = await printfulFetch(`/sync/products/${id}`);

  if (!res.ok) {
    throw new Error(
      `Failed to fetch Printful product ${id}: ${res.status} ${res.statusText}`,
    );
  }

  const data = (await res.json()) as { result?: PrintfulSyncProductDetail };
  if (!data.result) throw new Error(`Printful product ${id} returned no result`);
  return data.result;
}

// Fetch a catalog variant to resolve reliable color/size labels.
export async function fetchPrintfulCatalogVariant(
  variantId: number
): Promise<PrintfulCatalogVariant | null> {
  const res = await printfulFetch(`/products/variant/${variantId}`);

  if (!res.ok) return null;

  const data = (await res.json()) as { result?: { variant?: PrintfulCatalogVariant } };
  return data.result?.variant ?? null;
}

// Fetch a catalog product in one call: its type (e.g. "T-Shirt", "Hoodie",
// "Mug") plus every variant with authoritative color name, hex (color_code),
// and size. Far cheaper than one request per variant and avoids the rate limit.
export async function fetchPrintfulCatalogProduct(
  productId: number
): Promise<{ typeName?: string; variants: PrintfulCatalogVariant[] }> {
  const res = await printfulFetch(`/products/${productId}`);

  if (!res.ok) return { variants: [] };

  const data = (await res.json()) as {
    result?: {
      product?: { type?: string; type_name?: string; title?: string };
      variants?: PrintfulCatalogVariant[];
    };
  };

  return {
    typeName: data.result?.product?.type_name || data.result?.product?.type,
    variants: data.result?.variants ?? [],
  };
}

// Create a fulfillment order in Printful. Pass confirm=true to submit it for
// fulfillment immediately; confirm=false leaves it as an editable draft.
export async function createPrintfulOrder(params: {
  externalId: string;
  recipient: PrintfulRecipient;
  items: PrintfulOrderItemInput[];
  confirm?: boolean;
}): Promise<{ id: number; status: string }> {
  const { externalId, recipient, items, confirm = true } = params;

  const res = await printfulFetch(`/orders${confirm ? '?confirm=1' : ''}`, {
    method: 'POST',
    body: JSON.stringify({
      external_id: externalId,
      recipient,
      items,
    }),
  });

  const data = (await res.json()) as {
    result?: { id: number; status: string };
    error?: { message?: string };
    code?: number;
  };

  if (!res.ok || !data.result) {
    throw new Error(
      `Failed to create Printful order: ${data.error?.message || `${res.status} ${res.statusText}`}`,
    );
  }

  return data.result;
}
