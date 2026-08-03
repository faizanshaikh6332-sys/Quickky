import React, { useState, useEffect } from 'react';
import AdminLayout from '@/admin/components/AdminLayout';
import StatCard from '@/admin/components/StatCard'; // Assumption: This component exists and accepts title, value, icon, trend, etc.
import { supabase } from '@/lib/supabase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell 
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Users, Store, AlertCircle, ArrowRight, Package, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalShops: number;
  activeShops: number;
  pendingShops: number;
  totalOrders: number;
  todayOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalSellers: number;
  totalProducts: number;
  pendingProducts: number;
  avgOrderValue: number;
}

const COLORS = {
  delivered: '#10B981', // green
  cancelled: '#EF4444', // red
  processing: '#F59E0B', // orange
  confirmed: '#3B82F6', // blue
  pending: '#8B5CF6' // purple
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<DashboardStats>({
    totalShops: 0,
    activeShops: 0,
    pendingShops: 0,
    totalOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalSellers: 0,
    totalProducts: 0,
    pendingProducts: 0,
    avgOrderValue: 0
  });

  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      
      const [
        { count: totalShops },
        { count: activeShops },
        { count: pendingShops },
        { count: totalOrders },
        { count: todayOrders },
        { data: allOrders }, // For revenue and avg order value
        { count: totalCustomers },
        { data: shopsData }, // For total sellers (unique seller_ids)
        { count: totalProducts },
        { count: pendingProducts },
        { data: latestOrders }, // Recent 10
        { data: recentLogsData } // Logs
      ] = await Promise.all([
        supabase.from('shops').select('id', { count: 'exact', head: true }),
        supabase.from('shops').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('shops').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
        supabase.from('orders').select('total, status, payment_status, created_at'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('shops').select('seller_id'),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*, profiles!orders_user_id_fkey(full_name)').order('created_at', { ascending: false }).limit(10),
        supabase.from('admin_logs').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      // Calculate totals
      let revenue = 0;
      let orderStatusCount: Record<string, number> = {};
      let revByDate: Record<string, number> = {};

      if (allOrders) {
        (allOrders as any[]).forEach((order: any) => {
          if (order.payment_status === 'completed') {
            revenue += order.total || 0;
          }
          
          orderStatusCount[order.status] = (orderStatusCount[order.status] || 0) + 1;

          // Revenue last 7 days
          const orderDate = new Date(order.created_at);
          if (orderDate >= sevenDaysAgo) {
            const dateStr = orderDate.toLocaleDateString('en-US', { weekday: 'short' });
            if (order.payment_status === 'completed') {
               revByDate[dateStr] = (revByDate[dateStr] || 0) + (order.total || 0);
            } else {
               if(!revByDate[dateStr]) revByDate[dateStr] = 0;
            }
          }
        });
      }

      // Unique sellers
      const uniqueSellers = new Set((shopsData as any[])?.map((s: any) => s.seller_id) || []).size;

      setStats({
        totalShops: totalShops || 0,
        activeShops: activeShops || 0,
        pendingShops: pendingShops || 0,
        totalOrders: totalOrders || 0,
        todayOrders: todayOrders || 0,
        totalRevenue: revenue,
        totalCustomers: totalCustomers || 0,
        totalSellers: uniqueSellers,
        totalProducts: totalProducts || 0,
        pendingProducts: pendingProducts || 0,
        avgOrderValue: totalOrders ? revenue / totalOrders : 0
      });

      setRecentOrders(latestOrders || []);
      
      const formattedStatus = Object.entries(orderStatusCount).map(([status, count]) => ({
        status, count
      }));
      setOrdersByStatus(formattedStatus);

      // Format revenue data for last 7 days to ensure all days are present
      const formattedRev = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
        formattedRev.push({
          date: dayStr,
          revenue: revByDate[dayStr] || 0
        });
      }
      setRevenueData(formattedRev);
      
      setRecentLogs(recentLogsData || []);

    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch dashboard data. Please try again.");
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch(status.toLowerCase()) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="bg-white rounded-xl h-24 p-4 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white rounded-xl h-80 shadow-sm"></div>
             <div className="bg-white rounded-xl h-80 shadow-sm"></div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-6 w-6" />
          <p>{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Overview and statistics">
      <div className="space-y-6">
        {/* Row 1: Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Revenue" 
            value={formatCurrency(stats.totalRevenue)} 
            icon={<IndianRupee className="text-purple-600" />} 
            className="border-l-4 border-purple-500"
          />
          <StatCard 
            title="Orders Today" 
            value={stats.todayOrders} 
            icon={<ShoppingBag className="text-blue-600" />} 
          />
          <StatCard 
            title="Active Shops" 
            value={stats.activeShops} 
            icon={<Store className="text-emerald-600" />} 
          />
          <StatCard 
            title="Pending Approvals" 
            value={stats.pendingShops + stats.pendingProducts} 
            icon={<AlertCircle className="text-orange-500" />} 
          />
          <StatCard 
            title="Total Customers" 
            value={stats.totalCustomers} 
            icon={<Users className="text-indigo-600" />} 
          />
          <StatCard 
            title="Total Sellers" 
            value={stats.totalSellers} 
            icon={<Store className="text-pink-600" />} 
          />
          <StatCard 
            title="Total Products" 
            value={stats.totalProducts} 
            icon={<Package className="text-cyan-600" />} 
          />
          <StatCard 
            title="Avg Order Value" 
            value={formatCurrency(stats.avgOrderValue)} 
            icon={<IndianRupee className="text-gray-600" />} 
          />
        </div>

        {/* Row 2: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue (Last 7 Days)</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} 
                         tickFormatter={(value) => `₹${value > 1000 ? (value/1000).toFixed(0)+'k' : value}`} />
                  <RechartsTooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Orders by Status</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ordersByStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} style={{textTransform: 'capitalize'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} />
                  <RechartsTooltip 
                    cursor={{fill: '#f3f4f6'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS] || '#9ca3af'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 3: Recent Orders & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 lg:col-span-2 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
              <Link to="/admin/orders" className="text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                  <tr>
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-4 font-mono text-xs text-gray-500">
                        {order.id.substring(0, 8)}...
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {order.profiles?.full_name || 'Unknown User'}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-900">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button onClick={() => navigate('/admin/shops?filter=pending')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 text-orange-600 rounded-md group-hover:bg-orange-200 transition-colors">
                      <Store className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-purple-700">Approve Pending Shops</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                </button>
                <button onClick={() => navigate('/admin/orders')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-md group-hover:bg-blue-200 transition-colors">
                      <Package className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-purple-700">View New Orders</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                </button>
                <button onClick={() => navigate('/admin/products?filter=pending')} className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-md group-hover:bg-purple-200 transition-colors">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-700 group-hover:text-purple-700">Manage Products</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
               <h3 className="text-lg font-bold text-gray-900 mb-4">Attention Needed</h3>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                     <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-red-800">Pending Products</span>
                     </div>
                     <span className="text-lg font-bold text-red-700">{stats.pendingProducts}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                     <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-orange-500" />
                        <span className="text-sm font-medium text-orange-800">Suspended Sellers</span>
                     </div>
                     <span className="text-lg font-bold text-orange-700">0</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Row 4: Live Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4">
                <div className="mt-1 bg-gray-100 p-2 rounded-full">
                  <Clock className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{log.admin_id}</span> performed <span className="font-medium text-purple-600">{log.action}</span>
                  </p>
                  <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                No recent activity recorded
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
