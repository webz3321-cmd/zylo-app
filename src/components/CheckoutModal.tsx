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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1F1F]/40 backdrop-blur-md overflow-y-auto font-sans">
      <div 
        id="checkout-modal-wrapper"
        className="w-full max-w-4xl bg-white border border-[#E8E1D6] rounded-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.15)] grid grid-cols-1 md:grid-cols-12 h-full md:h-auto max-h-[95vh] md:max-h-none"
      >
        {/* MOBILE ONLY: STICKY SUMMARY TRIGGER */}
        <div className="sticky top-0 z-50 md:hidden bg-white/95 backdrop-blur-sm border-b border-[#E8E1D6] p-3 sm:p-4 flex justify-between items-center shrink-0">
          <button 
            type="button"
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="flex items-center gap-2 text-[10px] font-mono text-[#C9A227] uppercase tracking-widest cursor-pointer border border-[#C9A227]/30 px-3 py-1.5 rounded-lg bg-[#C9A227]/5 hover:bg-[#C9A227]/10 transition-colors font-bold"
          >
            <ShoppingBag className="w-3 h-3" />
            {showMobileSummary ? 'Hide Details' : `Show Details (₹${grandTotal})`}
          </button>
          <button 
            type="button" 
            onClick={onReturnHome || onClose} 
            className="text-[#666666] cursor-pointer p-1.5 hover:bg-[#F8F5EF] rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MOBILE SUMMARY (Collapsible) */}
        {showMobileSummary && (
          <div className="md:hidden bg-[#F8F5EF] p-6 space-y-4 border-b border-[#E8E1D6] animate-in slide-in-from-top duration-300 shrink-0">
            <div className="space-y-4 max-h-[150px] overflow-y-auto custom-scrollbar">
              {cartItems.map((item, index) => (
                <div key={index} className="flex gap-4 items-center text-[11px]">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#E8E1D6] shrink-0 bg-white shadow-sm">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-[#1F1F1F] truncate font-bold uppercase tracking-tight">{item.product.name}</h5>
                    {item.selectedVariant && (
                      <p className="text-[#666666] truncate text-[9px] font-medium italic">{item.selectedVariant.name}</p>
                    )}
                    <p className="text-[#666666] font-mono text-[9px] font-bold">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-[#1F1F1F] font-mono text-right shrink-0 font-bold">₹{(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}</span>
                </div>
              ))}
            </div>
            
            {/* Added Pricing Summary here too */}
            <div className="space-y-2.5 border-t border-[#E8E1D6] pt-4 text-xs font-mono text-[#666666]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="text-[#1F1F1F] font-bold">₹{subtotal}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-[#C9A227] font-bold">
                  <span>Discount:</span>
                  <span>-₹{discount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Tax (12%):</span>
                <span className="text-[#1F1F1F] font-bold">₹{tax}</span>
              </div>

              <div className="flex justify-between">
                <span>Shipping:</span>
                <span className="text-[#1F1F1F] font-bold">{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
              </div>

              <div className="flex justify-between border-t border-[#E8E1D6] pt-3 text-sm text-[#1F1F1F] font-bold font-sans">
                <span>Grand Total:</span>
                <span className="text-[#C9A227] font-mono font-black">₹{grandTotal}</span>
              </div>
            </div>
          </div>
        )}

        {/* Main interactive area */}
        <div className="col-span-1 md:col-span-7 p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 md:flex-none md:max-h-[700px] border-b md:border-b-0 md:border-r border-[#E8E1D6] custom-scrollbar">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-bold">Private Checkout</span>
              <h3 className="text-xl font-sans text-[#1F1F1F] font-bold tracking-tight uppercase">
                {step === 1 && 'Shipping Details'}
                {step === 2 && 'Secure Payment'}
                {step === 3 && 'Order Confirmed'}
              </h3>
            </div>
            {step !== 3 && (
              <button 
                onClick={onClose}
                className="hidden md:flex p-1.5 rounded-full bg-[#F8F5EF] border border-[#E8E1D6] text-[#666666] hover:text-[#1F1F1F] hover:border-[#C9A227]/20 cursor-pointer shadow-sm transition-all"
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
                        className={`border p-4 rounded-xl cursor-pointer relative group transition-all shadow-sm ${selectedAddressIndex === idx ? 'border-[#C9A227] bg-[#C9A227]/5' : 'border-[#E8E1D6] bg-[#F8F5EF]'}`}
                        onClick={() => handleAddressSelect(idx)}
                      >
                        <div className="flex gap-2 justify-end absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(e) => { e.stopPropagation(); handleEditAddress(idx); }} className="text-[10px] text-[#C9A227] hover:underline font-bold">Edit</button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(idx); }} className="text-[10px] text-red-500 hover:underline font-bold">Delete</button>
                        </div>
                        <p className="text-sm font-bold text-[#1F1F1F] uppercase tracking-tight">{addr.fullName}</p>
                        <p className="text-xs text-[#666666] font-medium">{addr.addressLine1}, {addr.addressLine2 ? addr.addressLine2 + ', ' : ''}{addr.city}, {addr.district}, {addr.state} - {addr.postalCode}</p>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={handleAddNewAddress}
                    className="w-full py-3 border border-dashed border-[#E8E1D6] rounded-xl text-xs text-[#666666] hover:border-[#C9A227] hover:text-[#C9A227] transition-all cursor-pointer font-bold uppercase tracking-widest"
                  >
                    + Add New Address
                  </button>

                  {selectedAddressIndex !== null && (
                    <button
                      onClick={() => setStep(2)}
                      className="w-full py-4.5 bg-[#C9A227] hover:bg-[#B68D1F] text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer shadow-md shadow-[#C9A227]/20"
                    >
                      Proceed to Secure Payment
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setIsEditingAddress(false); }} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">Full Name</label>
                    <input type="text" required placeholder="Full Name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-medium" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">Mobile Phone</label>
                      <input type="tel" required placeholder="+91 00000 00000" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">Country</label>
                      <select value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] focus:outline-none focus:border-[#C9A227]/50 appearance-none font-bold uppercase tracking-wider">
                        <option value="India">India</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">Shipping Address Line 1</label>
                    <input type="text" required placeholder="Street name, luxury penthouse suite..." value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-medium" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">Suite / Apartment (Optional)</label>
                    <input type="text" placeholder="Floor 4B, private dock access..." value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-medium" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">City</label>
                      <input type="text" required placeholder="New York" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">District</label>
                      <input type="text" required placeholder="District" value={address.district || ''} onChange={(e) => setAddress({ ...address, district: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">State</label>
                      <input type="text" required placeholder="NY" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-[#666666] tracking-wider block uppercase font-bold">Pincode</label>
                      <input type="text" required placeholder="100011" value={address.postalCode} onChange={(e) => handlePincodeChange(e.target.value)} className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#1F1F1F] placeholder-gray-400 focus:outline-none focus:border-[#C9A227]/50 font-mono font-bold" />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setIsEditingAddress(false)} className="flex-1 py-3 border border-[#E8E1D6] text-[#1F1F1F] text-xs uppercase rounded-xl font-bold tracking-widest cursor-pointer hover:bg-[#F8F5EF] transition-all">Cancel</button>
                    <button type="submit" className="flex-1 py-3 bg-[#C9A227] text-white text-xs uppercase rounded-xl font-bold tracking-widest cursor-pointer hover:bg-[#B68D1F] transition-all shadow-sm">Save Address</button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* STEP 2: PAYMENT METHOD (COD ONLY) */}
          {step === 2 && (
            <form onSubmit={handlePaymentSubmit} className="space-y-6">
              <div className="border border-[#C9A227]/30 bg-[#C9A227]/5 rounded-2xl p-8 text-center space-y-4 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-[#C9A227]/10 border border-[#C9A227]/20 text-[#C9A227] flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-sans text-[#1F1F1F] uppercase tracking-widest font-bold">Cash On Delivery</h4>
                  <p className="text-xs text-[#666666] max-w-xs mx-auto leading-relaxed font-medium">
                    You will pay for your order in cash at the time of delivery to your provided address.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-8 py-4 border border-[#E8E1D6] text-[#1F1F1F] text-xs font-mono tracking-widest uppercase rounded-xl hover:border-[#C9A227]/40 hover:bg-[#F8F5EF] transition-all cursor-pointer font-bold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-4 bg-[#C9A227] hover:bg-[#B68D1F] text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer disabled:opacity-55 flex items-center justify-center gap-2 shadow-md shadow-[#C9A227]/20"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm animate-bounce">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h4 className="text-2xl font-sans font-bold text-[#1F1F1F] uppercase tracking-tight">Order Confirmed</h4>
                <p className="text-sm text-[#C9A227] font-mono tracking-widest uppercase font-black">
                  Your order is safely proceed to home
                </p>
                <p className="text-xs text-[#666666] max-w-md mx-auto font-medium">
                  An order confirmation has been sent to your email. Our delivery team will contact you soon.
                </p>
              </div>

              {/* Order Invoice info */}
              <div className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-2xl p-5 text-left space-y-3 font-mono text-[11px] text-[#666666] shadow-sm">
                <div className="flex justify-between border-b border-[#E8E1D6] pb-2">
                  <span className="font-bold">Order ID:</span>
                  <span className="text-[#1F1F1F] font-black">{completedOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8E1D6] pb-2">
                  <span className="font-bold">Tracking Number:</span>
                  <span className="text-[#C9A227] font-black">{completedOrder.trackingNumber}</span>
                </div>
                <div className="flex justify-between border-b border-[#E8E1D6] pb-2">
                  <span className="font-bold">Delivery Address:</span>
                  <span className="text-[#1F1F1F] text-right max-w-[200px] font-bold">{completedOrder.shippingAddress.addressLine1}, {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} - {completedOrder.shippingAddress.postalCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold">Payment Settled:</span>
                  <span className="text-emerald-600 font-black">₹{completedOrder.total}</span>
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
                className="w-full py-4 bg-[#1F1F1F] hover:bg-black text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer shadow-lg"
              >
                Return To Home
              </button>
            </div>
          )}
        </div>

        {/* SIDEBAR: RESERVATION SUMMARY (Desktop Only) */}
        <div className="hidden md:block col-span-1 md:col-span-5 bg-[#F8F5EF] p-6 sm:p-8 space-y-6">
          <h4 className="text-sm font-mono text-[#C9A227] tracking-widest uppercase border-b border-[#E8E1D6] pb-3 font-bold">
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
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E8E1D6] shrink-0 bg-white shadow-sm">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h5 className="text-[#1F1F1F] font-sans font-bold truncate tracking-tight uppercase">{item.product.name}</h5>
                    {item.selectedVariant && (
                      <p className="text-[10px] text-[#666666] font-mono font-medium italic">
                        {item.selectedVariant.name}
                      </p>
                    )}
                    <p className="text-[10px] text-[#666666] font-mono font-bold">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-mono text-[#1F1F1F] text-right shrink-0 font-bold">₹{price * item.quantity}</span>
                </div>
              );
            })}
          </div>

          {/* Coupons section */}
          {step === 1 && (
            <div className="border-t border-b border-[#E8E1D6] py-4 space-y-2.5">
              <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider block font-bold">Promo Credentials</span>
              
              {appliedCoupon ? (
                <div className="flex items-center justify-between border border-[#C9A227]/30 bg-[#C9A227]/5 rounded-xl p-2 text-xs text-[#C9A227]">
                  <span className="font-mono font-bold">{appliedCoupon.code} Applied</span>
                  <button 
                    type="button" 
                    onClick={handleRemoveCoupon}
                    className="text-[10px] uppercase font-mono text-red-500 underline p-1 hover:text-red-600 cursor-pointer font-bold"
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
                      className="flex-1 bg-white border border-[#E8E1D6] rounded-lg px-3 py-1.5 text-xs text-[#1F1F1F] focus:outline-none focus:border-[#C9A227]/50 uppercase font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-3 py-1.5 bg-[#1F1F1F] text-white font-mono text-xs uppercase rounded-lg hover:bg-black transition-colors cursor-pointer font-bold"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && (
                    <span className="text-[10px] text-red-500 block font-sans font-bold">{couponError}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Pricing list */}
          <div className="space-y-2.5 border-t border-[#E8E1D6] pt-4 text-xs font-mono text-[#666666]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-[#1F1F1F] font-bold">₹{subtotal}</span>
            </div>
            
            {discount > 0 && (
              <div className="flex justify-between text-[#C9A227] font-bold">
                <span>Discount:</span>
                <span>-₹{discount}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Tax (12%):</span>
              <span className="text-[#1F1F1F] font-bold">₹{tax}</span>
            </div>

            <div className="flex justify-between">
              <span>Shipping:</span>
              <span className="text-[#1F1F1F] font-bold">{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
            </div>

            <div className="flex justify-between border-t border-[#E8E1D6] pt-3 text-sm text-[#1F1F1F] font-bold font-sans">
              <span>Grand Total:</span>
              <span className="text-[#C9A227] font-mono font-black">₹{grandTotal}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
