import React, { useState, useEffect } from 'react';
import { User, Order, Address } from '../types';
import { EcommerceService } from '../lib/ecommerceService';
import OrderTracking from './OrderTracking';
import { ShieldCheck, Truck, MapPin, Edit3, Plus, ArrowLeft, Download, CheckCircle, Package } from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface DashboardProps {
  currentUser: User;
  onBackToStore: () => void;
  onGoToMyOrders: () => void;
  brandName?: string;
}

export default function Dashboard({ currentUser, onBackToStore, onGoToMyOrders, brandName = 'Zylo' }: DashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<User>(currentUser);
  const [addresses, setAddresses] = useState<Address[]>(currentUser.addresses || []);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);

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

  // Address Form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState<Address>({
    fullName: currentUser.displayName || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India'
  });
  const [pincodeError, setPincodeError] = useState('');

  const handlePincodeChange = async (pincode: string) => {
    setNewAddress(prev => ({ ...prev, postalCode: pincode }));
    if (pincode.length === 6) {
      const details = await EcommerceService.getAddressDetailsByPincode(pincode);
      if (details) {
        setNewAddress(prev => ({ 
          ...prev, 
          city: details.Name,
          district: details.District,
          state: details.State 
        }));
        setPincodeError('');
      } else {
        setPincodeError('Invalid Pincode');
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.fullName || !newAddress.addressLine1 || !newAddress.city) return;

    let updatedAddresses;
    if (editingAddressIndex !== null) {
      updatedAddresses = [...addresses];
      updatedAddresses[editingAddressIndex] = newAddress;
    } else {
      updatedAddresses = [...addresses, newAddress];
    }
    
    await EcommerceService.saveUserAddresses(currentUser.uid, updatedAddresses);
    setAddresses(updatedAddresses);
    setShowAddressForm(false);
    setEditingAddressIndex(null);
    
    // Reset address form
    setNewAddress({
      fullName: currentUser.displayName || '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India'
    });
    showNotification(editingAddressIndex !== null ? 'Address updated.' : 'New address added.');
  };


  const handleEditAddress = (index: number) => {
    setNewAddress(addresses[index]);
    setEditingAddressIndex(index);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (index: number) => {
    const updated = addresses.filter((_, i) => i !== index);
    await EcommerceService.saveUserAddresses(currentUser.uid, updated);
    setAddresses(updated);
    showNotification('Address removed successfully.');
  };

  const handleCancelOrder = async (orderId: string) => {
    await EcommerceService.updateOrderStatus(orderId, 'cancel_requested');
    showNotification('Cancellation requested. Sent to admin.');
    loadDashboardData();
  };

  const handleReturnOrder = async (orderId: string) => {
    await EcommerceService.updateOrderStatus(orderId, 'return_requested');
    showNotification('Return requested. Sent to admin.');
    loadDashboardData();
  };

  const handleCancelItem = async (orderId: string, itemId: string) => {
    await EcommerceService.updateOrderItemStatus(orderId, itemId, 'cancel_requested');
    showNotification('Item cancellation requested. Sent to admin.');
    loadDashboardData();
  };

  const handleReturnItem = async (orderId: string, itemId: string) => {
    await EcommerceService.updateOrderItemStatus(orderId, itemId, 'return_requested');
    showNotification('Item return requested. Sent to admin.');
    loadDashboardData();
  };

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(''), 4000);
  };

  // Real PDF Downloader
  const downloadInvoice = (order: Order) => {
    const doc = new jsPDF();
    const primaryColor = [212, 175, 55]; // Gold/Amber

    // Header
    doc.setFillColor(12, 12, 12);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(brandName.toUpperCase(), 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('OFFICIAL CERTIFICATE OF ACQUISITION', 105, 30, { align: 'center' });

    // Invoice Info
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.text(`Invoice ID: ${order.id.toUpperCase()}`, 15, 55);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 15, 62);
    doc.text(`Status: ${order.deliveryStatus.toUpperCase()}`, 15, 69);

    doc.text('PATRON DETAILS:', 140, 55);
    doc.setTextColor(0, 0, 0);
    doc.text(order.userName, 140, 62);
    doc.text(order.userEmail, 140, 69);

    // Items Table
    const tableData = order.items.map(item => [
      item.product.name,
      item.selectedVariant?.name || 'Standard',
      `x ${item.quantity}`,
      `INR ${item.product.price + (item.selectedVariant?.additionalPrice || 0)}`,
      `INR ${(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}`
    ]);

    autoTable(doc, {
      startY: 85,
      head: [['Masterpiece', 'Variant', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      headStyles: { fillColor: [20, 20, 20], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 5 },
      columnStyles: { 4: { halign: 'right', fontStyle: 'bold' } }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 150;

    // Summary
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Summary:', 140, finalY + 15);
    doc.text(`Subtotal:`, 140, finalY + 22);
    doc.text(`Discount:`, 140, finalY + 29);
    doc.text(`Tax:`, 140, finalY + 36);
    doc.text(`Shipping:`, 140, finalY + 43);

    doc.setTextColor(0, 0, 0);
    doc.text(`INR ${order.total - order.tax + order.discount - (order.shippingCharge || 0)}`, 195, finalY + 22, { align: 'right' });
    doc.text(`- INR ${order.discount}`, 195, finalY + 29, { align: 'right' });
    doc.text(`INR ${order.tax}`, 195, finalY + 36, { align: 'right' });
    doc.text(order.shippingCharge === 0 ? 'FREE' : `INR ${order.shippingCharge}`, 195, finalY + 43, { align: 'right' });

    doc.setFillColor( primaryColor[0], primaryColor[1], primaryColor[2] );
    doc.rect(135, finalY + 48, 65, 12, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`GRAND TOTAL: INR ${order.total}`, 167.5, finalY + 56, { align: 'center' });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for choosing the elite collection at ' + brandName, 105, 280, { align: 'center' });
    doc.text('This is an electronically generated authenticity certificate.', 105, 285, { align: 'center' });

    doc.save(`Invoice-${order.id}.pdf`);
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
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Home
          </button>
          <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">Account Dashboard</span>
          <h1 className="text-3xl font-sans tracking-tight text-white font-light mt-1">
            Welcome Back, <span className="italic font-serif text-amber-100">{profile.displayName || profile.email.split('@')[0]}</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onGoToMyOrders}
            className="px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 text-xs font-mono tracking-widest uppercase transition-colors"
          >
            My Orders
          </button>
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
                <div className="grid grid-cols-4 gap-2">
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
                    placeholder="District"
                    required
                    value={newAddress.district || ''}
                    onChange={(e) => setNewAddress({ ...newAddress, district: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                  <div className="space-y-1">
                    <input
                      type="text"
                      placeholder="Pincode"
                      required
                      value={newAddress.postalCode}
                      onChange={(e) => handlePincodeChange(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    {pincodeError && <p className="text-[9px] text-red-500">{pincodeError}</p>}
                  </div>
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
                    {editingAddressIndex !== null ? 'Update Address' : 'Register Address'}
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
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditAddress(idx)}
                        className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono uppercase cursor-pointer hover:underline"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteAddress(idx)}
                        className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono uppercase cursor-pointer hover:underline"
                      >
                        Delete
                      </button>
                    </div>
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
                          {/* Cancel / Return Actions */}
                          {['pending', 'confirmed', 'packed', 'shipped'].includes(order.deliveryStatus) && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-3 py-2 sm:py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono text-[9px] sm:text-[10px] tracking-wider uppercase transition-all cursor-pointer text-center"
                            >
                              Cancel
                            </button>
                          )}
                          {order.deliveryStatus === 'delivered' && (Date.now() - new Date(order.createdAt).getTime() <= 3 * 24 * 60 * 60 * 1000) && (
                            <button
                              onClick={() => handleReturnOrder(order.id)}
                              className="px-3 py-2 sm:py-1.5 rounded-xl border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-mono text-[9px] sm:text-[10px] tracking-wider uppercase transition-all cursor-pointer text-center"
                            >
                              Return
                            </button>
                          )}
                          {['cancel_requested', 'return_requested'].includes(order.deliveryStatus) && (
                            <span className="px-3 py-2 sm:py-1.5 rounded-xl border border-gray-500/30 text-gray-400 font-mono text-[9px] sm:text-[10px] tracking-wider uppercase text-center">
                              {order.deliveryStatus.replace('_', ' ')}
                            </span>
                          )}

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
                              {item.status && item.status !== 'active' && (
                                <span className="inline-block mt-1 px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-500 text-[8px] uppercase tracking-widest bg-amber-500/10">
                                  {item.status.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <div className="text-right font-mono text-gray-500 sm:text-gray-400 flex flex-col items-end gap-1">
                              <span>Qty: {item.quantity} • ₹{(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}</span>
                              {(!item.status || item.status === 'active') && (
                                <div className="flex gap-2 mt-1">
                                  {['pending', 'confirmed', 'packed', 'shipped'].includes(order.deliveryStatus) && (
                                    <button 
                                      onClick={() => handleCancelItem(order.id, item.id)}
                                      className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                                    >
                                      Cancel Item
                                    </button>
                                  )}
                                  {order.deliveryStatus === 'delivered' && (Date.now() - new Date(order.createdAt).getTime() <= 3 * 24 * 60 * 60 * 1000) && (
                                    <button 
                                      onClick={() => handleReturnItem(order.id, item.id)}
                                      className="text-[9px] uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors"
                                    >
                                      Return Item
                                    </button>
                                  )}
                                </div>
                              )}
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
