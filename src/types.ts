export type JobRole = 'Admin' | 'Supervisor' | 'Maintainer';

export interface User {
  id: string;
  name: string;
  role: JobRole;
}

export type Factory = 'Agro' | 'Modular' | 'Solid' | 'Sofa' | 'Other';
export type Department = Factory;

export interface Machine {
  id: string;
  name: string;
  department: Factory;
  image?: string;
}

export type WorkType = 'Repair' | 'Service' | 'Break Down';
export type TimeType = 'Now' | 'Previous';

export interface MaintenanceRecord {
  id: string;
  maintainerName: string;
  role: JobRole;
  department: Factory;
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
  department: Factory;
  machineId: string;
  machineName: string;
  workType: WorkType;
  description: string;
  status: 'pending' | 'in-progress' | 'addressed';
  createdAt: string; // ISO string
  scheduledAt?: string; // ISO string
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: WorkType | 'System';
  department: Factory;
  machineId: string;
  machineName: string;
  createdAt: string;
  readBy: string[]; // ids of users who have read it
}
