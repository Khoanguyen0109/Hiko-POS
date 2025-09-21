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

const SalesHeatmapChart = ({ orders }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      // Return empty data with all hours
      const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      return {
        labels: hours,
        datasets: [{
          label: 'Orders',
          data: new Array(24).fill(0),
          backgroundColor: new Array(24).fill('rgba(246, 177, 0, 0.3)'),
          borderColor: new Array(24).fill('#f6b100'),
          borderWidth: 1,
        }]
      };
    }

    // Initialize hourly sales data
    const hourlySales = new Array(24).fill(0);
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      hourlySales[hour] += 1;
    });

    // Find max value for color intensity calculation
    const maxSales = Math.max(...hourlySales);
    
    // Generate hour labels
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return `${hour}:00`;
    });

    // Generate colors based on intensity (heatmap effect)
    const backgroundColors = hourlySales.map(sales => {
      if (maxSales === 0) return 'rgba(246, 177, 0, 0.3)';
      const intensity = sales / maxSales;
      return `rgba(246, 177, 0, ${0.3 + intensity * 0.7})`;
    });

    const borderColors = hourlySales.map(sales => {
      if (maxSales === 0) return '#f6b100';
      const intensity = sales / maxSales;
      return intensity > 0.5 ? '#ff8c00' : '#f6b100';
    });

    return {
      labels: hours,
      datasets: [
        {
          label: 'Orders',
          data: hourlySales,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1,
          borderRadius: 2,
          borderSkipped: false,
        }
      ]
    };
  }, [orders]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Sales by Time of Day (Peak Hours Analysis)',
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
          title: function(context) {
            const hour = context[0].label;
            const nextHour = (parseInt(hour.split(':')[0]) + 1).toString().padStart(2, '0');
            return `${hour} - ${nextHour}:00`;
          },
          label: function(context) {
            const orders = context.parsed.y;
            const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
            const percentage = total > 0 ? ((orders / total) * 100).toFixed(1) : 0;
            return `Orders: ${orders} (${percentage}% of daily total)`;
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
            size: 10
          },
          maxRotation: 45,
          minRotation: 45,
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
          stepSize: 1,
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
      <div className="h-80">
        <Bar data={chartData} options={options} />
      </div>
      {/* Legend for heatmap intensity */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="text-[#ababab] text-xs">Low Activity</span>
        <div className="flex gap-1">
          {[0.3, 0.5, 0.7, 0.9, 1.0].map((opacity, index) => (
            <div
              key={index}
              className="w-4 h-4 rounded"
              style={{ backgroundColor: `rgba(246, 177, 0, ${opacity})` }}
            />
          ))}
        </div>
        <span className="text-[#ababab] text-xs">High Activity</span>
      </div>
    </div>
  );
};

SalesHeatmapChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default SalesHeatmapChart;
