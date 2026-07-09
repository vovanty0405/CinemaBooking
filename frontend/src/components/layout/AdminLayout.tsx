import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { 
  LayoutDashboard, Film, Clock, Armchair, 
  Clapperboard, DoorOpen, Ticket, Users, 
  BarChart3, Search, Bell, Settings 
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/admin', end: true, icon: <LayoutDashboard size={20} /> },
    { name: 'Movies', path: '/admin/movies', icon: <Film size={20} /> },
    { name: 'Showtime', path: '/admin/showtimes', icon: <Clock size={20} /> },
    { name: 'Seats', path: '/admin/seats', icon: <Armchair size={20} /> },
    { name: 'Cinema', path: '/admin/cinemas', icon: <Clapperboard size={20} /> },
    { name: 'Room', path: '/admin/rooms', icon: <DoorOpen size={20} /> },
    { name: 'Promotion', path: '/admin/promotions', icon: <Ticket size={20} /> },
    { name: 'Account', path: '/admin/accounts', icon: <Users size={20} /> },
    { name: 'Analytics', path: '/admin/analytics', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#141414] text-white font-sans overflow-x-hidden">
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col h-full py-6 bg-[#131313] fixed left-0 top-0 w-[260px] border-r border-[#2B2B2B] z-50">
        <div className="px-6 mb-8">
          <h1 className="text-2xl font-black text-brand-red tracking-tighter">CINEBOOKING</h1>
          <p className="text-xs text-text-muted mt-1 uppercase tracking-wider font-semibold">Admin Console</p>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto pb-6">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 font-medium transition-all duration-200 ${
                  isActive
                    ? 'border-l-4 border-brand-red bg-gradient-to-r from-brand-red/10 to-transparent text-white font-bold'
                    : 'border-l-4 border-transparent text-text-muted hover:bg-dark-surface hover:text-white'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex justify-between items-center px-8 h-20 ml-0 md:ml-[260px] w-full md:w-[calc(100%-260px)] bg-[#141414]/80 backdrop-blur-xl shadow-sm border-b border-[#2B2B2B]">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-white hidden sm:block">Dashboard Overview</h2>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              className="bg-[#2B2B2B] text-white text-sm pl-10 pr-4 py-2 rounded-full border-none focus:ring-2 focus:ring-brand-red focus:outline-none w-64 transition-all" 
              placeholder="Search movies, rooms..." 
              type="text"
            />
          </div>
          <button className="text-text-muted hover:text-brand-red transition-colors">
            <Bell size={20} />
          </button>
          <button className="text-text-muted hover:text-brand-red transition-colors">
            <Settings size={20} />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-dark-input flex items-center justify-center bg-dark-surface">
            <span className="text-brand-red font-bold text-lg">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="ml-0 md:ml-[260px] p-4 md:p-8 min-h-[calc(100vh-80px)]">
        {children}
      </main>
    </div>
  );
};
