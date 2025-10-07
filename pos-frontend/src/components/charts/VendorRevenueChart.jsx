import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { formatVND } from '../../utils';

ChartJS.register(ArcElement, Tooltip, Legend);

const VendorRevenueChart = ({ orders }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
        }]
      };
    }

    // Calculate revenue by third party vendor
    const vendorRevenue = {};
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      const vendor = order.thirdPartyVendor || 'None';
      const revenue = order.bills?.totalWithTax || 0;
      
      if (!vendorRevenue[vendor]) {
        vendorRevenue[vendor] = 0;
      }
      vendorRevenue[vendor] += revenue;
    });

    const vendors = Object.keys(vendorRevenue);
    const revenues = Object.values(vendorRevenue);

    // Color mapping for vendors
    const colorMap = {
      'None': '#10B981', // Green for direct orders
      'Shopee': '#F97316', // Orange for Shopee
      'Grab': '#3B82F6', // Blue for Grab
    };

    const backgroundColors = vendors.map(vendor => colorMap[vendor] || '#6B7280');
    const borderColors = backgroundColors.map(color => color);

    return {
      labels: vendors.map(vendor => vendor === 'None' ? 'Direct Orders' : vendor),
      datasets: [
        {
          data: revenues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 15,
          cutout: '60%',
        }
      ]
    };
  }, [orders]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
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
        text: 'Revenue by Platform',
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
            const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatVND(context.parsed)} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  // Calculate total revenue for center text
  const totalRevenue = chartData.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 0;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#343434] relative">
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
        {/* Center text for donut chart */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-lg font-bold text-[#f5f5f5]">{formatVND(totalRevenue)}</div>
            <div className="text-sm text-[#ababab]">Total Revenue</div>
          </div>
        </div>
      </div>
    </div>
  );
};

VendorRevenueChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default VendorRevenueChart;
