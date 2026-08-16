export type Sector = 'private' | 'public' | 'mixed'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed'

export interface Company {
  id: string
  name: string
  taxId: string
  activity: string
  sector: Sector
  address: string
  phone: string
  email: string
  notes: string
  createdAt: string
}

export interface Employee {
  id: string
  companyId: string
  name: string
  nationalId: string
  birthDate: string
  gender: 'male' | 'female'
  maritalStatus: MaritalStatus
  jobTitle: string
  startDate: string
  endDate: string
  active: boolean
  basicSalary: number
  allowances: number
  otherBenefits: number
  inKindBenefits: number
  bonuses: number
  isPrimaryEmployer: boolean
  spouseAtHome: boolean
  childrenCount: number
  socialSecurity: boolean
  lifeInsurance: number
  alimony: number
  notes: string

  // Legacy compatibility fields
  nat?: 'iraqi' | 'foreign'
  res?: 'resident' | 'nonresident'
  sec?: 'private' | 'government'
  mainEmployer?: 'yes' | 'no'
  employerName?: string
  employerId?: string
  marital?: 'single' | 'married_housewife' | 'married_working' | 'widowed' | 'divorced'
  spouseName?: string
  spouseCivilId?: string
  marriageDate?: string
  divorceDate?: string
  spouseDisabled?: 'yes' | 'no'
  spouseEmployed?: 'yes' | 'no'
  incomeMerge?: 'yes' | 'no'
  spouseEmpId?: string
  child?: number
  childrenNames?: string[]
  over63?: 'yes' | 'no'
  months?: number
  salary?: number
  allow?: number
  cashHous?: number
  inKind?: 'none' | 'unfurnished' | 'furnished' | 'employerPart' | 'hotel' | 'caravan'
  actualRent?: number
  ins?: number
  leaveYear?: string | null
  leaveMonth?: string | null
  leaveDay?: string | null
}

export interface TaxBracket {
  from: number
  rate: number
}

export interface ContractType {
  id: string
  label: string
  rate: number
}

export interface SalesType {
  id: string
  label: string
  rate: number
}

export interface TaxConfig {
  legalAllowance: number
  spouseAllowance: number
  childAllowance: number
  maxChildren: number
  privateSectorExemptionRate: number
  socialSecurityRate: number
  employeeBrackets: TaxBracket[]
  annualBrackets: TaxBracket[]
  corporateRate: number
  corporateOilRate: number
  propertyRate: number
  propertyPenaltyRate: number
  landRate: number
  landExemptionArea: number
  professionAllowance: number
  contractTypes: ContractType[]
  salesTypes: SalesType[]
  salesDefaultId: string
}

export interface MonthlyRow {
  id: string
  companyId: string
  year: number
  month: number
  employeeId: string
  gross: number
  deductions: number
  taxable: number
  tax: number
  adjusted: number
  declared: boolean
}

export interface AnnualRow {
  id: string
  companyId: string
  year: number
  employeeId: string
  months: number
  gross: number
  deductions: number
  taxable: number
  annualTax: number
  paidTax: number
  difference: number
}

export interface CorporateReturn {
  id: string
  companyId: string
  year: number
  type: 'general' | 'oil'
  profits: number
  exemptions: number
  taxable: number
  rate: number
  tax: number
  paid: number
  notes: string
  createdAt: string
}

export interface ContractRecord {
  id: string
  companyId: string
  date: string
  party: string
  subject: string
  typeId: string
  amount: number
  rate: number
  tax: number
  paid: number
  notes: string
}

export interface PropertyRecord {
  id: string
  companyId: string
  year: number
  name: string
  location: string
  annualRent: number
  exemptAmount: number
  taxable: number
  rate: number
  tax: number
  paid: number
  penaltyMonths: number
  penalty: number
  totalDue: number
  notes: string
  nature?: string
  familyHome?: boolean
  isNew?: boolean
  buildDate?: string
  isEmpty?: boolean
  emptyMonths?: number
  maintenance?: number
  exempt?: boolean
  exemptReason?: string
  penaltyDelay?: boolean
  penaltyFalseInfo?: boolean
  penaltyFakeEmpty?: boolean
  penaltyUseChange?: boolean
}

