import type { AppData, Company, Employee, TaxConfig, SubscriptionTier, ModuleVisibility, RolePermission, SubscriptionGrant, UserRole } from './types'
import { nowYear } from './format'
import { calcEmployeeAnnual, calcEmployeeMonthly, calcCorporate, calcLand, calcProfession, calcPropertyForm, calcSales, calcContract, DEFAULT_EMPLOYEE_BRACKETS } from './tax'

export function defaultConfig(): TaxConfig {
  return {
    legalAllowance: 250000,
    spouseAllowance: 100000,
    childAllowance: 100000,
    maxChildren: 6,
    privateSectorExemptionRate: 0.3,
    socialSecurityRate: 0.05,
    employeeBrackets: DEFAULT_EMPLOYEE_BRACKETS,
    annualBrackets: DEFAULT_EMPLOYEE_BRACKETS,
    corporateRate: 0.15,
    corporateOilRate: 0.35,
    propertyRate: 0.1,
    propertyPenaltyRate: 0.02,
    landRate: 0.02,
    landExemptionArea: 800,
    professionAllowance: 250000,
    contractTypes: [
      { id: 'supply', label: 'توريد سلع', rate: 0.033 },
      { id: 'service', label: 'خدمات ومقاولات', rate: 0.07 },
      { id: 'consult', label: 'استشارات وأعمال مهنية', rate: 0.1 },
    ],
  }
}

function seedEmployees(): Employee[] {
  const c = seedCompanies()[0].id
  const mk = (
    i: number,
    name: string,
    nationalId: string,
    gender: 'male' | 'female',
    maritalStatus: Employee['maritalStatus'],
    jobTitle: string,
    basicSalary: number,
    allowances: number,
    childrenCount: number,
    spouseAtHome: boolean,
    extra: Partial<Employee> = {},
  ): Employee => ({
    id: 'emp-' + i,
    companyId: c,
    name,
    nationalId,
    birthDate: `198${i}010${i}`,
    gender,
    maritalStatus,
    jobTitle,
    startDate: `201${(i % 8) + 1}-0${(i % 9) + 1}-15`,
    endDate: '',
    active: true,
    basicSalary,
    allowances,
    otherBenefits: 0,
    inKindBenefits: 0,
    bonuses: 0,
    isPrimaryEmployer: true,
    spouseAtHome,
    childrenCount,
    socialSecurity: i % 2 === 0,
    lifeInsurance: i === 2 ? 25000 : 0,
    alimony: 0,
    notes: '',
    ...extra,
  })
  return [
    mk(1, 'أحمد عبد الكريم الحسيني', '12345678901', 'male', 'married', 'مدير مالي', 950000, 250000, 2, true),
    mk(2, 'زينب علي محمد', '23456789012', 'female', 'single', 'محاسبة', 520000, 120000, 0, false),
    mk(3, 'محمد جاسم العبيدي', '34567890123', 'male', 'married', 'مهندس أول', 1100000, 300000, 3, true, { lifeInsurance: 25000 }),
    mk(4, 'سارة خالد إبراهيم', '45678901234', 'female', 'single', 'موظفة إدارية', 450000, 100000, 0, false),
    mk(5, 'حسين فاضل النجار', '56789012345', 'male', 'married', 'مدير مشتريات', 1250000, 350000, 1, true),
    mk(6, 'نور هاشم السعدي', '67890123456', 'female', 'married', 'موظفة موارد بشرية', 600000, 140000, 1, true),
    mk(7, 'علي حسن الجبوري', '78901234567', 'male', 'married', 'فني صيانة', 780000, 180000, 4, true),
    mk(8, 'رنا عبد الله العزاوي', '89012345678', 'female', 'divorced', 'مساعدة إدارية', 470000, 90000, 1, false),
    mk(9, 'مصطفى كريم العاني', '90123456789', 'male', 'single', 'محلل مبيعات', 650000, 150000, 0, false),
    mk(10, 'هبة صباح التميمي', '11234567890', 'female', 'single', 'موظفة خدمات', 400000, 80000, 0, false),
  ]
}

// All nav paths that can be shown/hidden by the founder
const ALL_MODULE_PATHS = [
  '/dashboard',
  '/employees',
  '/users',
  '/tax/monthly',
  '/tax/annual',
  '/tax/corporate',
  '/tax/contracts',
  '/tax/property',
  '/tax/land',
  '/tax/profession',
  '/penalties',
  '/workflow',
  '/appointments',
  '/tasks',
  '/notifications',
  '/packages',
  '/audit',
  '/backup',
  '/contact',
  '/settings',
  '/founder',
]

