import { Button } from '@/components/ui/button';
import { Drawer, DrawerClose, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,} from '@/components/ui/drawer';
import { getCategoryTree } from '@/lib/actions/product.actions';
import { MenuIcon } from 'lucide-react';
import Link from 'next/link';
import Search from './search';

const CategoryDrawer = async () => {
  let categories: Awaited<ReturnType<typeof getCategoryTree>> = [];
  try {
    categories = await getCategoryTree();
  } catch (error) {
    console.error('Failed to fetch categories:', error);
  }
  return (
    <Drawer direction='left'>
      <DrawerTrigger asChild>
        <Button variant='outline'>
          <MenuIcon />
        </Button>
      </DrawerTrigger>
      <DrawerContent className='h-full max-w-sm bg-linear-to-r from-slate-700 via-violet-600 to-stone-900'>
        <DrawerHeader>
          <DrawerTitle>Select a category</DrawerTitle>
          <div className='mt-8'>
            <Search />
          </div>
          <div className='space-y-1 mt-4'>
            {categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.category} className='relative group'>
                  <Button
                    variant='ghost'
                    className='w-full justify-start'
                    asChild
                  > 
                    <DrawerClose asChild>
                      <Link href={`/search?category=${encodeURIComponent(cat.category)}`}>
                        {cat.category} ({cat.count})
                      </Link>
                    </DrawerClose>
                  </Button>

                  {cat.subCategories.length > 0 && (
                    <div className='absolute left-full top-0 hidden group-hover:block rounded-md bg-slate-900/95 text-slate-100 shadow-lg p-3 min-w-[180px] z-50'>
                      <p className='text-xs font-semibold uppercase mb-1 text-slate-400'>
                        {cat.category} subcategories
                      </p>
                      <div className='flex flex-col space-y-0.5'>
                        {cat.subCategories.map((sub) => (
                          <DrawerClose asChild key={`${cat.category}-${sub}`}>
                            <Link
                              href={`/search?category=${encodeURIComponent(cat.category)}&subCategory=${encodeURIComponent(sub)}`}
                              className='text-xs hover:text-violet-300'
                            >
                              {sub}
                            </Link>
                          </DrawerClose>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className='text-sm text-gray-500'>Categories will load shortly...</p>
            )}
          </div>
        </DrawerHeader>
      </DrawerContent>
    </Drawer>
  );
};

export default CategoryDrawer;
