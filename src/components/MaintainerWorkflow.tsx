import { useState, useEffect } from 'react';
import { User, MaintenanceRecord, Department, Machine, WorkType, TimeType } from '../types';
import { DEPARTMENTS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Settings, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Play,
  Square,
  Wrench,
  Stethoscope,
  LayoutGrid,
  Zap,
  ClipboardList,
  Save,
  Factory,
  ArrowRight,
  ArrowLeft,
  Edit2,
  AlertTriangle,
  Languages,
  Loader2,
  Calendar,
  LogOut
} from 'lucide-react';
import { cn, formatTime } from '../lib/utils';
import { format } from 'date-fns';
import { translateToEnglish } from '../services/geminiService';
import AnalogTimePicker from './AnalogTimePicker';

export default function MaintainerWorkflow({ user, onSave, onLogout, machines }: { user: User, onSave: (r: MaintenanceRecord) => void, onLogout: () => void, machines: Machine[] }) {
  const [step, setStep] = useState(1);
  const [department, setDepartment] = useState<Department | null>(null);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [workType, setWorkType] = useState<WorkType | null>(null);
  const [timeType, setTimeType] = useState<TimeType | null>('Now');
  const [startTime, setStartTime] = useState<string>('');
  const [finishTime, setFinishTime] = useState<string>('');
  const [manualDate, setManualDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [description, setDescription] = useState('');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activePicker, setActivePicker] = useState<'start' | 'final' | null>(null);
  
  const machinesInDept = machines.filter(m => m.department === department);

  const calculateDuration = (start: string, finish: string) => {
    if (!start || !finish) return 0;
    const s = new Date(start).getTime();
    const f = new Date(finish).getTime();
    return Math.max(0, Math.floor((f - s) / (1000 * 60)));
  };

  const handleStartNow = () => {
    setStartTime(new Date().toISOString());
    setIsTimerRunning(true);
  };

  const handleFinishNow = () => {
    setFinishTime(new Date().toISOString());
    setIsTimerRunning(false);
  };

  const handleSave = () => {
    if (!department || !machine || !workType || !timeType || !startTime || !finishTime) {
      alert("Please complete all fields before saving.");
      return;
    }

    const record: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      maintainerName: user.name,
      role: user.role,
      department,
      machineId: machine.id,
      machineName: machine.name,
      workType,
      timeType,
      date: timeType === 'Now' ? startTime : new Date(manualDate).toISOString(),
      startTime,
      finishTime,
      duration: calculateDuration(startTime, finishTime),
      description,
      createdAt: new Date().toISOString()
    };

    onSave(record);
    resetFlow();
  };

  const resetFlow = () => {
    setStep(1);
    setDepartment(null);
    setMachine(null);
    setWorkType(null);
    setTimeType('Now');
    setStartTime('');
    setFinishTime('');
    setDescription('');
    setIsTimerRunning(false);
  };

  const handleServiceAction = () => {
    if (!department || !machine) return;

    const now = new Date().toISOString();
    const record: MaintenanceRecord = {
      id: Math.random().toString(36).substr(2, 9),
      maintainerName: user.name,
      role: user.role,
      department,
      machineId: machine.id,
      machineName: machine.name,
      workType: 'Service',
      timeType: 'Now',
      date: now,
      startTime: now,
      finishTime: now,
      duration: 0,
      description: 'Service Requested',
      createdAt: now
    };

    onSave(record);
    resetFlow();
  };

  const handleFinishWork = async () => {
    if (!description.trim()) return;
    
    setIsTranslating(true);
    try {
      const translated = await translateToEnglish(description);
      setDescription(translated);
      
      // Directly commit instead of going to step 6
      if (!department || !machine || !workType || !timeType || !startTime || !finishTime) {
        alert("Temporal data missing. Please check timing.");
        setStep(4);
        return;
      }

      const record: MaintenanceRecord = {
        id: Math.random().toString(36).substr(2, 9),
        maintainerName: user.name,
        role: user.role,
        department,
        machineId: machine.id,
        machineName: machine.name,
        workType,
        timeType,
        date: timeType === 'Now' ? startTime : new Date(manualDate).toISOString(),
        startTime,
        finishTime,
        duration: calculateDuration(startTime, finishTime),
        description: translated,
        createdAt: new Date().toISOString()
      };

      onSave(record);
      resetFlow();
    } catch (error) {
      console.error("Transmission fail", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const renderProgress = () => {
    const totalSteps = 5;
    return (
      <div className="flex gap-1 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-500",
              step > i + 1 ? "bg-singer-red" : step === i + 1 ? "bg-black" : "bg-gray-200"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden h-full">
      {/* Sidebar - Bold Typography Style (Desktop only) */}
      <aside className="w-80 bg-white border-r border-slate-200 p-8 hidden lg:flex flex-col shrink-0 overflow-y-auto">
        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-6 border-b border-slate-50 pb-4">Workflow Logic Control</div>
        <div className="space-y-6">
          {[
            { id: 1, label: 'Sector Selection' },
            { id: 2, label: 'Asset Identification' },
            { id: 3, label: 'Protocol Class' },
            { id: 4, label: 'Temporal Entry' },
            { id: 5, label: 'Analysis Report & Commit' }
          ].map((s) => (
            <div key={s.id} className={cn("flex gap-4 items-center transition-all duration-500", step < s.id && "opacity-20")}>
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all shadow-inner",
                step > s.id ? "bg-slate-900 text-white" : step === s.id ? "bg-singer-red text-white scale-110 shadow-lg shadow-singer-red/20" : "bg-slate-100 text-slate-400"
              )}>
                {step > s.id ? '✓' : s.id}
              </div>
              <div className="flex flex-col">
                <div className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  step === s.id ? "text-singer-red" : "text-slate-500"
                )}>
                  SYSTEM PHASE {s.id}
                </div>
                <div className={cn(
                  "text-sm font-black uppercase tracking-tight",
                  step === s.id ? "text-slate-900" : "text-slate-400"
                )}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-auto pt-10">
          <div className="bg-slate-900 p-8 rounded-[32px] border-2 border-singer-red shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
              <Zap size={40} />
            </div>
            <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Cycle Efficiency</div>
            <div className="text-4xl font-black text-white tracking-tighter italic tabular-nums">{Math.round((step / 5) * 100)}%</div>
            <div className="w-full bg-white/10 h-2 mt-4 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${(step / 5) * 100}%` }}
                className="bg-singer-red h-full shadow-[0_0_15px_rgba(211,47,47,0.8)]"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full h-12 bg-slate-100 text-slate-400 hover:bg-singer-red hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group"
          >
            <LogOut size={16} className="group-hover:rotate-12 transition-transform" />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 relative min-h-0">
        {/* Back Button (Floating) */}
        <button 
          onClick={step === 1 ? onLogout : () => setStep(step - 1)}
          className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:border-slate-900 transition-all text-slate-900 z-[60] shadow-sm group hidden lg:flex"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Mobile Progress Bar (Visible on < LG) */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
          <button 
            onClick={step === 1 ? onLogout : () => setStep(step - 1)}
            className="w-10 h-10 flex items-center justify-center bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest italic leading-none">Phase {step}</span>
              <span className={cn(
                "text-[10px] font-black text-singer-red uppercase tracking-widest leading-none"
              )}>{Math.round((step / 5) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${(step / 5) * 100}%` }}
                className="bg-singer-red h-full"
              />
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-12 xl:p-20">
          <AnimatePresence mode="wait">
            {/* Step 1: Department Selection */}
            {step === 1 && (
              <motion.div 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8 sm:space-y-12 max-w-4xl"
              >
                <header>
                  <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] mb-6 uppercase flex flex-col">
                    <span>SELECT</span>
                    <span className="text-singer-red">OPERATIONAL DEPARTMENT</span>
                  </h1>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Establish localized system anchor for logging</p>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {DEPARTMENTS.map((dept) => (
                    <button
                      key={dept}
                      onClick={() => { setDepartment(dept); setStep(2); }}
                      className="group bg-white border-2 border-slate-200 rounded-[32px] p-8 sm:p-12 flex flex-col items-start justify-center gap-6 hover:border-slate-900 hover:shadow-[40px_40px_80px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition-all text-left relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-8 text-slate-50 text-6xl font-black opacity-0 group-hover:opacity-100 transition-opacity select-none">{dept.charAt(0)}</div>
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all shadow-inner relative z-10">
                        <LayoutGrid size={32} />
                      </div>
                      <div className="relative z-10">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block group-hover:text-singer-red transition-colors">Sector ID: 00{DEPARTMENTS.indexOf(dept) + 1}</span>
                        <span className="text-2xl sm:text-3xl font-black uppercase text-slate-800 tracking-tighter group-hover:text-slate-900">{dept}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Machine Selection */}
            {step === 2 && (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8 sm:space-y-12 max-w-6xl"
              >
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-4 border-slate-900 pb-10">
                  <div>
                    <h1 className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-[0.8] mb-6 uppercase flex flex-col">
                      <span>IDENTIFY</span>
                      <span className="text-singer-red">MACHINE</span>
                    </h1>
                    <div className="flex gap-4 items-center">
                      <div className="px-4 py-1 bg-slate-900 text-white rounded text-[10px] font-black uppercase tracking-widest">{department} Division</div>
                      <p className="text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px]">Filter: Sub-system nodes</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setStep(1)} 
                    className="flex items-center gap-2 bg-singer-red text-white font-black uppercase text-[10px] sm:text-xs tracking-widest px-8 py-3 rounded-xl hover:bg-slate-900 transition-all shadow-lg active:scale-95 transition-all"
                  >
                    <ArrowLeft size={16} /> BACK
                  </button>
                </header>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {machinesInDept.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => { setMachine(m); setStep(3); }}
                      className={cn(
                        "group bg-white rounded-[40px] p-10 flex flex-col items-center transition-all duration-300 relative border-2",
                        machine?.id === m.id 
                          ? "border-singer-red shadow-[0_20px_50px_rgba(211,47,47,0.15)] scale-[1.02]" 
                          : "border-transparent shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-slate-100"
                      )}
                    >
                      {/* Image/Icon Area */}
                      <div className="relative w-full aspect-video flex items-center justify-center mb-8 bg-slate-50 rounded-[24px] overflow-hidden group-hover:bg-singer-red transition-colors shadow-inner">
                        {m.image ? (
                          <img 
                            src={m.image} 
                            alt={m.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="w-20 h-20 bg-singer-red rounded-full flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                            <Settings size={40} className="text-white group-hover:rotate-90 transition-transform duration-700" />
                          </div>
                        )}
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Divider */}
                      <div className="w-12 h-1 bg-singer-red rounded-full mb-6" />

                      {/* Info Area */}
                      <div className="space-y-2 text-center">
                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">ID: {m.id}</div>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tighter leading-tight" dangerouslySetInnerHTML={{ __html: m.name }} />
                      </div>

                      {/* Selection Indicator (Dot) */}
                      <div className={cn(
                        "absolute top-6 right-6 w-3 h-3 rounded-full transition-all duration-300",
                        machine?.id === m.id ? "bg-singer-red scale-100" : "bg-slate-100 scale-50 opacity-0"
                      )} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Work Type */}
            {step === 3 && (
              <motion.div 
                key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-12 max-w-4xl"
              >
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 border-b-4 border-slate-900 pb-10">
                  <div>
                    <h1 className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] mb-6 uppercase">WORK TYPE</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Node: <span dangerouslySetInnerHTML={{ __html: machine?.name || '' }} /> // Division: {department}</p>
                  </div>
                  <button 
                    onClick={() => setStep(2)} 
                    className="flex items-center gap-2 bg-singer-red text-white font-black uppercase text-[10px] sm:text-xs tracking-widest px-8 py-3 rounded-xl hover:bg-slate-900 transition-all shadow-lg active:scale-95 transition-all"
                  >
                    <ArrowLeft size={16} /> BACK
                  </button>
                </header>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-2xl text-left">
                  <button
                    onClick={() => { setWorkType('Repair'); setStep(4); }}
                    className={cn(
                      "group p-8 sm:p-10 bg-white border-4 rounded-[40px] text-left transition-all flex flex-col gap-8",
                      workType === 'Repair' ? "border-singer-red shadow-2xl" : "border-slate-50 hover:border-singer-red hover:shadow-[30px_30px_60px_rgba(211,47,47,0.05)]"
                    )}
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-[20px] flex items-center justify-center text-white transition-all shadow-xl group-hover:rotate-12",
                      workType === 'Repair' ? "bg-singer-red" : "bg-slate-900 group-hover:bg-singer-red"
                    )}>
                      <Wrench size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter italic">REPAIR</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Symptom Correction & Restoration</p>
                    </div>
                  </button>

                  <button
                    onClick={handleServiceAction}
                    className={cn(
                      "group p-8 sm:p-10 bg-white border-4 rounded-[40px] text-left transition-all flex flex-col gap-8",
                      workType === 'Service' ? "border-singer-red shadow-2xl" : "border-slate-50 hover:border-singer-red hover:shadow-[30px_30px_60px_rgba(211,47,47,0.05)]"
                    )}
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-[20px] flex items-center justify-center text-white transition-all shadow-xl group-hover:-rotate-12",
                      workType === 'Service' ? "bg-singer-red" : "bg-slate-900 group-hover:bg-singer-red"
                    )}>
                      <Stethoscope size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter italic">SERVICE</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Preventative Health Audit</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setWorkType('Break Down'); setStep(4); }}
                    className={cn(
                      "group p-8 sm:p-10 bg-white border-4 rounded-[40px] text-left transition-all flex flex-col gap-8",
                      workType === 'Break Down' ? "border-singer-red shadow-2xl" : "border-slate-50 hover:border-singer-red hover:shadow-[30px_30px_60px_rgba(211,47,47,0.05)]"
                    )}
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-[20px] flex items-center justify-center text-white transition-all shadow-xl group-hover:scale-110",
                      workType === 'Break Down' ? "bg-singer-red" : "bg-slate-900 group-hover:bg-singer-red"
                    )}>
                      <AlertTriangle size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mb-2 uppercase tracking-tighter italic">BREAK DOWN</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Critical Failure Response</p>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Time Selection */}
            {step === 4 && (
              <motion.div 
                key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-12 max-w-4xl"
              >
                <header>
                  <h1 className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] mb-6 uppercase">TIME TYPE</h1>
                  <div className="w-32 h-1.5 bg-singer-red mb-4"></div>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs underline decoration-slate-200 underline-offset-8 decoration-4">Primary Time Extraction Phase</p>
                </header>

                <div className="p-2 sm:p-3 rounded-[32px] bg-slate-200 flex gap-2">
                  <button 
                    onClick={() => setTimeType('Now')}
                    className={cn(
                      "flex-1 py-6 rounded-[24px] font-black uppercase text-xs sm:text-sm tracking-widest transition-all", 
                      timeType === 'Now' ? "bg-white text-singer-red shadow-2xl scale-[1.02]" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    LIVE TIME
                  </button>
                  <button 
                    onClick={() => { setTimeType('Previous'); setStartTime(''); setFinishTime(''); }}
                    className={cn(
                      "flex-1 py-6 rounded-[24px] font-black uppercase text-xs sm:text-sm tracking-widest transition-all", 
                      timeType === 'Previous' ? "bg-white text-singer-red shadow-2xl scale-[1.02]" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    PREVIOUS WORK
                  </button>
                </div>

                {timeType === 'Now' && (
                  <div className="bg-white p-10 sm:p-20 rounded-[48px] border-2 border-slate-50 shadow-[40px_40px_100px_rgba(0,0,0,0.03)] space-y-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-slate-50">
                       <motion.div 
                         animate={isTimerRunning ? { x: ['-100%', '100%'] } : {}}
                         transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                         className="w-1/3 h-full bg-singer-red opacity-50"
                       />
                    </div>

                    <div className="flex justify-center relative">
                      <div className={cn(
                        "w-56 h-56 sm:w-80 sm:h-80 rounded-full border-[12px] flex items-center justify-center transition-all duration-1000",
                        isTimerRunning ? "border-slate-900 border-t-singer-red italic" : "border-slate-50"
                      )}>
                        <div className="flex flex-col items-center">
                          <motion.div animate={isTimerRunning ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }}>
                            <Clock size={64} className={cn(isTimerRunning ? "text-singer-red" : "text-slate-100")} />
                          </motion.div>
                          <div className="mt-6 flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2">Clock Time</span>
                            <span className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter tabular-nums bg-slate-50 px-6 py-2 rounded-2xl">
                              {startTime ? formatTime(startTime) : "--:--"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-md mx-auto">
                      {!startTime && (
                        <button onClick={handleStartNow} className="w-full bg-singer-red text-white h-24 rounded-[24px] font-black text-2xl tracking-tighter hover:bg-slate-900 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 uppercase italic">
                          <Play fill="currentColor" /> START
                        </button>
                      )}

                      {startTime && !finishTime && (
                        <button onClick={handleFinishNow} className="w-full bg-slate-900 text-white h-24 rounded-[24px] font-black text-2xl tracking-tighter hover:bg-singer-red shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 uppercase italic">
                          <Square fill="currentColor" /> FINISH
                        </button>
                      )}

                      {finishTime && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pt-10 border-t-4 border-slate-50">
                          <div className="flex items-center justify-between px-10">
                            <div className="text-left">
                              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-1">Total Elapsed</span>
                              <span className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">{calculateDuration(startTime, finishTime)}</span>
                              <span className="text-xs font-black text-singer-red uppercase tracking-widest ml-2 italic">Minutes</span>
                            </div>
                            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-singer-red shadow-inner">
                              <CheckCircle2 size={40} />
                            </div>
                          </div>
                          <button onClick={() => setStep(5)} className="btn-primary w-full h-20 text-xl flex items-center justify-center gap-4 group">
                            FINISH WORK <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                )}

                {timeType === 'Previous' && (
                  <div className="bg-white p-10 sm:p-16 rounded-[48px] shadow-2xl border-2 border-slate-50 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 text-slate-50 select-none pointer-events-none">
                      <Zap size={120} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-6">
                          <Calendar size={12} className="text-singer-red" /> Node Date
                        </label>
                        <div className="relative group">
                          <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} className="w-full p-8 bg-slate-50 border-4 border-transparent focus:border-slate-900 rounded-[24px] text-2xl font-black outline-none transition-all shadow-inner relative z-10 appearance-none" />
                          <div className="absolute right-8 top-1/2 -translate-y-1/2 z-0 text-slate-200 group-focus-within:text-singer-red transition-colors pointer-events-none">
                            <Calendar size={32} />
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-6">
                            <Clock size={12} className="text-singer-red" /> Start Hr
                          </label>
                          <div className="relative group">
                            <button 
                              onClick={() => setActivePicker('start')}
                              className="w-full p-8 bg-slate-50 border-4 border-transparent hover:border-singer-red focus:border-slate-900 rounded-[24px] text-2xl font-black outline-none transition-all shadow-inner relative z-10 flex items-center justify-start"
                            >
                              {startTime ? format(new Date(startTime), 'HH:mm') : '00:00'}
                            </button>
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-0 text-slate-200 group-focus-within:text-singer-red transition-colors pointer-events-none">
                              <Clock size={32} />
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] ml-6">
                            <Clock size={12} className="text-singer-red" /> Final Hr
                          </label>
                          <div className="relative group">
                            <button 
                              onClick={() => setActivePicker('final')}
                              className="w-full p-8 bg-slate-50 border-4 border-transparent hover:border-singer-red focus:border-slate-900 rounded-[24px] text-2xl font-black outline-none transition-all shadow-inner relative z-10 flex items-center justify-start"
                            >
                              {finishTime ? format(new Date(finishTime), 'HH:mm') : '00:00'}
                            </button>
                            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-0 text-slate-200 group-focus-within:text-singer-red transition-colors pointer-events-none">
                              <Clock size={32} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {startTime && finishTime && (
                      <div className="p-10 bg-slate-900 rounded-[32px] flex justify-between items-center text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 uppercase font-black text-9xl group-hover:scale-150 transition-transform duration-1000">T</div>
                        <div className="relative z-10">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Calculated Duration</span>
                          <span className="text-5xl font-black text-white tracking-tighter tabular-nums">{calculateDuration(startTime, finishTime)} <span className="text-singer-red italic">MIN</span></span>
                        </div>
                        <button onClick={() => setStep(5)} className="relative z-10 w-20 h-20 bg-singer-red text-white p-0 rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-xl shadow-singer-red/20">
                          <CheckCircle2 size={40} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: Description */}
            {step === 5 && (
              <motion.div 
                key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-12 max-w-5xl"
              >
                <header>
                  <h1 className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tighter leading-[0.8] mb-6 uppercase">ANALYSIS<br />REPORT</h1>
                  <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Exposition of tasks executed within the operational window</p>
                </header>
                
                <div className="bg-white p-2 rounded-[48px] border-4 border-slate-50 shadow-2xl relative">
                  <div className="absolute top-8 left-10 p-2 bg-slate-100 rounded text-slate-300"><ClipboardList size={20} /></div>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Input technical summary. Focus on quantitative data and part identifiers..."
                    className="w-full h-80 sm:h-[400px] p-16 sm:p-24 bg-transparent text-xl sm:text-2xl font-medium outline-none resize-none placeholder:text-slate-100 font-sans leading-relaxed"
                  />
                  <div className="absolute bottom-10 right-10 flex gap-2">
                     <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">Character Pool: {description.length}</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <button onClick={() => setStep(4)} className="text-slate-300 font-black uppercase text-[10px] tracking-widest hover:text-slate-900 transition-all flex items-center gap-2">
                    <ArrowLeft size={16} /> REVISE TEMPORAL DATA
                  </button>
                  <button 
                    onClick={handleFinishWork}
                    disabled={!description.trim() || isTranslating}
                    className="btn-primary w-full sm:w-auto px-16 h-20 text-lg disabled:opacity-20 flex items-center justify-center gap-4 group shadow-2xl relative"
                  >
                    {isTranslating ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        TRANSLATING TO ENGLISH...
                      </>
                    ) : (
                      <>
                        FINISH WORK <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Time Picker Modal */}
          <AnimatePresence>
            {activePicker && (
              <AnalogTimePicker 
                label={activePicker === 'start' ? 'Start Hour' : 'Final Hour'}
                value={activePicker === 'start' 
                  ? (startTime ? format(new Date(startTime), 'HH:mm') : '00:00')
                  : (finishTime ? format(new Date(finishTime), 'HH:mm') : '00:00')
                }
                onClose={() => setActivePicker(null)}
                onChange={(val) => {
                  const [hours, minutes] = val.split(':');
                  const d = new Date(manualDate);
                  d.setHours(parseInt(hours), parseInt(minutes));
                  if (activePicker === 'start') setStartTime(d.toISOString());
                  else setFinishTime(d.toISOString());
                }}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
