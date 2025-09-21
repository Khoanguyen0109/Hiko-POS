export const getBgColor = () => {
  const bgarr = [
    "#b73e3e",
    "#5b45b0",
    "#7f167f",
    "#735f32",
    "#1d2569",
    "#285430",
    "#f6b100",
    "#025cca",
    "#be3e3f",
    "#02ca3a",
  ];
  const randomBg = Math.floor(Math.random() * bgarr.length);
  const color = bgarr[randomBg];
  return color;
};

export const getAvatarName = (name) => {
  if(!name) return "";

  return name.split(" ").map(word => word[0]).join("").toUpperCase();

}

export const formatDate = (date) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
};

export const formatDateAndTime = (date) => {
  const dateAndTime = new Date(date).toLocaleString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZone: "Asia/Ho_Chi_Minh"
  })

  return dateAndTime;
}

// Format price to VND currency
export const formatVND = (price) => {
  if (!price && price !== 0) return "0 ₫";
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

// Import Vietnam timezone utilities
import { 
  getTodayDateVietnam, 
  formatDateForInputVietnam, 
  formatDateForDisplayVietnam,
  toVietnamTime
} from './dateUtils';

// Get today's date in YYYY-MM-DD format (Vietnam timezone)
export const getTodayDate = () => {
  return getTodayDateVietnam();
};

// Format date for input field (YYYY-MM-DD) (Vietnam timezone)
export const formatDateForInput = (date) => {
  return formatDateForInputVietnam(date);
};

// Format date for display (DD/MM/YYYY) (Vietnam timezone)
export const formatDateForDisplay = (date) => {
  return formatDateForDisplayVietnam(date);
};

// Check if two dates are the same day (Vietnam timezone)
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = toVietnamTime(date1);
  const d2 = toVietnamTime(date2);
  return d1.toDateString() === d2.toDateString();
};