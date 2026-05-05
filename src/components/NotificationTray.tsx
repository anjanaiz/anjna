import { motion, AnimatePresence } from 'motion/react';
import { Notification, User } from '../types';
import { Bell, X, CheckCircle2, AlertTriangle, Calendar, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useState } from 'react';

interface NotificationTrayProps {
  notifications: Notification[];
  user: User;
  onMarkRead: (id: string, userId: string) => void;
}

export default function NotificationTray({ notifications, user, onMarkRead }: NotificationTrayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.readBy.includes(user.id)).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white border-2 border-slate-100 rounded-2xl hover:border-slate-900 transition-all group"
      >
        <Bell size={20} className={cn("text-slate-400 group-hover:text-slate-900 transition-colors", unreadCount > 0 && "animate-tada")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-singer-red text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile */}
            <div 
              className="fixed inset-0 z-[60] sm:hidden"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-[320px] sm:w-[400px] bg-white rounded-[32px] border-2 border-slate-900 shadow-2xl z-[70] overflow-hidden"
            >
              <div className="p-6 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Notifications</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Incident Nodes</p>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[450px] overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4">
                      <Bell size={32} />
                    </div>
                    <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">All clear. No active alerts.</p>
                  </div>
                ) : (
                  <div className="divide-y-2 divide-slate-50">
                    {notifications.map((notif) => {
                      const isRead = notif.readBy.includes(user.id);
                      return (
                        <motion.div 
                          key={notif.id}
                          className={cn(
                            "p-5 transition-colors cursor-pointer group relative",
                            isRead ? "opacity-60 grayscale-[0.5]" : "bg-white hover:bg-slate-50"
                          )}
                          onClick={() => {
                            if (!isRead) onMarkRead(notif.id, user.id);
                          }}
                        >
                          {!isRead && (
                            <div className="absolute left-0 inset-y-0 w-1 bg-singer-red" />
                          )}
                          
                          <div className="flex gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              notif.type === 'Break Down' ? "bg-red-50 text-red-600" :
                              notif.type === 'Service' ? "bg-blue-50 text-blue-600" :
                              notif.type === 'Repair' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-600"
                            )}>
                              {notif.type === 'Break Down' && <AlertTriangle size={18} />}
                              {notif.type === 'Service' && <CheckCircle2 size={18} />}
                              {notif.type === 'Repair' && <Calendar size={18} />}
                              {notif.type === 'System' && <Info size={18} />}
                            </div>

                            <div className="space-y-1">
                              <h4 className={cn(
                                "text-xs font-black uppercase tracking-tighter",
                                notif.type !== 'System' ? "text-singer-red" : "text-slate-900"
                              )}>
                                {notif.title}
                              </h4>
                              <p className="text-[11px] font-normal text-slate-500 leading-relaxed uppercase tracking-tight">
                                <span className="font-bold underline decoration-slate-200 decoration-1 underline-offset-2">{notif.machineName}</span> in <span className="font-bold">{notif.department}</span> requires {notif.type.toLowerCase()} attention.
                              </p>
                              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic pt-1">
                                {formatDistanceToNow(new Date(notif.createdAt))} ago
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-slate-50 border-t-2 border-slate-100 text-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Live Telemetry Feed // Singer Industrial
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
