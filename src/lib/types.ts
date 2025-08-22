

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
  taskTypeId: string;
  startedAt: Date;
  stoppedAt: Date | null;
  durationSec: number; // calculated by function
  unitsCompleted: number;
  notes: string;
  photos: string[];
  laborCost: number; // calculated by function
}

export interface JobMaterial {
  id: string; // This will be the document id in the subcollection
  sku: string; // From materials catalog
  name: string;
  unitCost: number;
  quantity: number;
  subtotal: number; // calculated by function
}

export interface MaterialCatalogItem {
    id: string; // SKU
    sku: string;
    name: string;
    unit: string;
    cost: number;
    description?: string;
    isActive: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string; // Can be a synthetic email
  role: 'Admin' | 'Yard Staff' | 'Welder' | 'Supervisor' | 'Worker';
  rate: number; // hourly rate
  isActive: boolean;
}

export interface TaskType {
  id:string;
  name: string;
  unitLabel?: string;
  defaultLaborRate?: number;
  defaultOverheadPct?: number;
  isActive?: boolean;
  defaultMaterials?: {
    sku: string;
    quantity: number;
  }[];
}

export interface OrganizationRates {
    defaultLaborRate: number;
    defaultOverheadPct: number;
}

export interface Report {
  id: string;
  name: string;
  dateGenerated: Date;
  dateRange: { from: Date; to: Date };
  data: any[];
}
