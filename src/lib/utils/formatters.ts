// src/lib/utils/formatters.ts

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: Date | string | any): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } 
    // Handle string dates
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    } 
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    } 
    else {
      return 'N/A';
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }

    // Use consistent formatting for both server and client
    // Format: MM/DD/YYYY to avoid hydration mismatch
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${month}/${day}/${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};

export const formatDateTime = (date: Date | string | any): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } 
    // Handle string dates
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    } 
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    } 
    else {
      return 'N/A';
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }

    // Use consistent formatting for both server and client
    // Format: MM/DD/YYYY HH:MM AM/PM
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${month}/${day}/${year} ${hoursStr}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'N/A';
  }
};

export const formatTime = (date: Date | string | any): string => {
  if (!date) return 'N/A';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } 
    // Handle string dates
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    } 
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    } 
    else {
      return 'N/A';
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'N/A';
    }

    let hours = dateObj.getHours();
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hoursStr = String(hours).padStart(2, '0');
    
    return `${hoursStr}:${minutes} ${ampm}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'N/A';
  }
};

export const formatRelativeTime = (date: Date | string | any): string => {
  if (!date) return 'Just now';
  
  try {
    let dateObj: Date;
    
    // Handle Firestore Timestamp
    if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } 
    // Handle string dates
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    } 
    // Handle Date objects
    else if (date instanceof Date) {
      dateObj = date;
    } 
    else {
      return 'Just now';
    }

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Just now';
    }

    const now = new Date();
    const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(days / 365);
    return `${years}y ago`;
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Just now';
  }
};