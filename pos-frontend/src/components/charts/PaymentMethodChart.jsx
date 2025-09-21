import { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import PropTypes from 'prop-types';

ChartJS.register(ArcElement, Tooltip, Legend);

const PaymentMethodChart = ({ orders }) => {
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

    // Calculate payment method distribution
    const paymentMethods = {};
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    completedOrders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      if (!paymentMethods[method]) {
        paymentMethods[method] = 0;
      }
      paymentMethods[method] += 1;
    });

    const methods = Object.keys(paymentMethods);
    const counts = Object.values(paymentMethods);

    // Color mapping for payment methods
    const colorMap = {
      'Cash': '#f6b100',
      'Card': '#025cca',
      'Digital': '#02ca3a',
      'Credit Card': '#be3e3f',
      'Debit Card': '#5b45b0',
      'UPI': '#285430',
      'Wallet': '#735f32',
      'Unknown': '#7f167f',
    };

    const backgroundColors = methods.map(method => colorMap[method] || '#ababab');
    const borderColors = backgroundColors.map(color => color);

    return {
      labels: methods,
      datasets: [
        {
          data: counts,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 15,
          cutout: '60%', // This makes it a donut chart
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
        text: 'Payment Method Distribution',
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
            return `${context.label}: ${context.parsed} orders (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    },
  };

  // Calculate total orders for center text
  const totalOrders = chartData.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 0;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#343434] relative">
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
        {/* Center text for donut chart */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#f5f5f5]">{totalOrders}</div>
            <div className="text-sm text-[#ababab]">Total Orders</div>
          </div>
        </div>
      </div>
    </div>
  );
};

PaymentMethodChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default PaymentMethodChart;
