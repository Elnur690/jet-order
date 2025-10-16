// --- Enums to match Prisma Schema ---
export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum OrderStage {
  WAITING = 'WAITING',
  DESIGN = 'DESIGN',
  PRINT_READY = 'PRINT_READY',
  PRINTING = 'PRINTING',
  CUT = 'CUT',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED',
}

export enum PaperType {
  GLOSS = 'GLOSS',
  MATTE = 'MATTE',
  CARDSTOCK = 'CARDSTOCK',
  VINYL = 'VINYL',
  CUSTOM = 'CUSTOM',
}

// --- Model Interfaces ---
export interface User {
  id: string;
  phone: string;
  role: UserRole;
}

export interface Branch {
  id: string;
  name: string;
}

export interface File {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  size: number;
}

export interface Product {
  id: string;
  name?: string | null;
  width: number;
  height: number;
  quantity: number;
  price: number;
  needsDesign: boolean;
  designAmount?: number | null;
  needsCut: boolean;
  needsLamination: boolean;
  paperType: PaperType;
  files: File[];
}

export interface StageClaim {
  id: string;
  stage: OrderStage;
  claimedAt: string;
  completedAt: string | null;
  user: Pick<User, 'id' | 'phone'>;
}

export interface Order {
  id: string;
  customerName?: string | null;
  customerPhone: string;
  isUrgent: boolean;
  shippingPrice?: number | null;
  notes?: string | null;
  currentStage: OrderStage;
  createdAt: string;
  updatedAt: string;
  branch: Branch;
  creator: Pick<User, 'id' | 'phone'>;
  products: Product[];
  stageClaims: StageClaim[];
}

export interface AuditLog extends StageClaim {
  order: {
    id: string;
    customerPhone: string;
  };
}