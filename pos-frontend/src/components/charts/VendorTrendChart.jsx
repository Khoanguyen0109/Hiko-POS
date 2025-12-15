import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { formatVND } from '../../utils';
import { toVietnamTime, formatVietnamTime } from '../../utils/dateUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const VendorTrendChart = ({ orders }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Group orders by date and vendor (using Vietnam timezone)
    const dateVendorData = {};
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      try {
        // Use Vietnam timezone for date grouping
        const orderDate = order.createdAt || order.orderDate || order.date || new Date().toISOString();
        const dateObj = toVietnamTime(orderDate);
        
        // Group by date only (YYYY-MM-DD) in Vietnam timezone
        const dateKey = formatVietnamTime(dateObj, 'YYYY-MM-DD');
        const vendor = order.thirdPartyVendor || 'None';
        const revenue = order.bills?.totalWithTax || 0;
        
        if (!dateVendorData[dateKey]) {
          dateVendorData[dateKey] = {};
        }
        
        if (!dateVendorData[dateKey][vendor]) {
          dateVendorData[dateKey][vendor] = 0;
        }
        
        dateVendorData[dateKey][vendor] += revenue;
      } catch (error) {
        console.warn('Error processing order date in VendorTrendChart:', error);
      }
    });

    // Sort dates chronologically (YYYY-MM-DD format sorts naturally)
    const sortedDates = Object.keys(dateVendorData).sort();
    
    // Format dates for display using Vietnam timezone
    const displayDates = sortedDates.map(dateKey => {
      return formatVietnamTime(new Date(dateKey), 'MMM DD');
    });
    
    const vendors = ['None', 'Shopee', 'Grab'];
    
    const datasets = vendors.map(vendor => {
      const data = sortedDates.map(date => dateVendorData[date][vendor] || 0);
      
      const colorMap = {
        'None': { color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.1)' },
        'Shopee': { color: '#F97316', bgColor: 'rgba(249, 115, 22, 0.1)' },
        'Grab': { color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)' },
      };
      
      const colors = colorMap[vendor] || { color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)' };
      
      return {
        label: vendor === 'None' ? 'Direct Orders' : vendor,
        data: data,
        borderColor: colors.color,
        backgroundColor: colors.bgColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.color,
        pointBorderColor: colors.color,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return {
      labels: displayDates,
      datasets: datasets
    };
  }, [orders]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f5f5f5',
          font: {
            size: 12
          },
          padding: 15,
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      title: {
        display: true,
        text: 'Revenue Trend by Platform',
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
            return `${context.dataset.label}: ${formatVND(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#f5f5f5',
          font: {
            size: 11
          },
          maxRotation: 45,
        },
        grid: {
          color: '#343434',
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: '#f5f5f5',
          font: {
            size: 12
          },
          callback: function(value) {
            return formatVND(value);
          }
        },
        grid: {
          color: '#343434',
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
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

VendorTrendChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default VendorTrendChart;
