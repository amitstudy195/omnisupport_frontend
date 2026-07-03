import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, LifeBuoy, Bell, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { alerts, clearAlert } = useSocket();

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'agent':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between border-b border-slate-800">
      {/* Brand Logo */}
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-indigo-600/30 shadow-md">
          <LifeBuoy className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
            OmniSupport
          </span>
          <span className="text-[10px] block text-slate-400 font-medium tracking-widest uppercase">
            Real-Time Helpdesk
          </span>
        </div>
      </div>

      {/* User Actions & Alerts */}
      {user && (
        <div className="flex items-center space-x-6">
          {/* Notifications Dropdown (Admins / Agents) */}
          {(user.role === 'admin' || user.role === 'agent') && (
            <div className="relative group">
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors duration-200">
                <Bell className="w-5 h-5" />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Alerts popup menu */}
              {alerts.length > 0 && (
                <div className="absolute right-0 mt-3 w-80 glass-panel border border-slate-800 rounded-xl shadow-2xl p-4 space-y-3 z-50 text-sm hidden group-hover:block hover:block">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-200">Live Notifications</span>
                    <span className="text-[11px] text-slate-400 font-medium">{alerts.length} new</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-2 bg-slate-900/50 hover:bg-slate-900 rounded-lg relative border border-slate-800/40">
                        <button
                          onClick={() => clearAlert(alert.id)}
                          className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="font-semibold text-xs text-indigo-400 pr-4">{alert.title}</div>
                        <div className="text-xs text-slate-300 mt-0.5">{alert.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Details */}
          <div className="flex items-center space-x-3 border-l border-slate-800 pl-6">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <UserIcon className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-slate-200 leading-tight">{user.name}</div>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 mt-0.5 rounded border ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </div>
          </div>

          {/* Log Out */}
          <button
            onClick={logout}
            className="flex items-center space-x-2 bg-slate-900 hover:bg-rose-950/30 text-slate-400 hover:text-rose-400 border border-slate-800 hover:border-rose-500/20 px-3.5 py-2 rounded-lg transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
