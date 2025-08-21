
import type { Job, MaterialCatalogItem, User, TaskType } from './types';

export const mockUsers: User[] = [
  { id: 'user-1', name: 'John Doe', email: 'john.doe@fenceit.com', role: 'Admin', rate: 45 },
  { id: 'user-2', name: 'Jane Smith', email: 'jane.smith@fenceit.com', role: 'Yard Staff', rate: 22 },
  { id: 'user-3', name: 'Mike Johnson', email: 'mike.johnson@fenceit.com', role: 'Welder', rate: 28 },
];

export const mockJobs: Job[] = [
  { id: 'job-1', name: 'Anderson Residence Fence', client: 'Mr. Anderson', materialCost: 1250, laborCost: 800, overheadCost: 410, totalCost: 2460, status: 'Completed' },
  { id: 'job-2', name: 'Maple Street Community Garden', client: 'City Council', materialCost: 3400, laborCost: 2200, overheadCost: 1120, totalCost: 6720, status: 'In Progress' },
  { id: 'job-3', name: 'Suburban Office Park Perimeter', client: 'Prime Properties', materialCost: 5600, laborCost: 3500, overheadCost: 1820, totalCost: 10920, status: 'In Progress' },
  { id: 'job-4', name: 'Internal Stock Build', client: 'Internal', materialCost: 1500, laborCost: 0, overheadCost: 0, totalCost: 1500, status: 'In Progress' },
];

export const mockMaterials: MaterialCatalogItem[] = [
  { id: 'mat-1', sku: 'WD-PC-6C', name: '6ft Cedar Picket', cost: 4.50, unit: 'picket', isActive: true },
  { id: 'mat-2', sku: 'WD-PT-8P', name: '8ft Pressure-Treated Post 4x4', cost: 12.75, unit: 'post', isActive: true },
  { id: 'mat-3', sku: 'WD-CR-8C', name: '8ft Cedar Rail 2x4', cost: 9.20, unit: 'rail', isActive: true },
  { id: 'mat-4', sku: 'CN-MX-80', name: '80lb Concrete Mix', cost: 5.50, unit: 'bag', isActive: true },
  { id: 'mat-5', sku: 'HW-GS-1B', name: 'Galvanized Wood Screws', cost: 15.00, unit: 'box', isActive: true },
  { id: 'mat-6', sku: 'HW-PC-WD', name: 'Post Caps', cost: 3.25, unit: 'cap', isActive: true },
  { id: 'mat-7', sku: 'HW-GH-KT', name: 'Gate Hardware Kit', cost: 45.00, unit: 'kit', isActive: true },
  { id: 'mat-8', sku: 'CL-FB-50', name: 'Chain Link Fabric 50ft', cost: 120.00, unit: 'roll', isActive: true},
  { id: 'mat-9', sku: 'CL-TR-10', name: 'Top Rail Pipe', cost: 25.00, unit: 'pipe', isActive: true},
  { id: 'mat-10', sku: 'CL-TB-1', name: 'Tension Bands', cost: 1.50, unit: 'band', isActive: true}
];

export const mockTaskTypes: TaskType[] = [
    { id: 'task-1', name: 'Wood Section Assembly' },
    { id: 'task-2', name: 'Pipe Cutting & Prep' },
    { id: 'task-3', name: 'Gate Welding' },
    { id: 'task-4', name: 'Gate Cleaning & Wiring' },
    { id: 'task-5', name: 'Material Pulling' },
    { id: 'task-6', name: 'Yard Maintenance' },
];
