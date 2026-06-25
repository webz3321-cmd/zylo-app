import React, { useState, useEffect } from 'react';
import { User, Order, Address } from '../types';
import { EcommerceService } from '../lib/ecommerceService';
import OrderTracking from './OrderTracking';
import { ShieldCheck, Truck, MapPin, Edit3, Plus, ArrowLeft, Download, CheckCircle, Package } from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  onBackToStore: () => void;
}

export default function Dashboard({ currentUser, onBackToStore }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<User>(currentUser);
  const [addresses, setAddresses] = useState<Address[]>(currentUser.addresses || []);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

  // Address Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Address>({
    fullName: currentUser.displayName || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States'
  });

  // Profile Edit Form
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(currentUser.displayName || '');
  const [editPhone, setEditPhone] = useState(currentUser.phone || '');

  const [notif, setNotif] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  const loadDashboardData = async () => {
    const userOrders = await EcommerceService.getOrders(currentUser.uid);
    setOrders(userOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    
    // Auto-expand first order tracking if exists and active
    if (userOrders.length > 0) {
      const active = userOrders.find(o => o.deliveryStatus !== 'delivered' && o.deliveryStatus !== 'cancelled');
      if (active) {
        setActiveTrackingOrderId(active.id);
      } else {
        setActiveTrackingOrderId(userOrders[0].id);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...profile,
      displayName: editName,
      phone: editPhone
    };
    await EcommerceService.syncUserToFirestore(updatedUser);
    setProfile(updatedUser);
    setIsEditingProfile(false);
    showNotification('Profile updated successfully.');
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.addressLine1 || !newAddress.city) return;

    const updatedAddresses = [...addresses, newAddress];
    await EcommerceService.saveUserAddresses(currentUser.uid, updatedAddresses);
    setAddresses(updatedAddresses);
    setShowAddressForm(false);
    
    // Reset address form
    setNewAddress({
      fullName: currentUser.displayName || '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States'
    });
    showNotification('New address added.');
  };

  const handleDeleteAddress = async (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    await EcommerceService.saveUserAddresses(currentUser.uid, updated);
    setAddresses(updated);
    showNotification('Address removed successfully.');
  };

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(''), 4000);
  };

  // Mock Invoice Downloader
  const downloadInvoice = (order: Order) => {
    const invoiceContent = `
==================================================
                 WHISTLE BOUTIQUE
                  OFFICIAL INVOICE
==================================================
Invoice ID: INV-${order.id.toUpperCase()}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Customer: ${order.userName}
Email: ${order.userEmail}

--------------------------------------------------
ITEMS ORDERED:
--------------------------------------------------
${order.items.map(item => {
  const price = item.product.price + (item.selectedVariant?.additionalPrice || 0);
  return `- ${item.product.name} [Variant: ${item.selectedVariant?.name || 'Standard'}]
  Qty: ${item.quantity} x ₹${price} = ₹${price * item.quantity}`;
}).join('\n')}

--------------------------------------------------
SUMMARY:
--------------------------------------------------
Subtotal: ₹${order.items.reduce((sum, item) => sum + (item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity, 0)}
Coupon Applied: ${order.couponCode || 'None'}
Discount: -₹${order.discount}
Tax (12%): ₹${order.tax}
Shipping: ${order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}
==================================================
GRAND TOTAL PAID: ₹${order.total}
==================================================
Payment Method: ${order.paymentMethod.toUpperCase()}
Payment ID: ${order.paymentId}
Tracking Number: ${order.trackingNumber || 'WST-9921-X9'}

Thank you for choosing Whistle Boutique. 
We hope to see you again!
==================================================
`;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${order.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="dashboard-wrapper" className="min-h-screen py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Dashboard Nav/Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <button 
            onClick={onBackToStore}
            className="flex items-center gap-2 text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors cursor-pointer uppercase mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
          </button>
          <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">Account Dashboard</span>
          <h1 className="text-3xl font-sans tracking-tight text-white font-light mt-1">
            Welcome Back, <span className="italic font-serif text-amber-100">{profile.displayName || profile.email.split('@')[0]}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-mono tracking-widest uppercase">
            {profile.role === 'admin' ? '⚜️ ADMIN' : '⚜️ MEMBER'}
          </span>
        </div>
      </div>

      {notif && (
        <div className="border border-emerald-500/20 bg-emerald-950/20 rounded-xl p-4 text-xs text-emerald-400 flex items-center gap-2 max-w-xl mx-auto">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CUSTOMER CARD & ADDRESSES (4 COLS) */}
        <div className="lg:col-span-4 space-y-6 sm:space-y-8 order-2 lg:order-1">
          {/* USER CARD */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Profile Details</h4>
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="text-gray-400 hover:text-amber-400 p-1 cursor-pointer transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">DisplayName</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Phone Line</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-3 py-1.5 border border-white/10 text-white text-xs font-mono rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-500 text-black font-mono font-bold text-xs rounded-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-mono text-gray-300">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <span className="text-white font-sans">{profile.displayName || 'Not Set'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="text-white">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="text-white">{profile.uid.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span className="text-white">{profile.phone || 'Not Set'}</span>
                </div>
              </div>
            )}
          </div>

          {/* SAVED ADDRESSES */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Shipping Addresses</h4>
              <button 
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="p-1.5 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-amber-400 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="space-y-4 border-t border-white/5 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase">Receiver Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-gray-400 uppercase">Street Address</label>
                  <input
                    type="text"
                    required
                    value={newAddress.addressLine1}
                    onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    required
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddressForm(false)}
                    className="px-3 py-1.5 border border-white/10 text-white text-[10px] font-mono rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-amber-500 text-black text-[10px] font-mono font-bold rounded-lg"
                  >
                    Register Address
                  </button>
                </div>
              </form>
            )}

            {addresses.length === 0 ? (
              <p className="text-xs text-gray-500 text-center font-sans">No private shipping safehouses registered.</p>
            ) : (
              <div className="space-y-4">
                {addresses.map((addr, idx) => (
                  <div key={idx} className="border border-white/5 bg-black/30 rounded-xl p-4 text-xs space-y-2 relative group">
                    <button 
                      onClick={() => handleDeleteAddress(idx)}
                      className="absolute top-3 right-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono uppercase cursor-pointer hover:underline"
                    >
                      Delete
                    </button>
                    <div className="flex items-center gap-2 text-white font-sans font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{addr.fullName}</span>
                    </div>
                    <p className="text-gray-400 font-sans leading-relaxed">
                      {addr.addressLine1} {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: ORDERS HISTORY & ACTIVE TRACKING TIMELINE (8 COLS) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8 order-1 lg:order-2">
          {/* EXPANDED TRACKING DRAWER */}
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
          <div className="space-y-4">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Order History ({orders.length})</h4>

            {orders.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-white/5 rounded-2xl text-gray-500 space-y-3">
                <Package className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-sans font-light">You haven't placed any orders yet.</p>
                <button 
                  onClick={onBackToStore}
                  className="px-4 py-2 bg-amber-500 text-black text-xs font-mono tracking-wider uppercase rounded-lg font-semibold hover:bg-amber-400 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const isCurrentlyTracking = activeTrackingOrderId === order.id;

                  return (
                    <div 
                      key={order.id} 
                      id={`order-row-${order.id}`}
                      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                        isCurrentlyTracking 
                          ? 'border-amber-500/30 bg-amber-500/[0.02]' 
                          : 'border-white/5 bg-white/5 hover:border-white/15'
                      }`}
                    >
                      {/* Summary card header */}
                      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] sm:text-xs font-mono font-bold text-white uppercase">{order.id}</span>
                            <span className="text-[8px] sm:text-[9px] font-mono bg-white/10 text-gray-300 px-2 py-0.5 rounded-full border border-white/10">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-[10px] sm:text-xs font-sans text-gray-400">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''} • Paid:{' '}
                            <span className="font-mono text-amber-500 font-semibold">₹{order.total}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5">
                          {/* Invoice download btn */}
                          <button
                            onClick={() => downloadInvoice(order)}
                            className="flex-1 sm:flex-none p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/20 cursor-pointer transition-colors flex justify-center"
                            title="Download Certificate Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          {/* Tracking Toggle */}
                          <button
                            onClick={() => setActiveTrackingOrderId(isCurrentlyTracking ? null : order.id)}
                            className={`flex-[2] sm:flex-none px-3 py-2 sm:py-1.5 rounded-xl border font-mono text-[9px] sm:text-[10px] tracking-wider uppercase transition-all cursor-pointer text-center ${
                              isCurrentlyTracking
                                ? 'bg-amber-500 border-amber-400 text-black font-semibold'
                                : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
                            }`}
                          >
                            Track Delivery
                          </button>
                        </div>
                      </div>

                      {/* Purchased Item details */}
                      <div className="p-4 sm:p-5 bg-black/20 divide-y divide-white/5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex gap-3 sm:gap-4 items-center py-3 first:pt-0 last:pb-0 text-[10px] sm:text-xs">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                              <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-white font-sans font-medium truncate tracking-wide">{item.product.name}</h5>
                              {item.selectedVariant && (
                                <p className="text-[9px] sm:text-[10px] text-gray-400 font-mono">
                                  {item.selectedVariant.name}
                                </p>
                              )}
                            </div>
                            <div className="text-right font-mono text-gray-500 sm:text-gray-400">
                              Qty: {item.quantity} • ₹{(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
