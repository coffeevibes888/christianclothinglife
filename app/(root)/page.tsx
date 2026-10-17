import ProductList from '@/components/shared/product/product-list';
import { getLatestProductsByCategory } from '@/lib/actions/product.actions';
import ViewAllProductsButton from '@/components/view-all-products-button';
import DealCountdown from '@/components/deal-countdown';
import Hero from '@/components/hero/hero';
import ValueProps from '@/components/home/value-props';
// import CategoryTiles from '@/components/home/category-tiles';
import CustomerReviews from '@/components/home/customer-reviews';
import HomeContactCard from '@/components/home/home-contact-card';
import CtaBand from '@/components/home/cta-band';
import type { Product } from '@/types';

type RawProduct = {
  subCategory?: unknown;
  salePercent?: unknown;
  saleUntil?: unknown;
  [key: string]: unknown;
};

const normalizeProducts = (products: RawProduct[]): Product[] =>
  products.map((product) => {
    const rawSaleUntil = product.saleUntil;
    const normalizedSaleUntil = rawSaleUntil
      ? new Date(rawSaleUntil as string | number | Date)
      : undefined;

    const rawSalePercent = product.salePercent;
    const normalizedSalePercent =
      rawSalePercent !== null && rawSalePercent !== undefined
        ? Number(rawSalePercent as number | string)
        : undefined;

    return {
      ...product,
      subCategory: (product.subCategory as string | null | undefined) ?? undefined,
      salePercent: normalizedSalePercent,
      saleUntil:
        normalizedSaleUntil && !Number.isNaN(normalizedSaleUntil.getTime())
          ? normalizedSaleUntil.toISOString()
          : undefined,
    } as Product;
  });

const Homepage = async () => {
  // Main categories — tag products with these exact names in the admin:
  // "T-Shirts", "Hoodies", "Coffee Mugs", "Seasonal", "Christian Humor"
  const [tshirtsRaw, hoodiesRaw, mugsRaw, seasonalRaw, humorRaw] = await Promise.all([
    getLatestProductsByCategory('T-Shirts', 20),
    getLatestProductsByCategory('Hoodies', 20),
    getLatestProductsByCategory('Coffee Mugs', 20),
    getLatestProductsByCategory('Seasonal', 20),
    getLatestProductsByCategory('Christian Humor', 20),
  ]);

  const tshirts = normalizeProducts(tshirtsRaw);
  const hoodies = normalizeProducts(hoodiesRaw);
  const mugs = normalizeProducts(mugsRaw);
  const seasonal = normalizeProducts(seasonalRaw);
  const humor = normalizeProducts(humorRaw);

  return (
    <>
      <Hero />
      <CustomerReviews />
     
      {/* <CategoryTiles /> */}

      {tshirts.length > 0 && (
        <ProductList
          data={tshirts}
          title='T-Shirts'
          viewAllHref='/search?category=T-Shirts'
        />
      )}
      {hoodies.length > 0 && (
        <ProductList
          data={hoodies}
          title='Hoodies'
          viewAllHref='/search?category=Hoodies'
        />
      )}
      {mugs.length > 0 && (
        <ProductList
          data={mugs}
          title='Coffee Mugs'
          viewAllHref='/search?category=Coffee Mugs'
        />
      )}
      {seasonal.length > 0 && (
        <ProductList
          data={seasonal}
          title='Seasonal'
          viewAllHref='/search?category=Seasonal'
        />
      )}
      {humor.length > 0 && (
        <ProductList
          data={humor}
          title='Christian Humor'
          viewAllHref='/search?category=Christian Humor'
        />
      )}

      <ViewAllProductsButton />
      <ValueProps />
      <DealCountdown />
      <HomeContactCard />
      <CtaBand />
    </>
  );
};

export default Homepage;
