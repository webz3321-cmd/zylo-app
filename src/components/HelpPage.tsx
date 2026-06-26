import React from 'react';
import { Phone, MessageSquare, Instagram, X } from 'lucide-react';
import { SiteSettings } from '../types';

export default function HelpPage({ siteSettings, onClose }: { siteSettings: SiteSettings | null, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#F8F5EF] text-[#1F1F1F] overflow-y-auto font-sans">
      <div className="max-w-3xl mx-auto p-8 sm:p-12">
        <button onClick={onClose} className="mb-8 p-2 hover:bg-[#E8E1D6] rounded-full cursor-pointer transition-colors shadow-sm bg-white">
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-4xl font-sans font-bold tracking-tight mb-8 uppercase">Customer Support</h1>
        
        <div className="bg-white border border-[#E8E1D6] rounded-2xl p-8 space-y-6 shadow-sm">
          <h2 className="text-xl font-sans font-bold uppercase tracking-tight">How can we help?</h2>
          <p className="text-[#666666] font-medium leading-relaxed">Our support team is available to assist you with any questions or concerns you might have about your orders or products.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <a href={`tel:${siteSettings?.supportPhone}`} className="flex items-center gap-4 p-5 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl hover:border-[#C9A227]/40 transition-all group shadow-sm">
              <div className="p-2.5 rounded-lg bg-white border border-[#E8E1D6] text-[#C9A227] group-hover:bg-[#C9A227] group-hover:text-white transition-all">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-[#666666] font-mono uppercase font-black tracking-widest">Call Support</div>
                <div className="font-bold text-[#1F1F1F]">{siteSettings?.supportPhone || 'Not available'}</div>
              </div>
            </a>
            <a href={`https://wa.me/${siteSettings?.supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl hover:border-[#C9A227]/40 transition-all group shadow-sm">
              <div className="p-2.5 rounded-lg bg-white border border-[#E8E1D6] text-[#C9A227] group-hover:bg-[#C9A227] group-hover:text-white transition-all">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-[#666666] font-mono uppercase font-black tracking-widest">WhatsApp</div>
                <div className="font-bold text-[#1F1F1F]">{siteSettings?.supportWhatsApp || 'Not available'}</div>
              </div>
            </a>
            <a href={`https://instagram.com/${siteSettings?.supportInstagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl hover:border-[#C9A227]/40 transition-all group shadow-sm">
              <div className="p-2.5 rounded-lg bg-white border border-[#E8E1D6] text-[#C9A227] group-hover:bg-[#C9A227] group-hover:text-white transition-all">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] text-[#666666] font-mono uppercase font-black tracking-widest">Instagram</div>
                <div className="font-bold text-[#1F1F1F]">@{siteSettings?.supportInstagram || 'Not available'}</div>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-sans font-bold uppercase tracking-tight">Live Chat</h3>
          <div className="bg-white border border-[#E8E1D6] rounded-xl h-64 flex items-center justify-center text-[#666666] font-mono text-xs font-bold uppercase tracking-widest shadow-inner">
            Chat feature coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
