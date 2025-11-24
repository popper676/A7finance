import React from 'react';
import { Home, PieChart, Settings, LogOut, Building2, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const menuItems = [
    { id: 'home', label: 'ပင်မစာမျက်နှာ', icon: Home },
    { id: 'reports', label: 'စာရင်းချုပ်များ', icon: PieChart },
    { id: 'settings', label: 'အပြင်အဆင်', icon: Settings },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar Container */}
      <div className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white flex flex-col
        transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Shwe Finance</h1>
              <p className="text-xs text-slate-400">SME Dashboard</p>
            </div>
          </div>
          {/* Close Button (Mobile Only) */}
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg md:hidden transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose(); // Close sidebar on mobile selection
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400 transition-colors'} />
                <span className="font-medium tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Action */}
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-rose-400 hover:bg-slate-800 rounded-lg transition-colors group">
            <LogOut size={20} className="group-hover:text-rose-300" />
            <span>အကောင့်မှထွက်ရန်</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;