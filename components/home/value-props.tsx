import { Cross, Truck, RotateCcw, ShieldCheck } from 'lucide-react';

const props = [
  {
    icon: Cross,
    title: 'Faith-Inspired Designs',
    description: 'Every piece carries a message worth wearing.',
    gradient: 'from-blue-500 to-indigo-600',
  },
  {
    icon: Truck,
    title: 'Free Shipping $75+',
    description: 'Fast, free delivery within the US.',
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    icon: RotateCcw,
    title: '30-Day Returns',
    description: 'Easy returns on any unworn items.',
    gradient: 'from-violet-500 to-fuchsia-600',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Checkout',
    description: 'Protected payments powered by Stripe.',
    gradient: 'from-fuchsia-500 to-pink-600',
  },
];

const ValueProps = () => {
  return (
    <section className='py-10'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {props.map(({ icon: Icon, title, description, gradient }) => (
          <div
            key={title}
            className='group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10'
          >
            <div
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md`}
            >
              <Icon size={20} />
            </div>
            <div>
              <h3 className='text-sm font-semibold text-slate-900'>{title}</h3>
              <p className='mt-1 text-sm text-slate-600'>{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ValueProps;
