
export const STORAGE_KEY = "neoPortfolio:v2";
export const BACKUP_KEY = "neoPortfolio:backups";
export const THEME_KEY = "neo_theme_preference";
export const COLOR_THEME_KEY = "neo_color_theme";

export const SOURCE_OF_ASSET_ENUM = ["Owner", "Campaign", "Referral", "Broker", "Other"];
export const FURNITURE_ENUM = ["Furnished", "Unfurnished", "Part Furnished", "N/A"];
export const STATUS_ENUM = ["Rented", "Vacant", "Off-Plan"];
export const CONSTRUCTION_STATUS_ENUM = ["In Progress", "Completed"];
export const HANDOVER_STATUS_ENUM = ["Not Handed Over", "Handed Over"];
export const BEDROOMS_ENUM = ["Studio", "1", "2", "3", "4", "5", "6", "7+"];
export const BATHROOMS_ENUM = ["1", "1.5", "2", "2.5", "3", "3.5", "4", "5+"];

export const FINAL_ASSET_DEFAULTS = {
  id: "",
  name: "",
  type: "Apartment",
  area: "",
  status: "Vacant",
  masterCommunity: "",
  subCommunity: "",
  buildingName: "",
  developer: "",
  publicUnitNo: "",
  size: 0,
  bedrooms: "",
  bathrooms: "",
  floor: "",
  parking: "",
  furniture: "N/A",
  sourceOfAsset: "Other",
  value: 0,
  rent: 0,
  expiry: "",
  serviceCharges: 0,
  managementFee: 0,
  otherExpenses: 0,
  purchasePrice: 0,
  purchaseDate: "",
  acquisitionCosts: 0,
  leaseStartDate: "",
  leaseEndDate: "",
  rentFrequency: "",
  isMortgaged: false,
  mortgageBalance: 0,
  annualMortgagePayment: 0,
  vacantSince: "",
  constructionStatus: "In Progress",
  handoverStatus: "Not Handed Over",
  baselineConstructionProgressPercent: 0,
  actualConstructionProgressPercent: 0,
  expectedHandoverDate: "",
  spaSignedDate: "",
  paymentPlan: [],
  valuationHistory: [],
  cheques: [],
  maintenance: [],
  documents: [],
  rentalHistory: []
};
