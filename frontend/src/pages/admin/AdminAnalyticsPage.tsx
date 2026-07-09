import React, { useState } from 'react';
import { Download, BarChart3, TrendingUp, Users, PieChart } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../api/analytics';

export const AdminAnalyticsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('7d');
  const { addToast } = useToastStore();

  const { data: kpiData } = useQuery({
    queryKey: ['analyticsKpi', dateRange],
    queryFn: async () => {
      const res = await analyticsApi.getKpi({ range: dateRange === 'all' ? undefined : dateRange });
      return res.data;
    }
  });

  const { data: topMovies } = useQuery({
    queryKey: ['analyticsTopMovies', dateRange],
    queryFn: async () => {
      const res = await analyticsApi.getRevenueByMovie({ range: dateRange === 'all' ? undefined : dateRange });
      return res.data;
    }
  });

  const { data: formatData } = useQuery({
    queryKey: ['analyticsFormat', dateRange],
    queryFn: async () => {
      const res = await analyticsApi.getFormatDistribution({ range: dateRange === 'all' ? undefined : dateRange });
      return res.data;
    }
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['analyticsHeatmap', dateRange],
    queryFn: async () => {
      const res = await analyticsApi.getBookingHeatmap({ range: dateRange === 'all' ? undefined : dateRange });
      return res.data;
    }
  });

  const handleExport = async () => {
    try {
      addToast('Đang xuất dữ liệu ra Excel...', 'info');
      const res = await analyticsApi.exportAnalytics({ range: dateRange === 'all' ? undefined : dateRange });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `thong-ke-${dateRange}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      addToast('Xuất Excel thành công', 'success');
    } catch (error) {
      addToast('Lỗi xuất Excel', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const formatPercent = (percent: number) => {
    return (percent > 0 ? '+' : '') + percent + '%';
  };

  const kpis = [
    { 
      title: 'Tổng Doanh Thu', 
      value: kpiData ? formatCurrency(kpiData.totalRevenue.value) : '...', 
      trend: kpiData ? formatPercent(kpiData.totalRevenue.changePercent) : '0%', 
      icon: TrendingUp, color: 'text-brand-red', bg: 'bg-brand-red/10' 
    },
    { 
      title: 'Tổng Số Vé Bán', 
      value: kpiData ? new Intl.NumberFormat('vi-VN').format(kpiData.totalTickets.value) : '...', 
      trend: kpiData ? formatPercent(kpiData.totalTickets.changePercent) : '0%', 
      icon: BarChart3, color: 'text-accent-teal', bg: 'bg-accent-teal/10' 
    },
    { 
      title: 'Khách Hàng Mới', 
      value: kpiData ? new Intl.NumberFormat('vi-VN').format(kpiData.newCustomers.value) : '...', 
      trend: kpiData ? formatPercent(kpiData.newCustomers.changePercent) : '0%', 
      icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' 
    },
    { 
      title: 'Tỷ Lệ Lấp Đầy', 
      value: kpiData ? kpiData.occupancyRate.value + '%' : '...', 
      trend: kpiData ? formatPercent(kpiData.occupancyRate.changePercent) : '0%', 
      icon: PieChart, color: 'text-[#F5A623]', bg: 'bg-[#F5A623]/10' 
    },
  ];

  // Calculate borders for Donut Chart
  let donutStyle = {};
  if (formatData && formatData.length > 0) {
    // For a simple CSS donut, it's hard to do arbitrary conic-gradient without Tailwind arbitrary values.
    // I will use a simple inline style for the border mapping or just use conic-gradient.
    let conicStr = '';
    let startPercent = 0;
    formatData.forEach((f: any, idx: number) => {
      const colorHex = idx === 0 ? '#E50914' : idx === 1 ? '#00E676' : idx === 2 ? '#B3B3B3' : '#9C27B0';
      conicStr += `${colorHex} ${startPercent}% ${startPercent + f.percent}%, `;
      startPercent += f.percent;
    });
    // Fill remaining if less than 100%
    if (startPercent < 100) {
      conicStr += `#2B2B2B ${startPercent}% 100%, `;
    }
    conicStr = conicStr.slice(0, -2);
    
    donutStyle = {
      background: `conic-gradient(${conicStr})`,
      borderRadius: '50%',
    };
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Thống kê & Phân tích</h2>
          <p className="text-sm text-text-muted mt-1">Báo cáo doanh thu chuyên sâu, phân tích hành vi khách hàng và hiệu suất phim.</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-[#2B2B2B] border-none text-white text-sm rounded-lg focus:ring-2 focus:ring-brand-red focus:outline-none px-4 py-2"
          >
            <option value="today">Hôm nay</option>
            <option value="7d">7 ngày qua</option>
            <option value="30d">30 ngày qua</option>
            <option value="all">Toàn thời gian</option>
          </select>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#2B2B2B] hover:bg-[#353534] border border-[#393939] text-white font-semibold px-4 py-2 rounded-lg transition-colors text-sm"
          >
            <Download size={18} />
            Export Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI Cards */}
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] p-6 relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 ${kpi.bg} rounded-full blur-2xl transition-all`}></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-1">{kpi.title}</p>
                <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
              </div>
              <div className={`p-2 ${kpi.bg} rounded-lg`}>
                <kpi.icon className={kpi.color} size={20} />
              </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <span className={`font-semibold ${kpi.trend.startsWith('+') ? 'text-accent-teal' : kpi.trend.startsWith('-') ? 'text-[#FF5A5A]' : 'text-text-muted'}`}>{kpi.trend}</span>
              <span className="text-text-muted">so với kỳ trước</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Top 5 Movies */}
        <div className="lg:col-span-2 bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] p-6">
          <h3 className="text-lg font-bold text-white mb-6">Doanh Thu Theo Phim (Top 5)</h3>
          <div className="h-64 flex items-end gap-4 justify-between pt-8 px-4">
            {topMovies && topMovies.map((movie: any, i: number) => {
              const maxRev = topMovies[0]?.revenue || 1;
              const heightPct = Math.max(10, (movie.revenue / maxRev) * 100);
              const isFirst = i === 0;
              return (
                <div key={movie._id} className="flex flex-col items-center flex-1 gap-2">
                  <div 
                    className={`w-full max-w-[60px] rounded-t-md ${isFirst ? 'bg-brand-red' : 'bg-[#353534]'} transition-all hover:opacity-80`} 
                    style={{ height: `${heightPct}%` }}
                    title={formatCurrency(movie.revenue)}
                  ></div>
                  <span className="text-xs text-text-muted truncate w-full text-center" title={movie.movieTitle}>{movie.movieTitle}</span>
                </div>
              );
            })}
            {(!topMovies || topMovies.length === 0) && (
              <div className="w-full text-center text-text-muted flex items-center justify-center h-full">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Format Distribution */}
        <div className="bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] p-6">
          <h3 className="text-lg font-bold text-white mb-6">Tỷ Trọng Định Dạng</h3>
          <div className="h-64 flex flex-col items-center justify-center">
            {formatData && formatData.length > 0 ? (
              <>
                <div className="relative w-40 h-40 flex items-center justify-center" style={donutStyle}>
                  <div className="absolute inset-4 bg-[#1F1F1F] rounded-full flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{formatData[0]?.format || 'N/A'}</span>
                  </div>
                </div>
                <div className="flex gap-4 mt-8 flex-wrap justify-center">
                  {formatData.map((f: any, idx: number) => {
                     const colorHex = idx === 0 ? '#E50914' : idx === 1 ? '#00E676' : idx === 2 ? '#B3B3B3' : '#9C27B0';
                     return (
                      <div key={f.format} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colorHex }}></div>
                        <span className="text-xs text-text-muted">{f.format} ({f.percent}%)</span>
                      </div>
                     );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-text-muted">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#1F1F1F] rounded-xl border border-[#2B2B2B] p-6">
        <h3 className="text-lg font-bold text-white mb-6">Mật Độ Đặt Vé Theo Khung Giờ (Heatmap)</h3>
        <div className="w-full overflow-x-auto">
          <div className="min-w-[800px] grid grid-cols-8 gap-2">
            <div className="col-span-1"></div>
            {['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'].map(d => <div key={d} className="text-center text-xs font-semibold text-text-muted">{d}</div>)}
            
            {[9, 12, 15, 18, 21].map(hour => {
              return (
                <React.Fragment key={hour}>
                  <div className="text-right text-xs font-semibold text-text-muted pr-2 pt-2">{hour.toString().padStart(2, '0')}:00</div>
                  {Array.from({length: 7}).map((_, i) => {
                    // Mongo dayOfWeek: 1=CN, 2=T2, ..., 7=T7
                    // However, in my map above: index 0 = CN, 1 = T2, etc.
                    // So mongoDay = i + 1
                    const mongoDay = i + 1;
                    
                    const slotData = heatmapData?.find((h: any) => h._id.day === mongoDay && h._id.hour === hour);
                    const count = slotData?.count || 0;
                    
                    // Simple intensity based on count
                    let bg = 'bg-[#2B2B2B]';
                    if (count > 20) bg = 'bg-brand-red';
                    else if (count > 10) bg = 'bg-brand-red/60';
                    else if (count > 0) bg = 'bg-brand-red/30';
                    
                    return <div key={i} className={`h-12 rounded ${bg} transition-colors hover:border hover:border-white cursor-pointer`} title={`Lượng vé: ${count}`}></div>
                  })}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
