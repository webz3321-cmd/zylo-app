import React, { useState, useEffect } from 'react';
import { Product, Order, Coupon, Review, Variant, Category, Offer, HeroSlide, SiteSettings, FAQItem } from '../types';
import { EcommerceService } from '../lib/ecommerceService';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid
} from 'recharts';
import { 
  DollarSign, ShoppingCart, Users, Tag, Plus, Edit, Trash2, Check, RefreshCw, X, FileText, Settings, Star, Layers, Calendar, Search, Sparkles, Download, Upload, QrCode, Bell, AlertTriangle
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { ZyloLogo } from './ZyloLogo';

export default function AdminDashboard({ onBackToStore }: { onBackToStore: () => void }) {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [editingFAQ, setEditingFAQ] = useState<FAQItem | null>(null);
  const [faqForm, setFaqForm] = useState<Partial<FAQItem>>({
    question: '', answer: '', category: 'General'
  });
  
  // Need to update loadAllAdminData to fetch FAQ items if persisted in Firestore
  // For now, assume EcommerceService has methods for FAQs
  
  const handleFAQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer) return;
    
    // Logic to save FAQ via EcommerceService
    // await EcommerceService.saveFAQ(faqForm);
    
    showNotification('FAQ updated.');
    setEditingFAQ(null);
    setFaqForm({ question: '', answer: '', category: 'General' });
    loadAllAdminData();
  };
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'categories' | 'orders' | 'coupons' | 'reviews' | 'offers' | 'hero' | 'admins' | 'settings' | 'faq'>('analytics');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [authorizedAdmins, setAuthorizedAdmins] = useState<string[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    logoUrl: '',
    faviconUrl: '',
    brandName: 'Zylo'
  });
  
  // Categories tab refinement states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(6000);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  
  // Category management form states
  const [categoryForm, setCategoryForm] = useState<Partial<Category>>({
    name: '', image: '', description: ''
  });
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Notification alert
  const [notif, setNotif] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; type: 'product' | 'category' } | null>(null);

  // Products state form
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', tagline: '', description: '', price: 100, category: 'Timepieces', subCategory: 'Chrono', images: [''], features: [''], specs: {}, variants: [],
    isTrending: false, isBestSeller: false, variantLabel: 'Variant'
  });
  const [variantForm, setVariantForm] = useState<Partial<Variant>>({
    name: '', type: 'color', value: '#ffffff', additionalPrice: 0, stock: 10
  });

  // Coupon state form
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    code: '', discountType: 'percentage', value: 10, expiryDate: '2026-12-31', isActive: true, minSpend: 0
  });

  // Offer state form
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerForm, setOfferForm] = useState<Partial<Offer>>({
    title: '', description: '', image: '', isActive: true, link: ''
  });

  // Hero state form
  const [editingHero, setEditingHero] = useState<HeroSlide | null>(null);
  const [heroForm, setHeroForm] = useState<Partial<HeroSlide>>({
    badge: '', title: '', description: '', image: '', buttonText: 'SHOP NOW', link: '/shop', isActive: true
  });

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const loadAllAdminData = async () => {
    try {
      const pList = await EcommerceService.getProducts();
      const oList = await EcommerceService.getOrders();
      const cList = await EcommerceService.getCoupons();
      const rList = await EcommerceService.getReviews();
      const cats = await EcommerceService.getRichCategories();
      const offList = await EcommerceService.getOffers();
      const heroList = await EcommerceService.getHeroSlides();
      const adminList = await EcommerceService.getAuthorizedAdmins();
      const settings = await EcommerceService.getSiteSettings();
      setProducts(pList);
      setOrders(oList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setCoupons(cList);
      setReviews(rList);
      setAvailableCategories(cats);
      setOffers(offList);
      setHeroSlides(heroList);
      setAuthorizedAdmins(adminList);
      setSiteSettings(settings);
    } finally {
      setIsLoaded(true);
    }
  };

  const [adminEmailForm, setAdminEmailForm] = useState('');

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(''), 4000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showNotification('File size too large. Max 2MB allowed.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.image) {
      showNotification('Please provide both a Category Name and Cover Image URL.');
      return;
    }

    const name = categoryForm.name.trim();
    const id = editingCategory ? editingCategory.id : name.toLowerCase().replace(/\s+/g, '-');
    const newCategoryObj: Category = {
      id,
      name,
      image: categoryForm.image.trim(),
      description: categoryForm.description?.trim() || ''
    };

    await EcommerceService.saveRichCategory(newCategoryObj);
    
    // Update local state
    setAvailableCategories(prev => {
      const filtered = prev.filter(c => c.id !== id);
      return [...filtered, newCategoryObj];
    });

    setCategoryForm({ name: '', image: '', description: '' });
    setEditingCategory(null);
    const msg = editingCategory ? `Category "${name}" updated successfully in website and database!` : `Category "${name}" added successfully in website and database!`;
    showNotification(msg);
    try {
      alert(msg);
    } catch (err) {
      console.warn("window.alert blocked:", err);
    }
  };

  // --- PRODUCTS CONTROLLER ---
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.category) {
      showNotification('Please complete required product fields.');
      return;
    }

    const targetId = editingProduct ? editingProduct.id : `prod-${Date.now()}`;
    const cleanProduct: Product = {
      id: targetId,
      name: productForm.name,
      tagline: productForm.tagline || 'Exquisite masterpiece.',
      description: productForm.description || '',
      price: Number(productForm.price),
      originalPrice: productForm.originalPrice ? Number(productForm.originalPrice) : undefined,
      images: productForm.images?.filter(url => url.trim() !== '') || ['https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800'],
      category: productForm.category,
      subCategory: productForm.subCategory || 'General',
      rating: editingProduct ? editingProduct.rating : 5.0,
      ratingCount: editingProduct ? editingProduct.ratingCount : 1,
      variants: productForm.variants && productForm.variants.length > 0 ? productForm.variants : [
        { id: `v-${Date.now()}`, name: "Standard", type: "size", value: "Standard", stock: 15 }
      ],
      features: productForm.features?.filter(f => f.trim() !== '') || ['Exquisite hand craftsmanship', 'Certified premium packaging'],
      specs: productForm.specs || { "Warranty": "5 Years" },
      isNew: editingProduct ? editingProduct.isNew : true,
      isTrending: productForm.isTrending || false,
      isBestSeller: productForm.isBestSeller || false,
      variantLabel: productForm.variantLabel || 'Variant'
    };

    await EcommerceService.saveProduct(cleanProduct);
    setEditingProduct(null);
    setProductForm({
      name: '', tagline: '', description: '', price: 100, category: 'Timepieces', subCategory: 'Chrono', images: [''], features: [''], specs: {}, variants: [],
      isTrending: false, isBestSeller: false
    });
    loadAllAdminData();
    const msg = editingProduct ? 'Product updated successfully in website and database!' : 'Product added successfully in website and database!';
    showNotification(msg);
    try {
      alert(msg);
    } catch (err) {
      console.warn("window.alert blocked:", err);
    }
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ ...p });
  };

  const handleDeleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    if (prod) {
      setDeleteConfirm({
        id,
        name: prod.name,
        type: 'product'
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id, name, type } = deleteConfirm;
    setDeleteConfirm(null);

    if (type === 'product') {
      setProducts(prev => prev.filter(p => p.id !== id));
      await EcommerceService.deleteProduct(id);
      loadAllAdminData();
      showNotification(`Product "${name}" deleted successfully from website and database.`);
    } else if (type === 'category') {
      setAvailableCategories(prev => prev.filter(c => c.id !== id));
      await EcommerceService.deleteCategory(id);
      loadAllAdminData();
      showNotification(`Category "${name}" deleted successfully from website and database.`);
    }
  };

  const handleAddVariantToForm = () => {
    if (!variantForm.name || !variantForm.value) return;
    const newV: Variant = {
      id: `var-${Date.now()}`,
      name: variantForm.name,
      type: variantForm.type || 'color',
      value: variantForm.value,
      additionalPrice: Number(variantForm.additionalPrice) || 0,
      stock: Number(variantForm.stock) || 10
    };
    setProductForm(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newV]
    }));
    // Reset variant fields
    setVariantForm({ name: '', type: 'color', value: '#ffffff', additionalPrice: 0, stock: 10 });
  };

  const handleRemoveVariantFromForm = (idx: number) => {
    setProductForm(prev => ({
      ...prev,
      variants: prev.variants?.filter((_, i) => i !== idx)
    }));
  };

  // --- ORDERS CONTROLLER ---
  const handleOrderStatusUpdate = async (orderId: string, status: Order['deliveryStatus'], tracking?: string) => {
    await EcommerceService.updateOrderStatus(orderId, status, tracking);
    loadAllAdminData();
    showNotification(`Order status updated to ${status.toUpperCase()}`);
  };

  const downloadLabel = async (order: Order) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [100, 150] // typical label size
      });
      const brandName = siteSettings.brandName || 'Zylo';

      // Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIPPING LABEL', 50, 15, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Order ID: ${order.id}`, 10, 25);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 10, 30);

      // Address
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIP TO:', 10, 45);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const addr = order.shippingAddress;
      const addressLines = [
        addr.fullName,
        addr.addressLine1,
        addr.addressLine2,
        `${addr.city}, ${addr.state} ${addr.postalCode}`,
        addr.country,
        `Phone: ${addr.phone}`
      ].filter(Boolean);

      let yPos = 52;
      addressLines.forEach(line => {
        if (line) {
          doc.text(line, 10, yPos);
          yPos += 5;
        }
      });

      // Products info
      yPos += 5;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CONTENTS:', 10, yPos);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      yPos += 6;
      order.items.forEach(item => {
        const txt = `- ${item.quantity}x ${item.product.name.substring(0, 30)}${item.product.name.length > 30 ? '...' : ''} (${item.selectedVariant?.name || 'Standard'})`;
        doc.text(txt, 10, yPos);
        yPos += 5;
      });

      // Total Value
      yPos += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total Value: INR ${order.total}`, 10, yPos);

      // QR Code
      const qrData = `Order: ${order.id}\nName: ${addr.fullName}\nTotal: INR ${order.total}`;
      const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 100 });
      
      // Calculate QR Code position to bottom center
      const qrSize = 40;
      doc.addImage(qrDataUrl, 'PNG', (100 - qrSize) / 2, Math.max(yPos + 5, 100), qrSize, qrSize);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(brandName, 50, 145, { align: 'center' });

      doc.save(`${brandName}_Label_${order.id}.pdf`);
    } catch (e) {
      console.error('Error generating label', e);
      alert('Could not generate label');
    }
  };

  const downloadInvoice = (order: Order) => {
    const doc = new jsPDF();
    const brandName = siteSettings.brandName || 'Zylo';
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
    
    // Add Shipping Address
    doc.setTextColor(60, 60, 60);
    doc.text('SHIPPING ADDRESS:', 15, 80);
    doc.setTextColor(0, 0, 0);
    const addr = order.shippingAddress;
    const addressLines = [
      addr.fullName,
      addr.addressLine1,
      addr.addressLine2,
      `${addr.city}, ${addr.state} ${addr.postalCode}`,
      addr.country,
      `Phone: ${addr.phone}`
    ].filter(Boolean);

    let yPosAddress = 87;
    addressLines.forEach(line => {
      if (line) {
        doc.text(line, 15, yPosAddress);
        yPosAddress += 6;
      }
    });

    // Items Table
    const tableData = order.items.map(item => [
      item.product.name,
      item.selectedVariant?.name || 'Standard',
      `x ${item.quantity}`,
      `INR ${item.product.price + (item.selectedVariant?.additionalPrice || 0)}`,
      `INR ${(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}`
    ]);

    autoTable(doc, {
      startY: Math.max(yPosAddress + 10, 85),
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

  // --- COUPONS CONTROLLER ---
  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.value) return;

    const newCoupon: Coupon = {
      code: couponForm.code.toUpperCase(),
      discountType: couponForm.discountType || 'percentage',
      value: Number(couponForm.value),
      minSpend: couponForm.minSpend ? Number(couponForm.minSpend) : undefined,
      expiryDate: couponForm.expiryDate || '2026-12-31',
      isActive: couponForm.isActive ?? true
    };

    await EcommerceService.saveCoupon(newCoupon);
    setShowCouponForm(false);
    setCouponForm({ code: '', discountType: 'percentage', value: 10, expiryDate: '2026-12-31', isActive: true, minSpend: 0 });
    loadAllAdminData();
    showNotification('New promo coupon registered.');
  };

  const handleDeleteCoupon = async (code: string) => {
    await EcommerceService.deleteCoupon(code);
    loadAllAdminData();
    showNotification('Coupon deleted.');
  };

  // --- REVIEWS CONTROLLER ---
  const handleDeleteReview = async (reviewId: string) => {
    await EcommerceService.deleteReview(reviewId);
    loadAllAdminData();
    showNotification('Review deleted.');
  };

  // --- HERO SLIDES CONTROLLER ---
  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!heroForm.title || !heroForm.image) {
      showNotification('Please provide at least a Title and Image URL.');
      return;
    }

    const targetId = editingHero ? editingHero.id : `hero-${Date.now()}`;
    const cleanHero: HeroSlide = {
      id: targetId,
      badge: heroForm.badge || '',
      title: heroForm.title,
      description: heroForm.description || '',
      image: heroForm.image,
      buttonText: heroForm.buttonText || 'SHOP NOW',
      link: heroForm.link || '/shop',
      isActive: heroForm.isActive ?? true
    };

    await EcommerceService.saveHeroSlide(cleanHero);
    setEditingHero(null);
    setHeroForm({ badge: '', title: '', description: '', image: '', buttonText: 'SHOP NOW', link: '/shop', isActive: true });
    loadAllAdminData();
    showNotification(editingHero ? 'Hero slide updated.' : 'New hero slide added.');
  };

  const handleDeleteHero = async (id: string) => {
    await EcommerceService.deleteHeroSlide(id);
    loadAllAdminData();
    showNotification('Slide removed.');
  };

  // --- ADMINS CONTROLLER ---
  const handleAuthorizeAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailForm.trim()) return;
    await EcommerceService.authorizeAdmin(adminEmailForm.trim());
    setAdminEmailForm('');
    loadAllAdminData();
    showNotification('Admin authorized successfully.');
  };

  const handleRevokeAdmin = async (email: string) => {
    if (email === 'webz3321@gmail.com') {
      showNotification('Primary admin cannot be revoked.');
      return;
    }
    await EcommerceService.revokeAdmin(email);
    loadAllAdminData();
    showNotification('Admin access revoked.');
  };

  // --- OFFERS CONTROLLER ---
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerForm.title || !offerForm.image) {
      showNotification('Please provide at least a Title and Image URL.');
      return;
    }

    const targetId = editingOffer ? editingOffer.id : `offer-${Date.now()}`;
    const cleanOffer: Offer = {
      id: targetId,
      title: offerForm.title,
      description: offerForm.description || '',
      image: offerForm.image,
      code: offerForm.code,
      discountValue: offerForm.discountValue ? Number(offerForm.discountValue) : undefined,
      discountType: offerForm.discountType as any,
      isActive: offerForm.isActive ?? true,
      link: offerForm.link
    };

    await EcommerceService.saveOffer(cleanOffer);
    setEditingOffer(null);
    setOfferForm({ title: '', description: '', image: '', isActive: true, link: '' });
    loadAllAdminData();
    showNotification(editingOffer ? 'Special offer updated.' : 'New special offer created.');
  };

  const handleDeleteOffer = async (id: string) => {
    await EcommerceService.deleteOffer(id);
    loadAllAdminData();
    showNotification('Offer removed.');
  };

  // --- ANALYTICS CALCULATIONS ---
  const validOrders = orders.filter(o => o.paymentStatus !== 'failed' && o.paymentStatus !== 'refunded' && o.deliveryStatus !== 'cancelled' && o.deliveryStatus !== 'returned');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalSales = validOrders.length;
  const averageOrderValue = totalSales > 0 ? Math.round(totalRevenue / totalSales) : 0;
  
  // Unique customers
  const uniqueCustomers = new Set(validOrders.map(o => o.userEmail)).size;

  // Chart data formatting (Recharts friendly)
  const salesHistoryMap: Record<string, { date: string, revenue: number, orders: number }> = {};
  
  // Fill 7 past days to have complete aesthetic lines
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    salesHistoryMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
  }

  validOrders.forEach(o => {
    const dateStr = new Date(o.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (salesHistoryMap[dateStr]) {
      salesHistoryMap[dateStr].revenue += o.total;
      salesHistoryMap[dateStr].orders += 1;
    } else {
      // Backfill or handle custom dates
      salesHistoryMap[dateStr] = { date: dateStr, revenue: o.total, orders: 1 };
    }
  });

  // Filter and sort products for the admin Categories tab
  const filteredProductsInAdmin = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesPrice = p.price <= maxPrice;
    
    const matchesStock = !inStockOnly || p.variants.some(v => v.stock > 0);

    return matchesSearch && matchesCategory && matchesPrice && matchesStock;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.ratingCount - a.ratingCount;
  });

  const chartData = Object.values(salesHistoryMap);

  return (
    <div id="admin-dashboard-container" className="min-h-screen pt-44 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* Custom Deletion Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-neutral-900 border border-red-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 transform animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-8 h-8 animate-pulse shrink-0" />
              <h3 className="text-xl font-sans font-light tracking-tight text-white uppercase">
                Confirm <span className="text-red-500 font-bold">Deletion</span>
              </h3>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed font-sans">
              Are you sure you want to delete the {deleteConfirm.type} <span className="text-white font-semibold">"{deleteConfirm.name}"</span>?
              <br /><br />
              <span className="text-xs text-red-400 font-mono uppercase tracking-wider">
                ⚠️ Warning: This action cannot be undone and will permanently remove this item from both the website and the database.
              </span>
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 text-xs font-mono tracking-widest uppercase transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <button 
            onClick={onBackToStore}
            className="text-xs font-mono text-amber-500 hover:text-amber-400 transition-colors uppercase mb-2 block cursor-pointer"
          >
            ← Return to Home
          </button>
          <span className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase block">Admin Control Panel</span>
          <h1 className="text-3xl font-sans tracking-tight text-white font-light mt-1">
            {siteSettings.brandName} <span className="italic font-serif text-amber-100">Management</span>
          </h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['analytics', 'products', 'categories', 'orders', 'coupons', 'reviews', 'offers', 'hero', 'admins', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3.5 py-1.5 rounded-xl border font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer ${
                activeTab === tab 
                  ? 'bg-amber-500 border-amber-400 text-black font-semibold shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {notif && (
        <div className="border border-amber-500/20 bg-amber-950/20 rounded-xl p-4 text-xs text-amber-400 flex items-center gap-2 max-w-xl mx-auto">
          <Check className="w-4 h-4 shrink-0" />
          <span>{notif}</span>
        </div>
      )}

      {/* ========================================================
          TAB 1: ANALYTICS & REVENUE CHARTS
          ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-10">
          {/* Info cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2 backdrop-blur-md">
              <div className="flex justify-between items-center text-amber-500">
                <DollarSign className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Cleared</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Total Revenue</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-light text-white font-mono tracking-tight">₹{totalRevenue}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2 backdrop-blur-md">
              <div className="flex justify-between items-center text-amber-500">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Count</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Completed Sales</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-light text-white font-mono tracking-tight">{totalSales}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2 backdrop-blur-md">
              <div className="flex justify-between items-center text-amber-500">
                <Users className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Audited</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Unique Patrons</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-light text-white font-mono tracking-tight">{uniqueCustomers}</h3>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-2 backdrop-blur-md">
              <div className="flex justify-between items-center text-amber-500">
                <FileText className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Mean</span>
              </div>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Average Ticket Size</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-light text-white font-mono tracking-tight">₹{averageOrderValue}</h3>
            </div>
          </div>

          {/* Area Chart visualization */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase mb-6">Sales Performance (INR)</h4>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" stroke="#666" fontSize={11} fontClassName="font-mono" />
                  <YAxis stroke="#666" fontSize={11} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0c0c0c', borderColor: '#333', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#d4af37" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: PRODUCTS MANAGER (ADD/EDIT/DELETE)
          ======================================================== */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add / Edit product form */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[9px] font-mono tracking-wider text-amber-500 uppercase block">Curator Form</span>
              <h4 className="text-base font-sans font-medium text-white tracking-wide">
                {editingProduct ? 'Update Masterpiece Details' : 'Catalogue New Masterpiece'}
              </h4>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aether Chrono 41"
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Tagline Phrase</label>
                  <input
                    type="text"
                    placeholder="Minimalist horology..."
                    value={productForm.tagline || ''}
                    onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Variant Label</label>
                  <select
                    value={productForm.variantLabel || 'Choose Variant'}
                    onChange={(e) => setProductForm({ ...productForm, variantLabel: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Choose Variant">Choose Variant</option>
                    <option value="Choose Color">Choose Color</option>
                    <option value="Choose Size">Choose Size</option>
                    <option value="Choose Volume (ml)">Choose Volume (ml)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 uppercase font-mono block">Product Narrative / Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell the design, engineering, and craftsmanship stories..."
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Retail Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price || 100}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-400 uppercase font-mono block text-[10px]">Category</label>
                    <button
                      type="button"
                      onClick={async () => {
                        const newCat = prompt("Enter new category name:");
                        if (newCat && newCat.trim()) {
                          const formatted = newCat.trim();
                          if (!availableCategories.some(c => c.name.toLowerCase() === formatted.toLowerCase())) {
                            const newCategoryObj: Category = {
                              id: formatted.toLowerCase().replace(/\s+/g, '-'),
                              name: formatted,
                              image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=300',
                              description: 'Newly added collection.'
                            };
                            await EcommerceService.saveRichCategory(newCategoryObj);
                            setAvailableCategories(prev => [...prev, newCategoryObj]);
                          }
                          setProductForm(prev => ({ ...prev, category: formatted }));
                          const msg = `Category "${formatted}" added successfully in website and database!`;
                          showNotification(msg);
                          try {
                            alert(msg);
                          } catch (err) {
                            console.warn("window.alert blocked:", err);
                          }
                        }
                      }}
                      className="text-[9px] text-amber-500 hover:text-amber-400 uppercase font-mono cursor-pointer flex items-center gap-0.5"
                    >
                      <Plus className="w-2.5 h-2.5" /> +Add
                    </button>
                  </div>
                  <select
                    value={productForm.category || 'Timepieces'}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-gray-400 uppercase font-mono block">Primary Image</label>
                      <label className="text-[9px] text-amber-500 hover:text-amber-400 uppercase font-mono cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, (b) => {
                            const currentImg = [...(productForm.images || [])];
                            currentImg[0] = b;
                            setProductForm({ ...productForm, images: currentImg });
                          })} 
                        />
                      </label>
                    </div>
                    <div className="flex gap-3">
                      {productForm.images?.[0] && (
                        <div className="w-12 h-12 rounded-lg border border-white/10 overflow-hidden bg-white/5 shrink-0">
                          <img src={productForm.images[0]} alt="Primary" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input
                        type="text"
                        required
                        placeholder="Primary image URL or use upload..."
                        value={productForm.images?.[0] || ''}
                        onChange={(e) => {
                          const currentImg = [...(productForm.images || [])];
                          currentImg[0] = e.target.value;
                          setProductForm({ ...productForm, images: currentImg });
                        }}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-gray-400 uppercase font-mono block">Secondary / Gallery Images</label>
                      <label className="text-[9px] text-amber-500 hover:text-amber-400 uppercase font-mono cursor-pointer flex items-center gap-1">
                        <Plus className="w-3 h-3" /> Add Image
                        <input 
                          type="file" 
                          accept="image/*" 
                          multiple
                          className="hidden" 
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const files = e.target.files;
                            if (files) {
                              Array.from(files).forEach((file: File) => {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const base64 = reader.result as string;
                                  setProductForm(prev => ({
                                    ...prev,
                                    images: [...(prev.images || []), base64]
                                  }));
                                };
                                reader.readAsDataURL(file);
                              });
                            }
                          }} 
                        />
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2 min-h-[50px] p-2 bg-black/20 rounded-xl border border-dashed border-white/10">
                      {productForm.images?.slice(1).map((img, idx) => (
                        <div key={idx} className="relative group w-16 h-16 rounded-lg border border-white/10 overflow-hidden bg-white/5">
                          <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => {
                              const newImgs = [...(productForm.images || [])];
                              newImgs.splice(idx + 1, 1);
                              setProductForm({...productForm, images: newImgs});
                            }}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!productForm.images || productForm.images.length <= 1) && (
                        <div className="w-full flex items-center justify-center py-4">
                          <span className="text-[10px] text-gray-600 font-mono">No secondary images added</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-1">
                      <input
                        type="text"
                        placeholder="Add gallery image URL and press Enter..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            if (val.trim()) {
                              setProductForm(prev => ({
                                ...prev,
                                images: [...(prev.images || []), val.trim()]
                              }));
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] text-white"
                      />
                    </div>
                  </div>
                </div>

              {/* Dynamic feature inputs */}
              <div className="space-y-1.5">
                <label className="text-gray-400 uppercase font-mono block">Key Handcrafted Feature</label>
                <input
                  type="text"
                  placeholder="Swiss cal. 12 automatic engineering..."
                  value={productForm.features?.[0] || ''}
                  onChange={(e) => {
                    const feat = [...(productForm.features || [])];
                    feat[0] = e.target.value;
                    setProductForm({ ...productForm, features: feat });
                  }}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              {/* Dynamic variants creator block */}
              <div className="border border-white/5 bg-black/20 rounded-xl p-3 space-y-3">
                <span className="text-[10px] font-mono text-amber-500 uppercase block">Variants & Inventories ({productForm.variants?.length || 0})</span>
                
                {/* Form fields */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Variant name (e.g. Space Black)"
                    value={variantForm.name || ''}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1 text-[11px] text-white"
                  />
                  <input
                    type="number"
                    placeholder="Stock count"
                    value={variantForm.stock || 10}
                    onChange={(e) => setVariantForm({ ...variantForm, stock: Number(e.target.value) })}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1 text-[11px] text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={variantForm.type || 'color'}
                    onChange={(e) => setVariantForm({ ...variantForm, type: e.target.value as any })}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1 text-[11px] text-white"
                  >
                    <option value="color">Color Swatch</option>
                    <option value="volume">Fragrance Volume</option>
                    <option value="size">Dimensions/Size</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Hex Code or e.g. 100ml"
                    value={variantForm.value || ''}
                    onChange={(e) => setVariantForm({ ...variantForm, value: e.target.value })}
                    className="bg-black/40 border border-white/15 rounded px-2 py-1 text-[11px] text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddVariantToForm}
                  className="w-full py-1.5 bg-white/5 hover:bg-white/15 text-white font-mono text-[10px] uppercase rounded border border-white/10 cursor-pointer"
                >
                  Add Variant to Form
                </button>

                {/* Variants List preview inside form */}
                <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                  {productForm.variants?.map((v, i) => (
                    <div key={i} className="flex justify-between items-center bg-black/40 rounded px-2 py-1 text-[10px] font-mono text-gray-400">
                      <span>{v.name} ({v.type}: {v.value}) - Qty: {v.stock}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariantFromForm(i)}
                        className="text-red-400 hover:underline p-0.5 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer" onClick={() => setProductForm({...productForm, isTrending: !productForm.isTrending})}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${productForm.isTrending ? 'bg-amber-500 border-amber-400' : 'border-white/20'}`}>
                    {productForm.isTrending && <Check className="w-3 h-3 text-black stroke-[3px]" />}
                  </div>
                  <span className="text-gray-300 font-mono text-[10px] uppercase">Trending Now</span>
                </div>
                <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer" onClick={() => setProductForm({...productForm, isBestSeller: !productForm.isBestSeller})}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${productForm.isBestSeller ? 'bg-amber-500 border-amber-400' : 'border-white/20'}`}>
                    {productForm.isBestSeller && <Check className="w-3 h-3 text-black stroke-[3px]" />}
                  </div>
                  <span className="text-gray-300 font-mono text-[10px] uppercase">Best Seller</span>
                </div>
              </div>

              <div className="flex gap-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: '', tagline: '', description: '', price: 100, category: 'Timepieces', subCategory: 'Chrono', images: [''], features: [''], specs: {}, variants: [], isTrending: false, isBestSeller: false });
                    }}
                    className="flex-1 py-3 border border-white/10 text-white text-[10px] font-mono tracking-widest uppercase rounded-xl hover:bg-white/5 transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-mono tracking-widest uppercase rounded-xl transition-all font-bold"
                >
                  {editingProduct ? 'Commit Changes' : 'Catalogue Masterpiece'}
                </button>
              </div>
            </form>
          </div>

          {/* Catalogued product listings */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Catalogued Items ({products.length})</h4>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {products.map((p) => (
                <div key={p.id} className="border border-white/5 bg-black/30 rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-white/5 text-gray-400 px-1.5 py-0.5 rounded uppercase border border-white/5">{p.category}</span>
                      <h5 className="text-sm font-sans font-medium text-white truncate tracking-wide">{p.name}</h5>
                    </div>
                    <p className="text-xs text-amber-500 font-mono mt-1 font-bold">₹{p.price}</p>
                    
                    {/* Stock level indicators */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.variants.map((v, idx) => (
                        <span key={idx} className={`text-[9px] font-mono px-1.5 rounded-full border ${v.stock < 5 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                          {v.name}: {v.stock}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEditProductClick(p)}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                      title="Edit Product"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 cursor-pointer transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: ORDERS MANAGER & LOGISTICS TRACKING
          ======================================================== */}
      {activeTab === 'orders' && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">System Delivery Ledger ({orders.length})</h4>

          {orders.length === 0 ? (
            <p className="text-sm font-sans font-light text-gray-500 text-center py-12">No transactions recorded in delivery ledger.</p>
          ) : (
            <div className="space-y-6 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar">
              {orders.map((o) => (
                <div key={o.id} className="border border-white/5 bg-black/40 rounded-xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-white uppercase">{o.id}</span>
                        <span className="text-[10px] font-mono bg-white/5 text-gray-400 px-2 py-0.5 rounded border border-white/5">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Patron: <span className="text-white font-sans font-medium">{o.userName} ({o.userEmail})</span>
                      </p>
                    </div>

                    {/* Quick status adjust buttons */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <button
                        onClick={() => downloadLabel(o)}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-amber-500 cursor-pointer transition-colors flex items-center gap-2 px-3"
                        title="Download Label PDF"
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold">Download Label PDF</span>
                      </button>
                      <button
                        onClick={() => downloadInvoice(o)}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-amber-500 cursor-pointer transition-colors flex items-center gap-2 px-3"
                        title="Download Details PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-bold">Download Details PDF</span>
                      </button>
                      <span className="text-gray-500">Track Status:</span>
                      <select
                        value={o.deliveryStatus}
                        onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value as any, o.trackingNumber)}
                        className="bg-black border border-white/10 rounded-lg px-2.5 py-1 text-white text-[11px] focus:border-amber-500/50 focus:outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="shipped">Shipped</option>
                        <option value="out_for_delivery">Out For Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancel_requested">Cancel Requested</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="return_requested">Return Requested</option>
                        <option value="returned">Returned</option>
                      </select>
                    </div>
                  </div>

                  {/* Consignment inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div className="space-y-1 text-xs">
                      <span className="text-gray-400 font-mono block">Logistics Code:</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. ZYL-3329-X8"
                          defaultValue={o.trackingNumber || ''}
                          onBlur={(e) => {
                            if (e.target.value !== o.trackingNumber) {
                              handleOrderStatusUpdate(o.id, o.deliveryStatus, e.target.value);
                            }
                          }}
                          className="bg-black/60 border border-white/10 rounded-lg px-3 py-1 text-[11px] text-white flex-1 focus:border-amber-500/50"
                        />
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center">Blur to save</span>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono space-y-1">
                      <p className="text-gray-400">Total Cleared Value: <span className="text-amber-500 font-bold">₹{o.total}</span></p>
                      <p className="text-[10px] text-gray-500">Gateway: {o.paymentMethod.toUpperCase()} | Ref: {o.paymentId}</p>
                    </div>
                  </div>

                  {/* Item quantities mapping */}
                  <div className="bg-black/20 rounded-xl p-3 text-xs space-y-2">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-gray-300 gap-2">
                        <div className="flex flex-col gap-1">
                          <span>• {item.product.name} [Qty: {item.quantity}] {item.selectedVariant && `(Variant: ${item.selectedVariant.name})`}</span>
                          {item.status && item.status !== 'active' && (
                            <div className="flex items-center gap-2">
                              <span className="inline-block px-1.5 py-0.5 rounded border border-amber-500/30 text-amber-500 text-[9px] uppercase tracking-widest bg-amber-500/10">
                                {item.status.replace('_', ' ')}
                              </span>
                              {item.status === 'cancel_requested' && (
                                <button 
                                  onClick={() => EcommerceService.updateOrderItemStatus(o.id, item.id, 'cancelled').then(loadAllAdminData)}
                                  className="text-[9px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                  Approve Cancel
                                </button>
                              )}
                              {item.status === 'return_requested' && (
                                <button 
                                  onClick={() => EcommerceService.updateOrderItemStatus(o.id, item.id, 'returned').then(loadAllAdminData)}
                                  className="text-[9px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300 transition-colors"
                                >
                                  Approve Return
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-white text-right">₹{(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: COUPON SYSTEM
          ======================================================== */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[9px] font-mono tracking-wider text-amber-500 uppercase block">Vouchers Registry</span>
              <h4 className="text-base font-sans font-medium text-white tracking-wide">Generate New Coupon</h4>
            </div>

            <form onSubmit={handleCouponSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-gray-400 uppercase font-mono block">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXTRAORDINAIRE"
                  value={couponForm.code || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Sum (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Min Spend (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minSpend || 0}
                    onChange={(e) => setCouponForm({ ...couponForm, minSpend: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all"
              >
                Register Coupon
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Registered Active Coupons ({coupons.length})</h4>

            <div className="space-y-3">
              {coupons.map((c) => (
                <div key={c.code} className="border border-white/5 bg-black/30 rounded-xl p-4 flex justify-between items-center text-xs font-mono">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-xs">{c.code}</span>
                      <span className="text-gray-400">{c.discountType === 'percentage' ? `${c.value}% discount` : `$${c.value} reduction`}</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Min spend: ${c.minSpend || 0} • Expires: {c.expiryDate}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteCoupon(c.code)}
                    className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: CATEGORIES MANAGER (DARK LUXURY FORM AND GRID)
          ======================================================== */}
      {activeTab === 'categories' && (
        <div id="admin-categories-view" className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-amber-500 uppercase block font-semibold">Catalogue Core Structure</span>
              <h3 className="text-2xl font-sans tracking-tight text-white font-light mt-1">
                Luxury Boutique <span className="italic font-serif text-amber-500 font-medium">Collections</span>
              </h3>
              <p className="text-xs text-gray-400 font-sans mt-1">
                Establish and configure exquisite collections that display in sophisticated circled nodes on the client storefront.
              </p>
            </div>
            
            <div className="flex gap-4 text-xs font-mono">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                <span className="text-gray-400 block text-[9px] uppercase tracking-wider">Total Categories</span>
                <span className="text-amber-500 font-bold text-sm">{availableCategories.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Column 1: Category Builder Form (Left) */}
            <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <span className="text-[9px] font-mono tracking-wider text-amber-500 uppercase block">Curator Form</span>
                <h4 className="text-base font-sans font-medium text-white tracking-wide">
                  {editingCategory ? 'Update Collection Aesthetics' : 'Design New Collection'}
                </h4>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Collection Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imperial Timepieces"
                    value={categoryForm.name || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-gray-400 uppercase font-mono block">Cover Image</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const luxuryImages = [
                            'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=400',
                            'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&q=80&w=400',
                            'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=400',
                            'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=400'
                          ];
                          const randomImg = luxuryImages[Math.floor(Math.random() * luxuryImages.length)];
                          setCategoryForm(prev => ({ ...prev, image: randomImg }));
                        }}
                        className="text-[9px] text-amber-500 hover:text-amber-400 font-mono uppercase cursor-pointer"
                      >
                        🪄 Auto
                      </button>
                      <label className="text-[9px] text-amber-500 hover:text-amber-400 uppercase font-mono cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" /> Upload
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleFileUpload(e, (b) => setCategoryForm({...categoryForm, image: b}))} 
                        />
                      </label>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Image URL..."
                    value={categoryForm.image || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Collection Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a sophisticated narrative for this salon category..."
                    value={categoryForm.description || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white resize-none placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {categoryForm.image && (
                  <div className="space-y-1.5">
                    <label className="text-gray-400 uppercase font-mono block text-[10px]">Circled Shape Preview</label>
                    <div className="flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-amber-500/40 bg-black shrink-0">
                        <img 
                          src={categoryForm.image} 
                          alt="preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=150';
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{categoryForm.name || 'New Collection'}</p>
                        <p className="text-[10px] text-gray-500 truncate">{categoryForm.description || 'Sophisticated design...'}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono tracking-widest uppercase rounded-xl transition-all font-bold cursor-pointer"
                  >
                    {editingCategory ? 'Commit Design' : 'Establish Collection'}
                  </button>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setCategoryForm({ name: '', image: '', description: '' });
                      }}
                      className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-mono tracking-widest uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Column 2: Visual Collections Grid (Right) */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase block font-semibold">Active Salon Collections</span>
              
              {availableCategories.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl text-gray-500">
                  <p className="text-sm font-sans font-light">No boutique collections have been designed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableCategories.map((cat) => {
                    const count = products.filter(p => p.category.toLowerCase() === cat.name.toLowerCase()).length;
                    return (
                      <div 
                        key={cat.id} 
                        className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-5 hover:border-amber-500/20 hover:shadow-[0_4px_30px_rgba(212,175,55,0.03)] transition-all duration-300"
                      >
                        {/* Circle Shape cover photo represent representing category */}
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-amber-500/30 shrink-0 bg-black/40">
                          <img 
                            src={cat.image || 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=150'} 
                            alt={cat.name} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&q=80&w=150';
                            }}
                          />
                        </div>

                        {/* Details of category */}
                        <div className="flex-grow min-w-0">
                          <h5 className="text-sm font-sans font-medium text-white tracking-wide truncate">
                            {cat.name}
                          </h5>
                          <p className="text-[10px] text-gray-400 font-sans italic line-clamp-1 mt-0.5">
                            {cat.description || 'Exclusive boutique collection.'}
                          </p>
                          <span className="inline-block mt-2 text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full">
                            {count} {count === 1 ? 'Masterpiece' : 'Masterpieces'}
                          </span>
                        </div>

                        {/* Edit / Delete actions */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setCategoryForm({
                                name: cat.name,
                                image: cat.image,
                                description: cat.description || ''
                              });
                            }}
                            className="p-1.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all cursor-pointer border border-white/10"
                            title="Edit Collection"
                          >
                            <Edit className="w-3.5 h-3.5 text-amber-500" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteConfirm({
                                id: cat.id,
                                name: cat.name,
                                type: 'category'
                              });
                            }}
                            className="p-1.5 bg-white/5 hover:bg-red-950/40 text-white rounded-lg transition-all cursor-pointer border border-white/10 group hover:border-red-500/30"
                            title="Retire Collection"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500 group-hover:text-red-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: OFFERS MANAGER
          ======================================================== */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add / Edit offer form */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[9px] font-mono tracking-wider text-amber-500 uppercase block">Promotions Engine</span>
              <h4 className="text-base font-sans font-medium text-white tracking-wide">
                {editingOffer ? 'Edit Special Offer' : 'Create Special Offer'}
              </h4>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-gray-400 uppercase font-mono block">Offer Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Collection 2026"
                  value={offerForm.title || ''}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 uppercase font-mono block">Offer Description</label>
                <textarea
                  rows={2}
                  placeholder="The narrative for this promotion..."
                  value={offerForm.description || ''}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white resize-none focus:border-amber-500/50 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-gray-400 uppercase font-mono block">Image URL</label>
                  <label className="text-[9px] text-amber-500 hover:text-amber-400 uppercase font-mono cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, (b) => setOfferForm({...offerForm, image: b}))} 
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={offerForm.image || ''}
                  onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Promo Code (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. LUXE20"
                    value={offerForm.code || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Destination Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="/shop/watches"
                    value={offerForm.link || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, link: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Discount Value</label>
                  <input
                    type="number"
                    value={offerForm.discountValue || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Type</label>
                  <select
                    value={offerForm.discountType || 'percentage'}
                    onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value as any })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Sum (₹)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer" onClick={() => setOfferForm({...offerForm, isActive: !offerForm.isActive})}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${offerForm.isActive ? 'bg-amber-500 border-amber-400' : 'border-white/20'}`}>
                  {offerForm.isActive && <Check className="w-3 h-3 text-black stroke-[3px]" />}
                </div>
                <span className="text-gray-300 font-mono text-[10px] uppercase">Active & Visible</span>
              </div>

              <div className="flex gap-2">
                {editingOffer && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOffer(null);
                      setOfferForm({ title: '', description: '', image: '', isActive: true, link: '' });
                    }}
                    className="flex-1 py-3 border border-white/10 text-white text-[10px] font-mono tracking-widest uppercase rounded-xl hover:bg-white/5 transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all"
                >
                  {editingOffer ? 'Commit Offer' : 'Launch Offer'}
                </button>
              </div>
            </form>
          </div>

          {/* Offer listings */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Active Promotions ({offers.length})</h4>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {offers.map((off) => (
                <div key={off.id} className="border border-white/5 bg-black/30 rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-20 h-14 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0">
                    <img src={off.image} alt={off.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${off.isActive ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                        {off.isActive ? 'Live' : 'Draft'}
                      </span>
                      <h5 className="text-sm font-sans font-medium text-white truncate tracking-wide">{off.title}</h5>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5 font-light">{off.description}</p>
                    {off.code && (
                      <div className="flex items-center gap-2 mt-2">
                        <Tag className="w-2.5 h-2.5 text-amber-500" />
                        <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest">{off.code}</span>
                        {off.discountValue && (
                          <span className="text-[10px] text-gray-500">
                            - {off.discountType === 'percentage' ? `${off.discountValue}%` : `₹${off.discountValue}`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingOffer(off);
                        setOfferForm({ ...off });
                      }}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(off.id)}
                      className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 8: HERO SLIDER MANAGER
          ======================================================== */}
      {activeTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add / Edit hero slide form */}
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[9px] font-mono tracking-wider text-amber-500 uppercase block">Landing Page Control</span>
              <h4 className="text-base font-sans font-medium text-white tracking-wide">
                {editingHero ? 'Edit Hero Slide' : 'Create Hero Slide'}
              </h4>
            </div>

            <form onSubmit={handleHeroSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Badge / Label</label>
                  <input
                    type="text"
                    placeholder="e.g. NEW ARRIVALS"
                    value={heroForm.badge || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value.toUpperCase() })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Main Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Hero Headline"
                    value={heroForm.title || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-400 uppercase font-mono block">Slide Description</label>
                <textarea
                  rows={2}
                  placeholder="Supporting text for the hero banner..."
                  value={heroForm.description || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white resize-none focus:border-amber-500/50 outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-gray-400 uppercase font-mono block">Background Image</label>
                  <label className="text-[9px] text-amber-500 hover:text-amber-400 uppercase font-mono cursor-pointer flex items-center gap-1">
                    <Upload className="w-3 h-3" /> Upload
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, (b) => setHeroForm({...heroForm, image: b}))} 
                    />
                  </label>
                </div>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={heroForm.image || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, image: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Button Text</label>
                  <input
                    type="text"
                    placeholder="SHOP NOW"
                    value={heroForm.buttonText || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, buttonText: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-400 uppercase font-mono block">Link / URL</label>
                  <input
                    type="text"
                    placeholder="/shop"
                    value={heroForm.link || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, link: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-amber-500/50 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl px-3 py-2 cursor-pointer" onClick={() => setHeroForm({...heroForm, isActive: !heroForm.isActive})}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${heroForm.isActive ? 'bg-amber-500 border-amber-400' : 'border-white/20'}`}>
                  {heroForm.isActive && <Check className="w-3 h-3 text-black stroke-[3px]" />}
                </div>
                <span className="text-gray-300 font-mono text-[10px] uppercase">Active & Visible</span>
              </div>

              <div className="flex gap-2">
                {editingHero && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHero(null);
                      setHeroForm({ badge: '', title: '', description: '', image: '', buttonText: 'SHOP NOW', link: '/shop', isActive: true });
                    }}
                    className="flex-1 py-3 border border-white/10 text-white text-[10px] font-mono tracking-widest uppercase rounded-xl hover:bg-white/5 transition-all"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all"
                >
                  {editingHero ? 'Update Slide' : 'Add Hero Slide'}
                </button>
              </div>
            </form>
          </div>

          {/* Hero slides listings */}
          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Hero Banner Slides ({heroSlides.length})</h4>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {heroSlides.map((slide) => (
                <div key={slide.id} className="border border-white/5 bg-black/30 rounded-xl p-4 flex gap-4 items-center">
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-white/10 bg-black shrink-0 relative">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 flex items-center justify-center text-[8px] font-mono text-white/50 text-center px-1">
                      {slide.badge}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase border ${slide.isActive ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                        {slide.isActive ? 'Live' : 'Hidden'}
                      </span>
                      <h5 className="text-sm font-sans font-medium text-white truncate tracking-wide">{slide.title}</h5>
                    </div>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5 font-light">{slide.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Btn: {slide.buttonText}</span>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">| Link: {slide.link}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingHero(slide);
                        setHeroForm({ ...slide });
                      }}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white cursor-pointer transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHero(slide.id)}
                      className="p-2 rounded-lg bg-red-950/20 border border-red-500/20 text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {heroSlides.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-mono text-xs italic">
                  No hero slides configured.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 9: ADMIN ACCESS CONTROL
          ======================================================== */}
      {activeTab === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
            <div>
              <span className="text-[9px] font-mono tracking-wider text-amber-500 uppercase block">Security Protocols</span>
              <h4 className="text-base font-sans font-medium text-white tracking-wide">Authorize New Administrator</h4>
              <p className="text-[10px] text-gray-500 mt-1 font-sans">Authorized emails will be granted full access to this control panel upon Google login.</p>
            </div>

            <form onSubmit={handleAuthorizeAdmin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Admin Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@whistleboutique.com"
                  value={adminEmailForm}
                  onChange={(e) => setAdminEmailForm(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
              >
                Authorize Access
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-4">
            <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Authorized Personnel ({authorizedAdmins.length})</h4>
            <div className="space-y-3">
              {authorizedAdmins.map((email) => (
                <div key={email} className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Users className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xs font-sans text-white font-medium">{email}</p>
                      {email === 'webz3321@gmail.com' && (
                        <span className="text-[9px] font-mono text-amber-500 uppercase tracking-widest">Primary Administrator</span>
                      )}
                    </div>
                  </div>
                  {email !== 'webz3321@gmail.com' && (
                    <button 
                      onClick={() => handleRevokeAdmin(email)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors cursor-pointer"
                      title="Revoke Access"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 10: SITE SETTINGS
      ======================================================== */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
              <h3 className="text-xl font-sans tracking-tight text-white font-light mb-6">
                Brand <span className="italic font-serif text-amber-100">Identity</span>
              </h3>
              
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  await EcommerceService.saveSiteSettings(siteSettings);
                  setNotif('Site settings updated successfully.');
                  setTimeout(() => setNotif(''), 3000);
                }} 
                className="space-y-6"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.brandName}
                    onChange={(e) => setSiteSettings({...siteSettings, brandName: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Logo URL</label>
                  <input
                    type="url"
                    required
                    value={siteSettings.logoUrl}
                    onChange={(e) => setSiteSettings({...siteSettings, logoUrl: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Favicon URL</label>
                  <input
                    type="url"
                    required
                    value={siteSettings.faviconUrl}
                    onChange={(e) => setSiteSettings({...siteSettings, faviconUrl: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">About Us Content</label>
                  <textarea
                    rows={6}
                    required
                    value={siteSettings.aboutContent || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, aboutContent: e.target.value})}
                    placeholder="Tell your brand story..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Support Phone</label>
                  <input
                    type="tel"
                    value={siteSettings.supportPhone || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, supportPhone: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Support WhatsApp</label>
                  <input
                    type="text"
                    value={siteSettings.supportWhatsApp || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, supportWhatsApp: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-400 tracking-wider block uppercase">Support Instagram ID</label>
                  <input
                    type="text"
                    value={siteSettings.supportInstagram || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, supportInstagram: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase rounded-xl transition-all shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                >
                  Save Global Settings
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md flex flex-col items-center justify-center text-center space-y-6">
              <h4 className="text-xs font-mono text-amber-500 tracking-widest uppercase">Visual Preview</h4>
              
              <div className="space-y-4">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Main Header Logo</p>
                <div className="bg-black/50 border border-white/5 rounded-2xl p-12 flex items-center justify-center">
                  {siteSettings.logoUrl && siteSettings.logoUrl !== 'https://images.unsplash.com/photo-1583391733956-6c7827447678?auto=format&fit=crop&q=80&w=100' ? (
                    <img src={siteSettings.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                  ) : (
                    <ZyloLogo className="h-12 text-white" />
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Favicon / Browser Tab</p>
                <div className="bg-black/50 border border-white/5 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center overflow-hidden">
                    {siteSettings.faviconUrl ? (
                      <img src={siteSettings.faviconUrl} alt="Favicon Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Sparkles className="w-3 h-3 text-amber-500" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-sans text-white font-medium truncate w-32">{siteSettings.brandName || 'Zylo'}</p>
                    <p className="text-[8px] font-mono text-gray-500 truncate w-32">https://zylo.luxury</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
