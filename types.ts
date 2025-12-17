
export enum AssetStatus {
  RENTED = 'Rented',
  VACANT = 'Vacant',
  OFF_PLAN = 'Off-Plan'
}

export interface PaymentPlanItem {
  id: string | number;
  milestone: string;
  percent: number;
  amount: number;
  date: string;
  status: 'Pending' | 'Paid';
}

export interface ValuationEntry {
  date: string;
  value: number;
}

export interface MaintenanceRecord {
  id: string | number;
  date: string;
  issue: string;
  cost: number;
  status: 'Pending' | 'Resolved';
}

export interface ChequeRecord {
  id: string | number;
  date: string;
  amount: number;
  status: 'Pending' | 'Cleared';
  number: string;
}

export interface RentalRecord {
  id: string | number;
  tenantName: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  status: 'Active' | 'Completed' | 'Terminated';
}

export interface DocumentRecord {
  id: string | number;
  name: string;
  type: string;
  date: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  area: string;
  status: string;
  masterCommunity: string;
  subCommunity: string;
  buildingName: string;
  developer: string;
  publicUnitNo: string;
  size: number;
  bedrooms: string;
  bathrooms: string;
  floor: string;
  parking: string;
  furniture: string;
  sourceOfAsset: string;
  value: number;
  rent: number;
  expiry: string;
  serviceCharges: number;
  managementFee: number;
  otherExpenses: number;
  purchasePrice: number;
  purchaseDate: string;
  acquisitionCosts: number;
  leaseStartDate: string;
  leaseEndDate: string;
  rentFrequency: string;
  isMortgaged: boolean;
  mortgageBalance: number;
  annualMortgagePayment: number;
  vacantSince: string;
  constructionStatus: string;
  handoverStatus: string;
  baselineConstructionProgressPercent: number;
  actualConstructionProgressPercent: number;
  expectedHandoverDate: string;
  spaSignedDate: string;
  paymentPlan: PaymentPlanItem[];
  valuationHistory: ValuationEntry[];
  cheques: ChequeRecord[];
  maintenance: MaintenanceRecord[];
  documents: DocumentRecord[];
  rentalHistory: RentalRecord[];
  clientName?: string;
  ownerId?: string;
  _legacy?: Record<string, any>;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationality: string;
  passport: string;
  emiratesId: string;
  type: string;
  tags: string[];
  assets: Asset[];
  totalValue: number;
  totalUnits: number;
}

export interface ThemeClasses {
  name: string;
  bg: string;
  bgHover: string;
  text: string;
  textDark: string;
  border: string;
  ring: string;
  borderFocus: string;
  light: string;
  badge: string;
}
