import React from 'react';
import { Check, Truck, Package, Hourglass, ShieldCheck, ShoppingBag, Eye, XCircle } from 'lucide-react';

interface OrderTrackingProps {
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  trackingNumber?: string;
  orderDate?: string;
}

const STEPS = [
  { id: 'pending', label: 'Order Placed', icon: Hourglass, desc: 'We have received your reservation request.' },
  { id: 'confirmed', label: 'Confirmed', icon: ShieldCheck, desc: 'Our concierge has verified inventory and processed payment.' },
  { id: 'packed', label: 'Packed & Sealed', icon: Package, desc: 'Item is encapsulated in our dustproof luxury boxes.' },
  { id: 'shipped', label: 'In Transit', icon: Truck, desc: 'Dispatched with express tracking codes.' },
  { id: 'out_for_delivery', label: 'With Courier', icon: ShoppingBag, desc: 'Out for final luxury courier white-glove signature.' },
  { id: 'delivered', label: 'Delivered', icon: Check, desc: 'Safely arrived and signed at destination.' }
];

export default function OrderTracking({ status, trackingNumber, orderDate }: OrderTrackingProps) {
  // Cancelled or returned status layouts
  if (status === 'cancelled') {
    return (
      <div id="tracking-cancelled" className="border border-red-500/10 bg-red-950/10 rounded-xl p-6 text-center space-y-3">
        <XCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h4 className="text-white font-sans font-medium">Reservation Cancelled</h4>
        <p className="text-xs text-gray-400">This reservation has been cancelled and any funds have been fully refunded.</p>
      </div>
    );
  }

  if (status === 'returned') {
    return (
      <div id="tracking-returned" className="border border-amber-500/10 bg-amber-950/10 rounded-xl p-6 text-center space-y-3">
        <RefreshCwIcon className="w-10 h-10 text-amber-500 mx-auto" />
        <h4 className="text-white font-sans font-medium">Consignment Returned</h4>
        <p className="text-xs text-gray-400">The consignment was returned to our headquarters and inspected.</p>
      </div>
    );
  }

  const getStepIndex = (s: string) => {
    return STEPS.findIndex(step => step.id === s);
  };

  const currentIdx = getStepIndex(status);

  return (
    <div id="order-tracking-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 mb-8">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block mb-1">Transit Credentials</span>
          <h4 className="text-sm font-mono text-white">Consignment: <span className="text-amber-100 font-bold">{trackingNumber || 'ZYL-9921-X9'}</span></h4>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block mb-1">Reservation Date</span>
          <p className="text-xs text-gray-300">{orderDate ? new Date(orderDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'June 25, 2026'}</p>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-[21px] top-4 bottom-4 w-[2px] bg-white/5 hidden md:block" />
        {/* Progress Line */}
        <div 
          className="absolute left-[21px] top-4 w-[2px] bg-gradient-to-b from-amber-500 to-amber-300 transition-all duration-1000 hidden md:block" 
          style={{ height: `${(currentIdx / (STEPS.length - 1)) * 88}%` }}
        />

        <div className="grid grid-cols-1 md:grid-cols-1 gap-8 relative z-10">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= currentIdx;
            const isCurrent = idx === currentIdx;

            return (
              <div 
                key={step.id} 
                id={`tracking-step-${step.id}`}
                className="flex items-start gap-4 sm:gap-6 group"
              >
                {/* Node bubble */}
                <div 
                  className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-500 shrink-0 ${
                    isCurrent 
                      ? 'bg-amber-500 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                      : isCompleted 
                        ? 'bg-white/10 border-amber-500/50 text-amber-500' 
                        : 'bg-black/40 border-white/5 text-gray-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text Content */}
                <div className="space-y-1 py-1">
                  <h5 className={`text-sm sm:text-base font-sans font-medium tracking-wide transition-colors duration-300 ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                    {step.label}
                    {isCurrent && (
                      <span className="ml-2 text-[9px] font-mono tracking-widest bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase animate-pulse">
                        Active
                      </span>
                    )}
                  </h5>
                  <p className={`text-xs sm:text-sm font-sans font-light leading-relaxed transition-colors duration-300 ${isCompleted ? 'text-gray-300' : 'text-gray-600'}`}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RefreshCwIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
