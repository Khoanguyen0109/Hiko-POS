import { useMemo } from 'react';
import { toVietnamTime, formatVietnamTime } from '../../utils/dateUtils';
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
import { formatVND } from '../../utils';
import { MdTrendingUp, MdTrendingDown, MdRemove } from 'react-icons/md';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RevenueByDayOfWeekChart = ({ orders, dateRange }) => {
  const analysis = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        chartData: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Revenue',
            data: [0, 0, 0, 0, 0, 0, 0],
            backgroundColor: Array(7).fill('rgba(246, 177, 0, 0.7)'),
            borderColor: Array(7).fill('#f6b100'),
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }]
        },
        stats: {
          totalRevenue: 0,
          averagePerDay: 0,
          bestDay: { name: 'N/A', revenue: 0, percentage: 0 },
          worstDay: { name: 'N/A', revenue: 0, percentage: 0 },
          weekendRevenue: 0,
          weekdayRevenue: 0,
          weekendPercentage: 0
        }
      };
    }

    // Filter completed orders
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    // Initialize revenue by day of week (0 = Monday, 6 = Sunday)
    const revenueByDayIndex = [0, 0, 0, 0, 0, 0, 0];
    const orderCountByDay = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayNamesShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Process each order
    completedOrders.forEach(order => {
      try {
        const orderDate = order.createdAt || order.orderDate || order.date || new Date().toISOString();
        const dateObj = toVietnamTime(orderDate);
        
        // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const dayOfWeek = dateObj.getDay();
        
        // Convert to our format (0 = Monday, 6 = Sunday)
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        const revenue = order.bills?.totalWithTax || 0;
        revenueByDayIndex[dayIndex] += revenue;
        orderCountByDay[dayIndex] += 1;
      } catch (error) {
        console.warn('Error processing order date:', error);
      }
    });

    // Calculate statistics
    const totalRevenue = revenueByDayIndex.reduce((sum, val) => sum + val, 0);
    const averagePerDay = totalRevenue / 7;
    
    // Find best and worst days
    let bestDayIndex = 0;
    let worstDayIndex = 0;
    let maxRevenue = revenueByDayIndex[0];
    let minRevenue = revenueByDayIndex[0];
    
    revenueByDayIndex.forEach((revenue, index) => {
      if (revenue > maxRevenue) {
        maxRevenue = revenue;
        bestDayIndex = index;
      }
      if (revenue < minRevenue || minRevenue === 0) {
        minRevenue = revenue;
        worstDayIndex = index;
      }
    });
    
    // Calculate weekend vs weekday
    const weekendRevenue = revenueByDayIndex[5] + revenueByDayIndex[6]; // Sat + Sun
    const weekdayRevenue = totalRevenue - weekendRevenue;
    const weekendPercentage = totalRevenue > 0 ? (weekendRevenue / totalRevenue) * 100 : 0;
    
    // Generate colors based on performance (above/below average)
    const colors = revenueByDayIndex.map(revenue => {
      if (revenue === 0) return 'rgba(171, 171, 171, 0.5)'; // Gray for no data
      if (revenue >= averagePerDay * 1.1) return 'rgba(16, 185, 129, 0.8)'; // Green - above average
      if (revenue <= averagePerDay * 0.9) return 'rgba(239, 68, 68, 0.8)'; // Red - below average
      return 'rgba(246, 177, 0, 0.8)'; // Yellow - average
    });
    
    const borderColors = revenueByDayIndex.map(revenue => {
      if (revenue === 0) return '#ababab';
      if (revenue >= averagePerDay * 1.1) return '#10B981'; // Green
      if (revenue <= averagePerDay * 0.9) return '#EF4444'; // Red
      return '#f6b100'; // Yellow
    });

    const chartData = {
      labels: dayNamesShort,
      datasets: [{
        label: 'Revenue',
        data: revenueByDayIndex,
        backgroundColor: colors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    };

    return {
      chartData,
      stats: {
        totalRevenue,
        averagePerDay,
        bestDay: {
          name: dayNames[bestDayIndex],
          revenue: maxRevenue,
          percentage: totalRevenue > 0 ? (maxRevenue / totalRevenue) * 100 : 0,
          orderCount: orderCountByDay[bestDayIndex]
        },
        worstDay: {
          name: dayNames[worstDayIndex],
          revenue: minRevenue,
          percentage: totalRevenue > 0 ? (minRevenue / totalRevenue) * 100 : 0,
          orderCount: orderCountByDay[worstDayIndex]
        },
        weekendRevenue,
        weekdayRevenue,
        weekendPercentage,
        revenueByDay: revenueByDayIndex,
        orderCountByDay
      }
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
        text: `Revenue by Day of Week - ${dateRange === 'today' ? 'Today' : dateRange === 'week' ? 'This Week' : dateRange === 'month' ? 'This Month' : 'Custom Range'}`,
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
        backgroundColor: 'rgba(31, 31, 31, 0.95)',
        titleColor: '#f5f5f5',
        bodyColor: '#f5f5f5',
        borderColor: '#f6b100',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          title: function(context) {
            const dayIndex = context[0].dataIndex;
            const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            return dayNames[dayIndex];
          },
          label: function(context) {
            return `Revenue: ${formatVND(context.parsed.y)}`;
          },
          afterLabel: function(context) {
            const dayIndex = context.dataIndex;
            const orderCount = analysis.stats.orderCountByDay[dayIndex];
            const avgOrderValue = orderCount > 0 ? context.parsed.y / orderCount : 0;
            return [
              `Orders: ${orderCount}`,
              `Avg Order: ${formatVND(avgOrderValue)}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(52, 52, 52, 0.3)',
          display: false,
        },
        ticks: {
          color: '#ababab',
          font: {
            size: 12,
            weight: '600'
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
            size: 11
          },
          callback: function(value) {
            // Shorten large numbers
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M';
            }
            if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'K';
            }
            return formatVND(value);
          }
        },
        beginAtZero: true
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const { stats } = analysis;

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] overflow-hidden">
      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-[#262626] border-b border-[#343434]">
        {/* Best Day */}
        <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#10B981]/30">
          <div className="flex items-center gap-2 mb-1">
            <MdTrendingUp className="text-[#10B981] text-lg" />
            <span className="text-[#ababab] text-xs">Best Day</span>
          </div>
          <p className="text-[#f5f5f5] font-bold text-sm mb-0.5">{stats.bestDay.name}</p>
          <p className="text-[#10B981] font-semibold text-xs">{formatVND(stats.bestDay.revenue)}</p>
          <p className="text-[#ababab] text-xs">{stats.bestDay.percentage.toFixed(1)}% of total</p>
        </div>

        {/* Worst Day */}
        <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#EF4444]/30">
          <div className="flex items-center gap-2 mb-1">
            <MdTrendingDown className="text-[#EF4444] text-lg" />
            <span className="text-[#ababab] text-xs">Lowest Day</span>
          </div>
          <p className="text-[#f5f5f5] font-bold text-sm mb-0.5">{stats.worstDay.name}</p>
          <p className="text-[#EF4444] font-semibold text-xs">{formatVND(stats.worstDay.revenue)}</p>
          <p className="text-[#ababab] text-xs">{stats.worstDay.percentage.toFixed(1)}% of total</p>
        </div>

        {/* Average per Day */}
        <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#f6b100]/30">
          <div className="flex items-center gap-2 mb-1">
            <MdRemove className="text-[#f6b100] text-lg" />
            <span className="text-[#ababab] text-xs">Daily Average</span>
          </div>
          <p className="text-[#f5f5f5] font-bold text-sm mb-0.5">Per Day</p>
          <p className="text-[#f6b100] font-semibold text-xs">{formatVND(stats.averagePerDay)}</p>
          <p className="text-[#ababab] text-xs">Across all days</p>
        </div>

        {/* Weekend vs Weekday */}
        <div className="bg-[#1a1a1a] rounded-lg p-3 border border-[#8B5CF6]/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[#8B5CF6] text-xs font-bold">📅</span>
            <span className="text-[#ababab] text-xs">Weekend Share</span>
          </div>
          <p className="text-[#f5f5f5] font-bold text-sm mb-0.5">{stats.weekendPercentage.toFixed(1)}%</p>
          <p className="text-[#8B5CF6] font-semibold text-xs">{formatVND(stats.weekendRevenue)}</p>
          <p className="text-[#ababab] text-xs">Sat + Sun</p>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80">
          <Bar data={analysis.chartData} options={options} />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-[#343434]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#10B981] border-2 border-[#10B981]"></div>
            <span className="text-[#ababab] text-xs">Above Average (+10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#f6b100] border-2 border-[#f6b100]"></div>
            <span className="text-[#ababab] text-xs">Average (±10%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#EF4444] border-2 border-[#EF4444]"></div>
            <span className="text-[#ababab] text-xs">Below Average (-10%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

RevenueByDayOfWeekChart.propTypes = {
  orders: PropTypes.array.isRequired,
  dateRange: PropTypes.string.isRequired,
};

export default RevenueByDayOfWeekChart;

