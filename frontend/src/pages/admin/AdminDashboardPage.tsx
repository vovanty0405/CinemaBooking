import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  return (
    <>
      {/* KPI Row */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI 1 */}
        <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-semibold text-text-muted">Total Revenue</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">$124,500</h3>
            <span className="text-xs font-medium text-accent-teal flex items-center">
              <ArrowUp size={12} className="mr-0.5" /> 5%
            </span>
          </div>
          <p className="text-xs text-text-muted opacity-60 mt-1">vs Yesterday</p>
          <div className="h-12 mt-4 w-full opacity-30 rounded" style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)'
          }}></div>
        </div>

        {/* KPI 2 */}
        <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-semibold text-text-muted">Tickets Sold</p>
          </div>
          <h3 className="text-3xl font-bold text-white">8,432</h3>
          <div className="flex gap-4 mt-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-muted">Today</span>
              <span className="text-sm font-normal text-white">1.2k</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-muted">Week</span>
              <span className="text-sm font-normal text-white">8.4k</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-muted">Month</span>
              <span className="text-sm font-normal text-white">34k</span>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-semibold text-text-muted">New Users</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">342</h3>
            <span className="text-xs font-medium text-accent-teal flex items-center">
              <ArrowUp size={12} className="mr-0.5" /> 12%
            </span>
          </div>
          <p className="text-xs text-text-muted opacity-60 mt-1">Daily trend</p>
          <div className="flex items-end gap-1 h-12 mt-4 opacity-50">
            {[40, 60, 30, 80, 50].map((h, i) => (
              <div key={i} className="w-full bg-[#2A2A2A] rounded-t-sm hover:bg-brand-red transition-colors" style={{ height: `${h}%` }}></div>
            ))}
            <div className="w-full bg-brand-red h-[90%] rounded-t-sm shadow-[0_0_8px_rgba(229,9,20,0.5)]"></div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm font-semibold text-text-muted">Occupancy Rate</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">68.5%</h3>
            <span className="text-xs font-medium text-[#FF5A5A] flex items-center">
              <ArrowDown size={12} className="mr-0.5" /> 2%
            </span>
          </div>
          <p className="text-xs text-text-muted opacity-60 mt-1">Avg across showtimes</p>
          <div className="w-full bg-[#2A2A2A] h-2 rounded-full mt-8 overflow-hidden">
            <div className="bg-gradient-to-r from-brand-red to-[#B20710] h-full w-[68.5%] rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Middle Section */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8">
        {/* Left Column (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* Revenue Chart */}
          <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6 flex flex-col min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Revenue over Time</h3>
              <div className="bg-[#2B2B2B] rounded-md px-3 py-1 flex gap-2">
                <span className="text-sm text-white cursor-pointer opacity-60 hover:opacity-100 transition">7D</span>
                <span className="text-sm text-brand-red cursor-pointer border-b border-brand-red font-medium">30D</span>
                <span className="text-sm text-white cursor-pointer opacity-60 hover:opacity-100 transition">All</span>
              </div>
            </div>
            <div className="flex-grow w-full rounded-lg relative overflow-hidden" style={{
              backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.02) 10px, rgba(255,255,255,0.02) 20px)'
            }}>
              <div className="absolute inset-0 bg-gradient-to-t from-brand-red/5 to-transparent"></div>
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M0,80 Q20,60 40,70 T80,40 T100,20 L100,100 L0,100 Z" fill="rgba(229,9,20,0.05)"></path>
                <path d="M0,80 Q20,60 40,70 T80,40 T100,20" fill="none" stroke="#E50914" strokeWidth="0.5"></path>
              </svg>
            </div>
          </div>

          {/* Top 5 Selling Movies */}
          <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-6">Top Selling Movies</h3>
            <div className="flex flex-col gap-4">
              {/* Movie 1 */}
              <div className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors">
                <div className="w-12 h-16 rounded overflow-hidden shadow-sm flex-shrink-0 bg-dark-input">
                  <img alt="Neon Genesis" className="w-full h-full object-cover" src="https://via.placeholder.com/150x200" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-semibold text-white">Neon Genesis: The End</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-brand-red/15 text-brand-red text-xs px-2 py-0.5 rounded-full font-medium">Sci-Fi</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">2,450</p>
                  <p className="text-xs text-text-muted">Tickets</p>
                </div>
                <div className="w-24 h-2 bg-[#353534] rounded-full overflow-hidden ml-4">
                  <div className="bg-brand-red h-full w-[85%] rounded-full"></div>
                </div>
              </div>
              
              {/* Movie 2 */}
              <div className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-[#2A2A2A] rounded-lg transition-colors">
                <div className="w-12 h-16 rounded overflow-hidden shadow-sm flex-shrink-0 bg-dark-input">
                  <img alt="Urban Descent" className="w-full h-full object-cover" src="https://via.placeholder.com/150x200" />
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-semibold text-white">Urban Descent</h4>
                  <div className="flex gap-2 mt-1">
                    <span className="bg-accent-teal/15 text-accent-teal text-xs px-2 py-0.5 rounded-full font-medium">Action</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">1,820</p>
                  <p className="text-xs text-text-muted">Tickets</p>
                </div>
                <div className="w-24 h-2 bg-[#353534] rounded-full overflow-hidden ml-4">
                  <div className="bg-brand-red h-full w-[65%] rounded-full opacity-80"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Booking Distribution */}
          <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6 flex flex-col justify-center min-h-[300px]">
            <h3 className="text-xl font-bold text-white mb-6">Booking Time</h3>
            <div className="flex-grow flex items-center justify-center relative">
              <div className="w-40 h-40 rounded-full border-[12px] border-[#353534] relative">
                <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-brand-red border-r-brand-red rotate-45"></div>
                <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-b-[#8B0000] border-l-[#8B0000] rotate-[-45deg] opacity-70"></div>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">45%</span>
                  <span className="text-xs text-text-muted">Evening</span>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-red"></div>
                <span className="text-xs text-text-muted">Evening</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#8B0000]"></div>
                <span className="text-xs text-text-muted">Matinee</span>
              </div>
            </div>
          </div>

          {/* Upcoming Showtimes */}
          <div className="bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl p-6 flex-grow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Upcoming</h3>
              <a className="text-sm font-medium text-brand-red hover:underline cursor-pointer">View All</a>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-[#242424] rounded-lg p-3 flex justify-between items-center border-l-2 border-brand-red">
                <div>
                  <h4 className="text-sm font-semibold text-white truncate w-32">Neon Genesis</h4>
                  <p className="text-xs text-text-muted">Room 4</p>
                </div>
                <div className="text-right">
                  <span className="bg-[#353534] px-2 py-1 rounded text-white text-sm font-medium">19:30</span>
                </div>
              </div>
              <div className="bg-[#1F1F1F] border border-[#353534] rounded-lg p-3 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold text-white truncate w-32">Urban Descent</h4>
                  <p className="text-xs text-text-muted">IMAX 1</p>
                </div>
                <div className="text-right">
                  <span className="bg-[#353534] px-2 py-1 rounded text-white text-sm font-medium">20:15</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
