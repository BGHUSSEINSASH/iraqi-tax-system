import { useMemo, useState } from 'react'
import {
  PageHead,
  Card,
  CardBody,
  Input,
  Badge,
  SearchInput,
  Modal,
} from '../components/ui'
import {
  Map,
  MapPin,
  Building,
  Home,
  Briefcase,
  Sprout,
  Waves,
  Mountain,
  Milestone,
  Compass,
  DollarSign,
} from 'lucide-react'
import { fmt } from '../lib/format'

interface ProvinceData {
  name: string
  icon: any
  population: string
  districts: string[]
  prices: {
    residential: number
    commercial: number
    agricultural: number
    industrial: number
  }
}

export const ALL_PROVINCES: Record<string, ProvinceData> = {
  baghdad: {
    name: 'بغداد',
    icon: MapPin,
    population: '٨.١ مليون',
    districts: ['الكرخ', 'الرصافة', 'الأعظمية', 'الكاظمية', 'المنصور', 'الكرادة', 'المدائن', 'أبو غريب', 'الطارمية'],
    prices: { residential: 500000, commercial: 1200000, agricultural: 100000, industrial: 800000 },
  },
  basra: {
    name: 'البصرة',
    icon: Waves,
    population: '٢.٩ مليون',
    districts: ['مركز البصرة', 'الفاو', 'أبو الخصيب', 'شط العرب', 'القرنة', 'الزبير'],
    prices: { residential: 300000, commercial: 800000, agricultural: 80000, industrial: 600000 },
  },
  nineveh: {
    name: 'نينوى',
    icon: Milestone,
    population: '٣.٧ مليون',
    districts: ['مركز الموصل', 'تلكيف', 'الحمدانية', 'سنجار', 'تلعفر'],
    prices: { residential: 200000, commercial: 500000, agricultural: 60000, industrial: 400000 },
  },
  erbil: {
    name: 'أربيل',
    icon: Building,
    population: '١.٩ مليون',
    districts: ['مركز أربيل', 'شقلاوة', 'سوران', 'ميركه سور'],
    prices: { residential: 400000, commercial: 1000000, agricultural: 90000, industrial: 700000 },
  },
  najaf: {
    name: 'النجف',
    icon: MapPin,
    population: '١.٥ مليون',
    districts: ['مركز النجف', 'الكوفة', 'المناذرة'],
    prices: { residential: 350000, commercial: 900000, agricultural: 70000, industrial: 500000 },
  },
  karbala: {
    name: 'كربلاء',
    icon: MapPin,
    population: '١.٢ مليون',
    districts: ['مركز كربلاء', 'الهندية', 'عين التمر'],
    prices: { residential: 350000, commercial: 900000, agricultural: 75000, industrial: 550000 },
  },
  kirkuk: {
    name: 'كركوك',
    icon: Milestone,
    population: '١.٦ مليون',
    districts: ['مركز كركوك', 'الحويجة', 'داقوق', 'دبس'],
    prices: { residential: 250000, commercial: 600000, agricultural: 65000, industrial: 450000 },
  },
  sulaymaniyah: {
    name: 'السليمانية',
    icon: Mountain,
    population: '٢.١ مليون',
    districts: ['مركز السليمانية', 'حلبجة', 'رانية', 'دوكان', 'بنجوين'],
    prices: { residential: 300000, commercial: 750000, agricultural: 70000, industrial: 500000 },
  },
  dhiqar: {
    name: 'ذي قار',
    icon: Waves,
    population: '٢.١ مليون',
    districts: ['الناصرية', 'الرفاعي', 'الشطرة', 'سوق الشيوخ', 'الجبايش'],
    prices: { residential: 180000, commercial: 400000, agricultural: 50000, industrial: 300000 },
  },
  babel: {
    name: 'بابل',
    icon: Compass,
    population: '٢.٠ مليون',
    districts: ['الحلة', 'المحاويل', 'المسيب', 'الهاشمية', 'القاسم'],
    prices: { residential: 220000, commercial: 500000, agricultural: 55000, industrial: 350000 },
  },
  diyala: {
    name: 'ديالى',
    icon: Sprout,
    population: '١.٧ مليون',
    districts: ['بعقوبة', 'المقدادية', 'خانقين', 'بلدروز', 'الخالص'],
    prices: { residential: 190000, commercial: 420000, agricultural: 50000, industrial: 320000 },
  },
  anbar: {
    name: 'الأنبار',
    icon: Compass,
    population: '١.٨ مليون',
    districts: ['الرمادي', 'الفلوجة', 'هيت', 'حديثة', 'القائم', 'عنه', 'راوه'],
    prices: { residential: 170000, commercial: 380000, agricultural: 45000, industrial: 280000 },
  },
  wasit: {
    name: 'واسط',
    icon: Sprout,
    population: '١.٤ مليون',
    districts: ['الكوت', 'النعمانية', 'الحي', 'بدرة', 'الصويرة'],
    prices: { residential: 170000, commercial: 380000, agricultural: 48000, industrial: 290000 },
  },
  maysan: {
    name: 'ميسان',
    icon: Waves,
    population: '١.١ مليون',
    districts: ['العمارة', 'المجر الكبير', 'علي الغربي', 'قلعة صالح'],
    prices: { residential: 160000, commercial: 350000, agricultural: 42000, industrial: 270000 },
  },
  muthanna: {
    name: 'المثنى',
    icon: Compass,
    population: '٠.٨ مليون',
    districts: ['السماوة', 'الرميثة', 'الخضر', 'السلمان'],
    prices: { residential: 150000, commercial: 320000, agricultural: 40000, industrial: 250000 },
  },
  qadisiyyah: {
    name: 'القادسية',
    icon: Sprout,
    population: '١.٣ مليون',
    districts: ['الديوانية', 'عفك', 'الشامية', 'الحمزة'],
    prices: { residential: 160000, commercial: 350000, agricultural: 45000, industrial: 260000 },
  },
  saladin: {
    name: 'صلاح الدين',
    icon: Building,
    population: '١.٦ مليون',
    districts: ['تكريت', 'سامراء', 'بلد', 'الدجيل', 'طوزخورماتو', 'الشرقاط'],
    prices: { residential: 180000, commercial: 400000, agricultural: 50000, industrial: 300000 },
  },
  duhok: {
    name: 'دهوك',
    icon: Mountain,
    population: '١.٣ مليون',
    districts: ['مركز دهوك', 'زاخو', 'العمادية', 'سيميل', 'بردرش'],
    prices: { residential: 280000, commercial: 650000, agricultural: 65000, industrial: 450000 },
  },
}

