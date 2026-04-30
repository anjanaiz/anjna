import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Machine, WorkType, MachineReport } from '../types';
import SingerLogo from './SingerLogo';
import { 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  AlertTriangle, 
  Hammer, 
  Cog, 
  Activity,
  ClipboardPen,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function ModularDepartmentFlow({ 
  onBack, 
  onReport,
  machines,
  departmentName = 'Modular'
}: { 
  onBack: () => void, 
  onReport: (report: MachineReport) => Promise<void>,
  machines: Machine[],
  departmentName?: string
}) {
  const [step, setStep] = useState<'machines' | 'work-types' | 'description'>('machines');
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMachines = machines.filter(m => m.department === departmentName);

  const workTypes: { type: WorkType; icon: any; color: string; desc: string }[] = [
    { type: 'Repair', icon: Hammer, color: 'bg-amber-500', desc: 'Fix physical damage or failure' },
    { type: 'Service', icon: Cog, color: 'bg-blue-500', desc: 'Routine maintenance & inspection' },
    { type: 'Break Down', icon: AlertTriangle, color: 'bg-singer-red', desc: 'Critical system interruption' },
  ];

  const triggerReport = async (wType: WorkType, desc: string) => {
    if (!selectedMachine) return;

    setIsSubmitting(true);
    const report: MachineReport = {
      id: Math.random().toString(36).substr(2, 9),
      department: (selectedMachine.department as any) || departmentName,
      machineId: selectedMachine.id,
      machineName: selectedMachine.name,
      workType: wType,
      description: desc,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    try {
      await onReport(report);
      setStep('machines');
      setSelectedMachine(null);
      setSelectedWorkType(null);
      setDescription('');
    } catch (error) {
      console.error("Report submission failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMachineSelect = (m: Machine) => {
    setSelectedMachine(m);
    setStep('work-types');
  };

  const handleWorkTypeSelect = async (type: WorkType) => {
    setSelectedWorkType(type);
    if (type === 'Service') {
      await triggerReport('Service', 'Service Requested');
    } else {
      setStep('description');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMachine || !selectedWorkType || !description.trim()) return;

    await triggerReport(selectedWorkType, description.trim());
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-0 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full p-4 sm:p-8 flex-1 flex flex-col">
        {/* Header - Centered Titles */}
        <header className="flex flex-col items-center mb-12 relative pt-8 sm:pt-0">
          <button 
            onClick={() => {
              if (step === 'machines') onBack();
              else if (step === 'work-types') setStep('machines');
              else if (step === 'description') setStep('work-types');
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl hover:border-slate-900 transition-all text-slate-900 z-10 shadow-sm"
            disabled={step === 'success' || isSubmitting}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="text-center">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none mb-2">
              {departmentName} Department
            </h2>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none italic">
              {step === 'machines' ? 'Machine Selection' : 
               step === 'work-types' ? 'Operation Protocol' :
               step === 'description' ? 'Operational Narrative' : 'Report Logged'}
            </h1>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {step === 'machines' ? (
            <motion.div 
              key="machines"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredMachines.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => handleMachineSelect(m)}
                  className="group bg-white border-2 border-slate-200 rounded-[28px] p-6 text-left hover:border-slate-900 hover:shadow-xl transition-all relative overflow-hidden"
                >
                  <div className="w-32 h-32 bg-slate-50 text-slate-400 rounded-[32px] flex items-center justify-center mb-8 group-hover:bg-singer-red group-hover:text-white transition-all overflow-hidden ring-8 ring-slate-50 group-hover:ring-singer-red/10 shadow-inner">
                    {m.image ? (
                      <img src={m.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Settings size={48} />
                    )}
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sector ID: 0{idx + 1}</span>
                    <h3 className="text-lg font-black text-slate-800 uppercase leading-tight tracking-tight group-hover:text-slate-900" dangerouslySetInnerHTML={{ __html: m.name }} />
                  </div>
                </button>
              ))}
            </motion.div>
          ) : step === 'work-types' ? (
            <motion.div 
              key="work-types"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="bg-slate-900 p-8 rounded-[32px] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-4 border-singer-red shadow-2xl">
                <div>
                  <span className="text-[10px] font-black text-singer-red uppercase tracking-[0.2em] mb-2 block">Active Target Unit</span>
                  <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter" dangerouslySetInnerHTML={{ __html: selectedMachine?.name || '' }} />
                </div>
                <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest block mb-1">Status</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-widest">Unit Operational</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {workTypes.map((wt) => (
                  <button
                    key={wt.type}
                    onClick={() => handleWorkTypeSelect(wt.type)}
                    className="group bg-white border-2 border-slate-200 rounded-[32px] p-8 text-left hover:border-slate-900 hover:shadow-2xl transition-all flex flex-col gap-6"
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform",
                      wt.color
                    )}>
                      <wt.icon size={32} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-1 group-hover:text-slate-900">{wt.type}</h3>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-tight leading-tight">{wt.desc}</p>
                    </div>
                    <div className="mt-auto pt-4 flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                      Initiate Protocol <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ) : step === 'description' ? (
            <motion.div
              key="description"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto w-full"
            >
              <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-2xl border-2 border-slate-900 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white border-b-4 border-singer-red flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-singer-red rounded-xl">
                      <ClipboardPen size={24} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter italic">Anomaly Description</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Assignment: {selectedWorkType}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-4">Incident Log Narrative</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the machine status or failure in detail..."
                      className="w-full h-48 bg-slate-50 border-2 border-transparent focus:border-slate-900 rounded-[24px] p-6 outline-none transition-all text-slate-800 font-bold text-lg placeholder:text-slate-200 resize-none"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="w-full bg-singer-red text-white py-6 rounded-[24px] font-black text-xl italic tracking-tighter flex items-center justify-center gap-3 hover:bg-slate-900 transition-all shadow-[0px_20px_40px_rgba(211,47,47,0.2)] disabled:opacity-50 disabled:grayscale group"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={24} className="animate-spin" />
                        UPLOADING LOG...
                      </>
                    ) : (
                      <>
                        TRANSMIT TO MAINTENANCE
                        <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
