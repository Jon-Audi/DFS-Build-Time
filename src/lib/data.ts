import type { Job, Material, User, TaskType } from './types';

export const mockUsers: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john.doe@trackit.com', role: 'Admin', rate: 45 },
  { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@trackit.com', role: 'Worker', rate: 35 },
  { id: 'user-3', name: 'Mike Johnson', email: 'mike.johnson@trackit.com', role: 'Worker', rate: 32 },
];

export const mockJobs: Job[] = [
  { id: 'job-1', name: 'Anderson Residence Fence', client: 'Mr. Anderson', materialCost: 1250, laborCost: 800, overheadCost: 410, totalCost: 2460, status: 'Completed' },
  { id: 'job-2', name: 'Maple Street Community Garden', client: 'City Council', materialCost: 3400, laborCost: 2200, overheadCost: 1120, totalCost: 6720, status: 'In Progress' },
  { id: 'job-3', name: 'Suburban Office Park Perimeter', client: 'Prime Properties', materialCost: 5600, laborCost: 3500, overheadCost: 1820, totalCost: 10920, status: 'In Progress' },
  { id: 'job-4', name: 'Private Estate Security Fence', client: 'Ms. Wallace', materialCost: 8900, laborCost: 5000, overheadCost: 2780, totalCost: 16680, status: 'On Hold' },
  { id: 'job-5', name: 'Johnson Farm Livestock Fence', client: 'Mr. Johnson', materialCost: 2100, laborCost: 1500, overheadCost: 720, totalCost: 4320, status: 'Completed' },
];

export const mockMaterials: Material[] = [
  { id: 'mat-1', name: '6ft Cedar Picket', cost: 4.50, unit: 'picket' },
  { id: 'mat-2', name: '8ft Pressure-Treated Post 4x4', cost: 12.75, unit: 'post' },
  { id: 'mat-3', name: '8ft Cedar Rail 2x4', cost: 9.20, unit: 'rail' },
  { id: 'mat-4', name: '80lb Concrete Mix', cost: 5.50, unit: 'bag' },
  { id: 'mat-5', name: 'Galvanized Wood Screws', cost: 15.00, unit: 'box' },
  { id: 'mat-6', name: 'Post Caps', cost: 3.25, unit: 'cap' },
  { id: 'mat-7', name: 'Gate Hardware Kit', cost: 45.00, unit: 'kit' },
  { id: 'mat-8', name: 'Chain Link Fabric 50ft', cost: 120.00, unit: 'roll'},
  { id: 'mat-9', name: 'Top Rail Pipe', cost: 25.00, unit: 'pipe'},
  { id: 'mat-10', name: 'Tension Bands', cost: 1.50, unit: 'band'}
];

export const mockTaskTypes: TaskType[] = [
  { id: 'task-1', name: 'Post Installation' },
  { id: 'task-2', name: 'Rail Installation' },
  { id: 'task-3', name: 'Picket/Panel Installation' },
  { id: 'task-4', name: 'Gate Installation' },
  { id: 'task-5', name: 'Demolition' },
  { id: 'task-6', name: 'Site Prep' },
];
