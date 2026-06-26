import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard, Shield, AlertCircle, ShoppingBag } from 'lucide-react';
import { CartItem, Address, Order, Coupon } from '../types';
import { EcommerceService } from '../lib/ecommerceService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnHome?: () => void;
  cartItems: CartItem[];
  currentUser: any;
  onOrderSuccess: (orderId: string) => void;
}

export default function CheckoutModal({ isOpen, onClose, onReturnHome, cartItems, currentUser, onOrderSuccess }: CheckoutModalProps) {
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
    country: 'India'
  });

  // Card payment mock (Not used in COD)
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'razorpay' | 'cod'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  
  // Address selection
  const [savedAddresses, setSavedAddresses] = useState<Address[]>(currentUser?.addresses || []);
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number | null>(savedAddresses.length > 0 ? 0 : null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg('');
      loadCoupons();
      
      // Auto-fill address if available
      if (currentUser?.addresses && currentUser.addresses.length > 0) {
        setSavedAddresses(currentUser.addresses);
        setAddress(currentUser.addresses[0]);
        setSelectedAddressIndex(0);
      } else if (currentUser?.displayName) {
        setAddress(prev => ({ ...prev, fullName: currentUser.displayName }));
      }
    }
  }, [isOpen, currentUser]);

  const handleEditAddress = (index: number) => {
    setAddress(savedAddresses[index]);
    setSelectedAddressIndex(index);
    setIsEditingAddress(true);
  };

  const handleDeleteAddress = async (index: number) => {
    const updated = savedAddresses.filter((_, i) => i !== index);
    await EcommerceService.saveUserAddresses(currentUser.uid, updated);
    setSavedAddresses(updated);
    if (selectedAddressIndex === index) {
      setSelectedAddressIndex(updated.length > 0 ? 0 : null);
      if (updated.length > 0) setAddress(updated[0]);
    }
  };

  const handleAddressSelect = (index: number) => {
    setSelectedAddressIndex(index);
    setAddress(savedAddresses[index]);
    setIsEditingAddress(false);
  };

  const handleAddNewAddress = () => {
    setAddress({
      fullName: currentUser?.displayName || '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      district: '',
      state: '',
      postalCode: '',
      country: 'India'
    });
    setSelectedAddressIndex(null);
    setIsEditingAddress(true);
  };

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

  const handlePincodeChange = async (pincode: string) => {
    setAddress(prev => ({ ...prev, postalCode: pincode }));
    if (pincode.length === 6) {
      const details = await EcommerceService.getAddressDetailsByPincode(pincode);
      if (details) {
        setAddress(prev => ({ 
          ...prev, 
          city: details.Name,
          district: details.District,
          state: details.State 
        }));
      }
    }
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
    
    setIsProcessing(true);
    setErrorMsg('');

    // Simulate order placement latency
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
          couponCode: appliedCoupon?.code || null,
          discount,
          tax,
          shippingCharge,
          total: grandTotal,
          paymentMethod: 'cod',
          paymentId: `cod-${Math.floor(100000 + Math.random() * 900000)}`,
          paymentStatus: 'cod_pending',
          deliveryStatus: 'pending',
          trackingNumber: trackingNum,
          createdAt: new Date().toISOString()
        };

        await EcommerceService.createOrder(newOrder);

        // Save address to user if logged in
        if (currentUser && currentUser.uid !== 'guest-user') {
          const currentAddresses = currentUser.addresses || [];
          const exists = currentAddresses.some(a => 
            a.addressLine1 === address.addressLine1 && a.postalCode === address.postalCode
          );
          if (!exists) {
            const updatedAddresses = [address, ...currentAddresses].slice(0, 5);
            await EcommerceService.saveUserAddresses(currentUser.uid, updatedAddresses);
          }
        }

        setCompletedOrder(newOrder);
        setStep(3);
        onOrderSuccess(orderId);
      } catch (e: any) {
        console.error("Order process error:", e);
        setErrorMsg(`Failed to process order: ${e.message || 'Please try again.'}`);
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div 
        id="checkout-modal-wrapper"
        className="w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] grid grid-cols-1 md:grid-cols-12 h-full md:h-auto max-h-[95vh] md:max-h-none"
      >
        {/* MOBILE ONLY: STICKY SUMMARY TRIGGER */}
        <div className="sticky top-0 z-50 md:hidden bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-white/10 p-3 sm:p-4 flex justify-between items-center shrink-0">
          <button 
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="flex items-center gap-2 text-[10px] font-mono text-amber-500 uppercase tracking-widest cursor-pointer border border-amber-500/30 px-3 py-1.5 rounded-lg bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
          >
            <ShoppingBag className="w-3 h-3" />
            {showMobileSummary ? 'Hide Details' : `Show Details (₹${grandTotal})`}
          </button>
          <button 
            type="button" 
            onClick={onReturnHome || onClose} 
            className="text-gray-500 cursor-pointer p-1.5 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
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
                    {item.selectedVariant && (
                      <p className="text-gray-500 truncate text-[9px]">{item.selectedVariant.name}</p>
                    )}
                    <p className="text-gray-500 font-mono text-[9px]">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-white font-mono text-right shrink-0">₹{(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}</span>
                </div>
              ))}
            </div>
            
            {/* Added Pricing Summary here too */}
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
            <div className="space-y-6">
              {!isEditingAddress ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    {savedAddresses.map((addr, idx) => (
                      <div 
                        key={idx} 
                        className={`border p-4 rounded-xl cursor-pointer relative group ${selectedAddressIndex === idx ? 'border-amber-500 bg-amber-500/10' : 'border-white/5 bg-black/30'}`}
                        onClick={() => handleAddressSelect(idx)}
                      >
                        <div className="flex gap-2 justify-end absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleEditAddress(idx); }} className="text-[10px] text-amber-400 hover:underline">Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(idx); }} className="text-[10px] text-red-400 hover:underline">Delete</button>
                        </div>
                        <p className="text-sm font-medium text-white">{addr.fullName}</p>
                        <p className="text-xs text-gray-400">{addr.addressLine1}, {addr.addressLine2 ? addr.addressLine2 + ', ' : ''}{addr.city}, {addr.district}, {addr.state} - {addr.postalCode}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleAddNewAddress}
                    className="w-full py-3 border border-dashed border-white/20 rounded-xl text-xs text-gray-400 hover:border-amber-500 hover:text-amber-500 transition-all cursor-pointer"
                  >
                    + Add New Address
                  </button>

                  {selectedAddressIndex !== null && (
                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-4.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                    >
                      Proceed to Secure Payment
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setIsEditingAddress(false); }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Full Name</label>
                    <input type="text" required placeholder="Full Name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Mobile Phone</label>
                      <input type="tel" required placeholder="+1 (555) 019-900" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Country</label>
                      <select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50 appearance-none">
                        <option value="India">India</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Shipping Address Line 1</label>
                    <input type="text" required placeholder="Street name, luxury penthouse suite..." value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Suite / Apartment (Optional)</label>
                    <input type="text" placeholder="Floor 4B, private dock access..." value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">City</label>
                      <input type="text" required placeholder="New York" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">District</label>
                      <input type="text" required placeholder="District" value={address.district || ''} onChange={(e) => setAddress({ ...address, district: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">State</label>
                      <input type="text" required placeholder="NY" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Pincode</label>
                      <input type="text" required placeholder="10001" value={address.postalCode} onChange={(e) => handlePincodeChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500/50" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsEditingAddress(false)} className="flex-1 py-3 border border-white/10 text-white text-xs uppercase rounded-xl">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-amber-500 text-black text-xs uppercase rounded-xl font-bold">Save Address</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD (COD ONLY) */}
          {step === 2 && (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="border border-amber-500/30 bg-amber-500/5 rounded-2xl p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-sans text-white uppercase tracking-widest font-light">Cash On Delivery</h4>
                  <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                    You will pay for your order in cash at the time of delivery to your provided address.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-4 border border-white/10 text-white text-xs font-mono tracking-widest uppercase rounded-xl hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-black cursor-pointer disabled:opacity-55 flex items-center justify-center gap-2 shadow-[0_10px_40px_rgba(245,158,11,0.3)]"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Confirming Order...</span>
                    </>
                  ) : (
                    <span>Confirm Order (COD)</span>
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
                <p className="text-sm text-amber-500 font-mono tracking-widest uppercase font-black">
                  Your order is safely proceed to home
                </p>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  An order confirmation has been sent to your email. Our delivery team will contact you soon.
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
                  <span className="text-white text-right max-w-[200px]">{completedOrder.shippingAddress.addressLine1}, {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Settled:</span>
                  <span className="text-emerald-400 font-bold">₹{completedOrder.total}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (onReturnHome) {
                    onReturnHome();
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-4 bg-white hover:bg-gray-100 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer"
              >
                Return To Home
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
