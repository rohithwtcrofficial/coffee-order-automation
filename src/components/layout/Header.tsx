// src/components/Header.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogOut, 
  User, 
  Bell, 
  Search, 
  Menu, 
  X,
  ShoppingBag,
  Package,
  Coffee,
  ChevronDown,
  Mail,
  CheckCheck,
  Users,
  IndianRupee
} from 'lucide-react';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, orderBy, limit, onSnapshot, updateDoc, doc, getDocs, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Order, Customer, Product } from '@/lib/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { useAuth } from '@/lib/contexts/AuthContext';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

interface HeaderProps {
  orders?: Order[];
  customers?: Customer[];
  products?: Product[];
}

interface AdminData {
  id: string;
  name: string;
  email: string;
  role: string;
  photoURL?: string;
  phone?: string;
  department?: string;
  createdAt?: any;
}

interface NotificationData {
  id: string;
  text: string;
  time: string;
  unread: boolean;
  type: string;
  status: string;
  orderId?: string;
  email: string;
  sentAt: any;
}

// Initialize Firebase only if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

export function Header({ orders = [], customers = [], products = [] }: HeaderProps) {
  const router = useRouter();
  const { signOut: authSignOut, admin: authAdmin, user } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Local state for when props aren't provided
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  // Use props if provided, otherwise use local state
  const effectiveOrders = orders.length > 0 ? orders : localOrders;
  const effectiveCustomers = customers.length > 0 ? customers : localCustomers;
  const effectiveProducts = products.length > 0 ? products : localProducts;

  // Use admin from AuthContext directly instead of duplicating state
  const admin = useMemo(() => {
    if (authAdmin) {
      return {
        id: authAdmin.id,
        name: authAdmin.name,
        email: authAdmin.email,
        role: authAdmin.role,
        photoURL: (authAdmin as any).photoURL,
        phone: (authAdmin as any).phone,
        department: (authAdmin as any).department,
        createdAt: authAdmin.createdAt,
      };
    }
    return null;
  }, [authAdmin]);

  // Calculate stats from effective data
  const stats = useMemo(() => {
    const totalRevenue = effectiveOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return [
      { 
        label: 'Orders', 
        value: effectiveOrders.length.toString(), 
        icon: ShoppingBag, 
        color: 'bg-blue-500', 
        link: '/orders' 
      },
      { 
        label: 'Customers', 
        value: effectiveCustomers.length.toString(), 
        icon: Users, 
        color: 'bg-green-500', 
        link: '/customers' 
      },
      { 
        label: 'Revenue', 
        value: formatCurrency(totalRevenue), 
        icon: IndianRupee, 
        color: 'bg-purple-500', 
        link: '/orders' 
      },
    ];
  }, [effectiveOrders, effectiveCustomers]);

  // Format time ago
  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    const now = new Date();
    const sentDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const seconds = Math.floor((now.getTime() - sentDate.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Get email type label
  const getEmailTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ORDER_DELIVERED': 'Order Delivered',
      'ORDER_CONFIRMED': 'Order Confirmed',
      'ORDER_SHIPPED': 'Order Shipped',
      'ORDER_CANCELLED': 'Order Cancelled',
      'WELCOME': 'Welcome Email',
      'PASSWORD_RESET': 'Password Reset'
    };
    return labels[type] || type;
  };

  // Fetch data from Firebase if not provided via props
  useEffect(() => {
    // Don't fetch if signing out or not authenticated
    if (isSigningOut || !auth.currentUser) {
      return;
    }
    
    if (orders.length === 0 || customers.length === 0 || products.length === 0) {
      const fetchData = async () => {
        try {
          // Double-check authentication before fetching
          if (isSigningOut || !auth.currentUser) return;
          
          if (orders.length === 0) {
            const ordersSnapshot = await getDocs(collection(db, 'orders'));
            const ordersData = ordersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Order[];
            if (!isSigningOut) setLocalOrders(ordersData);
          }

          if (customers.length === 0) {
            const customersSnapshot = await getDocs(collection(db, 'customers'));
            const customersData = customersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Customer[];
            if (!isSigningOut) setLocalCustomers(customersData);
          }

          if (products.length === 0) {
            const productsSnapshot = await getDocs(collection(db, 'products'));
            const productsData = productsSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Product[];
            if (!isSigningOut) setLocalProducts(productsData);
          }
        } catch (error: any) {
          // Only log error if not signing out and not a permission error
          if (!isSigningOut && error?.code !== 'permission-denied') {
            console.error('Error fetching data:', error);
          }
        }
      };

      fetchData();
    }
  }, [orders.length, customers.length, products.length, isSigningOut]);

  // Listen to notifications
  useEffect(() => {
    // Don't set up listener if signing out or not authenticated
    if (isSigningOut || !auth.currentUser) {
      return;
    }

    const q = query(
      collection(db, 'emailLogs'),
      orderBy('sentAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Check if signing out before processing
      if (isSigningOut) return;
      
      const emailNotifications = snapshot.docs.map((doc) => {
        const data = doc.data();
        const isUnread = !data.read;
        
        return {
          id: doc.id,
          text: `${getEmailTypeLabel(data.emailType)} sent to ${data.recipientEmail}`,
          time: getTimeAgo(data.sentAt),
          unread: isUnread,
          type: data.emailType,
          status: data.status,
          orderId: data.orderId,
          email: data.recipientEmail,
          sentAt: data.sentAt
        };
      });
      setNotifications(emailNotifications);
    }, (error: any) => {
      // Only log error if not signing out
      if (!isSigningOut) {
        console.error('Error listening to notifications:', error);
      }
    });

    return () => unsubscribe();
  }, [isSigningOut]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, 'emailLogs', notificationId);
      await updateDoc(notifRef, { 
        read: true,
        readAt: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifs = notifications.filter(n => n.unread);
      const updatePromises = unreadNotifs.map(notif => 
        updateDoc(doc(db, 'emailLogs', notif.id), { 
          read: true,
          readAt: new Date()
        })
      );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: NotificationData) => {
    await markAsRead(notification.id);
    setShowNotifications(false);
    
    if (notification.orderId) {
      router.push(`/orders/${notification.orderId}`);
    } else {
      switch (notification.type) {
        case 'WELCOME':
          router.push('/customers');
          break;
        case 'PASSWORD_RESET':
          router.push('/customers');
          break;
        default:
          router.push('/orders');
      }
    }
  };

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results: any[] = [];
    const searchLower = query.toLowerCase();
    
    effectiveOrders.forEach((order) => {
      const customer = effectiveCustomers.find(c => c.id === order.customerId);
      const customerName = customer?.name || '';
      const customerEmail = customer?.email || '';
      
      if (
        order.id.toLowerCase().includes(searchLower) ||
        (order.orderNumber && order.orderNumber.toLowerCase().includes(searchLower)) ||
        customerName.toLowerCase().includes(searchLower) ||
        customerEmail.toLowerCase().includes(searchLower)
      ) {
        results.push({
          id: order.id,
          type: 'Order',
          title: `Order ${order.orderNumber || '#' + order.id.substring(0, 8)}`,
          subtitle: customerEmail || customerName || 'N/A',
          link: `/orders/${order.id}`
        });
      }
    });

    effectiveProducts.forEach((product) => {
      if (
        (product.name && product.name.toLowerCase().includes(searchLower)) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      ) {
        results.push({
          id: product.id,
          type: 'Product',
          title: product.name || 'Unnamed Product',
          subtitle: product.description || 'No description',
          link: `/products/${product.id}/edit`
        });
      }
    });

    effectiveCustomers.forEach((customer) => {
      if (
        (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      ) {
        results.push({
          id: customer.id,
          type: 'Customer',
          title: customer.name || 'Unknown',
          subtitle: customer.email || 'No email',
          link: `/customers/${customer.id}`
        });
      }
    });

    setSearchResults(results.slice(0, 10));
    setIsSearching(false);
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleSignOut = async () => {
    try {
      // Set signing out state to prevent data fetching
      setIsSigningOut(true);
      
      // Close menus
      setShowUserMenu(false);
      setShowNotifications(false);
      setShowMobileMenu(false);
      
      // Clear local state
      setNotifications([]);
      setLocalOrders([]);
      setLocalCustomers([]);
      setLocalProducts([]);
      setSearchQuery('');
      setSearchResults([]);
      
      // Use the AuthContext signOut method
      await authSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
      // Force redirect even on error
      window.location.replace('/login');
    }
  };

  const getAdminInitials = (name: string) => {
    if (!name) return 'AD';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!admin) {
    return (
      <header className="bg-linear-to-r from-amber-50 via-white to-orange-50 border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-lg bg-white">
                <img 
                  src="/logo.png" 
                  alt="Western Terrain Coffee Roasters Logo" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      parent.className = 'w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg';
                      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                      icon.setAttribute('class', 'text-white');
                      icon.setAttribute('width', '24');
                      icon.setAttribute('height', '24');
                      icon.setAttribute('viewBox', '0 0 24 24');
                      icon.setAttribute('fill', 'none');
                      icon.setAttribute('stroke', 'currentColor');
                      icon.setAttribute('stroke-width', '2');
                      icon.setAttribute('stroke-linecap', 'round');
                      icon.setAttribute('stroke-linejoin', 'round');
                      icon.innerHTML = '<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>';
                      parent.appendChild(icon);
                    }
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent">
                  Western Terrain Coffee Roasters
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">Loading...</p>
              </div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header className="bg-linear-to-r from-amber-50 via-white to-orange-50 border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-opacity-90">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
              </button>
              
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shadow-lg bg-white">
                  <img 
                    src="/logo.png" 
                    alt="Western Terrain Coffee Roasters Logo" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement;
                      if (parent) {
                        parent.className = 'w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg';
                        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                        icon.setAttribute('class', 'text-white');
                        icon.setAttribute('width', '24');
                        icon.setAttribute('height', '24');
                        icon.setAttribute('viewBox', '0 0 24 24');
                        icon.setAttribute('fill', 'none');
                        icon.setAttribute('stroke', 'currentColor');
                        icon.setAttribute('stroke-width', '2');
                        icon.setAttribute('stroke-linecap', 'round');
                        icon.setAttribute('stroke-linejoin', 'round');
                        icon.innerHTML = '<path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line>';
                        parent.appendChild(icon);
                      }
                    }}
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent">
                    Western Terrain Coffee Roasters
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600">Dashboard & Management</p>
                </div>
              </Link>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search products, orders, customers..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
                />
                
                {searchQuery && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-8 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-600 mt-3">Searching...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div>
                        <div className="p-3 bg-linear-to-r from-amber-50 to-orange-50 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-700">Found {searchResults.length} results</p>
                        </div>
                        {searchResults.map((result) => (
                          <Link
                            key={result.id}
                            href={result.link}
                            onClick={() => setSearchQuery('')}
                            className="block p-4 hover:bg-gray-50 transition-colors border-b border-gray-50"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                    {result.type}
                                  </span>
                                  <h4 className="text-sm font-medium text-gray-900">{result.title}</h4>
                                </div>
                                <p className="text-xs text-gray-600 mt-1">{result.subtitle}</p>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Package size={48} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-600">No results found</p>
                        <p className="text-xs text-gray-500 mt-1">Try searching with different keywords</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Search size={20} className="text-gray-600" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Bell size={20} className="text-gray-600" />
                  {unreadCount > 0 && (
                    <>
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    </>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900">Email Notifications</h3>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                          </p>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                          >
                            <CheckCheck size={14} />
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 cursor-pointer ${
                              notif.unread ? 'bg-amber-50/30' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`${notif.status === 'success' ? 'bg-green-100' : 'bg-red-100'} p-2 rounded-lg`}>
                                <Mail size={16} className={notif.status === 'success' ? 'text-green-600' : 'text-red-600'} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-gray-900 font-medium">{notif.text}</p>
                                  {notif.unread && (
                                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 shrink-0"></div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                                    notif.status === 'success' 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {notif.status}
                                  </span>
                                  <span className="text-xs text-gray-500">{notif.time}</span>
                                </div>
                                {notif.orderId && (
                                  <p className="text-xs text-gray-500 mt-1">Order ID: {notif.orderId.substring(0, 12)}...</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell size={48} className="mx-auto text-gray-300 mb-3" />
                          <p className="text-sm text-gray-600">No notifications yet</p>
                          <p className="text-xs text-gray-500 mt-1">Email notifications will appear here</p>
                        </div>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
                        <button className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="p-1 rounded-full hover:ring-2 hover:ring-amber-400 transition-all"
                >
                  {admin.photoURL ? (
                    <img
                      src={admin.photoURL}
                      alt={admin.name}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover shadow-md border-2 border-white"
                    />
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-linear-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                      <span className="text-sm sm:text-base font-bold text-white">
                        {getAdminInitials(admin.name)}
                      </span>
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-6 bg-linear-to-r from-amber-50 to-orange-50 border-b border-gray-100">
                      <div className="flex flex-col items-center text-center">
                        {admin.photoURL ? (
                          <img
                            src={admin.photoURL}
                            alt={admin.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-amber-500 shadow-lg mb-3"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-linear-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white mb-3">
                            <span className="text-2xl font-bold text-white">{getAdminInitials(admin.name)}</span>
                          </div>
                        )}
                        <h3 className="font-bold text-gray-900 text-lg">{admin.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{admin.email}</p>
                        {admin.role && (
                          <span className="mt-2 px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full capitalize">
                            {admin.role.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2">
                      <Link
                        href="/profile"
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User size={18} className="text-gray-600" />
                        <span className="text-sm text-gray-700">My Profile</span>
                      </Link>
                      <div className="my-2 border-t border-gray-100"></div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 rounded-lg transition-colors text-left"
                      >
                        <LogOut size={18} className="text-red-600" />
                        <span className="text-sm text-red-600 font-medium">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 pb-4 border-t border-gray-100 pt-4">
            {stats.map((stat, index) => (
              <Link
                key={index}
                href={stat.link}
                className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex-1 group"
              >
                <div className={`${stat.color} p-2.5 rounded-lg group-hover:scale-110 transition-transform`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                  <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute top-16 left-0 right-0 bg-white shadow-xl p-4 m-4 rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-2">
              <div className="p-4 bg-linear-to-r from-amber-50 to-orange-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>
                <div className="space-y-2">
                  {stats.map((stat, index) => (
                    <Link
                      key={index}
                      href={stat.link}
                      className="flex items-center justify-between p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`${stat.color} p-2 rounded-lg`}>
                          <stat.icon size={16} className="text-white" />
                        </div>
                        <span className="text-sm text-gray-700">{stat.label}</span>
                      </div>
                      <span className="font-bold text-gray-900">{stat.value}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(showUserMenu || showNotifications || searchQuery) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
            setSearchQuery('');
          }}
        />
      )}
    </>
  );
}