import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const ViewAllProductsButton = () => {
  return (
    <div className='my-10 flex items-center justify-center'>
      <Link
        href='/search'
        className='group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-600/40'
      >
        View All Products
        <ArrowRight
          size={18}
          className='transition-transform duration-300 group-hover:translate-x-1'
        />
      </Link>
    </div>
  );
};

export default ViewAllProductsButton;
