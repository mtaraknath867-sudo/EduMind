import React from 'react';
import { View } from '../types';
import { MessageSquare, History, Bookmark, BrainCircuit, Settings, LogOut, Plus, GraduationCap, FileText } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onNewChat: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onNewChat, isMobileOpen, setIsMobileOpen }) => {
  
  const menuItems = [
    { id: 'chat', label: 'Ask AI', icon: MessageSquare },
    { id: 'imageToPdf', label: 'Photo to PDF', icon: FileText },
    { id: 'history', label: 'History', icon: History },
    { id: 'bookmarks', label: 'Saved Notes', icon: Bookmark },
    { id: 'quiz', label: 'Quiz Me', icon: BrainCircuit },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex flex-col no-print
      `}>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
             <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-md">
                <GraduationCap size={20} />
             </div>
             <span className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">EduMind</span>
          </div>

          <button 
            onClick={() => {
                onNewChat();
                if (window.innerWidth < 768) setIsMobileOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg mb-6 font-medium"
          >
            <Plus size={18} />
            <span>New Question</span>
          </button>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === (item.id as View);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id as View);
                    if (window.innerWidth < 768) setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-lg
                    ${isActive 
                        ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-200 dark:border-slate-800">
           <button 
              onClick={() => {
                  onViewChange('settings');
                  if (window.innerWidth < 768) setIsMobileOpen(false);
              }}
              className={`flex items-center gap-3 text-sm px-4 py-3 rounded-lg w-full transition font-medium
                ${currentView === 'settings' 
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800'}
              `}
           >
              <Settings size={18} />
              <span>Settings</span>
           </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;