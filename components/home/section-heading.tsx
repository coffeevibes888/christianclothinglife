import { cn } from '@/lib/utils';

const SectionHeading = ({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'center' | 'left';
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'space-y-3',
        align === 'center' ? 'mx-auto max-w-2xl text-center' : 'text-left',
        className
      )}
    >
      {eyebrow && (
        <p className='text-xs font-semibold uppercase tracking-[0.28em] text-blue-600'>
          {eyebrow}
        </p>
      )}
      <h2 className='text-3xl font-bold tracking-tight text-slate-900 md:text-4xl'>
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            'text-sm leading-relaxed text-slate-600 md:text-base',
            align === 'center' ? 'mx-auto max-w-xl' : ''
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
