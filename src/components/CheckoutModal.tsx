import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Shield, AlertCircle, ShoppingBag } from 'lucide-react';
import { CartItem, Address, Order, Coupon } from '../types';
import { EcommerceService } from '../lib/ecommerceService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  currentUser: any;
  onOrderSuccess: (orderId: string) => void;
}

export default function CheckoutModal({ isOpen, onClose, cartItems, currentUser, onOrderSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Shipping, 2: Payment, 3: Success
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');

  // Form Fields
  const [address, setAddress] = useState<Address>({
    fullName: currentUser?.displayName || '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States'
  });

  // Card payment mock
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay'>('stripe');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg('');
      loadCoupons();
      if (currentUser?.displayName) {
        setAddress(prev => ({ ...prev, fullName: currentUser.displayName }));
      }
    }
  }, [isOpen, currentUser]);

  const loadCoupons = async () => {
    const list = await EcommerceService.getCoupons();
    setCoupons(list);
  };

  if (!isOpen) return null;

  // Pricing calculations
  const subtotal = cartItems.reduce((sum, item) => {
    const basePrice = item.product.price;
    const additional = item.selectedVariant?.additionalPrice || 0;
    return sum + (basePrice + additional) * item.quantity;
  }, 0);

  // Apply discount
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }
  }

  const tax = parseFloat(((subtotal - discount) * 0.12).toFixed(2)); // 12% luxury tax
  const shippingCharge = subtotal > 1000 ? 0 : 50; // Free white-glove shipping above $1000
  const grandTotal = parseFloat((subtotal - discount + tax + shippingCharge).toFixed(2));

  const handleApplyCoupon = () => {
    setCouponError('');
    const matching = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase());
    if (!matching) {
      setCouponError('Invalid coupon credentials.');
      return;
    }
    if (!matching.isActive) {
      setCouponError('This coupon is currently inactive.');
      return;
    }
    if (matching.minSpend && subtotal < matching.minSpend) {
      setCouponError(`Minimum reservation of $${matching.minSpend} required.`);
      return;
    }
    setAppliedCoupon(matching);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const validateShippingForm = () => {
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.postalCode) {
      setErrorMsg('Please complete all premium address details.');
      return false;
    }
    setErrorMsg('');
    return true;
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShippingForm()) {
      setStep(2);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) {
      setErrorMsg('Please enter your card authorization codes.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    // Simulate luxury transaction latency
    setTimeout(async () => {
      try {
        const orderId = `order-${Math.floor(100000 + Math.random() * 900000)}`;
        const trackingNum = `ZYL-${Math.floor(100000 + Math.random() * 900000)}`;
        
        const newOrder: Order = {
          id: orderId,
          userId: currentUser?.uid || 'guest-user',
          userName: address.fullName,
          userEmail: currentUser?.email || 'guest@zylo.com',
          items: cartItems,
          shippingAddress: address,
          billingAddress: address,
          couponCode: appliedCoupon?.code,
          discount,
          tax,
          shippingCharge,
          total: grandTotal,
          paymentMethod,
          paymentId: `pay-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentStatus: 'paid',
          deliveryStatus: 'pending',
          trackingNumber: trackingNum,
          createdAt: new Date().toISOString()
        };

        await EcommerceService.createOrder(newOrder);
        setCompletedOrder(newOrder);
        setStep(3);
        onOrderSuccess(orderId);
      } catch (e: any) {
        setErrorMsg('Authorization failed. Please contact your premium private banker.');
      } finally {
        setIsProcessing(false);
      }
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="checkout-modal-wrapper"
        className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-12 h-full md:h-auto max-h-[95vh] md:max-h-none"
      >
        {/* MOBILE ONLY: STICKY SUMMARY TRIGGER */}
        <div className="md:hidden bg-black/40 border-b border-white/5 p-3 sm:p-4 flex justify-between items-center shrink-0">
          <button 
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="flex items-center gap-2 text-[10px] font-mono text-amber-500 uppercase tracking-widest cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            {showMobileSummary ? 'Hide Details' : `Show Details (₹${grandTotal})`}
          </button>
          <button type="button" onClick={onClose} className="text-gray-500 cursor-pointer"><X className="w-4 h-4" /></button>
        </div>

        {/* MOBILE SUMMARY (Collapsible) */}
        {showMobileSummary && (
          <div className="md:hidden bg-black p-6 space-y-4 border-b border-white/10 animate-in slide-in-from-top duration-300 shrink-0">
            <div className="space-y-4 max-h-[150px] overflow-y-auto custom-scrollbar">
              {cartItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-center text-[11px]">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 shrink-0 bg-black">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-white truncate font-medium">{item.product.name}</h5>
                    <p className="text-gray-500 font-mono text-[9px]">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-white font-mono text-right shrink-0">${(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/5 space-y-1 font-mono text-[10px]">
              <div className="flex justify-between text-gray-400"><span>Subtotal:</span><span>${subtotal}</span></div>
              <div className="flex justify-between text-white font-bold pt-1 text-sm"><span>Total:</span><span className="text-amber-500">${grandTotal}</span></div>
            </div>
          </div>
        )}

        {/* Main interactive area */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 md:flex-none md:max-h-[700px] border-b md:border-b-0 md:border-r border-white/5 custom-scrollbar">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-amber-500 uppercase block">Private Checkout</span>
              <h3 className="text-xl font-sans text-white font-medium tracking-wide">
                {step === 1 && 'Shipping Details'}
                {step === 2 && 'Secure Payment'}
                {step === 3 && 'Order Confirmed'}
              </h3>
            </div>
            {step !== 3 && (
              <button 
                onClick={onClose}
                className="hidden md:flex p-1 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-amber-500/20 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="border border-red-500/20 bg-red-950/20 rounded-xl p-3.5 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: SHIPPING ADDRESS */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sterling Belmont"
                  value={address.fullName}
                  onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Mobile Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 019-900"
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Country</label>
                  <select
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none"
                  >
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="France">France</option>
                    <option value="Monaco">Monaco</option>
                    <option value="Switzerland">Switzerland</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Shipping Address Line 1</label>
                <input
                  type="text"
                  required
                  placeholder="Street name, luxury penthouse suite..."
                  value={address.addressLine1}
                  onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Suite / Apartment (Optional)</label>
                <input
                  type="text"
                  placeholder="Floor 4B, private dock access..."
                  value={address.addressLine2}
                  onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">City</label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">State/Region</label>
                  <input
                    type="text"
                    required
                    placeholder="NY"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Postal Code</label>
                  <input
                    type="text"
                    required
                    placeholder="10001"
                    value={address.postalCode}
                    onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.2)] mt-4"
              >
                Proceed to Secure Payment
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT GATEWAY */}
          {step === 2 && (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              {/* Payment choice */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'stripe' 
                      ? 'border-amber-500/50 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/25'
                  }`}
                >
                  <span className="text-xs font-mono tracking-widest uppercase block mb-1">Stripe Gateway</span>
                  <span className="text-[10px] text-gray-500">Global Luxury Clearing</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'razorpay' 
                      ? 'border-amber-500/50 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.1)]' 
                      : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/25'
                  }`}
                >
                  <span className="text-xs font-mono tracking-widest uppercase block mb-1">Razorpay Cleared</span>
                  <span className="text-[10px] text-gray-500">Premium Asian Routing</span>
                </button>
              </div>

              {/* Card Inputs */}
              <div className="border border-white/5 bg-black/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-mono text-white uppercase tracking-wider">Debit / Credit Card</span>
                  </div>
                  <div className="flex gap-1.5 text-gray-600 text-xs font-mono select-none">
                    <span className="border border-white/15 rounded px-1.5">VISA</span>
                    <span className="border border-white/15 rounded px-1.5">AMEX</span>
                    <span className="border border-white/15 rounded px-1.5">MC</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Card Number</label>
                  <input
                    type="text"
                    required
                    maxLength={19}
                    placeholder="4111 2222 3333 4444"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Expiry Date</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Security CVV</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      placeholder="***"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Security Shield badge */}
              <div className="flex gap-3 items-start text-xs text-gray-400 leading-relaxed font-sans font-light">
                <Shield className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Your transaction is protected by secure AES-256 encryption. We never store your card details.
                </span>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-4 border border-white/10 text-white text-xs font-mono tracking-widest uppercase rounded-xl hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Address
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer disabled:opacity-55 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Authorizing Cleared Funds...</span>
                    </>
                  ) : (
                    <span>Authorize ₹{grandTotal} Payment</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 3 && completedOrder && (
            <div className="text-center py-8 space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)] animate-bounce">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-sans font-light text-white">Order Confirmed</h4>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  An order confirmation has been sent to your email. Your items will be shipped soon.
                </p>
              </div>

              {/* Order Invoice info */}
              <div className="border border-white/5 bg-white/5 rounded-2xl p-5 text-left space-y-3 font-mono text-[11px] text-gray-300">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Order ID:</span>
                  <span className="text-white font-bold">{completedOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Tracking Number:</span>
                  <span className="text-amber-400 font-bold">{completedOrder.trackingNumber}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span>Delivery Address:</span>
                  <span className="text-white text-right max-w-[200px] truncate">{completedOrder.shippingAddress.addressLine1}, {completedOrder.shippingAddress.city}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Settled:</span>
                  <span className="text-emerald-400 font-bold">₹{completedOrder.total}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-white hover:bg-gray-100 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer"
              >
                Close & Return To Store
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR: RESERVATION SUMMARY (Desktop Only) */}
        <div className="hidden md:block col-span-1 md:col-span-5 bg-black/80 p-6 sm:p-8 space-y-6">
          <h4 className="text-sm font-mono text-amber-500 tracking-widest uppercase border-b border-white/5 pb-3">
            Order Summary ({cartItems.length})
          </h4>

          {/* Cart Item Row */}
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {cartItems.map((item, index) => {
              const base = item.product.price;
              const add = item.selectedVariant?.additionalPrice || 0;
              const price = base + add;

              return (
                <div key={index} className="flex gap-4 items-start text-xs">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h5 className="text-white font-sans font-medium truncate tracking-wide">{item.product.name}</h5>
                    {item.selectedVariant && (
                      <p className="text-[10px] text-gray-400 font-mono">
                        {item.selectedVariant.name}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-500 font-mono">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono text-white text-right shrink-0">₹{price * item.quantity}</span>
                </div>
              );
            })}
          </div>

          {/* Coupons section */}
          {step === 1 && (
            <div className="border-t border-b border-white/5 py-4 space-y-2.5">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Promo Credentials</span>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between border border-amber-500/30 bg-amber-500/5 rounded-xl p-2 text-xs text-amber-400">
                  <span className="font-mono font-bold">{appliedCoupon.code} Applied</span>
                  <button 
                    type="button" 
                    onClick={handleRemoveCoupon}
                    className="text-[10px] uppercase font-mono text-red-400 underline p-1 hover:text-red-300 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="LUXURY10, ROYALTY..."
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500/50 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3 py-1.5 bg-white text-black font-mono text-xs uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer font-bold"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <span className="text-[10px] text-red-400 block font-sans">{couponError}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pricing list */}
          <div className="space-y-2.5 border-t border-white/5 pt-4 text-xs font-mono text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white">₹{subtotal}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Discount:</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Tax (12%):</span>
              <span className="text-white">₹{tax}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping:</span>
              <span className="text-white">{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
            </div>

            <div className="flex justify-between border-t border-white/10 pt-3 text-sm text-white font-bold font-sans">
              <span>Grand Total:</span>
              <span className="text-amber-500 font-mono">₹{grandTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
