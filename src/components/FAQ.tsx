import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle, Shield, Truck, RefreshCw, CreditCard } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
  icon: any;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    category: "Shipping & Delivery",
    icon: Truck,
    question: "Do you offer international white-glove shipping?",
    answer: "Yes. Zylo provides fully insured, white-glove international shipping to over 120 countries. All premium timepieces and high-value leather goods are dispatched in temperature-controlled, secure transit cases with real-time GPS tracking. Delivery within Europe, North America, and Asia typically takes 2–4 business days."
  },
  {
    category: "Authenticity & Warranty",
    icon: Shield,
    question: "How is the authenticity of Zylo items guaranteed?",
    answer: "Every masterpiece on Zylo is sourced directly from heritage ateliers or authorized brand houses and is accompanied by an individually numbered Certificate of Authenticity. Each timepiece also carries an electronic NFC tag that stores its provenance, batch history, and standard 5-year global warranty."
  },
  {
    category: "Returns & Exchanges",
    icon: RefreshCw,
    question: "What is your return policy for bespoke products?",
    answer: "We offer a complimentary 30-day return or exchange policy for all standard catalogue items in pristine, unworn condition with security seals intact. For personalized fragrances or customized monograms, returns are subject to review by our Private Concierge team."
  },
  {
    category: "Payments & Financing",
    icon: CreditCard,
    question: "Which ultra-secure payment methods do you support?",
    answer: "We support major credit networks (Visa, Mastercard, American Express), luxury digital wallets (Apple Pay, Google Pay), and fully secured gateway flows via Stripe and Razorpay. For high-value transactions, we also support bank-to-bank SWIFT/IBAN transfers through our elite concierge line."
  }
];

export default function FAQ({ brandName = 'Zylo' }: { brandName?: string }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs = FAQ_ITEMS.map(item => ({
    ...item,
    question: item.question.replace(/Zylo/g, brandName),
    answer: item.answer.replace(/Zylo/g, brandName)
  }));

  return (
    <div id="faq-section" className="w-full max-w-4xl mx-auto py-16 px-4 sm:px-6">
      <div className="text-center mb-12">
        <span className="text-xs tracking-[0.3em] text-amber-500 uppercase font-mono block mb-2">Inquiries & Assistance</span>
        <h2 className="text-3xl sm:text-4xl font-sans tracking-tight text-white font-light">
          Frequently Asked <span className="italic font-serif text-amber-100">Questions</span>
        </h2>
        <div className="h-[1px] w-12 bg-amber-500/50 mx-auto mt-4"></div>
      </div>

      <div className="space-y-4">
        {faqs.map((item, index) => {
          const Icon = item.icon;
          const isOpen = activeIndex === index;

          return (
            <div 
              key={index}
              id={`faq-item-${index}`}
              className="border border-white/5 bg-black/40 backdrop-blur-xl rounded-xl overflow-hidden transition-colors duration-300 hover:border-amber-500/20"
            >
              <button
                id={`faq-trigger-${index}`}
                onClick={() => setActiveIndex(isOpen ? null : index)}
                className="w-full text-left px-6 py-5 flex items-start justify-between gap-4 transition-colors"
              >
                <div className="flex gap-4">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-amber-500 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono tracking-widest text-amber-500/70 uppercase">
                      {item.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-sans font-medium text-white tracking-wide">
                      {item.question}
                    </h3>
                  </div>
                </div>
                <div className="p-1 rounded-full bg-white/5 text-gray-400 mt-1 shrink-0">
                  <ChevronDown className={`w-4 h-4 transform transition-transform duration-300 ${isOpen ? 'rotate-180 text-amber-500' : ''}`} />
                </div>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="px-6 pb-6 pt-1 pl-[3.75rem] border-t border-white/5 text-xs sm:text-sm text-gray-400 leading-relaxed font-sans font-light">
                      {item.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
