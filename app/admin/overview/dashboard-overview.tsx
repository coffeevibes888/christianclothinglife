'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { BadgeDollarSign, CreditCard, Users, Package, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardOverviewProps {
  summary: {
    totalSales: { _sum: { totalPrice?: string | number | null } };
    ordersCount: number;
    usersCount: number;
    productsCount: number;
    salesData: { month: string; totalSales: number }[];
  };
}

const DashboardOverview = ({ summary }: DashboardOverviewProps) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const cards = [
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: formatCurrency(summary.totalSales._sum.totalPrice?.toString() || 0),
      icon: BadgeDollarSign,
      color: 'from-emerald-500 to-teal-600',
      details: summary.salesData,
      detailLabel: 'Monthly Revenue',
      link: '/admin/revenue',
    },
    {
      id: 'sales',
      title: 'Total Sales',
      value: formatNumber(summary.ordersCount),
      icon: CreditCard,
      color: 'from-blue-500 to-cyan-600',
      details: null,
      detailLabel: 'Orders',
      link: null,
    },
    {
      id: 'customers',
      title: 'Total Customers',
      value: formatNumber(summary.usersCount),
      icon: Users,
      color: 'from-violet-500 to-purple-600',
      details: null,
      detailLabel: 'Active Users',
      link: null,
    },
    {
      id: 'products',
      title: 'Total Products',
      value: formatNumber(summary.productsCount),
      icon: Package,
      color: 'from-orange-500 to-red-600',
      details: null,
      detailLabel: 'SKUs',
      link: null,
    },
  ];

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {cards.map((card) => {
        const Icon = card.icon;
        const isExpanded = expandedCard === card.id;

        const cardContent = (
          <motion.div
            key={card.id}
            layout
            className='bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg shadow-slate-900/5 hover:shadow-xl transition-shadow cursor-pointer group relative'
            onClick={(e) => {
              if (card.link && !card.details) {
                return;
              }
              if (card.details) {
                e.preventDefault();
                setExpandedCard(isExpanded ? null : card.id);
              }
            }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              layout
              className={`absolute inset-0 rounded-xl ${
                isExpanded
                  ? 'bg-gradient-to-br ' + card.color
                  : 'bg-gradient-to-br ' + card.color
              } transition-all pointer-events-none`}
              style={{
                opacity: isExpanded ? 0.15 : 0.1,
              }}
            />

            <motion.div layout className='relative p-6 z-10'>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-slate-500 mb-1'>
                    {card.title}
                  </p>
                  <motion.h3
                    layout
                    className='text-3xl font-bold text-slate-900'
                  >
                    {card.value}
                  </motion.h3>
                </div>
                <div
                  className={`p-3 rounded-lg bg-gradient-to-br ${card.color} text-white shrink-0`}
                >
                  <Icon className='w-6 h-6' />
                </div>
              </div>

              {card.details && (
                <motion.div
                  animate={{
                    rotate: isExpanded ? 180 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className='flex items-center gap-1 text-xs text-slate-500 group-hover:text-slate-700 transition-colors'
                >
                  <ChevronDown className='w-4 h-4' />
                  Click to view details
                </motion.div>
              )}
              {card.link && !card.details && (
                <motion.div className='flex items-center gap-1 text-xs text-emerald-600'>
                  View Details <ArrowRight className='w-4 h-4' />
                </motion.div>
              )}
            </motion.div>

            <AnimatePresence>
              {isExpanded && card.details && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className='border-t border-slate-200 px-6 pb-6 relative z-10'
                >
                  <p className='text-xs font-semibold text-slate-500 mb-4 uppercase tracking-wider'>
                    {card.detailLabel}
                  </p>
                  <div className='space-y-3 max-h-64 overflow-y-auto'>
                    {card.details.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className='flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors'
                      >
                        <span className='text-sm font-medium text-slate-600'>
                          {item.month}
                        </span>
                        <span className='text-sm font-bold text-emerald-600'>
                          {formatCurrency(item.totalSales)}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );

        return card.link ? (
          <Link key={card.id} href={card.link}>
            {cardContent}
          </Link>
        ) : (
          cardContent
        );
      })}
    </div>
  );
};

export default DashboardOverview;