export function defaultModuleVisibility(): ModuleVisibility[] {
  return ALL_MODULE_PATHS.map((path) => ({
    path,
    enabledForTiers: ['basic', 'professional', 'enterprise'] as SubscriptionTier[],
    visibleToRoles: ['founder', 'admin', 'accountant'] as UserRole[],
    forceHidden: false,
  }))
}

export function defaultRolePermissions(): RolePermission[] {
  return [
    {
      role: 'founder',
      canEditTaxConfig: true,
      canManageUsers: true,
      canViewAuditLog: true,
      canExportData: true,
      canManageInvoices: true,
      canManageAppointments: true,
      canDeleteRecords: true,
      canViewReports: true,
    },
    {
      role: 'admin',
      canEditTaxConfig: true,
      canManageUsers: true,
      canViewAuditLog: true,
      canExportData: true,
      canManageInvoices: true,
      canManageAppointments: true,
      canDeleteRecords: true,
      canViewReports: true,
    },
    {
      role: 'accountant',
      canEditTaxConfig: false,
      canManageUsers: false,
      canViewAuditLog: false,
      canExportData: true,
      canManageInvoices: true,
      canManageAppointments: true,
      canDeleteRecords: false,
      canViewReports: true,
    },
  ]
}

function seedCompanies(): Company[] {
  const y = nowYear()
  return [
    {
      id: 'comp-1',
      name: 'شركة المنارة للتجارة العامة',
      taxId: '4102012345',
      activity: 'استيراد وتجارة السلع العامة',
      sector: 'private',
      address: 'بغداد — الكرادة، شارع الأمن',
      phone: '07701234567',
      email: 'info@almanara.iq',
      notes: '',
      createdAt: `${y}-01-01`,
      ownerIdType: 'taxNumber',
      ownerIdentifier: '4102012345',
      ownerPhone: '07701234567',
      ownerEmail: 'owner@almanara.iq',
      status: 'active',
    },
  ]
}

