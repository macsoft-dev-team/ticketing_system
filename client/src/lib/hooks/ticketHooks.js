import { useState, useEffect, useMemo } from 'react';

// Custom hook for debounced search
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for product search with filtering
export const useProductSearch = (products, searchTerm, filters = {}) => {
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter(product => {
      // Text search
      const matchesSearch = !debouncedSearchTerm || 
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        product.id.toString().includes(debouncedSearchTerm);

      // Price range filter
      const matchesPrice = (!filters.minPrice || product.price >= filters.minPrice) &&
        (!filters.maxPrice || product.price <= filters.maxPrice);

      // Stock availability filter
      const matchesStock = !filters.inStockOnly || product.stock > 0;

      // Category filter (if products have categories)
      const matchesCategory = !filters.category || product.category === filters.category;

      return matchesSearch && matchesPrice && matchesStock && matchesCategory;
    });
  }, [products, debouncedSearchTerm, filters]);

  return filteredProducts;
};

// Custom hook for managing selected products in spare request
export const useSpareRequest = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);

  const addProduct = (product) => {
    setSelectedProducts(prev => {
      const existingIndex = prev.findIndex(p => p.id === product.id);
      
      if (existingIndex >= 0) {
        // Product already exists, increment quantity
        return prev.map((p, index) => 
          index === existingIndex 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      } else {
        // Add new product
        return [...prev, { ...product, quantity: 1 }];
      }
    });
  };

  const removeProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    const newQuantity = parseInt(quantity);
    
    if (newQuantity <= 0) {
      removeProduct(productId);
      return;
    }

    setSelectedProducts(prev =>
      prev.map(p => 
        p.id === productId 
          ? { ...p, quantity: newQuantity }
          : p
      )
    );
  };

  const clearAll = () => {
    setSelectedProducts([]);
  };

  const getTotalAmount = () => {
    return selectedProducts.reduce((sum, product) => 
      sum + (product.price * product.quantity), 0
    );
  };

  const getTotalItems = () => {
    return selectedProducts.reduce((sum, product) => sum + product.quantity, 0);
  };

  return {
    selectedProducts,
    addProduct,
    removeProduct,
    updateQuantity,
    clearAll,
    getTotalAmount,
    getTotalItems
  };
};

// Custom hook for conversation management
export const useConversation = (initialMessages = [], autoCloseDelay = 10 * 60 * 1000) => {
  const [messages, setMessages] = useState(initialMessages);
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState(Date.now());

  const addMessage = (message) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...message
    };
    
    setMessages(prev => [...prev, newMessage]);
    setLastActivity(Date.now());
    
    return newMessage;
  };

  const closeConversation = () => {
    setIsActive(false);
  };

  const reopenConversation = () => {
    setIsActive(true);
    setLastActivity(Date.now());
  };

  // Auto-close functionality
  useEffect(() => {
    if (!isActive || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    
    // Only start timer if last message was from admin/support
    if (lastMessage.sender === 'admin' || lastMessage.sender === 'support') {
      const timer = setTimeout(() => {
        closeConversation();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [messages, isActive, autoCloseDelay]);

  return {
    messages,
    isActive,
    lastActivity,
    addMessage,
    closeConversation,
    reopenConversation
  };
};

// Utility functions for formatting
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const validateFileType = (file, allowedTypes) => {
  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(fileExtension);
};

export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};