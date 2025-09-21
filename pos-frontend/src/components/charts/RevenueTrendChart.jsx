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
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Revenue',
          data: [],
          borderColor: '#f6b100',
          backgroundColor: 'rgba(246, 177, 0, 0.1)',
          tension: 0.4,
        }]
      };
    }

    // Group orders by date and calculate daily revenue
    const revenueByDate = {};
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      const date = new Date(order.createdAt).toLocaleDateString();
      if (!revenueByDate[date]) {
        revenueByDate[date] = 0;
      }
      revenueByDate[date] += order.bills?.totalWithTax || 0;
    });

    // Sort dates and prepare data
    const sortedDates = Object.keys(revenueByDate).sort((a, b) => new Date(a) - new Date(b));
    const revenueData = sortedDates.map(date => revenueByDate[date]);

    // Format labels based on date range
    const formatLabel = (date) => {
      const d = new Date(date);
      switch (dateRange) {
        case 'today':
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        case 'week':
          return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
        case 'month':
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        default:
          return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
