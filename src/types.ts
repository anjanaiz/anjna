export type JobRole = 'Admin' | 'Supervisor' | 'Maintainer';

export interface User {
  id: string;
  name: string;
  role: JobRole;
}

export type Department = 'Agro' | 'Modular' | 'Solid' | 'Sofa' | 'Other';

export interface Machine {
  id: string;
  name: string;
  department: Department;
  image?: string;
}

export type WorkType = 'Repair' | 'Service' | 'Break Down';
export type TimeType = 'Now' | 'Previous';

export interface MaintenanceRecord {
  id: string;
  maintainerName: string;
  role: JobRole;
  department: Department;
  machineId: string;
  machineName: string;
  workType: WorkType;
  timeType: TimeType;
  date: string; // ISO string
  startTime: string; // ISO string
  finishTime: string; // ISO string
  duration: number; // in minutes
  description: string;
  createdAt: string; // ISO string
}

export interface MachineReport {
  id: string;
  department: Department;
  machineId: string;
  machineName: string;
  workType: WorkType;
  description: string;
  status: 'pending' | 'addressed';
  createdAt: string; // ISO string
}
