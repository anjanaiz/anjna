import { useState, useMemo } from 'react';
import { MaintenanceRecord, Department, MachineReport, Machine, Notification, User } from '../types';
import { DEPARTMENTS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, Filter, Download, ChevronLeft, ChevronRight, 
  Bell, CheckCircle2, MessageSquareWarning, X, LogOut, Edit2, Save,
  BarChart3, Map as MapIcon, Settings, Activity, Layers, Users, Cpu, Maximize,
  Trash2, AlertCircle, Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfYear, endOfYear, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { cn, formatDate, formatTime } from '../lib/utils';
import { translateToEnglish } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import ModularMap from './ModularMap';
import NotificationTray from './NotificationTray';
import AITranslationTool from './AITranslationTool';

export default function SupervisorDashboard({ 
  records, 
  reports = [], 
  machines = [],
  onUpdateReport,
  onDeleteReport,
  onUpdateRecord,
  onDeleteRecord,
  onLogout,
  notifications = [],
  onMarkNotificationAsRead,
  onDeleteNotification
}: { 
  records: MaintenanceRecord[], 
  reports: MachineReport[],
  machines: Machine[],
  onUpdateReport: (id: string, updates: Partial<MachineReport>) => Promise<void>,
  onDeleteReport?: (id: string) => Promise<void>,
  onUpdateRecord: (id: string, updates: Partial<MaintenanceRecord>) => Promise<void>,
  onDeleteRecord?: (id: string) => Promise<void>,
  onLogout: () => void,
  notifications?: Notification[],
  onMarkNotificationAsRead: (id: string, userId: string) => Promise<void>,
  onDeleteNotification?: (id: string) => Promise<void>
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'analysis' | 'map'>('pending');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [filterDept, setFilterDept] = useState<Department | 'All'>('All');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [confirmingReportId, setConfirmingReportId] = useState<string | null>(null);
  const [confirmingRecordId, setConfirmingRecordId] = useState<string | null>(null);
  const [confirmingClearDate, setConfirmingClearDate] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [showAddressed, setShowAddressed] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [editingDateRecordId, setEditingDateRecordId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');

  const [selectedAnalysisDept, setSelectedAnalysisDept] = useState<Department>(DEPARTMENTS[0]);
  const [selectedAnalysisMachineId, setSelectedAnalysisMachineId] = useState<string | null>(null);

  const analysisData = useMemo(() => {
    // Filter records for the current month
    const monthlyRecords = records.filter(r => isSameMonth(new Date(r.date), currentMonth));
    
    // Detailed stats for the specifically selected machine or ALL machines in dept
    if (selectedAnalysisMachineId === 'all') {
      const deptMachines = machines.filter(m => m.department === selectedAnalysisDept);
      return deptMachines.map(machine => {
        const machineRecords = monthlyRecords.filter(r => r.machineId === machine.id);
        const name = machine.name.replace(/<br\s*\/?>/gi, ' ');
        return {
          name: name.length > 15 ? name.substring(0, 12) + '...' : name,
          fullName: name,
          "Broke Down": machineRecords.filter(r => r.workType === 'Break Down').length,
          "Serviced": machineRecords.filter(r => r.workType === 'Service').length,
          "Repaired": machineRecords.filter(r => r.workType === 'Repair').length,
        };
      }).filter(m => (m["Broke Down"] + m["Serviced"] + m["Repaired"]) > 0);
    } else if (selectedAnalysisMachineId) {
      const machine = machines.find(m => m.id === selectedAnalysisMachineId);
      if (machine) {
        const machineRecords = monthlyRecords.filter(r => r.machineId === machine.id);
        const name = machine.name.replace(/<br\s*\/?>/gi, ' ');
        return [{
          name: name,
          fullName: name,
          "Broke Down": machineRecords.filter(r => r.workType === 'Break Down').length,
          "Serviced": machineRecords.filter(r => r.workType === 'Service').length,
          "Repaired": machineRecords.filter(r => r.workType === 'Repair').length,
        }];
      }
    }
    
    return [];
  }, [records, machines, currentMonth, selectedAnalysisMachineId, selectedAnalysisDept]);

  const selectedMachineStats = selectedAnalysisMachineId === 'all' 
    ? {
        "Broke Down": analysisData.reduce((acc, curr) => acc + curr["Broke Down"], 0),
        "Serviced": analysisData.reduce((acc, curr) => acc + curr["Serviced"], 0),
        "Repaired": analysisData.reduce((acc, curr) => acc + curr["Repaired"], 0),
      }
    : analysisData[0] || null;
  const filteredMachinesForDept = machines.filter(m => m.department === selectedAnalysisDept);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const dailyRecords = records.filter(r => 
    selectedDate && isSameDay(new Date(r.date), selectedDate) &&
    (filterDept === 'All' || r.department === filterDept)
  );

  const pendingReports = reports.filter(r => 
    (showAddressed ? (r.status === 'pending' || r.status === 'addressed') : r.status === 'pending') &&
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
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <NotificationTray 
            notifications={notifications} 
            user={{ id: 'supervisor-1', name: 'Supervisor', role: 'Supervisor' }} 
            onMarkRead={onMarkNotificationAsRead} 
            onDelete={onDeleteNotification}
          />
          <div className="flex bg-white p-1.5 rounded-2xl border-2 border-slate-900 shadow-lg overflow-x-auto no-scrollbar w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={cn(
                "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'pending' ? "bg-singer-red text-white" : "text-slate-400 hover:text-slate-900"
              )}
            >
              <Bell size={16} />
              Pending
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
                "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'completed' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
              )}
            >
              <CheckCircle2 size={16} />
              Completed
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={cn(
                "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'analysis' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
              )}
            >
              <BarChart3 size={16} />
              Analysis
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={cn(
                "px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === 'map' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-900"
              )}
            >
              <MapIcon size={16} />
              Map
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
        {activeTab === 'pending' && (
          <motion.div
            key="pending-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12"
          >
            {/* Calendar & Filter Column */}
            <div className="lg:col-span-4 space-y-6 sm:space-y-8">
              {/* Pending Activity Summary */}
              <div className="bg-white p-8 rounded-[32px] border-2 border-slate-900 shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 text-slate-100/50 text-7xl font-black italic select-none">!</div>
                <div className="relative z-10 space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic flex items-center gap-2">
                      <AlertCircle className="text-singer-red" size={20} />
                      Pending Alerts
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Live Operational Disruptions</p>
                  </div>
                  
                  <div className="space-y-4">
                    {DEPARTMENTS.map(dept => {
                      const count = reports.filter(r => r.department === dept && r.status === 'pending').length;
                      if (count === 0) return null;
                      return (
                        <div key={dept} className="flex items-center justify-between group/item">
                          <span className="text-xs font-bold text-slate-600 uppercase tracking-tight group-hover/item:text-singer-red transition-colors">{dept} Sector</span>
                          <div className="flex items-center gap-2">
                            <div className="h-px w-8 bg-slate-100 group-hover/item:w-12 transition-all group-hover/item:bg-singer-red/20" />
                            <span className="bg-singer-red text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg shadow-singer-red/20">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {reports.filter(r => r.status === 'pending').length === 0 && (
                      <div className="py-4 text-center">
                        <CheckCircle2 className="mx-auto text-green-500 mb-2" size={24} />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No Active Alerts</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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
                
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl border-2 border-slate-100">
                  <button 
                    onClick={() => setShowAddressed(!showAddressed)}
                    className={cn(
                      "w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2",
                      showAddressed ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 text-slate-400"
                    )}
                  >
                    {showAddressed ? "Hide Addressed" : "Show Addressed"}
                  </button>
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
                                    setIsTranslating(true);
                                    try {
                                      const translated = await translateToEnglish(editDescription);
                                      setEditDescription(translated);
                                      await onUpdateReport(report.id, { description: translated });
                                    } catch (error) {
                                      console.error("Auto translation failed", error);
                                      await onUpdateReport(report.id, { description: editDescription });
                                    } finally {
                                      setIsTranslating(false);
                                      setEditingReportId(null);
                                    }
                                  }}
                                  disabled={isTranslating}
                                  className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all border-2 border-blue-100 hover:border-slate-900 shadow-sm disabled:opacity-50"
                                  title="Save Changes"
                                >
                                  {isTranslating ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
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
                              {onDeleteReport && (
                                <button 
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    if (confirmingReportId === report.id) {
                                      try {
                                        await onDeleteReport(report.id);
                                        setConfirmingReportId(null);
                                      } catch (err) {
                                        console.error("Failed to delete report:", err);
                                      }
                                    } else {
                                      setConfirmingReportId(report.id);
                                      // Reset after 3 seconds
                                      setTimeout(() => setConfirmingReportId(null), 3000);
                                    }
                                  }}
                                  className={cn(
                                    "w-12 h-12 flex items-center justify-center rounded-2xl transition-all border-2 shadow-sm group/trash",
                                    confirmingReportId === report.id 
                                      ? "bg-red-600 text-white border-slate-900 scale-110" 
                                      : "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white hover:border-slate-900"
                                  )}
                                  title={confirmingReportId === report.id ? "Click Again to Delete" : "Delete Report"}
                                >
                                  <Trash2 size={20} className={cn("transition-transform", confirmingReportId === report.id ? "rotate-12 scale-110" : "group-hover/trash:scale-110")} />
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 rounded-[24px] p-6 mb-6 relative z-10 border-2 border-transparent group-hover:border-slate-100 transition-colors">
                            {editingReportId === report.id ? (
                              <div className="space-y-4">
                                <div className="flex justify-end p-2 pb-0">
                                  <AITranslationTool 
                                    value={editDescription} 
                                    onTranslated={(translated) => setEditDescription(translated)} 
                                  />
                                </div>
                                <textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 font-sans text-base focus:border-singer-red outline-none min-h-[100px] resize-none"
                                  autoFocus
                                />
                              </div>
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
        )}

        {activeTab === 'completed' && (
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
                    <div className="flex items-center gap-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">
                          {dailyRecords.length} 
                        </span>
                        <span className="text-[10px] sm:text-xs font-black text-slate-300 uppercase tracking-widest leading-none">Events Logged</span>
                      </div>
                      {dailyRecords.length > 0 && onDeleteRecord && (
                        <button 
                          onClick={async () => {
                            if (confirmingClearDate) {
                              for (const record of dailyRecords) {
                                await onDeleteRecord(record.id);
                              }
                              setConfirmingClearDate(false);
                            } else {
                              setConfirmingClearDate(true);
                              setTimeout(() => setConfirmingClearDate(false), 3000);
                            }
                          }}
                          className={cn(
                            "px-4 py-2 border-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-sm",
                            confirmingClearDate 
                              ? "bg-red-600 text-white border-slate-900 scale-105" 
                              : "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white"
                          )}
                        >
                          {confirmingClearDate ? "Confirm Wipe Out?" : "Clear Date"}
                        </button>
                      )}
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
                                  {editingDateRecordId === record.id ? (
                                    <div className="flex items-center gap-2 bg-white border-2 border-slate-900 p-1.5 rounded-xl shadow-lg animate-in fade-in zoom-in duration-200">
                                      <input 
                                        type="date" 
                                        value={editDate}
                                        onChange={(e) => setEditDate(e.target.value)}
                                        className="bg-slate-50 border-none rounded-lg px-3 py-1.5 font-bold text-xs uppercase tracking-wider outline-none focus:ring-2 ring-singer-red/20"
                                      />
                                      <button 
                                        onClick={async () => {
                                          if (!editDate) return;
                                          const newDate = new Date(editDate);
                                          await onUpdateRecord(record.id, { date: newDate.toISOString() });
                                          setEditingDateRecordId(null);
                                        }}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-slate-900 transition-colors"
                                        title="Save Date"
                                      >
                                        <Save size={16} />
                                      </button>
                                      <button 
                                        onClick={() => setEditingDateRecordId(null)}
                                        className="p-2 bg-slate-100 text-slate-400 rounded-lg hover:bg-slate-200 transition-colors"
                                        title="Cancel"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        setEditingDateRecordId(record.id);
                                        setEditDate(format(new Date(record.date), 'yyyy-MM-dd'));
                                      }}
                                      className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-xl transition-all border-2 border-slate-100 hover:border-slate-900 shadow-sm"
                                      title="Change Date"
                                    >
                                      <CalendarIcon size={20} />
                                    </button>
                                  )}

                                  {editingRecordId === record.id ? (
                                    <button 
                                      onClick={async () => {
                                        setIsTranslating(true);
                                        try {
                                          const translated = await translateToEnglish(editDescription);
                                          setEditDescription(translated);
                                          await onUpdateRecord(record.id, { description: translated });
                                        } catch (error) {
                                          console.error("Auto translation failed", error);
                                          await onUpdateRecord(record.id, { description: editDescription });
                                        } finally {
                                          setIsTranslating(false);
                                          setEditingRecordId(null);
                                        }
                                      }}
                                      disabled={isTranslating}
                                      className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl transition-all border-2 border-blue-100 hover:border-slate-900 shadow-sm disabled:opacity-50"
                                      title="Save Changes"
                                    >
                                      {isTranslating ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
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
                                  {onDeleteRecord && (
                                    <button 
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirmingRecordId === record.id) {
                                          try {
                                            await onDeleteRecord(record.id);
                                            setConfirmingRecordId(null);
                                          } catch (err) {
                                            console.error("Failed to delete record:", err);
                                          }
                                        } else {
                                          setConfirmingRecordId(record.id);
                                          setTimeout(() => setConfirmingRecordId(null), 3000);
                                        }
                                      }}
                                      className={cn(
                                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all border-2 shadow-sm group/trash",
                                        confirmingRecordId === record.id 
                                          ? "bg-red-600 text-white border-slate-900 scale-110" 
                                          : "bg-red-50 text-red-600 border-red-100 hover:bg-red-600 hover:text-white"
                                      )}
                                      title={confirmingRecordId === record.id ? "Confirm Delete" : "Delete Record"}
                                    >
                                      <Trash2 size={18} className={cn("transition-transform", confirmingRecordId === record.id ? "rotate-12 scale-110" : "group-hover/trash:scale-110")} />
                                    </button>
                                  )}
                                </div>
                              </div>
                              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase group-hover:text-singer-red transition-colors italic leading-tight" dangerouslySetInnerHTML={{ __html: record.machineName || 'Unknown Machine' }} />
                              <div className="bg-slate-50 rounded-[20px] p-6 relative z-10 border-2 border-transparent group-hover:border-slate-100 transition-colors">
                                {editingRecordId === record.id ? (
                                  <div className="space-y-4">
                                    <div className="flex justify-end p-2 pb-0">
                                      <AITranslationTool 
                                        value={editDescription} 
                                        onTranslated={(translated) => setEditDescription(translated)} 
                                      />
                                    </div>
                                    <textarea
                                      value={editDescription}
                                      onChange={(e) => setEditDescription(e.target.value)}
                                      className="w-full bg-white border-2 border-slate-200 rounded-xl p-4 font-sans text-base focus:border-singer-red outline-none min-h-[100px] resize-none"
                                      autoFocus
                                    />
                                  </div>
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

        {activeTab === 'analysis' && (
          <motion.div
            key="analysis-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            {/* Controls Section */}
            <div className="bg-white p-8 rounded-[32px] border-2 border-slate-900 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Machine Analysis</h2>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Manual Filter & Diagnostic View</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border-2 border-slate-200">
                  <button onClick={prevMonth} className="p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"><ChevronLeft size={20}/></button>
                  <span className="font-black uppercase tracking-tighter text-slate-900 px-4 min-w-[140px] text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                  <button onClick={nextMonth} className="p-3 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"><ChevronRight size={20}/></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">1. Select Department</label>
                  <div className="flex flex-wrap gap-2">
                    {DEPARTMENTS.map(dept => (
                      <button
                        key={dept}
                        onClick={() => {
                          setSelectedAnalysisDept(dept);
                          setSelectedAnalysisMachineId(null);
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all",
                          selectedAnalysisDept === dept 
                            ? "bg-slate-900 border-slate-900 text-white shadow-md scale-105" 
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900"
                        )}
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">2. Select Machine</label>
                  <select 
                    value={selectedAnalysisMachineId || ''} 
                    onChange={(e) => setSelectedAnalysisMachineId(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 font-black text-slate-900 uppercase tracking-tighter appearance-none focus:border-singer-red focus:outline-none transition-colors"
                  >
                    <option value="">Choose a machine...</option>
                    <option value="all">ALL MACHINES</option>
                    {filteredMachinesForDept.map(m => (
                      <option key={m.id} value={m.id}>{m.name.replace(/<br\s*\/?>/gi, ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Analysis Result */}
            {selectedAnalysisMachineId && (selectedMachineStats || analysisData.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Block */}
                <div className="lg:col-span-2 bg-white rounded-[40px] p-8 sm:p-12 shadow-xl border-2 border-slate-100 relative overflow-hidden group">
                  <div className="relative z-10 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-1 bg-singer-red" />
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Operational Metrics</h3>
                    </div>

                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analysisData} margin={{ top: 20, right: 30, left: 20, bottom: selectedAnalysisMachineId === 'all' ? 60 : 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            hide={selectedAnalysisMachineId !== 'all'}
                            angle={-45}
                            textAnchor="end"
                            interval={0}
                            tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }}
                          />
                          <YAxis 
                            tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                            allowDecimals={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              borderRadius: '16px', 
                              border: '2px solid #0f172a', 
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                              fontSize: '12px',
                              fontWeight: '900',
                              textTransform: 'uppercase'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ paddingTop: '20px', fontWeight: '900', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                          />
                          <Bar dataKey="Broke Down" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={selectedAnalysisMachineId === 'all' ? undefined : 60} />
                          <Bar dataKey="Serviced" fill="#3b82f6" radius={[8, 8, 0, 0]} barSize={selectedAnalysisMachineId === 'all' ? undefined : 60} />
                          <Bar dataKey="Repaired" fill="#f59e0b" radius={[8, 8, 0, 0]} barSize={selectedAnalysisMachineId === 'all' ? undefined : 60} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Counter Cards */}
                <div className="flex flex-col gap-4">
                  {[
                    { label: selectedAnalysisMachineId === 'all' ? 'Total Break Downs' : 'Machine Break Downs', value: selectedMachineStats?.["Broke Down"] || 0, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: selectedAnalysisMachineId === 'all' ? 'Total Times Serviced' : 'Times Serviced', value: selectedMachineStats?.["Serviced"] || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: selectedAnalysisMachineId === 'all' ? 'Total Repairs' : 'Repairs Completed', value: selectedMachineStats?.["Repaired"] || 0, color: 'text-amber-600', bg: 'bg-amber-50' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn("p-8 rounded-[32px] border-2 border-slate-100 flex flex-col justify-center", stat.bg)}
                    >
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                      <p className={cn("text-6xl font-black italic tracking-tighter", stat.color)}>{stat.value}</p>
                    </motion.div>
                  ))}
                  <div className="flex-1 bg-slate-900 rounded-[32px] p-8 flex flex-col justify-end text-white relative overflow-hidden">
                    <Settings className="absolute -top-4 -right-4 w-32 h-32 opacity-10 animate-spin-slow" />
                    <div className="relative z-10">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Scope</p>
                      <h3 className="text-xl font-black uppercase tracking-tighter italic leading-tight">
                        {selectedAnalysisMachineId === 'all' 
                          ? `${selectedAnalysisDept} Department (All)`
                          : machines.find(m => m.id === selectedAnalysisMachineId)?.name.replace(/<br\s*\/?>/gi, ' ')}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-32 text-center bg-white rounded-[40px] border-4 border-dashed border-slate-100">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                  <BarChart3 size={48} />
                </div>
                <h3 className="text-2xl font-black text-slate-300 uppercase tracking-widest">Select a machine to initiate analysis</h3>
                <p className="text-slate-400 font-medium italic mt-2 text-sm">Real-time telemetry and service history nodes will populate here.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'map' && (
          <motion.div
            key="future-improvements"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12"
          >
            <div className="bg-white p-12 rounded-[40px] border-2 border-slate-100 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-slate-900 text-[12rem] font-black italic select-none">
                2026
              </div>
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-2 bg-singer-red" />
                  <h2 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">Strategic <span className="text-singer-red underline decoration-slate-900 underline-offset-8">Roadmap</span></h2>
                </div>
                <p className="text-xl font-bold text-slate-400 uppercase tracking-widest max-w-2xl">Visualizing the future of machine diagnostics and spatial floor management.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Multi-Dept Support",
                  desc: "Expanded interactive maps for Packaging, Sewing, and Finishing departments for global oversight.",
                  icon: <Layers size={32} />,
                  color: "bg-blue-50 text-blue-600"
                },
                {
                  title: "Efficiency Heatmaps",
                  desc: "Visualize machine downtime frequency through thermal overlays on the floor plan.",
                  icon: <Activity size={32} />,
                  color: "bg-red-50 text-red-600"
                },
                {
                  title: "Maintainer Tracking",
                  desc: "Real-time location nodes for active maintainers to optimize task distribution.",
                  icon: <Users size={32} />,
                  color: "bg-green-50 text-green-600"
                },
                {
                  title: "AI Predictive Alerts",
                  desc: "Smart telemetry data predicting failures before they occur based on service frequency.",
                  icon: <Cpu size={32} />,
                  color: "bg-purple-50 text-purple-600"
                },
                {
                  title: "Full-Screen Mode",
                  desc: "Immersive spatial view for large command center displays with real-time incident highlights.",
                  icon: <Maximize size={32} />,
                  color: "bg-orange-50 text-orange-600"
                },
                {
                  title: "Custom Grid Editor",
                  desc: "Allow supervisors to drag and drop machine nodes to mirror physical factory floor changes.",
                  icon: <Settings size={32} />,
                  color: "bg-slate-50 text-slate-600"
                }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-10 rounded-[32px] border-2 border-slate-100 shadow-lg hover:shadow-2xl hover:border-slate-900 transition-all group"
                >
                  <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform", item.color)}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic mb-4">{item.title}</h3>
                  <p className="text-slate-400 font-bold text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
