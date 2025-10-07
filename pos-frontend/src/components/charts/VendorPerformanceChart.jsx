import { useMemo } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import PropTypes from 'prop-types';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const VendorPerformanceChart = ({ orders }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Calculate performance metrics for each vendor
    const vendorMetrics = {};
    
    orders.forEach(order => {
      const vendor = order.thirdPartyVendor || 'None';
      
      if (!vendorMetrics[vendor]) {
        vendorMetrics[vendor] = {
          totalOrders: 0,
          completedOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          completionRate: 0,
          cancelledOrders: 0,
        };
      }
      
      vendorMetrics[vendor].totalOrders += 1;
      
      if (order.orderStatus === 'completed') {
        vendorMetrics[vendor].completedOrders += 1;
        vendorMetrics[vendor].totalRevenue += order.bills?.totalWithTax || 0;
      }
      
      if (order.orderStatus === 'cancelled') {
        vendorMetrics[vendor].cancelledOrders += 1;
      }
    });

    // Calculate derived metrics and normalize to 0-100 scale
    const vendors = Object.keys(vendorMetrics);
    const maxRevenue = Math.max(...vendors.map(v => vendorMetrics[v].totalRevenue));
    const maxOrders = Math.max(...vendors.map(v => vendorMetrics[v].totalOrders));
    
    vendors.forEach(vendor => {
      const metrics = vendorMetrics[vendor];
      metrics.completionRate = metrics.totalOrders > 0 ? (metrics.completedOrders / metrics.totalOrders) * 100 : 0;
      metrics.avgOrderValue = metrics.completedOrders > 0 ? metrics.totalRevenue / metrics.completedOrders : 0;
      metrics.cancelRate = metrics.totalOrders > 0 ? (metrics.cancelledOrders / metrics.totalOrders) * 100 : 0;
      
      // Normalize metrics to 0-100 scale for radar chart
      metrics.normalizedRevenue = maxRevenue > 0 ? (metrics.totalRevenue / maxRevenue) * 100 : 0;
      metrics.normalizedOrders = maxOrders > 0 ? (metrics.totalOrders / maxOrders) * 100 : 0;
      metrics.normalizedAvgOrder = maxRevenue > 0 ? (metrics.avgOrderValue / (maxRevenue / maxOrders)) * 100 : 0;
      metrics.reliabilityScore = 100 - metrics.cancelRate; // Higher is better
    });

    const labels = [
      'Total Orders',
      'Revenue Volume',
      'Completion Rate',
      'Avg Order Value',
      'Reliability'
    ];

    const datasets = vendors.map(vendor => {
      const metrics = vendorMetrics[vendor];
      const colorMap = {
        'None': { color: 'rgba(16, 185, 129, 0.8)', bgColor: 'rgba(16, 185, 129, 0.2)' },
        'Shopee': { color: 'rgba(249, 115, 22, 0.8)', bgColor: 'rgba(249, 115, 22, 0.2)' },
        'Grab': { color: 'rgba(59, 130, 246, 0.8)', bgColor: 'rgba(59, 130, 246, 0.2)' },
      };
      
      const colors = colorMap[vendor] || { color: 'rgba(107, 114, 128, 0.8)', bgColor: 'rgba(107, 114, 128, 0.2)' };
      
      return {
        label: vendor === 'None' ? 'Direct Orders' : vendor,
        data: [
          metrics.normalizedOrders,
          metrics.normalizedRevenue,
          metrics.completionRate,
          Math.min(metrics.normalizedAvgOrder, 100),
          metrics.reliabilityScore
        ],
        borderColor: colors.color,
        backgroundColor: colors.bgColor,
        borderWidth: 2,
        pointBackgroundColor: colors.color,
        pointBorderColor: colors.color,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return {
      labels: labels,
      datasets: datasets
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
        text: 'Platform Performance Comparison',
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
            const label = context.label;
            const value = context.parsed.r;
            
            if (label === 'Completion Rate' || label === 'Reliability') {
              return `${context.dataset.label} ${label}: ${value.toFixed(1)}%`;
            }
            return `${context.dataset.label} ${label}: ${value.toFixed(1)}`;
          }
        }
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#ababab',
          font: {
            size: 10
          },
          stepSize: 20,
        },
        grid: {
          color: '#343434',
        },
        angleLines: {
          color: '#343434',
        },
        pointLabels: {
          color: '#f5f5f5',
          font: {
            size: 11
          }
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
        <Radar data={chartData} options={options} />
      </div>
    </div>
  );
};

VendorPerformanceChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default VendorPerformanceChart;
