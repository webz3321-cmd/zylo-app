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
    <div id="admin-dashboard-container" className="min-h-screen pt-44 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 bg-[#F8F5EF] text-[#1F1F1F] font-sans">
      {/* Custom Deletion Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-red-100 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 transform animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3 text-red-500">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-xl font-sans font-bold tracking-tight text-[#1F1F1F] uppercase">
                Confirm <span className="text-red-500 font-black">Deletion</span>
              </h3>
            </div>
            
            <p className="text-sm text-[#666666] leading-relaxed font-sans font-medium">
              Are you sure you want to delete the {deleteConfirm.type} <span className="text-[#1F1F1F] font-black">"{deleteConfirm.name}"</span>?
              <br /><br />
              <span className="text-[10px] text-red-500 font-mono uppercase tracking-[0.2em] font-black">
                ⚠️ Warning: This action cannot be undone and will permanently remove this item from both the website and the database.
              </span>
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 rounded-xl bg-[#F8F5EF] border border-[#E8E1D6] text-[#1F1F1F] hover:bg-white text-xs font-mono tracking-widest uppercase transition-all cursor-pointer font-black"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono tracking-widest uppercase transition-all shadow-md cursor-pointer font-black"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1D6] pb-8">
        <div>
          <button 
            onClick={onBackToStore}
            className="text-xs font-mono text-[#C9A227] hover:text-[#B68D1F] transition-colors uppercase mb-2 block cursor-pointer font-black tracking-widest"
          >
            ← Return to Home
          </button>
          <span className="text-[10px] font-mono tracking-[0.3em] text-[#C9A227] uppercase block font-black">Admin Control Panel</span>
          <h1 className="text-3xl font-sans tracking-tight text-[#1F1F1F] font-bold mt-1 uppercase">
            {siteSettings.brandName} <span className="italic font-serif text-[#C9A227] lowercase">Management</span>
          </h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['analytics', 'products', 'categories', 'orders', 'coupons', 'reviews', 'offers', 'hero', 'admins', 'settings', 'faq'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl border font-mono text-[10px] tracking-widest uppercase transition-all cursor-pointer font-black shadow-sm ${
                activeTab === tab 
                  ? 'bg-[#C9A227] border-[#C9A227] text-white' 
                  : 'bg-white border-[#E8E1D6] text-[#1F1F1F] hover:bg-[#F8F5EF]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {notif && (
        <div className="border border-[#C9A227]/20 bg-[#C9A227]/5 rounded-xl p-4 text-xs text-[#C9A227] flex items-center gap-2 max-w-xl mx-auto shadow-sm font-bold uppercase tracking-tight">
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
            <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[#C9A227]">
                <DollarSign className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-[#F8F5EF] px-2 py-0.5 rounded border border-[#E8E1D6] font-black">Cleared</span>
              </div>
              <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider block font-bold">Total Revenue</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[#1F1F1F] font-mono tracking-tight uppercase">₹{totalRevenue}</h3>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[#C9A227]">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-[#F8F5EF] px-2 py-0.5 rounded border border-[#E8E1D6] font-black">Count</span>
              </div>
              <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider block font-bold">Completed Sales</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[#1F1F1F] font-mono tracking-tight uppercase">{totalSales}</h3>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[#C9A227]">
                <Users className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-[#F8F5EF] px-2 py-0.5 rounded border border-[#E8E1D6] font-black">Audited</span>
              </div>
              <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider block font-bold">Unique Patrons</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[#1F1F1F] font-mono tracking-tight uppercase">{uniqueCustomers}</h3>
            </div>

            <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-2 shadow-sm">
              <div className="flex justify-between items-center text-[#C9A227]">
                <FileText className="w-5 h-5" />
                <span className="text-[9px] font-mono uppercase bg-[#F8F5EF] px-2 py-0.5 rounded border border-[#E8E1D6] font-black">Mean</span>
              </div>
              <span className="text-[10px] font-mono text-[#666666] uppercase tracking-wider block font-bold">Average Ticket Size</span>
              <h3 className="text-2xl sm:text-3xl font-sans font-bold text-[#1F1F1F] font-mono tracking-tight uppercase">₹{averageOrderValue}</h3>
            </div>
          </div>

          {/* Area Chart visualization */}
          <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 shadow-sm">
            <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase mb-6 font-black">Sales Performance (INR)</h4>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C9A227" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#C9A227" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E1D6" />
                  <XAxis dataKey="date" stroke="#666666" fontSize={11} fontClassName="font-mono" />
                  <YAxis stroke="#666666" fontSize={11} fontClassName="font-mono" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E8E1D6', color: '#1F1F1F', fontSize: '11px', fontFamily: 'monospace' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Revenue (₹)" />
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
          {/* Add / Edit product form */}
          <div className="lg:col-span-5 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-black">Curator Form</span>
              <h4 className="text-base font-sans font-bold text-[#1F1F1F] tracking-tight uppercase">
                {editingProduct ? 'Update Masterpiece Details' : 'Catalogue New Masterpiece'}
              </h4>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-bold">Product Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aether Chrono 41"
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-bold">Tagline Phrase</label>
                  <input
                    type="text"
                    placeholder="Minimalist horology..."
                    value={productForm.tagline || ''}
                    onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-bold">Variant Label</label>
                  <select
                    value={productForm.variantLabel || 'Choose Variant'}
                    onChange={(e) => setProductForm({ ...productForm, variantLabel: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none cursor-pointer"
                  >
                    <option value="Choose Variant">Choose Variant</option>
                    <option value="Choose Color">Choose Color</option>
                    <option value="Choose Size">Choose Size</option>
                    <option value="Choose Volume (ml)">Choose Volume (ml)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#666666] uppercase font-mono block font-bold">Product Narrative / Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Tell the design, engineering, and craftsmanship stories..."
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-medium placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-bold">Retail Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price || 100}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-bold">Original Price (₹)</label>
                  <input
                    type="number"
                    value={productForm.originalPrice || ''}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[#666666] uppercase font-mono block text-[10px] font-bold">Category</label>
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
                      className="text-[9px] text-[#C9A227] hover:text-[#B68D1F] uppercase font-mono cursor-pointer flex items-center gap-0.5 font-black"
                    >
                      <Plus className="w-2.5 h-2.5" /> +Add
                    </button>
                  </div>
                  <select
                    value={productForm.category || 'Timepieces'}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none cursor-pointer"
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
                      <label className="text-[#666666] uppercase font-mono block font-bold">Primary Image</label>
                      <label className="text-[9px] text-[#C9A227] hover:text-[#B68D1F] uppercase font-mono cursor-pointer flex items-center gap-1 font-black">
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
                        <div className="w-12 h-12 rounded-lg border border-[#E8E1D6] overflow-hidden bg-[#F8F5EF] shrink-0 shadow-sm">
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
                        className="flex-1 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-medium placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[#666666] uppercase font-mono block font-bold">Secondary / Gallery Images</label>
                      <label className="text-[9px] text-[#C9A227] hover:text-[#B68D1F] uppercase font-mono cursor-pointer flex items-center gap-1 font-black">
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
                    <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-[#F8F5EF] rounded-xl border border-dashed border-[#E8E1D6]">
                      {productForm.images?.slice(1).map((img, idx) => (
                        <div key={idx} className="relative group w-16 h-16 rounded-lg border border-[#E8E1D6] overflow-hidden bg-white shadow-sm">
                          <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => {
                              const newImgs = [...(productForm.images || [])];
                              newImgs.splice(idx + 1, 1);
                              setProductForm({...productForm, images: newImgs});
                            }}
                            className="absolute inset-0 bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {(!productForm.images || productForm.images.length <= 1) && (
                        <div className="w-full flex items-center justify-center py-4">
                          <span className="text-[10px] text-[#666666] font-mono font-bold uppercase tracking-widest">No secondary images added</span>
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
                        className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2 text-[10px] text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

              {/* Dynamic feature inputs */}
              <div className="space-y-1.5">
                <label className="text-[#666666] uppercase font-mono block font-bold">Key Handcrafted Feature</label>
                <input
                  type="text"
                  placeholder="Swiss cal. 12 automatic engineering..."
                  value={productForm.features?.[0] || ''}
                  onChange={(e) => {
                    const feat = [...(productForm.features || [])];
                    feat[0] = e.target.value;
                    setProductForm({ ...productForm, features: feat });
                  }}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-medium placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none"
                />
              </div>

              {/* Dynamic variants creator block */}
              <div className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-xl p-4 space-y-4 shadow-inner">
                <span className="text-[10px] font-mono text-[#C9A227] uppercase block font-black tracking-widest">Variants & Inventories ({productForm.variants?.length || 0})</span>
                
                {/* Form fields */}
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Variant name (e.g. Space Black)"
                    value={variantForm.name || ''}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                    className="bg-white border border-[#E8E1D6] rounded px-3 py-2 text-[11px] text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Stock count"
                    value={variantForm.stock || 10}
                    onChange={(e) => setVariantForm({ ...variantForm, stock: Number(e.target.value) })}
                    className="bg-white border border-[#E8E1D6] rounded px-3 py-2 text-[11px] text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={variantForm.type || 'color'}
                    onChange={(e) => setVariantForm({ ...variantForm, type: e.target.value as any })}
                    className="bg-white border border-[#E8E1D6] rounded px-3 py-2 text-[11px] text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none cursor-pointer"
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
                    className="bg-white border border-[#E8E1D6] rounded px-3 py-2 text-[11px] text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddVariantToForm}
                  className="w-full py-2 bg-white hover:bg-[#F8F5EF] text-[#C9A227] font-mono text-[10px] uppercase rounded border border-[#C9A227]/30 cursor-pointer font-black transition-all shadow-sm"
                >
                  Add Variant to Form
                </button>

                {/* Variants List preview inside form */}
                <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {productForm.variants?.map((v, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border border-[#E8E1D6] rounded px-3 py-1.5 text-[10px] font-mono text-[#666666] shadow-sm">
                      <span className="font-bold">{v.name} ({v.type}: {v.value}) - Qty: <span className="text-[#C9A227]">{v.stock}</span></span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVariantFromForm(i)}
                        className="text-red-500 hover:underline font-black cursor-pointer uppercase tracking-tight"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 cursor-pointer shadow-sm group" onClick={() => setProductForm({...productForm, isTrending: !productForm.isTrending})}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${productForm.isTrending ? 'bg-[#C9A227] border-[#C9A227]' : 'bg-white border-[#E8E1D6]'}`}>
                    {productForm.isTrending && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                  </div>
                  <span className="text-[#1F1F1F] font-mono text-[10px] uppercase font-black tracking-widest">Trending Now</span>
                </div>
                <div className="flex items-center gap-3 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 cursor-pointer shadow-sm group" onClick={() => setProductForm({...productForm, isBestSeller: !productForm.isBestSeller})}>
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${productForm.isBestSeller ? 'bg-[#C9A227] border-[#C9A227]' : 'bg-white border-[#E8E1D6]'}`}>
                    {productForm.isBestSeller && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                  </div>
                  <span className="text-[#1F1F1F] font-mono text-[10px] uppercase font-black tracking-widest">Best Seller</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {editingProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(null);
                      setProductForm({ name: '', tagline: '', description: '', price: 100, category: 'Timepieces', subCategory: 'Chrono', images: [''], features: [''], specs: {}, variants: [], isTrending: false, isBestSeller: false });
                    }}
                    className="flex-1 py-3.5 border border-[#E8E1D6] text-[#1F1F1F] text-[10px] font-mono tracking-[0.2em] uppercase rounded-xl hover:bg-white transition-all font-black cursor-pointer shadow-sm"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-[#C9A227] hover:bg-[#B68D1F] text-white text-[10px] font-mono tracking-[0.2em] uppercase rounded-xl transition-all font-black cursor-pointer shadow-md"
                >
                  {editingProduct ? 'Commit Changes' : 'Catalogue Masterpiece'}
                </button>
              </div>
            </form>
          </div>

          {/* Catalogued product listings */}
          <div className="lg:col-span-7 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase font-black">Catalogued Items ({products.length})</h4>

            <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {products.map((p) => (
                <div key={p.id} className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-xl p-5 flex gap-5 items-center shadow-sm hover:border-[#C9A227]/30 transition-all group">
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#E8E1D6] bg-white shrink-0 shadow-sm">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono bg-white text-[#C9A227] px-2 py-0.5 rounded uppercase border border-[#E8E1D6] font-black">{p.category}</span>
                      <h5 className="text-sm font-sans font-bold text-[#1F1F1F] truncate tracking-tight uppercase">{p.name}</h5>
                    </div>
                    <p className="text-sm text-[#C9A227] font-mono mt-1 font-black">₹{p.price}</p>
                    
                    {/* Stock level indicators */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.variants.map((v, idx) => (
                        <span key={idx} className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-black uppercase tracking-tight ${v.stock < 5 ? 'bg-red-50 text-red-500 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {v.name}: {v.stock}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEditProductClick(p)}
                      className="p-2.5 rounded-lg bg-white border border-[#E8E1D6] text-[#666666] hover:text-[#C9A227] hover:border-[#C9A227] cursor-pointer transition-all shadow-sm"
                      title="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2.5 rounded-lg bg-red-50 border border-red-100 text-red-500 hover:bg-red-600 hover:text-white cursor-pointer transition-all shadow-sm"
                      title="Delete Product"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm font-sans">
          <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase font-black">System Delivery Ledger ({orders.length})</h4>

          {orders.length === 0 ? (
            <p className="text-sm font-sans font-medium text-[#666666] text-center py-12">No transactions recorded in delivery ledger.</p>
          ) : (
            <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
              {orders.map((o) => (
                <div key={o.id} className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-xl p-5 space-y-4 shadow-sm group">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1D6] pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black text-[#1F1F1F] uppercase tracking-wider">{o.id}</span>
                        <span className="text-[10px] font-mono bg-white text-[#666666] px-2 py-0.5 rounded border border-[#E8E1D6] font-black">{new Date(o.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-[#666666] font-medium">
                        Patron: <span className="text-[#1F1F1F] font-sans font-bold">{o.userName} ({o.userEmail})</span>
                      </p>
                    </div>

                    {/* Quick status adjust buttons */}
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <button
                        onClick={() => downloadLabel(o)}
                        className="p-2 rounded-lg bg-white border border-[#E8E1D6] text-[#666666] hover:text-[#C9A227] hover:border-[#C9A227] cursor-pointer transition-all flex items-center gap-2 px-3 shadow-sm"
                        title="Download Label PDF"
                      >
                        <QrCode className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-black">Label</span>
                      </button>
                      <button
                        onClick={() => downloadInvoice(o)}
                        className="p-2 rounded-lg bg-white border border-[#E8E1D6] text-[#666666] hover:text-[#C9A227] hover:border-[#C9A227] cursor-pointer transition-all flex items-center gap-2 px-3 shadow-sm"
                        title="Download Details PDF"
                      >
                        <Download className="w-4 h-4" />
                        <span className="text-[10px] uppercase font-black">Invoice</span>
                      </button>
                      <span className="text-[#666666] font-bold uppercase text-[10px] tracking-tight">Track Status:</span>
                      <select
                        value={o.deliveryStatus}
                        onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value as any, o.trackingNumber)}
                        className="bg-white border border-[#E8E1D6] rounded-lg px-3 py-1.5 text-[#1F1F1F] text-[11px] font-bold focus:border-[#C9A227]/50 focus:outline-none cursor-pointer shadow-sm"
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
                      <span className="text-[#666666] font-mono block font-black uppercase text-[10px] tracking-widest">Logistics Code:</span>
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
                          className="bg-white border border-[#E8E1D6] rounded-lg px-3 py-2 text-[11px] text-[#1F1F1F] font-bold flex-1 focus:border-[#C9A227]/50 focus:outline-none shadow-sm"
                        />
                        <span className="text-[10px] font-mono text-emerald-600 flex items-center font-black uppercase">Auto-Save</span>
                      </div>
                    </div>

                    <div className="text-right text-xs font-mono space-y-1">
                      <p className="text-[#666666] font-bold">Total Cleared Value: <span className="text-[#C9A227] font-black text-sm">₹{o.total}</span></p>
                      <p className="text-[10px] text-[#666666] font-bold uppercase tracking-tighter">Gateway: <span className="text-[#1F1F1F]">{o.paymentMethod.toUpperCase()}</span> | Ref: <span className="text-[#1F1F1F]">{o.paymentId}</span></p>
                    </div>
                  </div>

                  {/* Item quantities mapping */}
                  <div className="bg-white border border-[#E8E1D6] rounded-xl p-4 text-xs space-y-3 shadow-inner">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-[#1F1F1F] gap-2">
                        <div className="flex flex-col gap-1.5">
                          <span className="font-bold uppercase tracking-tight text-[11px]">• {item.product.name} <span className="text-[#C9A227] ml-2 font-black">[Qty: {item.quantity}]</span> {item.selectedVariant && <span className="text-[#666666] ml-1 font-medium">({item.selectedVariant.name})</span>}</span>
                          {item.status && item.status !== 'active' && (
                            <div className="flex items-center gap-3">
                              <span className="inline-block px-2 py-0.5 rounded border border-[#C9A227]/30 text-[#C9A227] text-[9px] uppercase tracking-[0.2em] bg-[#F8F5EF] font-black">
                                {item.status.replace('_', ' ')}
                              </span>
                              {item.status === 'cancel_requested' && (
                                <button 
                                  onClick={() => EcommerceService.updateOrderItemStatus(o.id, item.id, 'cancelled').then(loadAllAdminData)}
                                  className="text-[9px] uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors font-black border-b border-emerald-600/30 cursor-pointer"
                                >
                                  Approve Cancel
                                </button>
                              )}
                              {item.status === 'return_requested' && (
                                <button 
                                  onClick={() => EcommerceService.updateOrderItemStatus(o.id, item.id, 'returned').then(loadAllAdminData)}
                                  className="text-[9px] uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors font-black border-b border-emerald-600/30 cursor-pointer"
                                >
                                  Approve Return
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="font-mono text-[#1F1F1F] text-right font-black">₹{(item.product.price + (item.selectedVariant?.additionalPrice || 0)) * item.quantity}</span>
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
          <div className="lg:col-span-5 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-black">Vouchers Registry</span>
              <h4 className="text-base font-sans font-bold text-[#1F1F1F] tracking-tight uppercase">Generate New Coupon</h4>
            </div>

            <form onSubmit={handleCouponSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EXTRAORDINAIRE"
                  value={couponForm.code || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Discount Type</label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as any })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Sum (₹)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Discount Value</label>
                  <input
                    type="number"
                    required
                    value={couponForm.value}
                    onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Min Spend (₹)</label>
                  <input
                    type="number"
                    value={couponForm.minSpend || 0}
                    onChange={(e) => setCouponForm({ ...couponForm, minSpend: Number(e.target.value) })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#C9A227] hover:bg-[#B68D1F] text-white text-[10px] font-mono tracking-[0.2em] uppercase rounded-xl transition-all font-black cursor-pointer shadow-md"
              >
                Mint Coupon Voucher
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase font-black">Registered Active Coupons ({coupons.length})</h4>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {coupons.map((c) => (
                <div key={c.code} className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-xl p-5 flex justify-between items-center text-xs font-mono shadow-sm group">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[#1F1F1F] font-black bg-white border border-[#E8E1D6] px-3 py-1 rounded text-sm shadow-sm">{c.code}</span>
                      <span className="text-[#C9A227] font-black uppercase tracking-widest text-[10px]">{c.discountType === 'percentage' ? `${c.value}% discount` : `₹${c.value} reduction`}</span>
                    </div>
                    <p className="text-[10px] text-[#666666] font-bold uppercase tracking-widest">Min spend: <span className="text-[#1F1F1F]">₹{c.minSpend || 0}</span> • Expires: <span className="text-[#1F1F1F]">{c.expiryDate}</span></p>
                  </div>

                  <button
                    onClick={() => handleDeleteCoupon(c.code)}
                    className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
                    title="Burn Coupon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {coupons.length === 0 && (
                <div className="py-12 text-center text-[#666666] font-medium uppercase text-xs tracking-widest border border-dashed border-[#E8E1D6] rounded-xl">
                  No active vouchers in registry
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: CATEGORIES MANAGER (DARK LUXURY FORM AND GRID)
          ======================================================== */}
      {activeTab === 'categories' && (
        <div id="admin-categories-view" className="space-y-8 font-sans">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E1D6] pb-5">
            <div>
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-black">Catalogue Core Structure</span>
              <h3 className="text-2xl font-sans tracking-tight text-[#1F1F1F] font-bold mt-1 uppercase">
                Luxury Boutique <span className="italic font-serif text-[#C9A227] lowercase">Collections</span>
              </h3>
              <p className="text-xs text-[#666666] font-sans mt-1 font-medium">
                Establish and configure exquisite collections that display in sophisticated circled nodes on the client storefront.
              </p>
            </div>
            
            <div className="flex gap-4 text-xs font-mono">
              <div className="bg-white border border-[#E8E1D6] rounded-xl px-4 py-2.5 shadow-sm">
                <span className="text-[#666666] block text-[9px] uppercase tracking-[0.2em] font-black">Total Categories</span>
                <span className="text-[#C9A227] font-black text-sm">{availableCategories.length}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Column 1: Category Builder Form (Left) */}
            <div className="lg:col-span-5 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm">
              <div>
                <span className="text-[9px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-black">Curator Form</span>
                <h4 className="text-base font-sans font-bold text-[#1F1F1F] tracking-tight uppercase">
                  {editingCategory ? 'Update Collection Aesthetics' : 'Design New Collection'}
                </h4>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-bold">Collection Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Imperial Timepieces"
                    value={categoryForm.name || ''}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold placeholder-[#666666]/50 focus:border-[#C9A227]/50 focus:outline-none"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
          {/* Add / Edit offer form */}
          <div className="lg:col-span-5 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-black">Promotions Engine</span>
              <h4 className="text-base font-sans font-bold text-[#1F1F1F] tracking-tight uppercase">
                {editingOffer ? 'Edit Special Offer' : 'Create Special Offer'}
              </h4>
            </div>

            <form onSubmit={handleOfferSubmit} className="space-y-4 text-xs font-sans">
              <div className="space-y-1">
                <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Offer Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer Collection 2026"
                  value={offerForm.title || ''}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Offer Description</label>
                <textarea
                  rows={2}
                  placeholder="The narrative for this promotion..."
                  value={offerForm.description || ''}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold resize-none focus:border-[#C9A227]/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Image URL</label>
                  <label className="text-[9px] text-[#C9A227] hover:text-[#B68D1F] uppercase font-mono cursor-pointer flex items-center gap-1 font-black">
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
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Promo Code</label>
                  <input
                    type="text"
                    placeholder="e.g. LUXE20"
                    value={offerForm.code || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Link / URL</label>
                  <input
                    type="text"
                    placeholder="/shop/watches"
                    value={offerForm.link || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, link: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Discount Value</label>
                  <input
                    type="number"
                    value={offerForm.discountValue || ''}
                    onChange={(e) => setOfferForm({ ...offerForm, discountValue: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Type</label>
                  <select
                    value={offerForm.discountType || 'percentage'}
                    onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value as any })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none cursor-pointer"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Sum (₹)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-3 cursor-pointer group shadow-sm" onClick={() => setOfferForm({...offerForm, isActive: !offerForm.isActive})}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${offerForm.isActive ? 'bg-[#C9A227] border-[#C9A227]' : 'border-[#E8E1D6] bg-white'}`}>
                  {offerForm.isActive && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                </div>
                <span className="text-[#666666] font-mono text-[10px] uppercase font-black tracking-widest group-hover:text-[#1F1F1F]">Active & Visible</span>
              </div>

              <div className="flex gap-3">
                {editingOffer && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingOffer(null);
                      setOfferForm({ title: '', description: '', image: '', isActive: true, link: '' });
                    }}
                    className="flex-1 py-4 border border-[#E8E1D6] bg-white text-[#666666] text-[10px] font-mono tracking-[0.2em] uppercase rounded-xl hover:bg-[#F8F5EF] transition-all font-black shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#C9A227] hover:bg-[#B68D1F] text-white font-mono font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {editingOffer ? 'Commit Offer' : 'Launch Offer'}
                </button>
              </div>
            </form>
          </div>

          {/* Offer listings */}
          <div className="lg:col-span-7 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase font-black">Active Promotions ({offers.length})</h4>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {offers.map((off) => (
                <div key={off.id} className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-xl p-5 flex gap-5 items-center shadow-sm group">
                  <div className="w-24 h-16 rounded-xl overflow-hidden border border-[#E8E1D6] bg-white shrink-0 shadow-sm">
                    <img src={off.image} alt={off.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase border font-black tracking-widest ${off.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {off.isActive ? 'Live' : 'Draft'}
                      </span>
                      <h5 className="text-sm font-sans font-bold text-[#1F1F1F] truncate tracking-tight uppercase">{off.title}</h5>
                    </div>
                    <p className="text-[10px] text-[#666666] truncate mt-0.5 font-medium">{off.description}</p>
                    {off.code && (
                      <div className="flex items-center gap-2 mt-2">
                        <Tag className="w-3 h-3 text-[#C9A227]" />
                        <span className="text-[10px] font-mono text-[#C9A227] font-black uppercase tracking-widest">{off.code}</span>
                        {off.discountValue && (
                          <span className="text-[10px] text-[#666666] font-bold">
                            • {off.discountType === 'percentage' ? `${off.discountValue}% OFF` : `₹${off.discountValue} OFF`}
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
                      className="p-3 rounded-xl bg-white border border-[#E8E1D6] text-[#666666] hover:text-[#C9A227] hover:border-[#C9A227] cursor-pointer transition-all shadow-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteOffer(off.id)}
                      className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
          {/* Add / Edit hero slide form */}
          <div className="lg:col-span-5 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-black">Landing Page Control</span>
              <h4 className="text-base font-sans font-bold text-[#1F1F1F] tracking-tight uppercase">
                {editingHero ? 'Edit Hero Slide' : 'Create Hero Slide'}
              </h4>
            </div>

            <form onSubmit={handleHeroSubmit} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Badge / Label</label>
                  <input
                    type="text"
                    placeholder="e.g. NEW ARRIVALS"
                    value={heroForm.badge || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, badge: e.target.value.toUpperCase() })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Main Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Hero Headline"
                    value={heroForm.title || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Slide Description</label>
                <textarea
                  rows={2}
                  placeholder="Supporting text for the hero banner..."
                  value={heroForm.description || ''}
                  onChange={(e) => setHeroForm({ ...heroForm, description: e.target.value })}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold resize-none focus:border-[#C9A227]/50 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Background Image</label>
                  <label className="text-[9px] text-[#C9A227] hover:text-[#B68D1F] uppercase font-mono cursor-pointer flex items-center gap-1 font-black">
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
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Button Text</label>
                  <input
                    type="text"
                    placeholder="SHOP NOW"
                    value={heroForm.buttonText || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, buttonText: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#666666] uppercase font-mono block font-black text-[10px] tracking-widest">Link / URL</label>
                  <input
                    type="text"
                    placeholder="/shop"
                    value={heroForm.link || ''}
                    onChange={(e) => setHeroForm({ ...heroForm, link: e.target.value })}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-[#1F1F1F] font-bold focus:border-[#C9A227]/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-3 cursor-pointer group shadow-sm" onClick={() => setHeroForm({...heroForm, isActive: !heroForm.isActive})}>
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${heroForm.isActive ? 'bg-[#C9A227] border-[#C9A227]' : 'border-[#E8E1D6] bg-white'}`}>
                  {heroForm.isActive && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                </div>
                <span className="text-[#666666] font-mono text-[10px] uppercase font-black tracking-widest group-hover:text-[#1F1F1F]">Active & Visible</span>
              </div>

              <div className="flex gap-3">
                {editingHero && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingHero(null);
                      setHeroForm({ badge: '', title: '', description: '', image: '', buttonText: 'SHOP NOW', link: '/shop', isActive: true });
                    }}
                    className="flex-1 py-4 border border-[#E8E1D6] bg-white text-[#666666] text-[10px] font-mono tracking-[0.2em] uppercase rounded-xl hover:bg-[#F8F5EF] transition-all font-black shadow-sm cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 py-4 bg-[#C9A227] hover:bg-[#B68D1F] text-white font-mono font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer"
                >
                  {editingHero ? 'Update Slide' : 'Add Hero Slide'}
                </button>
              </div>
            </form>
          </div>

          {/* Hero slides listings */}
          <div className="lg:col-span-7 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase font-black">Hero Banner Slides ({heroSlides.length})</h4>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {heroSlides.map((slide) => (
                <div key={slide.id} className="border border-[#E8E1D6] bg-[#F8F5EF] rounded-xl p-5 flex gap-5 items-center shadow-sm group">
                  <div className="w-28 h-20 rounded-xl overflow-hidden border border-[#E8E1D6] bg-white shrink-0 shadow-sm relative group-hover:border-[#C9A227]/50 transition-all">
                    <img src={slide.image} alt={slide.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-transparent transition-all">
                      <span className="text-[7px] font-mono font-black bg-white/90 text-[#1F1F1F] px-1.5 py-0.5 rounded shadow-sm uppercase">{slide.badge}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase border font-black tracking-widest ${slide.isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {slide.isActive ? 'Live' : 'Hidden'}
                      </span>
                      <h5 className="text-sm font-sans font-bold text-[#1F1F1F] truncate tracking-tight uppercase">{slide.title}</h5>
                    </div>
                    <p className="text-[10px] text-[#666666] truncate mt-0.5 font-medium">{slide.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest font-black border border-[#C9A227]/20 px-2 py-0.5 rounded bg-[#F8F5EF]">Btn: {slide.buttonText}</span>
                      <span className="text-[9px] font-mono text-[#666666] uppercase tracking-widest font-bold">| Path: {slide.link}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setEditingHero(slide);
                        setHeroForm({ ...slide });
                      }}
                      className="p-3 rounded-xl bg-white border border-[#E8E1D6] text-[#666666] hover:text-[#C9A227] hover:border-[#C9A227] cursor-pointer transition-all shadow-sm"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteHero(slide.id)}
                      className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {heroSlides.length === 0 && (
                <div className="text-center py-12 text-[#666666] font-medium uppercase text-xs tracking-widest border border-dashed border-[#E8E1D6] rounded-xl">
                  No hero slides configured
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
          <div className="lg:col-span-5 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <span className="text-[9px] font-mono tracking-[0.2em] text-[#C9A227] uppercase block font-black">Security Protocols</span>
              <h4 className="text-base font-sans font-bold text-[#1F1F1F] tracking-tight uppercase">Authorize New Administrator</h4>
              <p className="text-[10px] text-[#666666] mt-1 font-medium">Authorized emails will be granted full access to this control panel upon Google login.</p>
            </div>

            <form onSubmit={handleAuthorizeAdmin} className="space-y-4 font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">Admin Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@zylo.luxury"
                  value={adminEmailForm}
                  onChange={(e) => setAdminEmailForm(e.target.value)}
                  className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-3 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#C9A227] hover:bg-[#B68D1F] text-white font-mono font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer"
              >
                Authorize Access
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-[#E8E1D6] rounded-2xl p-6 space-y-4 shadow-sm">
            <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase font-black">Authorized Personnel ({authorizedAdmins.length})</h4>
            <div className="space-y-3">
              {authorizedAdmins.map((email) => (
                <div key={email} className="flex items-center justify-between p-5 bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl shadow-sm group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-[#E8E1D6] shadow-sm">
                      <Users className="w-5 h-5 text-[#C9A227]" />
                    </div>
                    <div>
                      <p className="text-xs font-sans text-[#1F1F1F] font-bold">{email}</p>
                      {email === 'webz3321@gmail.com' && (
                        <span className="text-[9px] font-mono text-[#C9A227] uppercase tracking-widest font-black">Primary Administrator</span>
                      )}
                    </div>
                  </div>
                  {email !== 'webz3321@gmail.com' && (
                    <button 
                      onClick={() => handleRevokeAdmin(email)}
                      className="p-3 bg-white border border-[#E8E1D6] text-[#666666] hover:text-red-500 hover:border-red-100 transition-all rounded-xl shadow-sm cursor-pointer"
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-[#E8E1D6] rounded-2xl p-8 shadow-sm">
              <h3 className="text-xl font-sans tracking-tight text-[#1F1F1F] font-bold mb-6 uppercase">
                Brand <span className="italic font-serif text-[#C9A227] lowercase">Identity</span>
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
                  <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">Brand Name</label>
                  <input
                    type="text"
                    required
                    value={siteSettings.brandName}
                    onChange={(e) => setSiteSettings({...siteSettings, brandName: e.target.value})}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">Logo URL</label>
                  <input
                    type="url"
                    required
                    value={siteSettings.logoUrl}
                    onChange={(e) => setSiteSettings({...siteSettings, logoUrl: e.target.value})}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">Favicon URL</label>
                  <input
                    type="url"
                    required
                    value={siteSettings.faviconUrl}
                    onChange={(e) => setSiteSettings({...siteSettings, faviconUrl: e.target.value})}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">About Us Content</label>
                  <textarea
                    rows={6}
                    required
                    value={siteSettings.aboutContent || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, aboutContent: e.target.value})}
                    placeholder="Tell your brand story..."
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">Support Phone</label>
                  <input
                    type="tel"
                    value={siteSettings.supportPhone || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, supportPhone: e.target.value})}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">Support WhatsApp</label>
                  <input
                    type="text"
                    value={siteSettings.supportWhatsApp || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, supportWhatsApp: e.target.value})}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-[#666666] tracking-[0.2em] block uppercase font-black">Support Instagram ID</label>
                  <input
                    type="text"
                    value={siteSettings.supportInstagram || ''}
                    onChange={(e) => setSiteSettings({...siteSettings, supportInstagram: e.target.value})}
                    className="w-full bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl px-4 py-2.5 text-xs text-[#1F1F1F] font-bold focus:outline-none focus:border-[#C9A227]/50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#C9A227] hover:bg-[#B68D1F] text-white font-mono font-black text-[10px] uppercase tracking-[0.2em] rounded-xl transition-all shadow-md cursor-pointer"
                >
                  Save Global Settings
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-[#E8E1D6] rounded-2xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-8">
              <h4 className="text-xs font-mono text-[#C9A227] tracking-[0.2em] uppercase font-black">Visual Preview</h4>
              
              <div className="space-y-4 w-full">
                <p className="text-[10px] font-mono text-[#666666] uppercase tracking-[0.2em] font-black">Main Header Logo</p>
                <div className="bg-[#F8F5EF] border border-[#E8E1D6] rounded-2xl p-12 flex items-center justify-center shadow-inner">
                  {siteSettings.logoUrl && siteSettings.logoUrl !== 'https://images.unsplash.com/photo-1583391733956-6c7827447678?auto=format&fit=crop&q=80&w=100' ? (
                    <img src={siteSettings.logoUrl} alt="Logo Preview" className="h-16 object-contain" />
                  ) : (
                    <ZyloLogo className="h-16 text-[#C9A227]" />
                  )}
                </div>
              </div>

              <div className="space-y-4 w-full max-w-sm">
                <p className="text-[10px] font-mono text-[#666666] uppercase tracking-[0.2em] font-black">Favicon / Browser Tab</p>
                <div className="bg-[#F8F5EF] border border-[#E8E1D6] rounded-xl p-5 flex items-center gap-4 shadow-inner">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm border border-[#E8E1D6]">
                    {siteSettings.faviconUrl ? (
                      <img src={siteSettings.faviconUrl} alt="Favicon Preview" className="w-full h-full object-contain" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-[#C9A227]" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-sans text-[#1F1F1F] font-bold truncate w-40">{siteSettings.brandName || 'Zylo'}</p>
                    <p className="text-[10px] font-mono text-[#666666] truncate w-40 font-medium">https://zylo.luxury</p>
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
