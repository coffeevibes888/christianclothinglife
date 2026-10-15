import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getOrderSummary } from '@/lib/actions/order-actions';
import { formatCurrency, formatDateTime, convertToPlainObject } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import Charts from './charts';
import { requireAdmin } from '@/lib/auth-guard';
import DashboardOverview from './dashboard-overview';

export const metadata: Metadata = {
  title: 'Admin Dashboard',
};

const AdminOverviewPage = async () => {
  await requireAdmin();

  const summary = await getOrderSummary();
  const serializedSummary = convertToPlainObject(summary);

  return (
    <div className='w-full min-h-screen px-4 py-8 md:px-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        <div>
          <h1 className='text-4xl md:text-5xl font-bold text-slate-900 mb-2'>Dashboard</h1>
          <p className='text-slate-500'>Monitor your store performance and recent activity</p>
        </div>

        <DashboardOverview summary={serializedSummary} />

        <div className='grid gap-8 lg:grid-cols-7'>
          <div className='lg:col-span-4 bg-white border border-slate-200 rounded-xl p-8 shadow-lg shadow-slate-900/5'>
            <div className='flex items-center justify-between mb-8'>
              <div>
                <h3 className='text-2xl font-bold text-slate-900'>Sales Overview</h3>
                <p className='text-sm text-slate-500 mt-1'>Monthly revenue trend</p>
              </div>
              <TrendingUp className='w-6 h-6 text-violet-500' />
            </div>
            <Charts
              data={{
                salesData: summary.salesData,
              }}
            />
          </div>

          <div className='lg:col-span-3 bg-white border border-slate-200 rounded-xl p-8 shadow-lg shadow-slate-900/5'>
            <div className='flex items-center justify-between mb-8'>
              <div>
                <h3 className='text-2xl font-bold text-slate-900'>Recent Sales</h3>
                <p className='text-sm text-slate-500 mt-1'>Latest transactions</p>
              </div>
            </div>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow className='border-slate-200 hover:bg-slate-50'>
                    <TableHead className='text-slate-500'>BUYER</TableHead>
                    <TableHead className='text-slate-500'>DATE</TableHead>
                    <TableHead className='text-slate-500'>TOTAL</TableHead>
                    <TableHead className='text-slate-500'>ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.latestSales.slice(0, 8).map((order) => (
                    <TableRow key={order.id} className='border-slate-100 hover:bg-slate-50 transition-colors'>
                      <TableCell className='text-slate-700 font-medium'>
                        {order?.user?.name ? order.user.name : 'Deleted User'}
                      </TableCell>
                      <TableCell className='text-slate-500 text-sm'>
                        {formatDateTime(order.createdAt).dateOnly}
                      </TableCell>
                      <TableCell className='text-slate-900 font-semibold'>
                        {formatCurrency(order.totalPrice)}
                      </TableCell>
                      <TableCell>
                        <Link href={`/order/${order.id}`}>
                          <span className='text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors'>View</span>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Link href='/admin/orders'>
              <button className='w-full mt-6 py-2 px-4 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'>
                View All Sales
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewPage;
