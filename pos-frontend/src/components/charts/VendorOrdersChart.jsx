import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import PropTypes from 'prop-types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const VendorOrdersChart = ({ orders }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
        }]
      };
    }

    // Calculate orders by third party vendor and status
    const vendorStats = {};
    
    orders.forEach(order => {
      const vendor = order.thirdPartyVendor || 'None';
      const status = order.orderStatus;
      
      if (!vendorStats[vendor]) {
        vendorStats[vendor] = {
          completed: 0,
          pending: 0,
          progress: 0,
          ready: 0,
          cancelled: 0,
          total: 0
        };
      }
      
      vendorStats[vendor][status] = (vendorStats[vendor][status] || 0) + 1;
      vendorStats[vendor].total += 1;
    });

    const vendors = Object.keys(vendorStats).map(vendor => vendor === 'None' ? 'Direct' : vendor);
    const completedData = Object.values(vendorStats).map(stats => stats.completed);
    const pendingData = Object.values(vendorStats).map(stats => stats.pending);
    const progressData = Object.values(vendorStats).map(stats => stats.progress);
    const cancelledData = Object.values(vendorStats).map(stats => stats.cancelled);

    return {
      labels: vendors,
      datasets: [
        {
          label: 'Completed',
          data: completedData,
          backgroundColor: '#10B981',
          borderColor: '#10B981',
          borderWidth: 1,
        },
        {
          label: 'In Progress',
          data: progressData,
          backgroundColor: '#F59E0B',
          borderColor: '#F59E0B',
          borderWidth: 1,
        },
        {
          label: 'Pending',
          data: pendingData,
          backgroundColor: '#6B7280',
          borderColor: '#6B7280',
          borderWidth: 1,
        },
        {
          label: 'Cancelled',
          data: cancelledData,
          backgroundColor: '#EF4444',
          borderColor: '#EF4444',
          borderWidth: 1,
        }
      ]
    };
  }, [orders]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
        text: 'Orders by Platform & Status',
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
            return `${context.dataset.label}: ${context.parsed.y} orders`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#f5f5f5',
          font: {
            size: 12
          }
        },
        grid: {
          color: '#343434',
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: '#f5f5f5',
          font: {
            size: 12
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
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

VendorOrdersChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default VendorOrdersChart;
