/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import React from 'react';
import { User, MaintenanceRecord, MachineReport, Machine } from './types';
import { INITIAL_USERS } from './constants';
import Splash from './components/Splash';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import MaintainerWorkflow from './components/MaintainerWorkflow';
import DepartmentSelection from './components/DepartmentSelection';
import ModularDepartmentFlow from './components/ModularDepartmentFlow';
import { LogOut } from 'lucide-react';
import SingerLogo from './components/SingerLogo';
import { db, logout } from './lib/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError } from './lib/utils';

// Global Error Boundary Component
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string>('');

  useEffect(() => {
    const handleError = (event: ErrorEvent | PromiseRejectionEvent) => {
      setHasError(true);
      const msg = 'reason' in event ? event.reason : event.message;
      setErrorDetails(String(msg));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-2xl w-full bg-white rounded-[40px] p-12 text-center border-b-8 border-singer-red shadow-2xl">
          <div className="w-20 h-20 bg-singer-red/10 rounded-3xl flex items-center justify-center text-singer-red mx-auto mb-8">
            <LogOut size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">System Fault Detected</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-8 italic">Operational Protocol Aborted Due to Runtime Exception</p>
          <div className="bg-slate-50 p-6 rounded-2xl text-left font-mono text-[10px] text-slate-400 mb-8 max-h-48 overflow-auto border-2 border-slate-100 shadow-inner">
            {errorDetails}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-singer-red transition-all shadow-xl"
          >
            Refresh System Instance
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

type Page = 'splash' | 'department-selection' | 'login' | 'admin' | 'supervisor' | 'maintainer' | 'modular-dept';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('splash');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [reports, setReports] = useState<MachineReport[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  // Sync with Firestore
  useEffect(() => {
    // Real-time records sync
    const qRecords = query(collection(db, 'records'), orderBy('createdAt', 'desc'));
    const unsubscribeRecords = onSnapshot(qRecords, 
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MaintenanceRecord));
        setRecords(docs);
      },
      (error) => {
        console.error("Records sync error", error);
      }
    );

    // Real-time reports sync
    const qReports = query(collection(db, 'machine_reports'), orderBy('createdAt', 'desc'));
    const unsubscribeReports = onSnapshot(qReports,
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MachineReport));
        setReports(docs);
      },
      (error) => {
        console.error("Reports sync error", error);
      }
    );

    // Real-time machines sync
    const qMachines = query(collection(db, 'machines'));
    const unsubscribeMachines = onSnapshot(qMachines,
      (snapshot) => {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Machine));
        setMachines(docs);
      },
      (error) => {
        console.error("Machines sync error", error);
      }
    );

    // Sync session user
    const savedUser = sessionStorage.getItem('singer_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user && user.role) {
          setCurrentUser(user);
          if (user.role === 'Admin') setCurrentPage('admin');
          else if (user.role === 'Supervisor') setCurrentPage('supervisor');
          else if (user.role === 'Maintainer') setCurrentPage('maintainer');
        }
      } catch (err) {
        console.error("Session sync error", err);
        sessionStorage.removeItem('singer_current_user');
      }
    }

    return () => {
      unsubscribeRecords();
      unsubscribeReports();
      unsubscribeMachines();
    };
  }, []);

  // Save records to Firestore
  const addRecord = async (newRecord: MaintenanceRecord) => {
    try {
      const { id, ...data } = newRecord;
      await setDoc(doc(db, 'records', id), data);
    } catch (error) {
      handleFirestoreError(error, 'create', `records/${newRecord.id}`);
    }
  };

  // Save reports to Firestore
  const addReport = async (newReport: MachineReport) => {
    try {
      const { id, ...data } = newReport;
      await setDoc(doc(db, 'machine_reports', id), data);
    } catch (error) {
      handleFirestoreError(error, 'create', `machine_reports/${newReport.id}`);
    }
  };

  const updateReport = async (reportId: string, updates: Partial<MachineReport>) => {
    try {
      await setDoc(doc(db, 'machine_reports', reportId), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `machine_reports/${reportId}`);
    }
  };

  const updateRecord = async (recordId: string, updates: Partial<MaintenanceRecord>) => {
    try {
      await setDoc(doc(db, 'records', recordId), updates, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update', `records/${recordId}`);
    }
  };

  const addMachine = async (newMachine: Machine) => {
    try {
      const { id, ...data } = newMachine;
      await setDoc(doc(db, 'machines', id), data);
    } catch (error) {
      handleFirestoreError(error, 'create', `machines/${newMachine.id}`);
    }
  };

  const deleteMachine = async (machineId: string) => {
    try {
      await deleteDoc(doc(db, 'machines', machineId));
    } catch (error) {
      console.error("Delete machine error", error);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('singer_current_user', JSON.stringify(user));
    
    if (user.role === 'Admin') setCurrentPage('admin');
    else if (user.role === 'Supervisor') setCurrentPage('supervisor');
    else if (user.role === 'Maintainer') setCurrentPage('maintainer');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
    sessionStorage.removeItem('singer_current_user');
    setCurrentPage('department-selection');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'splash':
        return <Splash onComplete={() => setCurrentPage('department-selection')} />;
      case 'department-selection':
        return (
          <DepartmentSelection 
            onBack={() => setCurrentPage('splash')}
            onSelect={(deptId) => {
              if (deptId === 'maintenance') {
                setCurrentPage('login');
              } else if (deptId === 'Modular') {
                setCurrentPage('modular-dept');
              } else {
                alert(`${deptId} Portal is currently under maintenance. Please use the Maintenance module.`);
              }
            }} 
          />
        );
      case 'modular-dept':
        return (
          <ModularDepartmentFlow 
            onBack={() => setCurrentPage('department-selection')} 
            onReport={addReport}
            machines={machines}
          />
        );
      case 'login':
        return <Login onLogin={handleLogin} onBack={() => setCurrentPage('department-selection')} />;
      case 'admin':
        return (
          <AdminDashboard 
            records={records} 
            machines={machines}
            onAddMachine={addMachine}
            onDeleteMachine={deleteMachine}
            onLogout={handleLogout} 
          />
        );
      case 'supervisor':
        return (
          <SupervisorDashboard 
            records={records} 
            reports={reports}
            onUpdateReport={updateReport}
            onUpdateRecord={updateRecord}
            onLogout={handleLogout} 
          />
        );
      case 'maintainer':
        return (
          <MaintainerWorkflow 
            user={currentUser!} 
            onSave={addRecord} 
            onLogout={handleLogout} 
            machines={machines}
          />
        );
      default:
        return <div>Error: Page not found</div>;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {/* Header (Hidden on splash, login, and department selection) */}
        {currentPage !== 'splash' && currentPage !== 'login' && currentPage !== 'department-selection' && (
          <header className="bg-singer-red text-white px-4 py-8 sm:px-8 sm:py-10 flex justify-center items-center shrink-0 shadow-lg relative z-50">
            <SingerLogo variant="white" className="scale-110 sm:scale-125" />
          </header>
        )}

        <main className="flex-1 flex flex-col min-h-0">
          {renderPage()}
        </main>

        {/* Basic Footer */}
        {currentPage !== 'splash' && currentPage !== 'department-selection' && currentPage !== 'modular-dept' && (
          <footer className="py-8 sm:py-12 px-4 sm:px-8 text-center bg-slate-50 border-t border-slate-200">
            <p className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] sm:tracking-[0.4em] leading-relaxed">
              © {new Date().getFullYear()} SINGER (Sri Lanka) PLC <br className="sm:hidden" /> // INDUSTRIAL MAINTENANCE PROTOCOL
            </p>
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
}
