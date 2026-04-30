import { motion } from 'motion/react';
import SingerLogo from './SingerLogo';
import { 
  Sofa, 
  ChevronRight, 
  Wrench, 
  Droplets, 
  Layers, 
  TreeDeciduous, 
  Wind 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { DEPARTMENTS } from '../constants';

import { Machine } from '../types';

export default function DepartmentSelection({ 
  onSelect, 
  onBack, 
  machines = [] 
}: { 
  onSelect: (dept: string) => void, 
  onBack: () => void,
  machines?: Machine[]
}) {
  const depts = [
    { id: 'maintenance', name: 'Maintenance Department', icon: Wrench, color: 'bg-singer-red', tagline: 'Maintenance Machine' },
    { id: 'Agro', name: 'Agro Department', icon: Droplets, color: 'bg-slate-900', tagline: 'Assemble Water Pump' },
    { id: 'Modular', name: 'Modular Department', icon: Layers, color: 'bg-slate-900', tagline: 'Build Particle Board Furniture' },
    { id: 'Solid', name: 'Solid Department', icon: TreeDeciduous, color: 'bg-slate-900', tagline: 'Build Wood Furniture' },
    { id: 'Sofa', name: 'Sofa Department', icon: Sofa, color: 'bg-slate-900', tagline: 'Build Sofa' },
    { id: 'Other', name: 'Other Department', icon: Wind, color: 'bg-slate-900', tagline: 'Misc Operations' },
  ];

  const getMachinesForDept = (deptId: string) => {
    if (deptId === 'maintenance') return [];
    return machines.filter(m => m.department === deptId);
  };

  return (
    <div className="flex-1 flex flex-col bg-white min-h-0 overflow-y-auto relative">
      {/* Full Width Header Branding - Consistent with Login */}
      <header className="bg-singer-red pt-16 pb-12 px-8 flex flex-col items-center justify-center text-center relative overflow-hidden w-full shadow-lg shrink-0">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 z-20 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white hover:text-singer-red transition-all group"
        >
          <ChevronRight size={20} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
        </button>

        <SingerLogo variant="white" className="scale-[1.2] mb-6 relative z-10" />
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-white font-black text-xl sm:text-2xl tracking-[0.2em] leading-none uppercase mb-2">Operational</h2>
          <h3 className="text-white font-black text-lg sm:text-xl tracking-[0.3em] leading-none uppercase opacity-90">Access Portal</h3>
        </div>
        {/* Subtle noise/texture */}
        <div className="absolute inset-0 bg-black opacity-[0.03] pointer-events-none" />
      </header>

      <div className="max-w-6xl mx-auto w-full py-12 px-6 space-y-12">
        <div className="text-center">
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none uppercase mb-4">
            Select <span className="text-singer-red">Department</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] sm:text-xs">
            SINGER Industrial Management Portal
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {depts.map((dept, idx) => {
            const Icon = dept.icon;
            return (
              <motion.button
                key={dept.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => onSelect(dept.id)}
                className="group relative bg-white border-2 border-slate-200 rounded-[32px] p-8 flex flex-col items-start text-left gap-8 hover:border-slate-900 hover:shadow-[40px_40px_80px_rgba(0,0,0,0.05)] transition-all hover:-translate-y-2 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-slate-50 text-8xl font-black opacity-0 group-hover:opacity-100 transition-opacity select-none italic">
                  {dept.name.charAt(0)}
                </div>

                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-inner relative z-10 transition-transform group-hover:scale-110",
                  dept.color
                )}>
                  <Icon size={32} />
                </div>

                <div className="relative z-10 space-y-2">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-singer-red transition-colors">
                    {dept.tagline}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-slate-800 tracking-tighter group-hover:text-slate-900 border-b-2 border-slate-100 pb-2 mb-4">
                    {dept.name}
                  </h3>
                  
                  {/* Machines List */}
                  {getMachinesForDept(dept.id).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {getMachinesForDept(dept.id).slice(0, 4).map((m) => (
                        <span key={m.id} className="text-[8px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-wider group-hover:bg-singer-red/10 group-hover:text-singer-red transition-colors" dangerouslySetInnerHTML={{ __html: m.name.replace('<br>', ' ') }} />
                      ))}
                      {getMachinesForDept(dept.id).length > 4 && (
                        <span className="text-[8px] font-black text-slate-300">+{getMachinesForDept(dept.id).length - 4} MORE</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-4 flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  Access Portal <ChevronRight size={16} />
                </div>
              </motion.button>
            );
          })}
        </div>

        <footer className="pt-12 text-center">
          <div className="inline-flex items-center gap-4 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            System Online: Global Personnel Verification Active
          </div>
        </footer>
      </div>
    </div>
  );
}
