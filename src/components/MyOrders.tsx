import React, { useState, useEffect } from 'react';
import { User, Order } from '../types';
import { EcommerceService } from '../lib/ecommerceService';
import OrderTracking from './OrderTracking';
import { ArrowLeft, Package, Download, CheckCircle } from 'lucide-react';

interface MyOrdersProps {
  currentUser: User;
  onBackToDashboard: () => void;
}

export default function MyOrders({ currentUser, onBackToDashboard }: MyOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [notif, setNotif] = useState('');

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const loadOrders = async () => {
    const userOrders = await EcommerceService.getOrders(currentUser.uid);
    setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleCancelOrder = async (orderId: string) => {
    await EcommerceService.updateOrderStatus(orderId, 'cancel_requested');
    showNotification('Cancellation requested. Sent to admin.');
    loadOrders();
  };

  const handleReturnOrder = async (orderId: string) => {
    await EcommerceService.updateOrderStatus(orderId, 'return_requested');
    showNotification('Return requested. Sent to admin.');
    loadOrders();
  };

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(''), 4000);
  };

  return (
    <div className="min-h-screen pt-44 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 bg-[#F8F5EF] text-[#1F1F1F]">
      <div className="flex items-center gap-4 border-b border-[#E8E1D6] pb-8">
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-mono text-[#C9A227] hover:text-[#B68D1F] transition-colors cursor-pointer uppercase font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-sans tracking-tight text-[#1F1F1F] font-bold uppercase">My Order History</h1>
      </div>

      {notif && (
        <div className="border border-emerald-100 bg-emerald-50 rounded-xl p-4 text-xs text-emerald-600 flex items-center gap-2 max-w-xl font-bold shadow-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {/* TRACKING */}
      {activeTrackingOrderId && (
        <div className="space-y-4">
          <h4 className="text-xs font-mono text-[#C9A227] tracking-widest uppercase font-bold">Live Delivery Tracker</h4>
          {(() => {
            const order = orders.find(o => o.id === activeTrackingOrderId);
            if (order) {
              return (
                <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 shadow-sm">
                  <OrderTracking 
                    status={order.deliveryStatus} 
                    trackingNumber={order.trackingNumber} 
                    orderDate={order.createdAt} 
                  />
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* ORDERS LIST */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#E8E1D6] rounded-2xl text-[#666666] space-y-3 bg-white/50">
          <Package className="w-10 h-10 mx-auto opacity-30 text-[#C9A227]" />
          <p className="text-sm font-sans font-bold uppercase tracking-tight">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCurrentlyTracking = activeTrackingOrderId === order.id;
            return (
              <div 
                key={order.id} 
                className={`border rounded-2xl p-6 transition-all shadow-sm ${isCurrentlyTracking ? 'border-[#C9A227] bg-white' : 'border-[#E8E1D6] bg-white hover:border-[#C9A227]/30'}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-mono font-black text-[#1F1F1F] uppercase">{order.id}</span>
                    <p className="text-xs text-[#666666] font-bold uppercase tracking-tight">{new Date(order.createdAt).toLocaleDateString()} • <span className="text-[#C9A227]">₹{order.total}</span></p>
                    <span className="text-[10px] font-black uppercase text-[#C9A227] tracking-[0.2em]">{order.deliveryStatus.replace('_', ' ')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTrackingOrderId(isCurrentlyTracking ? null : order.id)}
                      className={`px-5 py-2.5 rounded-lg border font-mono text-[10px] uppercase transition-all font-black tracking-widest cursor-pointer shadow-sm ${
                        isCurrentlyTracking ? 'bg-[#C9A227] text-white border-[#C9A227]' : 'border-[#E8E1D6] text-[#1F1F1F] bg-[#F8F5EF] hover:bg-white'
                      }`}
                    >
                      {isCurrentlyTracking ? 'Close Tracker' : 'Track Order'}
                    </button>
                    {['pending', 'confirmed'].includes(order.deliveryStatus) && (
                      <button onClick={() => handleCancelOrder(order.id)} className="px-5 py-2.5 rounded-lg border border-red-100 text-red-500 font-mono text-[10px] uppercase font-black tracking-widest hover:bg-red-50 transition-all cursor-pointer">Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
