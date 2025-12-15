import { useMemo } from 'react';
import { getCurrentVietnamTime, toVietnamTime, formatDateForInputVietnam, formatVietnamDateOnly } from '../../utils/dateUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { formatVND } from '../../utils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const RevenueTrendChart = ({ orders, dateRange }) => {
  console.log('orders', orders);
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      // Show current date with 0 revenue for empty data
      const today = getCurrentVietnamTime();
      const todayLabel = formatVietnamDateOnly(today);
      console.log('todayLabel', todayLabel);
      return {
        labels: [todayLabel],
        datasets: [{
          label: 'Revenue',
          data: [0],
          borderColor: '#f6b100',
          backgroundColor: 'rgba(246, 177, 0, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#f6b100',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true,
        }]
      };
    }

    // Group orders by date and calculate daily revenue
    const revenueByDate = {};
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      // Try different date fields that might exist in the order object
      const orderDate = order.createdAt || order.orderDate || order.date || new Date().toISOString();
      
      // Create a proper date object and format it consistently in Vietnam timezone
      let dateObj;
      try {
        dateObj = toVietnamTime(orderDate);
        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
          dateObj = getCurrentVietnamTime(); // Fallback to current date in Vietnam timezone
        }
      } catch {
        dateObj = getCurrentVietnamTime(); // Fallback to current date in Vietnam timezone
      }
      
      // Use Vietnam timezone date string for consistent grouping (YYYY-MM-DD)
      // This ensures all orders on the same date are grouped together
      const dateKey = formatDateForInputVietnam(dateObj);
      
      if (!revenueByDate[dateKey]) {
        revenueByDate[dateKey] = 0;
      }
      // Accumulate revenue for this date
      revenueByDate[dateKey] += order.bills?.totalWithTax || 0;
    });

    // Debug: Log grouped data
    console.log('📊 Revenue Grouped by Date:', revenueByDate);
    console.log('📅 Total dates with orders:', Object.keys(revenueByDate).length);

    // Sort dates chronologically (YYYY-MM-DD format sorts naturally)
    const sortedDates = Object.keys(revenueByDate).sort();
    
    // If no completed orders, show current date with 0 revenue
    if (sortedDates.length === 0) {
      const today = getCurrentVietnamTime();
      const todayLabel = formatVietnamDateOnly(today, 'MMM DD');
      return {
        labels: [todayLabel],
        datasets: [{
          label: 'Revenue',
          data: [0],
          borderColor: '#f6b100',
          backgroundColor: 'rgba(246, 177, 0, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#f6b100',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true,
        }]
      };
    }
    
    const revenueData = sortedDates.map(date => revenueByDate[date]);

    // Format labels based on date range
    const formatLabel = (dateString) => {
      // dateString is in YYYY-MM-DD format from Vietnam timezone
      // Parse it as a local date (not UTC) to avoid timezone shifts
      const [year, month, day] = dateString.split('-').map(Number);
      const d = new Date(year, month - 1, day); // Create local date
      
      // Ensure we have a valid date
      if (isNaN(d.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid Date';
      }
      
      // Format based on date range
      switch (dateRange) {
        case 'today':
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
        case 'week':
          return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
        case 'month':
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
        case 'custom':
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
        default:
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
      }
    };

    const labels = sortedDates.map(formatLabel);

    return {
      labels,
      datasets: [
        {
          label: 'Revenue',
          data: revenueData,
          borderColor: '#f6b100',
          backgroundColor: 'rgba(246, 177, 0, 0.1)',
          borderWidth: 3,
          pointBackgroundColor: '#f6b100',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          tension: 0.4,
          fill: true,
        }
      ]
    };
  }, [orders, dateRange]);

  console.log('chartData', chartData);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Revenue Trends - ${dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'Last 7 Days' : 'Last 30 Days'}`,
        color: '#f5f5f5',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(31, 31, 31, 0.9)',
        titleColor: '#f5f5f5',
        bodyColor: '#f5f5f5',
        borderColor: '#f6b100',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return `Revenue: ${formatVND(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(52, 52, 52, 0.5)',
        },
        ticks: {
          color: '#ababab',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(52, 52, 52, 0.5)',
        },
        ticks: {
          color: '#ababab',
          font: {
            size: 12
          },
          callback: function(value) {
            return formatVND(value);
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#343434]">
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

RevenueTrendChart.propTypes = {
  orders: PropTypes.array.isRequired,
  dateRange: PropTypes.string.isRequired,
};

export default RevenueTrendChart;
