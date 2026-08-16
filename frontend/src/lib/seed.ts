import type { AppData, Company, Employee, TaxConfig } from './types'
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
    salesTypes: [
      { id: 'essential', label: 'سلع أساسية', rate: 0.05 },
      { id: 'standard', label: 'سلع عامة', rate: 0.1 },
      { id: 'services', label: 'خدمات', rate: 0.15 },
      { id: 'tobacco', label: 'تبغ ومشروبات', rate: 0.2 },
      { id: 'luxury', label: 'سلع كمالية', rate: 0.3 },
    ],
    salesDefaultId: 'standard',
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
    },
    {
      id: 'comp-2',
      name: 'شركة الفارس للاستيراد والتوزيع',
      taxId: '4102098765',
      activity: 'استيراد وتوزيع السلع الغذائية والكمالية',
      sector: 'private',
      address: 'بغداد — المنصور، شارع الوحدة',
      phone: '07700998877',
      email: 'sales@alfaris-iq.com',
      notes: 'شركة تجارة متنوعة',
      createdAt: `${y}-02-14`,
    },
    {
      id: 'comp-3',
      name: 'مؤسسة الرافدين للمقاولات العامة',
      taxId: '4102123456',
      activity: 'مقاولات عامة وإنشاءات',
      sector: 'public',
      address: 'الموصل — الدواسة، شارع الصناعة',
      phone: '07703456789',
      email: 'rafidain@iq.com',
      notes: 'مؤسسة مقاولات وسكنية',
      createdAt: `${y}-03-08`,
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
    {
      id: 'corp-4',
      companyId: companies[1].id,
      year,
      type: 'general',
      profits: 27000000,
      exemptions: 1500000,
      taxable: 25500000,
      rate: cfg.corporateRate,
      tax: 3825000,
      paid: 2500000,
      notes: 'تنزيل دفع جزئي',
      createdAt: `${year}-06-14`,
    },
  ]

  const contracts: AppData['contracts'] = [
    { id: 'ctr-1', companyId: companies[0].id, date: `${year}-02-10`, party: 'شركة بغداد للإنشاءات', subject: 'توريد مواد بناء', typeId: 'supply', amount: 15000000, rate: 0.033, tax: calcContract(15000000, 0.033), paid: 495000, notes: '' },
    { id: 'ctr-2', companyId: companies[0].id, date: `${year}-03-22`, party: 'مكتب السلامة للاستشارات', subject: 'استشارات مالية', typeId: 'consult', amount: 8000000, rate: 0.1, tax: calcContract(8000000, 0.1), paid: 800000, notes: '' },
    { id: 'ctr-3', companyId: companies[0].id, date: `${year}-05-05`, party: 'شركة الأفق للخدمات', subject: 'صيانة وأنظمة حاسوب', typeId: 'service', amount: 12000000, rate: 0.07, tax: calcContract(12000000, 0.07), paid: 0, notes: 'بذمة التسديد' },
    { id: 'ctr-4', companyId: companies[1].id, date: `${year}-04-18`, party: 'مجموعة الفارس للمقاولات', subject: 'أعمال إنشائية', typeId: 'service', amount: 18500000, rate: 0.07, tax: calcContract(18500000, 0.07), paid: 1000000, notes: 'تسليم جزئي' },
    { id: 'ctr-5', companyId: companies[1].id, date: `${year}-06-29`, party: 'مركز دار الحكمة للاستشارات', subject: 'استشارات إدارية', typeId: 'consult', amount: 6700000, rate: 0.1, tax: calcContract(6700000, 0.1), paid: 0, notes: 'جديد' },
    { id: 'ctr-6', companyId: companies[2].id, date: `${year}-07-11`, party: 'صناعة الكفاح الغذائية', subject: 'توريد مواد غذائية', typeId: 'supply', amount: 11200000, rate: 0.033, tax: calcContract(11200000, 0.033), paid: 350000, notes: '' },
    { id: 'ctr-7', companyId: companies[0].id, date: `${year}-07-01`, party: 'مكتب الرافدين للمحاماة', subject: 'استشارات قانونية', typeId: 'consult', amount: 5000000, rate: 0.1, tax: calcContract(5000000, 0.1), paid: 0, notes: 'جديد' },
  ]

  const properties: AppData['properties'] = [
    { id: 'prp-1', companyId: companies[0].id, year, name: 'المقر الرئيسي — الكرادة', location: 'بغداد، الكرادة', annualRent: 24000000, exemptAmount: 0, taxable: calcPropertyForm({ annualRent: 24000000, nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, rate: cfg.propertyRate, penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false, penaltyMonths: 0, monthlyPenaltyRate: cfg.propertyPenaltyRate }).taxable, rate: cfg.propertyRate, tax: calcPropertyForm({ annualRent: 24000000, nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, rate: cfg.propertyRate, penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false, penaltyMonths: 0, monthlyPenaltyRate: cfg.propertyPenaltyRate }).baseTax, paid: 2160000, penaltyMonths: 0, penalty: 0, totalDue: 2160000, notes: '', nature: 'none', familyHome: false, isNew: false, buildDate: '', isEmpty: false, emptyMonths: 0, maintenance: 2400000, exempt: false, exemptReason: '', penaltyDelay: false, penaltyFalseInfo: false, penaltyFakeEmpty: false, penaltyUseChange: false },
    { id: 'prp-2', companyId: companies[0].id, year, name: 'مستودع زيونة', location: 'بغداد، زيونة', annualRent: 12000000, exemptAmount: 0, taxable: 10800000, rate: cfg.propertyRate, tax: 1080000, paid: 600000, penaltyMonths: 2, penalty: 43200, totalDue: 1123200, notes: 'غرامة تأخير شهرين' },
    { id: 'prp-3', companyId: companies[1].id, year, name: 'مركز الطلبات السريعة', location: 'بغداد، المنصور', annualRent: 16800000, exemptAmount: 0, taxable: 15120000, rate: cfg.propertyRate, tax: 1512000, paid: 800000, penaltyMonths: 1, penalty: 30240, totalDue: 1542240, notes: 'مراجعة شهرية' },
    { id: 'prp-4', companyId: companies[2].id, year, name: 'محل تجاري — الدورة', location: 'البصرة، الدورة', annualRent: 11000000, exemptAmount: 0, taxable: 9900000, rate: cfg.propertyRate, tax: 990000, paid: 990000, penaltyMonths: 0, penalty: 0, totalDue: 990000, notes: 'نموذجي' },
    { id: 'prp-5', companyId: companies[0].id, year: year - 1, name: 'معرض الأعظمية', location: 'بغداد، الأعظمية', annualRent: 18000000, exemptAmount: 0, taxable: 16200000, rate: cfg.propertyRate, tax: 1620000, paid: 1620000, penaltyMonths: 0, penalty: 0, totalDue: 1620000, notes: '' },
  ]

  const lands: AppData['lands'] = [
    { id: 'lnd-1', companyId: companies[0].id, year, name: 'قطعة أرض رقم 12/م', location: 'بغداد، المنصور', area: 2500, value: 300000000, exemptArea: cfg.landExemptionArea, taxable: calcLand(300000000, 2500, cfg.landExemptionArea, cfg.landRate).taxable, rate: cfg.landRate, tax: calcLand(300000000, 2500, cfg.landExemptionArea, cfg.landRate).tax, paid: 4080000, notes: '' },
    { id: 'lnd-2', companyId: companies[0].id, year, name: 'مشروع سكني — أبي غريب', location: 'بغداد، أبي غريب', area: 12000, value: 900000000, exemptArea: cfg.landExemptionArea, taxable: calcLand(900000000, 12000, cfg.landExemptionArea, cfg.landRate).taxable, rate: cfg.landRate, tax: calcLand(900000000, 12000, cfg.landExemptionArea, cfg.landRate).tax, paid: 0, notes: 'بذمة التسديد' },
    { id: 'lnd-3', companyId: companies[1].id, year, name: 'قطعة صناعية — الكاظمية', location: 'بغداد، الكاظمية', area: 5000, value: 420000000, exemptArea: cfg.landExemptionArea, taxable: calcLand(420000000, 5000, cfg.landExemptionArea, cfg.landRate).taxable, rate: cfg.landRate, tax: calcLand(420000000, 5000, cfg.landExemptionArea, cfg.landRate).tax, paid: 0, notes: 'قيد التسديد' },
  ]

  const professions: AppData['professions'] = [
    { id: 'prf-1', companyId: companies[0].id, year, name: 'عمار محمد (استشارات محاسبة)', income: 42000000, allowance: cfg.professionAllowance, taxable: calcProfession(42000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(42000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 0, notes: 'مقاولة سنوية' },
    { id: 'prf-2', companyId: companies[0].id, year, name: 'د. ليلى حسن (عيادة استشارية)', income: 36000000, allowance: cfg.professionAllowance, taxable: calcProfession(36000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(36000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 1500000, notes: '' },
    { id: 'prf-3', companyId: companies[1].id, year, name: 'مكتب الفرات الهندسي', income: 55000000, allowance: cfg.professionAllowance, taxable: calcProfession(55000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(55000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 4100000, notes: '' },
    { id: 'prf-4', companyId: companies[2].id, year, name: 'مكتب السلام الطبي', income: 28000000, allowance: cfg.professionAllowance, taxable: calcProfession(28000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(28000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 900000, notes: 'علاج أسنان' },
    { id: 'prf-5', companyId: companies[0].id, year: year - 1, name: 'مكتب الفرات الهندسي', income: 55000000, allowance: cfg.professionAllowance, taxable: calcProfession(55000000, cfg.professionAllowance, cfg.employeeBrackets).taxable, tax: calcProfession(55000000, cfg.professionAllowance, cfg.employeeBrackets).tax, paid: 4100000, notes: '' },
  ]

  const sales: AppData['sales'] = [
    { id: 'sal-1', companyId: companies[0].id, date: `${year}-01-12`, invoiceNo: 'INV-2026-001', description: 'فاتورة سلع غذائية متنوعة', typeId: 'essential', amount: 8500000, rate: 0.05, tax: calcSales(8500000, 0.05), paid: 425000, notes: '' },
    { id: 'sal-2', companyId: companies[0].id, date: `${year}-02-08`, invoiceNo: 'INV-2026-014', description: 'مبيعات سلع عامة', typeId: 'standard', amount: 12000000, rate: 0.1, tax: calcSales(12000000, 0.1), paid: 1200000, notes: '' },
    { id: 'sal-3', companyId: companies[0].id, date: `${year}-03-19`, invoiceNo: 'INV-2026-030', description: 'خدمات شحن وتوصيل', typeId: 'services', amount: 6500000, rate: 0.15, tax: calcSales(6500000, 0.15), paid: 0, notes: 'آجل' },
    { id: 'sal-4', companyId: companies[1].id, date: `${year}-04-02`, invoiceNo: 'INV-2026-041', description: 'مبيعات سلع عامة', typeId: 'standard', amount: 9400000, rate: 0.1, tax: calcSales(9400000, 0.1), paid: 940000, notes: '' },
    { id: 'sal-5', companyId: companies[1].id, date: `${year}-05-21`, invoiceNo: 'INV-2026-058', description: 'مبيعات أجهزة كهربائية', typeId: 'luxury', amount: 15000000, rate: 0.3, tax: calcSales(15000000, 0.3), paid: 0, notes: 'قيد التسديد' },
    { id: 'sal-6', companyId: companies[2].id, date: `${year}-06-11`, invoiceNo: 'INV-2026-072', description: 'مبيعات سلع عامة', typeId: 'standard', amount: 7800000, rate: 0.1, tax: calcSales(7800000, 0.1), paid: 780000, notes: '' },
    { id: 'sal-7', companyId: companies[2].id, date: `${year}-07-03`, invoiceNo: 'INV-2026-085', description: 'مبيعات سلع أساسية', typeId: 'essential', amount: 5200000, rate: 0.05, tax: calcSales(5200000, 0.05), paid: 260000, notes: '' },
    { id: 'sal-8', companyId: companies[0].id, date: `${year}-07-18`, invoiceNo: 'INV-2026-106', description: 'خدمات استشارية ومهنية', typeId: 'services', amount: 13200000, rate: 0.15, tax: calcSales(13200000, 0.15), paid: 1980000, notes: 'مسدد جزئياً' },
  ]

  const taxpayers: AppData['taxpayers'] = [
    { id: 'TP-001', taxId: 'IQ-2026-00001', name: 'شركة النور للتجارة والتوزيع', type: 'company', province: 'بغداد', phone: '07701234567', email: 'info@alnour.iq', address: 'بغداد - الكرادة', status: 'active' },
    { id: 'TP-002', taxId: 'IQ-2026-00002', name: 'أحمد محمود العلي', type: 'individual', province: 'البصرة', phone: '07809876543', email: 'ahmad@mail.com', address: 'البصرة - العشار', status: 'active' },
    { id: 'TP-003', taxId: 'IQ-2026-00003', name: 'مؤسسة الرافدين للمقاولات العامة', type: 'company', province: 'نينوى', phone: '07501112233', email: 'rafidain@iq.com', address: 'الموصل - الدواسة', status: 'active' },
    { id: 'TP-004', taxId: 'IQ-2026-00004', name: 'دائرة ضريبة كربلاء', type: 'government', province: 'كربلاء', phone: '07601234567', email: 'karbala.tax@gov.iq', address: 'كربلاء - المركز', status: 'active' },
    { id: 'TP-005', taxId: 'IQ-2026-00005', name: 'علي حسن الموسوي', type: 'individual', province: 'النجف', phone: '07711223344', email: 'ali@mail.com', address: 'النجف - حي السعد', status: 'inactive' },
    { id: 'TP-006', taxId: 'IQ-2026-00006', name: 'شركة الفارس للاستيراد', type: 'company', province: 'ديالى', phone: '07744112233', email: 'sales@alfaris-iq.com', address: 'بعقوبة - شارع 14 رمضان', status: 'active' },
    { id: 'TP-007', taxId: 'IQ-2026-00007', name: 'مكتب الهدى للمحاسبة', type: 'company', province: 'بغداد', phone: '07999001122', email: 'info@alhuda-accounting.iq', address: 'بغداد - الرصافة', status: 'active' },
  ]

  const invoices: AppData['invoices'] = [
    { id: 'INV-001', client: 'شركة النور للتجارة والتوزيع', taxType: 'ضريبة دخل الشركات', amount: 2500000, date: `${year}-03-01`, due: `${year}-04-01`, status: 'paid', notes: '' },
    { id: 'INV-002', client: 'مؤسسة الرافدين للمقاولات العامة', taxType: 'ضريبة العقار', amount: 1800000, date: `${year}-03-10`, due: `${year}-04-10`, status: 'pending', notes: '' },
    { id: 'INV-003', client: 'شركة بغداد المتحدة', taxType: 'ضريبة المبيعات', amount: 3200000, date: `${year}-02-15`, due: `${year}-03-15`, status: 'overdue', notes: '' },
    { id: 'INV-004', client: 'مكتب الأمين للمحاسبة والاستشارات', taxType: 'ضريبة المهنة', amount: 950000, date: `${year}-03-20`, due: `${year}-04-20`, status: 'pending', notes: '' },
    { id: 'INV-005', client: 'شركة الفرات للإنشاء والإعمار', taxType: 'ضريبة العرصات', amount: 4100000, date: `${year}-01-05`, due: `${year}-02-05`, status: 'paid', notes: '' },
    { id: 'INV-006', client: 'مكتب الهدى للمحاسبة', taxType: 'ضريبة الشركات', amount: 5200000, date: `${year}-05-08`, due: `${year}-06-08`, status: 'pending', notes: 'خدمة استشارية' },
    { id: 'INV-007', client: 'شركة الفارس للاستيراد', taxType: 'ضريبة المبيعات', amount: 2900000, date: `${year}-06-05`, due: `${year}-07-05`, status: 'paid', notes: '' },
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
    { id: 'a-1', title: 'مراجعة ملف شركة النور الضريبي والمستندات', date: `${year}-08-15`, time: '10:00', client: 'شركة النور', notes: 'يرجى إحضار كشوفات المصارف', status: 'upcoming' },
    { id: 'a-2', title: 'اجتماع لجنة التدقيق الضريبي العليا', date: `${year}-08-20`, time: '09:00', client: '', notes: 'قاعة الاجتماعات الرئيسية بالطابق الثاني', status: 'upcoming' },
    { id: 'a-3', title: 'تسليم شهادة براءة ذمة رسمية للمكلف', date: `${year}-08-01`, time: '14:00', client: 'أحمد محمود', notes: 'التسليم المباشر للمكلف', status: 'completed' },
    { id: 'a-4', title: 'مراجعة إقرار ضريبة الشركات - شركة الفارس', date: `${year}-08-22`, time: '11:30', client: 'شركة الفارس', notes: 'إحضار كشف حسابات بنكي', status: 'upcoming' },
  ]

  const tasks: AppData['tasks'] = [
    { id: 't-1', title: 'مراجعة ملفات ضريبية معلقة ومؤجلة من 2025', status: 'done', priority: 'high', date: `${year}-03-20` },
    { id: 't-2', title: 'إعداد تقرير الربع الأول المالي لمصلحة الضرائب', status: 'progress', priority: 'medium', date: `${year}-03-25` },
    { id: 't-3', title: 'تحديث بيانات المكلفين والشركات المسجلة حديثاً', status: 'pending', priority: 'low', date: `${year}-03-28` },
    { id: 't-4', title: 'اجتماع دوري مع فريق التدقيق والمراجعة الفنية', status: 'pending', priority: 'high', date: `${year}-03-30` },
    { id: 't-5', title: 'إرسال إشعارات ومطالبات التأخير للمتخلفين', status: 'done', priority: 'medium', date: `${year}-03-15` },
    { id: 't-6', title: 'تحديث البيانات الشهرية للمحافظات الأربع الكبرى', status: 'progress', priority: 'medium', date: `${year}-08-10` },
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

  const documents: AppData['documents'] = [
    { id: 'doc-1', companyId: companies[0].id, name: 'شهادة التسجيل الرسمية للشركة المعتمدة.pdf', category: 'تأسيس', size: '1.2 MB', date: `${year}-01-10`, url: '#' },
    { id: 'doc-2', companyId: companies[0].id, name: 'ميزانية الشركة المدققة لسنة 2025 الرسمية.pdf', category: 'ميزانية', size: '4.5 MB', date: `${year}-03-15`, url: '#' },
    { id: 'doc-3', companyId: companies[0].id, name: 'عقد إيجار المقر الرئيسي للشركة مصدقاً.pdf', category: 'عقارات', size: '2.1 MB', date: `${year}-01-15`, url: '#' },
    { id: 'doc-4', companyId: companies[1].id, name: 'قرار تأسيس المنشأة.pdf', category: 'تأسيس', size: '900 KB', date: `${year}-02-02`, url: '#' },
    { id: 'doc-5', companyId: companies[2].id, name: 'كشف حساب بنكي سنوي.xlsx', category: 'مالية', size: '2.8 MB', date: `${year}-05-11`, url: '#' },
  ]

  const apiKeys: AppData['apiKeys'] = [
    { id: 'key-1', name: 'تكامل ERP', key: 'tk_9f2a1c4e7b8d', status: 'active', lastUsed: `${year}-08-11 10:00:00`, created: `${year}-01-05`, notes: 'ربط مع نظام ERP الخاص بالمؤسسة' },
    { id: 'key-2', name: 'نسخ احتياطي', key: 'tk_5b7d9f3a6c8e', status: 'active', lastUsed: '', created: `${year}-02-18`, notes: 'مزامنة البيانات مع خدمة النسخ الاحتياطي' },
    { id: 'key-3', name: 'تقرير محاسبي', key: 'tk_7a1d4c2e9b0f', status: 'active', lastUsed: `${year}-08-01 12:00:00`, created: `${year}-04-09`, notes: 'تصدير التقارير الشهرية' },
  ]

  return {
    version: 3,
    companies,
    employees,
    monthlyRows,
    annualRows,
    corporateReturns,
    contracts,
    properties,
    lands,
    professions,
    sales,
    config: cfg,
    users: [
      { id: 'user-admin', username: 'admin', password: 'admin123', name: 'مدير النظام', role: 'admin' },
      { id: 'user-accountant', username: 'accountant', password: '123456', name: 'المحاسب', role: 'accountant' },
      { id: 'user-auditor', username: 'auditor', password: 'aud123', name: 'مراجع داخلي', role: 'accountant' },
    ],
    activeCompanyId,
    taxpayers,
    invoices,
    tickets,
    workflows,
    appointments,
    tasks,
    auditLogs,
    loginHistory,
    documents,
    apiKeys,
    currentPackage: 'enterprise',
  }
}
