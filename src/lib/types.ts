export interface Job {
  id: string;
  name: string;
  client: string;
  materialCost: number;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  status: 'In Progress' | 'Completed' | 'On Hold';
}

export interface Session {
  id: string;
  jobId: string;
  userId: string;
  taskType: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in seconds
  units: number;
  notes: string;
  photos: string[];
}

export interface Material {
  id: string;
  name: string;
  cost: number;
  unit: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Yard Staff' | 'Welder';
  rate: number; // hourly rate
}

export interface TaskType {
  id: string;
  name: string;
}

export interface Report {
  id: string;
  name: string;
  dateGenerated: Date;
  dateRange: { from: Date; to: Date };
  data: any[];
}
