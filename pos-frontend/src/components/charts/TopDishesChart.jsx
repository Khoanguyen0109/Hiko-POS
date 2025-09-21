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

const TopDishesChart = ({ orders, limit = 10 }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Quantity Sold',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
        }]
      };
    }

    // Calculate dish sales
    const dishSales = {};
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const dishName = item.name || 'Unknown Dish';
          if (!dishSales[dishName]) {
            dishSales[dishName] = 0;
          }
          dishSales[dishName] += item.quantity || 0;
        });
      }
    });

    // Sort dishes by quantity sold and get top dishes
    const sortedDishes = Object.entries(dishSales)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);

    const dishNames = sortedDishes.map(([name]) => name);
    const quantities = sortedDishes.map(([, quantity]) => quantity);

    // Generate gradient colors
    const generateColor = (index, total) => {
      const hue = (index / total) * 360;
      return `hsl(${hue}, 70%, 60%)`;
    };

    const backgroundColors = dishNames.map((_, index) => generateColor(index, dishNames.length));
    const borderColors = backgroundColors.map(color => color.replace('60%', '50%'));

    return {
      labels: dishNames,
      datasets: [
        {
          label: 'Quantity Sold',
          data: quantities,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }
      ]
    };
  }, [orders, limit]);

  const options = {
    indexAxis: 'y', // This makes it horizontal
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: `Top ${limit} Selling Dishes`,
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
            return `Sold: ${context.parsed.x} times`;
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
          display: false,
        },
        ticks: {
          color: '#ababab',
          font: {
            size: 11
          },
          callback: function(value, index) {
            const label = this.getLabelForValue(value);
            return label.length > 20 ? label.substring(0, 20) + '...' : label;
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#343434]">
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

TopDishesChart.propTypes = {
  orders: PropTypes.array.isRequired,
  limit: PropTypes.number,
};

export default TopDishesChart;