export interface LandRecord {
  id: string
  companyId: string
  year: number
  name: string
  location: string
  area: number
  value: number
  exemptArea: number
  taxable: number
  rate: number
  tax: number
  paid: number
  notes: string
}

export interface ProfessionRecord {
  id: string
  companyId: string
  year: number
  name: string
  income: number
  allowance: number
  taxable: number
  tax: number
  paid: number
  notes: string
}

export interface SalesRecord {
  id: string
  companyId: string
  date: string
  invoiceNo: string
  description: string
  typeId: string
  amount: number
  rate: number
  tax: number
  paid: number
  notes: string
}

export interface User {
  id: string
  username: string
  password: string
  name: string
  role: 'admin' | 'accountant'
}

export interface Taxpayer {
  id: string
  taxId: string
  name: string
  type: 'individual' | 'company' | 'government'
  province: string
  phone: string
  email: string
  address: string
  status: 'active' | 'inactive' | 'suspended'
}

export interface Invoice {
  id: string
  client: string
  taxType: string
  amount: number
  date: string
  due: string
  status: 'paid' | 'pending' | 'overdue'
  notes: string
}

export interface Ticket {
  id: string
  subject: string
  dept: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'progress' | 'closed'
  date: string
  desc: string
}

export interface WorkflowItem {
  id: string
  title: string
  assignee: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'review' | 'approved' | 'completed'
  date: string
}

export interface Appointment {
  id: string
  title: string
  date: string
  time: string
  client: string
  notes: string
  status: 'upcoming' | 'completed'
}

export interface TaskItem {
  id: string
  title: string
  status: 'pending' | 'progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  date: string
}

export interface AuditEntry {
  id: string
  action: string
  user: string
  details: string
  time: string
}

export interface LoginEntry {
  id: string
  date: string
  user: string
  ip: string
  browser: string
  location: string
  status: 'success' | 'failed'
}

export interface DocumentRecord {
  id: string
  companyId: string
  name: string
  category: string
  size: string
  date: string
  url: string
}

export interface ApiKey {
  id: string
  name: string
  key: string
  status: 'active' | 'revoked'
  lastUsed: string
  created: string
  notes: string
}

export interface AppData {
  version: number
  companies: Company[]
  employees: Employee[]
  monthlyRows: MonthlyRow[]
  annualRows: AnnualRow[]
  corporateReturns: CorporateReturn[]
  contracts: ContractRecord[]
  properties: PropertyRecord[]
  lands: LandRecord[]
  professions: ProfessionRecord[]
  sales: SalesRecord[]
  config: TaxConfig
  users: User[]
  activeCompanyId: string
  taxpayers: Taxpayer[]
  invoices: Invoice[]
  tickets: Ticket[]
  workflows: WorkflowItem[]
  appointments: Appointment[]
  tasks: TaskItem[]
  auditLogs: AuditEntry[]
  loginHistory: LoginEntry[]
  documents: DocumentRecord[]
  apiKeys: ApiKey[]
  currentPackage: 'basic' | 'professional' | 'enterprise'
}

export type CollectionKey =
  | 'companies'
  | 'employees'
  | 'monthlyRows'
  | 'annualRows'
  | 'corporateReturns'
  | 'contracts'
  | 'properties'
  | 'lands'
  | 'professions'
  | 'sales'
  | 'users'
  | 'taxpayers'
  | 'invoices'
  | 'tickets'
  | 'workflows'
  | 'appointments'
  | 'tasks'
  | 'auditLogs'
  | 'loginHistory'
  | 'documents'
  | 'apiKeys'
