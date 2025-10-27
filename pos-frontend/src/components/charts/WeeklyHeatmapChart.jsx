import { useMemo } from 'react';
import { toVietnamTime } from '../../utils/dateUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import PropTypes from 'prop-types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  MatrixController,
  MatrixElement
);

const WeeklyHeatmapChart = ({ orders }) => {
  const chartData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return {
        datasets: [{
          label: 'Khách ước lượng giờ',
          data: [],
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(52, 52, 52, 0.5)',
          borderWidth: 1,
          width: ({ chart }) => (chart.chartArea || {}).width / 15 - 2,
          height: ({ chart }) => (chart.chartArea || {}).height / 7 - 2,
        }]
      };
    }

    // Filter completed orders
    const completedOrders = orders.filter(order => order.orderStatus === 'completed');
    
    // Initialize traffic matrix: [day][hour]
    // Days: 0=Monday, 1=Tuesday, ..., 6=Sunday
    // Hours: 8-22 (8am to 10pm)
    const trafficMatrix = {};
    
    // Initialize all cells with 0
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 22; hour++) {
        const key = `${day}-${hour}`;
        trafficMatrix[key] = 0;
      }
    }
    
    // Count orders by day and hour
    completedOrders.forEach(order => {
      try {
        const orderDate = order.createdAt || order.orderDate || order.date || new Date().toISOString();
        const dateObj = toVietnamTime(orderDate);
        
        // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
        const dayOfWeek = dateObj.getDay();
        
        // Convert to our format (0 = Monday, 6 = Sunday)
        const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        
        // Get hour (0-23)
        const hour = dateObj.getHours();
        
        // Only count hours between 8am and 10pm
        if (hour >= 8 && hour <= 22) {
          const key = `${dayIndex}-${hour}`;
          trafficMatrix[key] = (trafficMatrix[key] || 0) + 1;
        }
      } catch (error) {
        console.warn('Error processing order date:', error);
      }
    });

    // Find max value for color scaling
    const maxValue = Math.max(...Object.values(trafficMatrix), 1);
    
    // Convert matrix to chart.js matrix format
    const dataPoints = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 22; hour++) {
        const key = `${day}-${hour}`;
        const value = trafficMatrix[key] || 0;
        dataPoints.push({
          x: hour,
          y: day,
          v: value
        });
      }
    }

    // Color scale function (light yellow to dark red)
    const getColor = (value, max) => {
      if (value === 0) {
        return 'rgba(255, 255, 220, 0.15)'; // Very light yellow for no data
      }
      
      const intensity = value / max;
      
      // Color gradient from screenshot: light yellow -> orange -> red -> dark red
      if (intensity < 0.15) {
        // Very light yellow (#FFFACD)
        return 'rgba(255, 250, 205, 0.5)';
      } else if (intensity < 0.3) {
        // Light yellow (#FFE87C)
        return 'rgba(255, 232, 124, 0.7)';
      } else if (intensity < 0.45) {
        // Yellow-orange (#FFD700)
        return 'rgba(255, 215, 0, 0.8)';
      } else if (intensity < 0.6) {
        // Orange (#FFA500)
        return 'rgba(255, 165, 0, 0.85)';
      } else if (intensity < 0.75) {
        // Red-orange (#FF6347)
        return 'rgba(255, 99, 71, 0.9)';
      } else if (intensity < 0.9) {
        // Red (#DC143C)
        return 'rgba(220, 20, 60, 0.95)';
      } else {
        // Dark red (#8B0000)
        return 'rgba(139, 0, 0, 1)';
      }
    };

    return {
      datasets: [{
        label: 'Khách ước lượng giờ',
        data: dataPoints,
        backgroundColor: (ctx) => {
          if (!ctx.raw) return 'rgba(255, 255, 220, 0.15)';
          return getColor(ctx.raw.v, maxValue);
        },
        borderColor: 'rgba(220, 220, 220, 0.3)',
        borderWidth: 0.5,
        width: ({ chart }) => {
          const chartArea = chart.chartArea || {};
          return (chartArea.width || 800) / 15 - 1;
        },
        height: ({ chart }) => {
          const chartArea = chart.chartArea || {};
          return (chartArea.height || 400) / 7 - 1;
        },
      }]
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
        text: 'Heatmap khách ước lượng theo giờ (8h-22h, Thứ 2 - Chủ Nhật)',
        color: '#f5f5f5',
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 10,
          bottom: 10
        }
      },
      subtitle: {
        display: true,
        text: 'Chuẩn hóa theo log Thứ 5, 10:00-16:59',
        color: '#ababab',
        font: {
          size: 12,
          style: 'italic'
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
            const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
            const day = context[0].raw.y;
            const hour = context[0].raw.x;
            return `${dayNames[day]} - ${hour}:00`;
          },
          label: function(context) {
            const value = context.raw.v;
            return `Số khách: ${value} người`;
          },
          afterLabel: function(context) {
            const value = context.raw.v;
            if (value === 0) return 'Không có dữ liệu';
            if (value < 3) return 'Thấp điểm';
            if (value < 7) return 'Trung bình';
            if (value < 12) return 'Cao điểm';
            return 'Rất cao điểm';
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        min: 7.5,
        max: 22.5,
        title: {
          display: true,
          text: 'Giờ trong ngày (Hours)',
          color: '#ffffff',
          font: {
            size: 13,
            weight: '600'
          },
          padding: {
            top: 10
          }
        },
        ticks: {
          stepSize: 1,
          color: '#ffffff',
          font: {
            size: 11,
            weight: '600'
          },
          autoSkip: false,
          maxRotation: 0,
          minRotation: 0,
          callback: function(value) {
            // Only show integer hours from 8 to 22
            const hour = Math.round(value);
            if (hour >= 8 && hour <= 22) {
              return `${hour}:00`;
            }
            return '';
          }
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        min: -0.5,
        max: 6.5,
        reverse: false,
        title: {
          display: true,
          text: 'Ngày trong tuần (Days)',
          color: '#ffffff',
          font: {
            size: 13,
            weight: '600'
          },
          padding: {
            right: 10
          }
        },
        ticks: {
          stepSize: 1,
          color: '#ffffff',
          font: {
            size: 12,
            weight: '600'
          },
          autoSkip: false,
          callback: function(value) {
            const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
            const day = Math.round(value);
            // Show all days from 0-6
            if (day >= 0 && day <= 6) {
              return dayNames[day];
            }
            return '';
          }
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.05)',
        }
      }
    },
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 20,
        left: 15
      }
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] overflow-hidden">
      <div className="p-6">
        <div className="flex gap-4">
          {/* Main Chart */}
          <div className="flex-1 h-[500px]">
            <Chart type="matrix" data={chartData} options={options} />
          </div>
          
          {/* Color Scale Bar (Right Side) */}
          <div className="flex flex-col justify-center items-center w-24">
            <div className="h-[400px] w-8 relative" style={{
              background: 'linear-gradient(to top, rgba(255, 250, 205, 0.5) 0%, rgba(255, 232, 124, 0.7) 14%, rgba(255, 215, 0, 0.8) 28%, rgba(255, 165, 0, 0.85) 42%, rgba(255, 99, 71, 0.9) 57%, rgba(220, 20, 60, 0.95) 71%, rgba(139, 0, 0, 1) 85%)',
              borderRadius: '4px',
              border: '1px solid rgba(220, 220, 220, 0.3)'
            }}>
              {/* Scale Labels */}
              <div className="absolute top-0 left-10 text-white text-xs whitespace-nowrap">14</div>
              <div className="absolute top-[14%] left-10 text-white text-xs whitespace-nowrap">12</div>
              <div className="absolute top-[28%] left-10 text-white text-xs whitespace-nowrap">10</div>
              <div className="absolute top-[42%] left-10 text-white text-xs whitespace-nowrap">8</div>
              <div className="absolute top-[57%] left-10 text-white text-xs whitespace-nowrap">6</div>
              <div className="absolute top-[71%] left-10 text-white text-xs whitespace-nowrap">4</div>
              <div className="absolute top-[85%] left-10 text-white text-xs whitespace-nowrap">2</div>
            </div>
            <p className="text-white text-xs mt-2 text-center writing-mode-vertical transform -rotate-0">
              Khách ước lượng giờ
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 pt-4 border-t border-[#343434]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 250, 205, 0.5)' }}></div>
            <span className="text-[#ababab] text-xs">Rất thấp (1-2)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 232, 124, 0.7)' }}></div>
            <span className="text-[#ababab] text-xs">Thấp (3-4)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 215, 0, 0.8)' }}></div>
            <span className="text-[#ababab] text-xs">Trung bình (5-8)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 165, 0, 0.85)' }}></div>
            <span className="text-[#ababab] text-xs">Cao (9-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 99, 71, 0.9)' }}></div>
            <span className="text-[#ababab] text-xs">Rất cao (11-12)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(220, 20, 60, 0.95)' }}></div>
            <span className="text-[#ababab] text-xs">Cực cao (13-14)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(139, 0, 0, 1)' }}></div>
            <span className="text-[#ababab] text-xs">Đỉnh điểm (15+)</span>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-[#262626] rounded-lg border border-[#343434]">
          <p className="text-[#ababab] text-xs text-center">
            💡 <span className="text-[#f5f5f5] font-medium">Mẹo:</span> Màu càng đậm = Khách càng đông. 
            Sử dụng để tối ưu hóa nhân viên và chuẩn bị nguyên liệu theo giờ cao điểm.
          </p>
        </div>
      </div>
    </div>
  );
};

WeeklyHeatmapChart.propTypes = {
  orders: PropTypes.array.isRequired,
};

export default WeeklyHeatmapChart;

