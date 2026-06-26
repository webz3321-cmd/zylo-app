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
    <div className="min-h-screen pt-44 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12 bg-[#030303] text-gray-100">
      <div className="flex items-center gap-4 border-b border-white/5 pb-8">
        <button 
          onClick={onBackToDashboard}
          className="flex items-center gap-2 text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors cursor-pointer uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <h1 className="text-3xl font-sans tracking-tight text-white font-light">My Order History</h1>
      </div>

      {notif && (
        <div className="border border-emerald-500/20 bg-emerald-950/20 rounded-xl p-4 text-xs text-emerald-400 flex items-center gap-2 max-w-xl">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {/* TRACKING */}
      {activeTrackingOrderId && (
        <div className="space-y-4">
          <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Live Delivery Tracker</h4>
          {(() => {
            const order = orders.find(o => o.id === activeTrackingOrderId);
            if (order) {
              return (
                <OrderTracking 
                  status={order.deliveryStatus} 
                  trackingNumber={order.trackingNumber} 
                  orderDate={order.createdAt} 
                />
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* ORDERS LIST */}
      {orders.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl text-gray-500 space-y-3">
          <Package className="w-10 h-10 mx-auto opacity-30" />
          <p className="text-sm font-sans font-light">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isCurrentlyTracking = activeTrackingOrderId === order.id;
            return (
              <div 
                key={order.id} 
                className={`border rounded-2xl p-5 border-white/5 bg-white/5 hover:border-white/15 transition-all`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono font-bold text-white uppercase">{order.id}</span>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()} • ₹{order.total}</p>
                    <span className="text-[10px] uppercase text-amber-500 tracking-widest">{order.deliveryStatus.replace('_', ' ')}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTrackingOrderId(isCurrentlyTracking ? null : order.id)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-[10px] uppercase transition-all ${
                        isCurrentlyTracking ? 'bg-amber-500 text-black' : 'border-white/10 text-gray-300'
                      }`}
                    >
                      Track
                    </button>
                    {['pending', 'confirmed'].includes(order.deliveryStatus) && (
                      <button onClick={() => handleCancelOrder(order.id)} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 font-mono text-[10px] uppercase">Cancel</button>
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
