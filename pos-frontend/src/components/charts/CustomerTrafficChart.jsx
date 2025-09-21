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

const CustomerTrafficChart = ({ orders }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      // Return empty data with all hours
      const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
      return {
        labels: hours,
        datasets: [{
          label: 'Customer Traffic',
          data: new Array(24).fill(0),
          borderColor: '#02ca3a',
          backgroundColor: 'rgba(2, 202, 58, 0.2)',
          fill: true,
          tension: 0.4,
        }]
      };
    }

    // Initialize hourly customer traffic
    const hourlyTraffic = new Array(24).fill(0);
    
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const hour = orderDate.getHours();
      // Count guests or default to 1 if no guest info
      const guests = order.customerDetails?.guests || 1;
      hourlyTraffic[hour] += guests;
    });

    // Generate hour labels
    const hours = Array.from({ length: 24 }, (_, i) => {
      const hour = i.toString().padStart(2, '0');
      return `${hour}:00`;
    });

    return {
      labels: hours,
      datasets: [
        {
          label: 'Customer Traffic',
          data: hourlyTraffic,
          borderColor: '#02ca3a',
          backgroundColor: 'rgba(2, 202, 58, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#02ca3a',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4,
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
        text: 'Customer Traffic by Hour',
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
        borderColor: '#02ca3a',
        borderWidth: 1,
        callbacks: {
          title: function(context) {
            const hour = context[0].label;
            const nextHour = (parseInt(hour.split(':')[0]) + 1).toString().padStart(2, '0');
            return `${hour} - ${nextHour}:00`;
          },
          label: function(context) {
            const customers = context.parsed.y;
            return `Customers: ${customers}`;
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
        },
        beginAtZero: true,
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
  };

  // Calculate peak hours
  const peakHour = useMemo(() => {
    const data = chartData.datasets[0].data;
    const maxTraffic = Math.max(...data);
    const peakHourIndex = data.indexOf(maxTraffic);
    return {
      hour: chartData.labels[peakHourIndex],
      traffic: maxTraffic
    };
  }, [chartData]);

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#343434]">
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
      {/* Peak hour info */}
      {peakHour.traffic > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#262626] px-4 py-2 rounded-lg">
            <div className="w-3 h-3 bg-[#02ca3a] rounded-full"></div>
            <span className="text-[#f5f5f5] text-sm">
              Peak Hour: <span className="font-semibold">{peakHour.hour}</span> 
              <span className="text-[#ababab]"> ({peakHour.traffic} customers)</span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

CustomerTrafficChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default CustomerTrafficChart;
