import React from 'react';
import { Phone, MessageSquare, Instagram, X } from 'lucide-react';
import { SiteSettings } from '../types';

export default function HelpPage({ siteSettings, onClose }: { siteSettings: SiteSettings | null, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] bg-white text-gray-900 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8 sm:p-12">
        <button onClick={onClose} className="mb-8 p-2 hover:bg-gray-100 rounded-full cursor-pointer">
          <X className="w-6 h-6" />
        </button>

        <h1 className="text-4xl font-sans font-bold tracking-tight mb-8">Customer Support</h1>
        
        <div className="bg-gray-50 rounded-2xl p-8 space-y-6">
          <h2 className="text-xl font-sans font-semibold">How can we help?</h2>
          <p className="text-gray-600">Our support team is available to assist you with any questions or concerns you might have about your orders or products.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <a href={`tel:${siteSettings?.supportPhone}`} className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition-all">
              <Phone className="w-5 h-5 text-gray-700" />
              <div>
                <div className="text-xs text-gray-500 font-mono uppercase">Call Support</div>
                <div className="font-medium">{siteSettings?.supportPhone || 'Not available'}</div>
              </div>
            </a>
            <a href={`https://wa.me/${siteSettings?.supportWhatsApp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition-all">
              <MessageSquare className="w-5 h-5 text-gray-700" />
              <div>
                <div className="text-xs text-gray-500 font-mono uppercase">WhatsApp</div>
                <div className="font-medium">{siteSettings?.supportWhatsApp || 'Not available'}</div>
              </div>
            </a>
            <a href={`https://instagram.com/${siteSettings?.supportInstagram}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-gray-400 transition-all">
              <Instagram className="w-5 h-5 text-gray-700" />
              <div>
                <div className="text-xs text-gray-500 font-mono uppercase">Instagram</div>
                <div className="font-medium">@{siteSettings?.supportInstagram || 'Not available'}</div>
              </div>
            </a>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <h3 className="text-lg font-sans font-semibold">Live Chat</h3>
          <div className="bg-gray-100 rounded-xl h-64 flex items-center justify-center text-gray-500 font-mono">
            Chat feature coming soon...
          </div>
        </div>
      </div>
    </div>
  );
}
