import { useState } from 'react';
import { MaintenanceRecord, Department, MachineReport } from '../types';
import { DEPARTMENTS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, Filter, Download, ChevronLeft, ChevronRight, Bell, CheckCircle2, MessageSquareWarning, X, LogOut, Edit2, Save } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { cn, formatDate, formatTime } from '../lib/utils';

export default function SupervisorDashboard({ 
  records, 
  reports = [], 
  onUpdateReport,
  onUpdateRecord,
  onLogout 
}: { 
  records: MaintenanceRecord[], 
  reports: MachineReport[],
  onUpdateReport: (id: string, updates: Partial<MachineReport>) => Promise<void>,
  onUpdateRecord: (id: string, updates: Partial<MaintenanceRecord>) => Promise<void>,
  onLogout: () => void 
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterDept, setFilterDept] = useState<Department | 'All'>('All');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const dailyRecords = records.filter(r => 
    selectedDate && isSameDay(new Date(r.date), selectedDate) &&
    (filterDept === 'All' || r.department === filterDept)
  );

  const pendingReports = reports.filter(r => 
    r.status === 'pending' &&
    (!selectedDate || isSameDay(new Date(r.createdAt), selectedDate)) &&
    (filterDept === 'All' || r.department === filterDept)
  );

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const exportToCSV = () => {
    const headers = ['Date', 'Maintainer', 'Dept', 'Machine', 'Type', 'Start', 'Finish', 'Duration', 'Description'];
    const rows = records.map(r => [
      formatDate(r.date),
      r.maintainerName,
      r.department,
      r.machineName.replace(/<br\s*\/?>/gi, ' '),
      r.workType,
      formatTime(r.startTime),
      formatTime(r.finishTime),
      `${r.duration}m`,
      r.description.replace(/,/g, ';')
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `singer_maintenance_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 md:p-12 space-y-8 sm:space-y-12 max-w-7xl mx-auto w-full bg-slate-50 min-h-screen relative">
      {/* Back Button */}
      <button 
        onClick={onLogout}
        className="absolute top-4 left-4 sm:top-12 sm:left-12 w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:border-slate-900 transition-all text-slate-900 z-10 shadow-sm group"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 border-b-4 border-slate-900 pb-10 mt-8 sm:mt-0">
        <div>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] uppercase flex flex-col">
            <span>SHIFT</span>
            <span className="text-singer-red">OVERVIEW</span>
          </h1>
          <p className="mt-4 sm:mt-6 text-slate-400 font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[8px] sm:text-[10px]">Division Oversight & Performance Tracking</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="flex bg-white p-1.5 rounded-2xl border-2 border-slate-900 shadow-lg">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'pending' ? "bg-singer-red text-white" : "text-slate-400 hover:text-slate-900"
              )}
            >
              <Bell size={16} />
              Pending Tasks
              {pendingReports.length > 0 && (
                <span className={cn(
                  "px-1.5 py-0.5 rounded-full text-[8px]",
                  activeTab === 'pending' ? "bg-white text-singer-red" : "bg-singer-red text-white"
                )}>
                  {pendingReports.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={cn(
                "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                activeTab === 'completed' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
              )}
            >
              <CheckCircle2 size={16} />
              Completed Tasks
            </button>
          </div>
          <button 
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-2 group whitespace-nowrap justify-center h-16 sm:h-auto"
          >
            <Download size={20} className="group-hover:-translate-y-1 transition-transform" />
            EXPORT MASTER LOG (.CSV)
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'pending' ? (
          <motion.div
            key="pending-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
          >
            {/* Calendar & Filter Column */}
            <div className="lg:col-span-4 space-y-6 sm:space-y-8">
              <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-xl sm:shadow-2xl border-2 border-slate-100 overflow-hidden">
                <div className="p-6 sm:p-8 bg-slate-900 text-white flex justify-between items-center border-b-4 border-singer-red">
                  <h2 className="font-black text-xl sm:text-2xl uppercase tracking-tighter italic">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={20}/></button>
                    <button onClick={nextMonth} className="p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={20}/></button>
                  </div>
                </div>
                
                <div className="p-4 sm:p-8 bg-white">
                  <div className="grid grid-cols-7 mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={`${d}-${i}`} className="text-center text-[9px] sm:text-[10px] font-black text-slate-300 uppercase py-2 tracking-widest">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                      <div key={`p-${i}`} className="aspect-square" />
                    ))}
                    {days.map(day => {
                      const hasPending = reports.some(r => r.status === 'pending' && isSameDay(new Date(r.createdAt), day));
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      return (
                        <button
                          key={day.toString()}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "relative flex items-center justify-center aspect-square rounded-xl sm:rounded-2xl text-sm sm:text-base font-black transition-all",
                            isSelected ? "bg-singer-red text-white shadow-lg sm:shadow-xl shadow-singer-red/20 scale-105 sm:scale-110 z-10" : "hover:bg-slate-50 text-slate-700",
                            isToday(day) && !isSelected && "ring-2 ring-singer-red/20",
                          )}
                        >
                          {format(day, 'd')}
                          {hasPending && !isSelected && (
                            <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-1 sm:h-1.5 sm:w-1.5 h-1 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-xl border-2 border-slate-100 overflow-x-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Filter size={18} /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Division Filter</span>
                </div>
                <div className="flex sm:grid sm:grid-cols-1 gap-2 pb-2 sm:pb-0 overflow-x-auto sm:overflow-x-visible no-scrollbar">
                  <button 
                    onClick={() => setFilterDept('All')}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-left transition-all whitespace-nowrap min-w-[120px] sm:min-w-0 flex-shrink-0",
                      filterDept === 'All' ? "bg-slate-900 text-white shadow-lg sm:translate-x-1" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    Global Audit
                  </button>
                  {DEPARTMENTS.map(dept => (
                    <button 
                      key={dept}
                      onClick={() => setFilterDept(dept)}
                      className={cn(
                        "px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-left transition-all whitespace-nowrap min-w-[120px] sm:min-w-0 flex-shrink-0",
                        filterDept === dept ? "bg-singer-red text-white shadow-lg sm:translate-x-1" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {dept} Sector
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Reports List Column */}
            <div className="lg:col-span-8 space-y-12">
              {DEPARTMENTS.map(dept => {
                const deptReports = pendingReports.filter(r => r.department === dept);
                if (deptReports.length === 0) return null;

                return (
                  <div key={dept} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200" />
                      <h2 className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em]">{dept} Department</h2>
                      <div className="h-px flex-1 bg-slate-200" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {deptReports.map((report) => (
                        <motion.div 
                          key={report.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white border-2 border-slate-900 rounded-[32px] p-8 shadow-xl relative overflow-hidden group hover:-translate-y-1 transition-all"
                        >
                          <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900 text-7xl font-black italic select-none">
                            !
                          </div>
                          <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="space-y-1">
                              <span className="bg-singer-red text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                {report.workType}
                              </span>
                              <h3 className="text-2xl font-black text-slate-900 leading-tight uppercase tracking-tighter" dangerouslySetInnerHTML={{ __html: report.machineName || 'Unknown Machine' }} />
                            </div>
                            <div className="flex gap-2">
                              {editingReportId === report.id ? (
                                <button 
                                  onClick={async () => {
                                    await onUpdateReport(report.id, { description: editDescription });
                                    setEditingReportId(null);
                                  }}
                                  className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all border-2 border-blue-100 hover:border-slate-900 shadow-sm"
                                  title="Save Changes"
                                >
                                  <Save size={24} />
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    setEditingReportId(report.id);
                                    setEditDescription(report.description);
                                  }}
                                  className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all border-2 border-slate-100 hover:border-slate-900 shadow-sm"
                                  title="Edit Description"
                                >
                                  <Edit2 size={24} />
                                </button>
                              )}
                              <button 
                                onClick={() => onUpdateReport(report.id, { status: 'addressed' })}
                                className="w-12 h-12 flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-2xl transition-all border-2 border-green-100 hover:border-slate-900 shadow-sm group/check"
                                title="Mark as Addressed"
                              >
                                <CheckCircle2 size={24} className="group-hover/check:scale-110 transition-transform" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 rounded-[24px] p-6 mb-6 relative z-10 border-2 border-transparent group-hover:border-slate-100 transition-colors">
                            {editingReportId === report.id ? (
                              <textarea
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 font-sans text-base focus:border-singer-red outline-none min-h-[100px] resize-none"
                                autoFocus
                              />
                            ) : (
                              <p className="text-base font-bold text-slate-600 italic leading-relaxed">"{report.description}"</p>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-300 relative z-10">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-singer-red rounded-full animate-pulse" />
                              Logged: {formatTime(report.createdAt)}
                            </div>
                            <span>ID: {report.id.toUpperCase()}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {pendingReports.length === 0 && (
                <div className="py-24 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-100">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">No Pending Tasks</h3>
                  <p className="text-slate-400 font-medium italic mt-2 text-sm">No operational reports found for this selection.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="completed-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
          >
            {/* Calendar Column */}
            <div className="lg:col-span-4 space-y-6 sm:space-y-8">
              <div className="bg-white rounded-[24px] sm:rounded-[32px] shadow-xl sm:shadow-2xl border-2 border-slate-100 overflow-hidden">
                <div className="p-6 sm:p-8 bg-slate-900 text-white flex justify-between items-center border-b-4 border-singer-red">
                  <h2 className="font-black text-xl sm:text-2xl uppercase tracking-tighter italic">{format(currentMonth, 'MMMM yyyy')}</h2>
                  <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronLeft size={20}/></button>
                    <button onClick={nextMonth} className="p-2 sm:p-3 hover:bg-white/10 rounded-xl transition-all"><ChevronRight size={20}/></button>
                  </div>
                </div>
                
                <div className="p-4 sm:p-8 bg-white">
                  <div className="grid grid-cols-7 mb-4">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                      <div key={`${d}-${i}`} className="text-center text-[9px] sm:text-[10px] font-black text-slate-300 uppercase py-2 tracking-widest">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                      <div key={`p-${i}`} className="aspect-square" />
                    ))}
                    {days.map(day => {
                      const hasRecords = records.some(r => isSameDay(new Date(r.date), day));
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      return (
                        <button
                          key={day.toString()}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "relative flex items-center justify-center aspect-square rounded-xl sm:rounded-2xl text-sm sm:text-base font-black transition-all",
                            isSelected ? "bg-singer-red text-white shadow-lg sm:shadow-xl shadow-singer-red/20 scale-105 sm:scale-110 z-10" : "hover:bg-slate-50 text-slate-700",
                            isToday(day) && !isSelected && "ring-2 ring-singer-red/20",
                          )}
                        >
                          {format(day, 'd')}
                          {hasRecords && !isSelected && (
                            <span className="absolute top-1 right-1 sm:top-2 sm:right-2 w-1 sm:h-1.5 sm:w-1.5 h-1 bg-singer-red rounded-full shadow-[0_0_8px_rgba(211,47,47,0.5)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-xl border-2 border-slate-100 overflow-x-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><Filter size={18} /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Division Filter</span>
                </div>
                <div className="flex sm:grid sm:grid-cols-1 gap-2 pb-2 sm:pb-0 overflow-x-auto sm:overflow-x-visible no-scrollbar">
                  <button 
                    onClick={() => setFilterDept('All')}
                    className={cn(
                      "px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-left transition-all whitespace-nowrap min-w-[120px] sm:min-w-0 flex-shrink-0",
                      filterDept === 'All' ? "bg-slate-900 text-white shadow-lg sm:translate-x-1" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    Global Audit
                  </button>
                  {DEPARTMENTS.map(dept => (
                    <button 
                      key={dept}
                      onClick={() => setFilterDept(dept)}
                      className={cn(
                        "px-6 py-3 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest text-left transition-all whitespace-nowrap min-w-[120px] sm:min-w-0 flex-shrink-0",
                        filterDept === dept ? "bg-singer-red text-white shadow-lg sm:translate-x-1" : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                      )}
                    >
                      {dept} Sector
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Records Detail Column */}
            <div className="lg:col-span-8">
              {selectedDate ? (
                <motion.div 
                  key={selectedDate.toString() + filterDept}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 border-l-4 border-singer-red pl-4 sm:pl-6 py-2">
                    <div>
                      <h2 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter uppercase italic">
                        {format(selectedDate, 'MMM do')}
                      </h2>
                      <p className="text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest">{format(selectedDate, 'EEEE, yyyy')}</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                        {dailyRecords.length} 
                      </span>
                      <span className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest leading-none">Events Logged</span>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    {dailyRecords.length > 0 ? (
                      dailyRecords.map(record => (
                        <div key={record.id} className="group bg-white p-6 sm:p-10 rounded-[24px] sm:rounded-[40px] shadow-lg border-2 border-slate-50 hover:border-slate-900 hover:shadow-2xl transition-all relative overflow-hidden">
                          <div className="flex flex-col md:flex-row justify-between gap-6 sm:gap-8 relative z-10">
                            <div className="space-y-3 flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <span className="bg-slate-900 text-white px-2 sm:px-3 py-1 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                    {record.department}
                                  </span>
                                  <span className={cn(
                                    "text-[9px] sm:text-[10px] font-black px-2 sm:px-3 py-1 rounded uppercase tracking-widest",
                                    "bg-singer-red/10 text-singer-red"
                                  )}>
                                    {record.workType}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  {editingRecordId === record.id ? (
                                    <button 
                                      onClick={async () => {
                                        await onUpdateRecord(record.id, { description: editDescription });
                                        setEditingRecordId(null);
                                      }}
                                      className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border-2 border-blue-100 hover:border-slate-900 shadow-sm"
                                      title="Save Changes"
                                    >
                                      <Save size={20} />
                                    </button>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setEditingRecordId(record.id);
                                        setEditDescription(record.description);
                                      }}
                                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all border-2 border-slate-100 hover:border-slate-900 shadow-sm"
                                      title="Edit Description"
                                    >
                                      <Edit2 size={20} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase group-hover:text-singer-red transition-colors italic leading-tight" dangerouslySetInnerHTML={{ __html: record.machineName || 'Unknown Machine' }} />
                              <div className="bg-slate-50 rounded-[20px] p-6 relative z-10 border-2 border-transparent group-hover:border-slate-100 transition-colors">
                                {editingRecordId === record.id ? (
                                  <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 font-sans text-base focus:border-singer-red outline-none min-h-[100px] resize-none"
                                    autoFocus
                                  />
                                ) : (
                                  <p className="text-slate-500 font-medium text-base sm:text-lg leading-relaxed border-l-2 border-slate-100 pl-4 sm:pl-6 italic">"{record.description}"</p>
                                )}
                              </div>
                            </div>

                            <div className="md:text-right flex flex-row md:flex-col justify-between shrink-0 items-end md:items-stretch border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-8">
                              <div>
                                <div className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{record.duration}</div>
                                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-1">Net Minutes</div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{formatTime(record.startTime)} — {formatTime(record.finishTime)}</div>
                                <div className="text-[10px] sm:text-sm font-black text-slate-900 uppercase italic tracking-tight">LOGGED BY {record.maintainerName}</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Decorative background element */}
                          <div className="absolute bottom-0 right-0 text-slate-50 text-6xl sm:text-8xl font-black translate-x-1/4 translate-y-1/4 group-hover:text-singer-red/5 select-none pointer-events-none transition-colors">
                            {record.id.substr(0, 3).toUpperCase()}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-[32px] sm:rounded-[40px] p-12 sm:p-24 text-center border-4 border-dashed border-slate-100">
                        <CalendarIcon size={48} className="mx-auto text-slate-100 mb-4 sm:mb-6" />
                        <p className="text-slate-300 font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] text-base sm:text-lg">No Operational Data</p>
                        <p className="text-slate-400 font-medium mt-2 text-xs sm:text-sm italic">Historical records show silence on this date.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center min-h-[300px]">
                  <div className="text-center">
                    <div className="text-slate-100 font-black uppercase text-6xl sm:text-9xl tracking-tighter italic select-none">IDLE</div>
                    <p className="text-slate-400 font-black uppercase tracking-[0.2em] -mt-4 sm:-mt-8 relative z-10 text-[9px] sm:text-xs">Select Temporal Node To Observe</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