export function buildSeedData(): AppData {
  const cfg = defaultConfig()
  const companies = seedCompanies()
  const employees = seedEmployees()
  const activeCompanyId = companies[0].id
  const year = nowYear()

  const monthlyRows: AppData['monthlyRows'] = []
  for (const emp of employees) {
    const r = calcEmployeeMonthly(emp, cfg)
    for (let m = 1; m <= 12; m++) {
      monthlyRows.push({
        id: `mr-${emp.id}-${m}`,
        companyId: emp.companyId,
        year,
        month: m,
        employeeId: emp.id,
        gross: r.gross,
        deductions: r.deductions,
        taxable: r.taxable,
        tax: r.tax,
        adjusted: r.tax,
        declared: m <= 10,
      })
    }
  }

  const annualRows: AppData['annualRows'] = []
  for (const emp of employees) {
    const monthly = calcEmployeeMonthly(emp, cfg)
    const paid = monthly.tax * 12
    const r = calcEmployeeAnnual(emp, cfg, 12, paid)
    annualRows.push({
      id: `ar-${emp.id}`,
      companyId: emp.companyId,
      year,
      employeeId: emp.id,
      months: 12,
      gross: r.gross,
      deductions: r.deductions,
      taxable: r.taxable,
      annualTax: r.tax,
      paidTax: paid,
      difference: r.difference,
    })
  }

  const corporateReturns: AppData['corporateReturns'] = [
    {
      id: 'corp-1',
      companyId: companies[0].id,
      year: year - 2,
      type: 'general',
      profits: 42000000,
      exemptions: 2000000,
      taxable: 40000000,
      rate: cfg.corporateRate,
      tax: 6000000,
      paid: 6000000,
      notes: 'تسوية كاملة',
      createdAt: `${year - 1}-03-15`,
    },
    {
      id: 'corp-2',
      companyId: companies[0].id,
      year: year - 1,
      type: 'general',
      profits: 52000000,
      exemptions: 2000000,
      taxable: 50000000,
      rate: cfg.corporateRate,
      tax: 7500000,
      paid: 7500000,
      notes: 'تسوية كاملة',
      createdAt: `${year}-03-10`,
    },
    {
      id: 'corp-3',
      companyId: companies[0].id,
      year,
      type: 'general',
      profits: 31000000,
      exemptions: 1000000,
      taxable: 30000000,
      rate: cfg.corporateRate,
      tax: 4500000,
      paid: 2000000,
      notes: 'دفعة أولى (تقسيط)',
      createdAt: `${year}-05-20`,
    },
  ]

  const contracts: AppData['contracts'] = [
    { id: 'ctr-1', companyId: companies[0].id, date: `${year}-02-10`, party: 'شركة بغداد للإنشاءات', subject: 'توريد مواد بناء', typeId: 'supply', amount: 15000000, rate: 0.033, tax: calcContract(15000000, 0.033), paid: 495000, notes: '', startDate: '', endDate: '', contractorType: 'primary' },
    { id: 'ctr-2', companyId: companies[0].id, date: `${year}-03-22`, party: 'مكتب السلامة للاستشارات', subject: 'استشارات مالية', typeId: 'consult', amount: 8000000, rate: 0.1, tax: calcContract(8000000, 0.1), paid: 800000, notes: '', startDate: '', endDate: '', contractorType: 'primary' },
    { id: 'ctr-3', companyId: companies[0].id, date: `${year}-05-05`, party: 'شركة الأفق للخدمات', subject: 'صيانة وأنظمة حاسوب', typeId: 'service', amount: 12000000, rate: 0.07, tax: calcContract(12000000, 0.07), paid: 0, notes: 'بذمة التسديد', startDate: '', endDate: '', contractorType: 'primary' },
    { id: 'ctr-7', companyId: companies[0].id, date: `${year}-07-01`, party: 'مكتب الرافدين للمحاماة', subject: 'استشارات قانونية', typeId: 'consult', amount: 5000000, rate: 0.1, tax: calcContract(5000000, 0.1), paid: 0, notes: 'جديد', startDate: '', endDate: '', contractorType: 'primary' },
  ]

  const properties: AppData['properties'] = [
    { id: 'prp-1', companyId: companies[0].id, year, name: 'المقر الرئيسي — الكرادة', location: 'بغداد، الكرادة', annualRent: 24000000, exemptAmount: 0, taxable: calcPropertyForm({ annualRent: 24000000, nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, rate: cfg.propertyRate, penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false, penaltyMonths: 0, monthlyPenaltyRate: cfg.propertyPenaltyRate }).taxable, rate: cfg.propertyRate, tax: calcPropertyForm({ annualRent: 24000000, nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, rate: cfg.propertyRate, penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false, penaltyMonths: 0, monthlyPenaltyRate: cfg.propertyPenaltyRate }).baseTax, paid: 2160000, penaltyMonths: 0, penalty: 0, totalDue: 2160000, notes: '', nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, maintenance: 2400000, exempt: false, exemptReason: '', penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false },
    { id: 'prp-2', companyId: companies[0].id, year, name: 'مستودع زيونة', location: 'بغداد، زيونة', annualRent: 12000000, exemptAmount: 0, taxable: 10800000, rate: cfg.propertyRate, tax: 1080000, paid: 600000, penaltyMonths: 2, penalty: 43200, totalDue: 1123200, notes: 'غرامة تأخير شهرين' },
    { id: 'prp-5', companyId: companies[0].id, year: year - 1, name: 'معرض الأعظمية', location: 'بغداد، الأعظمية', annualRent: 18000000, exemptAmount: 0, taxable: 16200000, rate: cfg.propertyRate, tax: 1620000, paid: 1620000, penaltyMonths: 0, penalty: 0, totalDue: 1620000, notes: '' },
  ]

  const lands: AppData['lands'] = [
    { id: 'lnd-1', companyId: companies[0].id, year, name: 'قطعة أرض رقم 12/م', location: 'بغداد، المنصور', area: 2500, value: 300000000, exemptArea: cfg.landExemptionArea, taxable: calcLand(300000000, 2500, cfg.landExemptionArea, cfg.landRate).taxable, rate: cfg.landRate, tax: calcLand(300000000, 2500, cfg.landExemptionArea, cfg.landRate).tax, paid: 4080000, notes: '' },
    { id: 'lnd-2', companyId: companies[0].id, year, name: 'مشروع سكني — أبي غريب', location: 'بغداد، أبي غريب', area: 12000, value: 900000000, exemptArea: cfg.landExemptionArea, taxable: calcLand(900000000, 12000, cfg.landExemptionArea, cfg.landRate).taxable, rate: cfg.landRate, tax: calcLand(900000000, 12000, cfg.landExemptionArea, cfg.landRate).tax, paid: 0, notes: 'بذمة التسديد' },
  ]

  const professions: AppData['professions'] = [
    { id: 'prf-1', companyId: companies[0].id, year, name: 'عمار محمد (استشارات محاسبة)', income: 42000000, allowance: cfg.professionAllowance, taxable: calcProfession(42000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(42000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 0, notes: 'مقاولة سنوية' },
    { id: 'prf-2', companyId: companies[0].id, year, name: 'د. ليلى حسن (عيادة استشارية)', income: 36000000, allowance: cfg.professionAllowance, taxable: calcProfession(36000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(36000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 1500000, notes: '' },
    { id: 'prf-5', companyId: companies[0].id, year: year - 1, name: 'مكتب الفرات الهندسي', income: 55000000, allowance: cfg.professionAllowance, taxable: calcProfession(55000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(55000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 4100000, notes: '' },
  ]

  const invoices: AppData['invoices'] = [
    { id: 'INV-001', client: 'شركة النور للتجارة والتوزيع', taxType: 'ضريبة دخل الشركات', taxRate: 0.15, amount: 2500000, taxAmount: 375000, date: `${year}-03-01`, due: `${year}-04-01`, period: `${year}-Q1`, relatedEntityId: 'corporate-1', status: 'paid', notes: '' },
    { id: 'INV-002', client: 'مؤسسة الرافدين للمقاولات العامة', taxType: 'ضريبة العقار', taxRate: 0.1, amount: 1800000, taxAmount: 180000, date: `${year}-03-10`, due: `${year}-04-10`, period: `${year}-Q1`, relatedEntityId: 'property-1', status: 'pending', notes: '' },
    { id: 'INV-003', client: 'شركة بغداد المتحدة', taxType: 'ضريبة العقود', taxRate: 0.07, amount: 3200000, taxAmount: 224000, date: `${year}-02-15`, due: `${year}-03-15`, period: `${year}-Q1`, relatedEntityId: 'contract-1', status: 'overdue', notes: '' },
    { id: 'INV-004', client: 'مكتب الأمين للمحاسبة والاستشارات', taxType: 'ضريبة المهنة', taxRate: 0.15, amount: 950000, taxAmount: 142500, date: `${year}-03-20`, due: `${year}-04-20`, period: `${year}-Q1`, relatedEntityId: 'profession-1', status: 'pending', notes: '' },
    { id: 'INV-005', client: 'شركة الفرات للإنشاء والإعمار', taxType: 'ضريبة العرصات', taxRate: 0.02, amount: 4100000, taxAmount: 82000, date: `${year}-01-05`, due: `${year}-02-05`, period: `${year}-Q1`, relatedEntityId: 'land-1', status: 'paid', notes: '' },
    { id: 'INV-006', client: 'مكتب الهدى للمحاسبة', taxType: 'ضريبة الشركات', taxRate: 0.15, amount: 5200000, taxAmount: 780000, date: `${year}-05-08`, due: `${year}-06-08`, period: `${year}-Q2`, relatedEntityId: 'corporate-2', status: 'pending', notes: 'خدمة استشارية' },
    { id: 'INV-007', client: 'شركة الفارس للاستيراد', taxType: 'ضريبة الاستقطاع', taxRate: 0.05, amount: 2900000, taxAmount: 145000, date: `${year}-06-05`, due: `${year}-07-05`, period: `${year}-Q2`, relatedEntityId: 'monthly-1', status: 'paid', notes: '' },
  ]

  const tickets: AppData['tickets'] = [
    { id: 'TKT-001', subject: 'مشكلة في حساب ضريبة الأرباح للشركة النفطية', dept: 'الدعم الفني', priority: 'high', status: 'open', date: `${year}-03-25`, desc: 'تظهر قيمة الضريبة مرتفعة عن النسبة المعتمدة.' },
    { id: 'TKT-002', subject: 'طلب تفعيل باقة الأعمال الشاملة المتقدمة', dept: 'الاشتراكات', priority: 'medium', status: 'progress', date: `${year}-03-22`, desc: 'نرجو تفعيل الباقة للاستفادة من كل الخدمات.' },
    { id: 'TKT-003', subject: 'خطأ في تقرير التحصيل السنوي الإجمالي المجمع', dept: 'المحاسبة', priority: 'low', status: 'closed', date: `${year}-03-18`, desc: 'تم حل المشكلة وتصحيح الفوارق الحسابية.' },
    { id: 'TKT-004', subject: 'إضافة شركة جديدة في حسابات الضرائب', dept: 'إدارة البيانات', priority: 'medium', status: 'open', date: `${year}-07-10`, desc: 'تحديث بيانات الشركة الجديدة وتحميل المستندات' },
  ]

  const workflows: AppData['workflows'] = [
    { id: 'w-1', title: 'مراجعة ملف شركة النور للتجارة والسلع', assignee: 'محمد أحمد', priority: 'high', status: 'new', date: `${year}-03-25` },
    { id: 'w-2', title: 'تدقيق ضريبة العقار المجمع - البصرة', assignee: 'سارة حسين', priority: 'medium', status: 'review', date: `${year}-03-20` },
    { id: 'w-3', title: 'معالجة اعتراض المكلف الفني المقدم للضريبة', assignee: 'أحمد علي', priority: 'urgent', status: 'review', date: `${year}-03-18` },
    { id: 'w-4', title: 'إصدار شهادة براءة ذمة قانونية رسمية', assignee: 'محمد أحمد', priority: 'low', status: 'approved', date: `${year}-03-15` },
    { id: 'w-5', title: 'تسوية ضريبية متأخرة - كركوك', assignee: 'سارة حسين', priority: 'medium', status: 'completed', date: `${year}-03-10` },
    { id: 'w-6', title: 'مراجعة دفعات المبيعات الشهرية للقطاع التجاري', assignee: 'ليلى هادي', priority: 'high', status: 'new', date: `${year}-08-01` },
  ]

  const appointments: AppData['appointments'] = [
    { id: 'a-1', title: 'مراجعة ملف شركة النور الضريبي والمستندات', date: `${year}-08-15`, time: '10:00', client: 'شركة النور', notes: 'يرجى إحضار كشوفات المصارف', status: 'upcoming', subscriptionTier: 'professional', taxModule: 'corporate', period: `${year}-Q3`, autoGenerated: false },
    { id: 'a-2', title: 'اجتماع لجنة التدقيق الضريبي العليا', date: `${year}-08-20`, time: '09:00', client: '', notes: 'قاعة الاجتماعات الرئيسية بالطابق الثاني', status: 'upcoming', subscriptionTier: 'enterprise', taxModule: 'corporate', period: `${year}-Q3`, autoGenerated: false },
    { id: 'a-3', title: 'تسليم شهادة براءة ذمة رسمية للمكلف', date: `${year}-08-01`, time: '14:00', client: 'أحمد محمود', notes: 'التسليم المباشر للمكلف', status: 'completed', subscriptionTier: 'professional', taxModule: 'corporate', period: `${year}-Q3`, autoGenerated: false },
    { id: 'a-4', title: 'مراجعة إقرار ضريبة الشركات - شركة الفارس', date: `${year}-08-22`, time: '11:30', client: 'شركة الفارس', notes: 'إحضار كشف حسابات بنكي', status: 'upcoming', subscriptionTier: 'professional', taxModule: 'corporate', period: `${year}-Q3`, autoGenerated: false },
  ]

  const tasks: AppData['tasks'] = [
    { id: 't-1', title: 'مراجعة ملفات ضريبية معلقة ومؤجلة من 2025', status: 'done', priority: 'high', date: `${year}-03-20`, taxType: 'corporate', period: `${year}-Q1`, autoGenerated: false, subscriptionTier: 'professional' },
    { id: 't-2', title: 'إعداد تقرير الربع الأول المالي لمصلحة الضرائب', status: 'progress', priority: 'medium', date: `${year}-03-25`, taxType: 'corporate', period: `${year}-Q1`, autoGenerated: false, subscriptionTier: 'professional' },
    { id: 't-3', title: 'إرسال إشعارات ومطالبات التأخير للمتخلفين', status: 'done', priority: 'medium', date: `${year}-03-15`, taxType: 'monthly', period: `${year}-03`, autoGenerated: true, subscriptionTier: 'professional' },
    { id: 't-4', title: 'تحديث البيانات الشهرية للمحافظات الأربع الكبرى', status: 'progress', priority: 'medium', date: `${year}-08-10`, taxType: 'annual', period: `${year}`, autoGenerated: false, subscriptionTier: 'professional' },
  ]

  const auditLogs: AppData['auditLogs'] = [
    { id: 'aud-1', action: 'تسجيل دخول', user: 'مدير النظام', details: 'تم تسجيل الدخول بنجاح من عنوان IP 192.168.1.100', time: `${year}-08-11 09:00:15` },
    { id: 'aud-2', action: 'إضافة شركة', user: 'مدير النظام', details: 'تمت إضافة شركة المنارة للتجارة العامة', time: `${year}-08-11 09:12:30` },
    { id: 'aud-3', action: 'حفظ إقرار ضريبي', user: 'المحاسب', details: 'حفظ إقرار ضريبة الاستقطاع المباشر لشهر تموز 2026', time: `${year}-08-11 11:45:00` },
    { id: 'aud-4', action: 'تحديث المعاملات', user: 'مدير النظام', details: 'تم تعديل نسبة ضريبة المبيعات والضمان الاجتماعي', time: `${year}-08-12 08:30:12` },
  ]

  const loginHistory: AppData['loginHistory'] = [
    { id: 'lh-1', date: `${year}-08-11 09:00:15`, user: 'admin', ip: '192.168.1.100', browser: 'Chrome 124', location: 'بغداد، العراق', status: 'success' },
    { id: 'lh-2', date: `${year}-08-10 14:30:45`, user: 'admin', ip: '192.168.1.100', browser: 'Chrome 124', location: 'بغداد، العراق', status: 'success' },
    { id: 'lh-3', date: `${year}-08-10 08:22:11`, user: 'accountant', ip: '10.0.0.55', browser: 'Firefox 125', location: 'البصرة، العراق', status: 'success' },
    { id: 'lh-4', date: `${year}-08-09 16:45:00`, user: 'unknown', ip: '203.45.67.89', browser: 'Edge 124', location: 'غير معروف', status: 'failed' },
    { id: 'lh-5', date: `${year}-08-08 13:10:00`, user: 'admin', ip: '172.16.1.30', browser: 'Chrome 124', location: 'النجف، العراق', status: 'success' },
  ]

  const apiKeys: AppData['apiKeys'] = [
    { id: 'key-1', name: 'تكامل ERP', key: 'tk_9f2a1c4e7b8d', status: 'active', lastUsed: `${year}-08-11 10:00:00`, created: `${year}-01-05`, notes: 'ربط مع نظام ERP الخاص بالمؤسسة' },
    { id: 'key-2', name: 'نسخ احتياطي', key: 'tk_5b7d9f3a6c8e', status: 'active', lastUsed: '', created: `${year}-02-18`, notes: 'مزامنة البيانات مع خدمة النسخ الاحتياطي' },
    { id: 'key-3', name: 'تقرير محاسبي', key: 'tk_7a1d4c2e9b0f', status: 'active', lastUsed: `${year}-08-01 12:00:00`, created: `${year}-04-09`, notes: 'تصدير التقارير الشهرية' },
  ]

  return {
    version: 4,
    companies,
    employees,
    monthlyRows,
    annualRows,
    corporateReturns,
    contracts,
    properties,
    lands,
    professions,
    config: cfg,
    users: [
      { id: 'user-founder', username: 'founder', password: 'founder@2026', name: 'مؤسس النظام', role: 'founder', status: 'active' },
      { id: 'user-admin', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin' },
      { id: 'user-accountant', username: 'accountant', password: '123456', name: 'المحاسب', role: 'accountant' },
      { id: 'user-auditor', username: 'auditor', password: 'aud123', name: 'مراجع داخلي', role: 'accountant' },
    ],
    activeCompanyId,
    companyName: '',
    invoices,
    tickets,
    workflows,
    appointments,
    tasks,
    auditLogs,
    loginHistory,
    apiKeys,
    currentPackage: 'enterprise' as SubscriptionTier,
    moduleVisibility: defaultModuleVisibility(),
    rolePermissions: defaultRolePermissions(),
    subscriptionGrants: [] as SubscriptionGrant[],
    maintenanceMode: false,
    maintenanceMessage: 'النظام في وضع الصيانة. يرجى المحاولة لاحقاً.',
  }
}
