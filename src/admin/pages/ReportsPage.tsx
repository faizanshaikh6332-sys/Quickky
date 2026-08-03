import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Users, ShoppingBag, CreditCard, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from '@/admin/components/AdminLayout';
import StatCard from '@/admin/components/StatCard';
import { supabase } from '@/lib/supabase';

const COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#6B7280'];

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState(7); // days
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);
  const [paymentData, setPaymentData] = useState<any[]>([]);
  const [usersData, setUsersData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    avgOrder: 0,
    newUsers: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    const startStr = startDate.toISOString();

    try {
      // Fetch Orders
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total, status, payment_method, payment_status')
        .gte('created_at', startStr);

      // Fetch Users
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at, role')
        .gte('created_at', startStr);

      // Fetch Order Items for Top Products
      // Note: In production with large data, this should be done via RPC or materialized view
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, product_snapshot, quantity, unit_price, orders!inner(created_at)')
        .gte('orders.created_at', startStr);

      processData(orders || [], users || [], orderItems || [], dateRange);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const processData = (orders: any[], users: any[], items: any[], days: number) => {
    // Generate dates array for x-axis
    const dates = Array.from({length: days}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return d.toISOString().split('T')[0];
    });

    // 1. Revenue & Orders Data
    let totalRev = 0;
    const revMap = new Map();
    const statusMap = new Map();
    const paymentMap = new Map();

    dates.forEach(d => revMap.set(d, { date: d, revenue: 0, orders: 0 }));

    orders.forEach(o => {
      const date = o.created_at.split('T')[0];
      
      // Totals
      if (o.status !== 'cancelled') {
        totalRev += o.total;
        if (revMap.has(date)) {
          revMap.get(date).revenue += o.total;
        }
      }
      if (revMap.has(date)) revMap.get(date).orders += 1;

      // Status
      statusMap.set(o.status, (statusMap.get(o.status) || 0) + 1);

      // Payment
      paymentMap.set(o.payment_method, (paymentMap.get(o.payment_method) || 0) + 1);
    });

    setRevenueData(Array.from(revMap.values()));
    setStatusData(Array.from(statusMap.entries()).map(([name, value]) => ({ name, value })));
    setPaymentData(Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value })));
    
    // Stats
    setStats({
      revenue: totalRev,
      orders: orders.length,
      avgOrder: orders.length ? totalRev / orders.length : 0,
      newUsers: users.length
    });

    // 2. Users Data
    const usersMap = new Map();
    dates.forEach(d => usersMap.set(d, { date: d, count: 0 }));
    users.forEach(u => {
      const date = u.created_at.split('T')[0];
      if (usersMap.has(date)) usersMap.get(date).count += 1;
    });
    setUsersData(Array.from(usersMap.values()));

    // 3. Top Products
    const prodMap = new Map();
    items.forEach(i => {
      if (!i.product_snapshot) return;
      const pid = i.product_id;
      if (!prodMap.has(pid)) {
        prodMap.set(pid, {
          name: i.product_snapshot.title,
          brand: i.product_snapshot.brand || 'N/A',
          units: 0,
          revenue: 0
        });
      }
      prodMap.get(pid).units += i.quantity;
      prodMap.get(pid).revenue += (i.quantity * i.unit_price);
    });
    
    setTopProducts(
      Array.from(prodMap.values())
        .sort((a: any, b: any) => b.units - a.units)
        .slice(0, 10)
    );
  };

  const exportData = () => {
    const csvRows = ['Date,Orders,Revenue'];
    revenueData.forEach(r => {
      csvRows.push(`${r.date},${r.orders},${r.revenue}`);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${dateRange}days.csv`;
    a.click();
  };

  const formatCurrency = (val: number) => `₹${val.toLocaleString()}`;

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Platform performance insights">
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                dateRange === days ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Last {days} Days
            </button>
          ))}
        </div>
        <button 
          onClick={exportData}
          className="flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-4 gap-4"><div className="h-28 bg-gray-200 rounded-xl"/><div className="h-28 bg-gray-200 rounded-xl"/><div className="h-28 bg-gray-200 rounded-xl"/><div className="h-28 bg-gray-200 rounded-xl"/></div>
          <div className="h-96 bg-gray-200 rounded-xl"/>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Revenue" value={formatCurrency(stats.revenue)} icon={<TrendingUp />} trend="+12%" trendUp={true} />
            <StatCard title="Total Orders" value={stats.orders.toString()} icon={<ShoppingBag />} />
            <StatCard title="Avg Order Value" value={formatCurrency(stats.avgOrder)} icon={<CreditCard />} />
            <StatCard title="New Customers" value={stats.newUsers.toString()} icon={<Users />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Revenue Area Chart */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Revenue Over Time</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} axisLine={false} />
                    <YAxis tickFormatter={(val) => `₹${val/1000}k`} tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Orders by Status */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Orders by Status</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <Tooltip cursor={{fill: '#F3F4F6'}} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* New Users */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">New Users Registration</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={usersData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} minTickGap={30} axisLine={false} />
                    <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-6">Payment Methods</h3>
              <div className="h-72 flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} formatter={(val) => <span className="capitalize text-sm text-gray-700">{val}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Products Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Top Performing Products (By Units Sold)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-700 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4">#</th>
                    <th className="px-6 py-4">Product Name</th>
                    <th className="px-6 py-4">Brand</th>
                    <th className="px-6 py-4">Units Sold</th>
                    <th className="px-6 py-4">Revenue Gen.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No data available for this period</td></tr>
                  ) : (
                    topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{idx + 1}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                        <td className="px-6 py-4 text-gray-500">{p.brand}</td>
                        <td className="px-6 py-4 font-bold text-purple-600">{p.units}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">{formatCurrency(p.revenue)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
