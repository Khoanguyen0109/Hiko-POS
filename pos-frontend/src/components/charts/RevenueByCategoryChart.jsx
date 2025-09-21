import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import PropTypes from 'prop-types';
import { formatVND } from '../../utils';

ChartJS.register(ArcElement, Tooltip, Legend);

const RevenueByCategoryChart = ({ orders }) => {
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

    // Calculate revenue by category
    const revenueByCategory = {};
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const category = item.category || 'Unknown';
          if (!revenueByCategory[category]) {
            revenueByCategory[category] = 0;
          }
          revenueByCategory[category] += item.price || 0;
        });
      }
    });

    const categories = Object.keys(revenueByCategory);
    console.log('categories', categories)
    const revenues = Object.values(revenueByCategory);

    // Color palette for categories
    const colors = [
      '#f6b100', // Golden
      '#025cca', // Blue
      '#02ca3a', // Green
      '#be3e3f', // Red
      '#5b45b0', // Purple
      '#285430', // Dark Green
      '#735f32', // Brown
      '#7f167f', // Magenta
      '#ff6b6b', // Light Red
      '#4ecdc4', // Teal
    ];

    const backgroundColors = categories.map((_, index) => colors[index % colors.length]);
    const borderColors = backgroundColors.map(color => color);

    return {
      labels: categories,
      datasets: [
        {
          data: revenues,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 10,
        }
      ]
    };
  }, [orders]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
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
        text: 'Revenue by Category',
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

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#343434]">
      <div className="h-80">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

RevenueByCategoryChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default RevenueByCategoryChart;