export default function Provinces() {
  const [q, setQ] = useState('')
  const [activeProv, setActiveProv] = useState<ProvinceData | null>(null)

  const list = useMemo(() => {
    return Object.entries(ALL_PROVINCES).filter(([_, data]) =>
      data.name.includes(q.trim())
    )
  }, [q])

  return (
    <div className="space-y-6">
      <PageHead
        title="دليل المحافظات والتخمينات العقارية"
        desc="دليل تسعير الأراضي والتخمينات المعتمدة لتقدير قيم العقارات والعرصات بمختلف محافظات العراق"
      />

      <div className="flex justify-start">
        <SearchInput
          className="w-full max-w-xs"
          value={q}
          onChange={setQ}
          placeholder="ابحث عن محافظة..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(([key, p]) => {
          const IconComponent = p.icon
          return (
            <div
              key={key}
              className="card cursor-pointer border border-ink-200 hover:border-brand-400 hover:shadow-md transition duration-200"
              onClick={() => setActiveProv(p)}
            >
              <CardBody className="p-5 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-ink-800 text-base">{p.name}</h3>
                      <span className="text-[11px] text-ink-400 font-semibold">تعداد السكان: {p.population}</span>
                    </div>
                  </div>
                  <Badge tone="brand">
                    {p.districts.length} أقضية/نواحي
                  </Badge>
                </div>

                <div className="mt-5 border-t border-ink-100 pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-500 font-semibold">تخمين المتر السكني:</span>
                    <span className="font-bold text-ink-800 font-mono">{fmt(p.prices.residential)} د.ع</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-500 font-semibold">تخمين المتر التجاري:</span>
                    <span className="font-bold text-brand-700 font-mono">{fmt(p.prices.commercial)} د.ع</span>
                  </div>
                </div>
              </CardBody>
            </div>
          )
        })}
      </div>

      {activeProv && (
        <Modal open={true} onClose={() => setActiveProv(null)} title={`تفاصيل المحافظة: ${activeProv.name}`} size="lg">
          <div className="space-y-6">
            {/* Upper Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-center">
                <div className="text-xs font-semibold text-ink-400">تعداد السكان</div>
                <div className="text-lg font-bold text-ink-800 mt-1">{activeProv.population}</div>
              </div>
              <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-center">
                <div className="text-xs font-semibold text-ink-400">الأقضية والنواحي</div>
                <div className="text-lg font-bold text-ink-800 mt-1">{activeProv.districts.length}</div>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/10 p-4 text-center">
                <div className="text-xs font-semibold text-brand-600">التخمين السكني للمتر</div>
                <div className="text-lg font-bold text-brand-800 mt-1 font-mono">{fmt(activeProv.prices.residential)} د.ع</div>
              </div>
              <div className="rounded-xl border border-brand-200 bg-brand-50/10 p-4 text-center">
                <div className="text-xs font-semibold text-brand-600">التخمين التجاري للمتر</div>
                <div className="text-lg font-bold text-brand-800 mt-1 font-mono">{fmt(activeProv.prices.commercial)} د.ع</div>
              </div>
            </div>

            {/* Bottom Grid for Prices & Districts */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-12">
              {/* Prices detail list */}
              <div className="sm:col-span-5 border border-ink-200 rounded-xl p-5 space-y-4 bg-white shadow-sm">
                <h4 className="font-bold text-ink-800 text-sm border-b border-ink-100 pb-2 flex items-center gap-1">
                  <DollarSign size={15} className="text-brand-600" />
                  قوائم تسعير المتر المربع المعتمدة
                </h4>
                <div className="space-y-2.5 text-xs font-semibold text-ink-600">
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5">
                      <Home size={13} className="text-ink-400" />
                      الأراضي السكنية:
                    </span>
                    <span className="font-bold text-ink-800 font-mono">{fmt(activeProv.prices.residential)} د.ع</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={13} className="text-ink-400" />
                      الأراضي التجارية:
                    </span>
                    <span className="font-bold text-brand-700 font-mono">{fmt(activeProv.prices.commercial)} د.ع</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5">
                      <Sprout size={13} className="text-ink-400" />
                      الأراضي الزراعية:
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">{fmt(activeProv.prices.agricultural)} د.ع</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="flex items-center gap-1.5">
                      <Building size={13} className="text-ink-400" />
                      الأراضي الصناعية:
                    </span>
                    <span className="font-bold text-ink-800 font-mono">{fmt(activeProv.prices.industrial)} د.ع</span>
                  </div>
                </div>
              </div>

              {/* Districts flow */}
              <div className="sm:col-span-7 border border-ink-200 rounded-xl p-5 space-y-4 bg-white shadow-sm">
                <h4 className="font-bold text-ink-800 text-sm border-b border-ink-100 pb-2 flex items-center gap-1">
                  <MapPin size={15} className="text-brand-600" />
                  الأقضية والنواحي التابعة إدارياً
                </h4>
                <div className="flex flex-wrap gap-2 pt-1">
                  {activeProv.districts.map((d, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg border border-ink-200 bg-ink-50 text-xs font-semibold text-ink-700"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
