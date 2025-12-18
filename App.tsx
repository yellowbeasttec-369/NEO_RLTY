
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Building2, PieChart, Settings, Search, Plus, 
  Wallet, TrendingUp, ChevronRight, ArrowLeft, Printer, History, 
  Landmark, Palette, Sun, Moon, Briefcase, Loader2, UserPlus, 
  CheckCircle2, AlertTriangle, Download, RotateCcw, ShieldCheck, 
  Globe, Sparkles, MapPin, Calculator, Calendar, FileText,
  Mail, Phone, CreditCard, ChevronDown, Filter, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Activity, Percent
} from 'lucide-react';
import { Asset, Client, ThemeClasses } from './types';
import { 
  STORAGE_KEY, COLOR_THEME_KEY, FINAL_ASSET_DEFAULTS 
} from './constants';
import { 
  normalizeClient, normalizeAsset, formatCurrency, formatArea 
} from './utils';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { geminiService } from './services/geminiService';

// --- THEME HOOK ---
const useTheme = () => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, setTheme };
};

// --- REUSABLE UI COMPONENTS ---

const Card = ({ children, className = "" }: { children?: React.ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const KPI = ({ title, value, sub, icon: Icon, colorClass, trend }: any) => (
  <Card className="p-6 flex flex-col justify-between group hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 h-full relative overflow-hidden">
    <div className={`absolute -bottom-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none z-0 ${colorClass}`}>
      <Icon className="w-24 h-24" />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('400', '900/20')} ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm ${trend > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1.5">{title}</p>
        <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white leading-tight">{value}</h3>
        <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>
      </div>
    </div>
  </Card>
);

const NavItem = ({ id, label, icon: Icon, active, onClick, theme }: any) => (
  <button 
    onClick={() => onClick(id)} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${active ? `${theme.bg} text-white shadow-lg shadow-indigo-500/20` : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
  >
    <Icon className="w-5 h-5" /> {label}
  </button>
);

// --- MAIN APPLICATION ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Client[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorTheme, setColorTheme] = useState('indigo');
  const [isValuating, setIsValuating] = useState(false);
  
  // Reporting Filters
  const [reportType, setReportType] = useState('cashflow'); // cashflow, pl, occupancy
  const [assetFilter, setAssetFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('12M');

  const { theme, setTheme } = useTheme();

  const themes: Record<string, ThemeClasses> = {
    indigo: { name: 'Indigo', bg: 'bg-indigo-600', bgHover: 'hover:bg-indigo-700', text: 'text-indigo-600', textDark: 'dark:text-indigo-400', border: 'border-indigo-600', ring: 'focus:ring-indigo-500', borderFocus: 'focus:border-indigo-500', light: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800' },
    amber: { name: 'Amber', bg: 'bg-amber-500', bgHover: 'hover:bg-amber-600', text: 'text-amber-500', textDark: 'dark:text-amber-500', border: 'border-amber-500', ring: 'focus:ring-amber-500', borderFocus: 'focus:border-amber-500', light: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
    emerald: { name: 'Emerald', bg: 'bg-emerald-600', bgHover: 'hover:bg-emerald-700', text: 'text-emerald-600', textDark: 'dark:text-emerald-400', border: 'border-emerald-600', ring: 'focus:ring-emerald-500', borderFocus: 'focus:border-emerald-500', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
    rose: { name: 'Rose', bg: 'bg-rose-600', bgHover: 'hover:bg-rose-700', text: 'text-rose-600', textDark: 'dark:text-rose-400', border: 'border-rose-600', ring: 'focus:ring-rose-500', borderFocus: 'focus:border-rose-500', light: 'bg-rose-50', badge: 'bg-rose-100 text-rose-800' },
  };

  const activeTheme = themes[colorTheme] || themes.indigo;

  // Hydration
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setPortfolios(JSON.parse(saved).map(normalizeClient));
    } else {
      const demoData: Client[] = [
        {
          id: 'c-001',
          name: 'Sheikh Ahmed Al-Maktoum',
          email: 'ahmed@dubaiholding.ae',
          phone: '+971 50 111 2233',
          nationality: 'Emirati',
          emiratesId: '784-1975-1234567-1',
          passport: 'P784001',
          type: 'VIP Individual',
          tags: ['HNWI', 'Institutional'],
          assets: [
            {
              ...FINAL_ASSET_DEFAULTS,
              id: 'a-101',
              name: 'Burj Khalifa Residence, 8802',
              area: 'Downtown Dubai',
              buildingName: 'Burj Khalifa',
              type: 'Apartment',
              value: 18500000,
              rent: 1200000,
              status: 'Rented',
              bedrooms: '4',
              bathrooms: '5',
              size: 4500,
              purchasePrice: 15000000,
              serviceCharges: 150000,
              managementFee: 60000,
              otherExpenses: 20000
            },
            {
              ...FINAL_ASSET_DEFAULTS,
              id: 'a-102',
              name: 'Signature Villa, Frond J',
              area: 'Palm Jumeirah',
              buildingName: 'Frond J Villa',
              type: 'Villa',
              value: 45000000,
              rent: 3500000,
              status: 'Vacant',
              bedrooms: '6',
              bathrooms: '8',
              size: 12000,
              purchasePrice: 38000000,
              serviceCharges: 250000,
              managementFee: 100000,
              otherExpenses: 50000
            }
          ],
          totalValue: 63500000,
          totalUnits: 2
        }
      ].map(normalizeClient);
      setPortfolios(demoData);
    }
    const savedColor = localStorage.getItem(COLOR_THEME_KEY);
    if (savedColor) setColorTheme(savedColor);
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
      localStorage.setItem(COLOR_THEME_KEY, colorTheme);
    }
  }, [portfolios, colorTheme, isLoaded]);

  const metrics = useMemo(() => {
    const allAssets: Asset[] = portfolios.flatMap(c => c.assets.map(a => ({ ...a, clientName: c.name, ownerId: c.id })));
    const totalAUM = allAssets.reduce((sum, a) => sum + a.value, 0);
    const totalRent = allAssets.reduce((sum, a) => sum + (a.status === 'Rented' ? a.rent : 0), 0);
    const totalExpenses = allAssets.reduce((sum, a) => sum + (a.serviceCharges + a.managementFee + a.otherExpenses), 0);
    const occupancyRate = allAssets.length > 0 ? (allAssets.filter(a => a.status === 'Rented').length / allAssets.length) * 100 : 0;
    
    return { allAssets, totalAUM, totalRent, units: allAssets.length, totalExpenses, occupancyRate };
  }, [portfolios]);

  const filteredAssets = metrics.allAssets.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.area.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeAsset = useMemo(() => 
    metrics.allAssets.find(a => a.id === activeAssetId), 
    [metrics.allAssets, activeAssetId]
  );

  const handleAIValuation = async () => {
    if (!activeAsset) return;
    setIsValuating(true);
    try {
      const newVal = await geminiService.estimateValuation(activeAsset);
      if (newVal > 0) {
        setPortfolios(prev => prev.map(c => ({
          ...c,
          assets: c.assets.map(a => a.id === activeAsset.id ? { ...a, value: newVal } : a)
        })).map(normalizeClient));
      }
    } finally {
      setIsValuating(false);
    }
  };

  // --- REPORTING LOGIC ---

  const reportingData = useMemo(() => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const filteredByAssetType = metrics.allAssets.filter(a => assetFilter === 'All' || a.type === assetFilter);

    // Cash Flow Generation (Simulated monthly breakdown)
    const cashflow = months.map((m, idx) => {
      const monthlyRent = filteredByAssetType.reduce((sum, a) => sum + (a.status === 'Rented' ? a.rent / 12 : 0), 0);
      const monthlyExpenses = filteredByAssetType.reduce((sum, a) => sum + (a.serviceCharges + a.managementFee + a.otherExpenses) / 12, 0);
      return {
        month: m,
        income: monthlyRent * (1 + (idx * 0.02)), // slight growth simulation
        expenses: monthlyExpenses,
        net: (monthlyRent * (1 + (idx * 0.02))) - monthlyExpenses
      };
    });

    // P&L Breakdown per community
    const communityDataMap = new Map();
    filteredByAssetType.forEach(a => {
      const existing = communityDataMap.get(a.area) || { area: a.area, income: 0, expenses: 0 };
      existing.income += (a.status === 'Rented' ? a.rent : 0);
      existing.expenses += (a.serviceCharges + a.managementFee + a.otherExpenses);
      communityDataMap.set(a.area, existing);
    });
    const plData = Array.from(communityDataMap.values()).map(item => ({
      ...item,
      profit: item.income - item.expenses
    }));

    return { cashflow, plData };
  }, [metrics.allAssets, assetFilter]);

  const renderReporting = () => (
    <div className="space-y-8 animate-fade-in pb-12">
      <Card className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-none">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            {['cashflow', 'pl', 'occupancy'].map(type => (
              <button 
                key={type}
                onClick={() => setReportType(type)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${reportType === type ? `${activeTheme.bg} text-white shadow-md` : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                {type.replace('pl', 'P&L').replace('cashflow', 'Cash Flow')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Asset Type:</span>
              <select 
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold px-3 py-1.5 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="All">All Assets</option>
                <option value="Apartment">Apartments</option>
                <option value="Villa">Villas</option>
                <option value="Commercial">Commercial</option>
              </select>
            </div>
            <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
              <Download className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>
      </Card>

      {reportType === 'cashflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Monthly Cash Flow Projection</h3>
                <p className="text-xs text-slate-500 mt-1">Expected income vs operative expenses for the next 12 months.</p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={reportingData.cashflow}>
                  <defs>
                    <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(val: number) => formatCurrency(val)}
                  />
                  <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#incomeColor)" strokeWidth={3} name="Gross Income" />
                  <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="space-y-8">
            <KPI title="Est. Annual Revenue" value={formatCurrency(metrics.totalRent)} sub="Based on current contracts" icon={ArrowUpRight} colorClass="text-emerald-600" />
            <KPI title="Total Op. Expenses" value={formatCurrency(metrics.totalExpenses)} sub="Service charges & Mgmt fees" icon={ArrowDownRight} colorClass="text-rose-600" />
            <KPI title="Projected Net Margin" value={`${metrics.totalRent > 0 ? (( (metrics.totalRent - metrics.totalExpenses) / metrics.totalRent ) * 100).toFixed(1) : '0'}%`} sub="Efficiency ratio" icon={Activity} colorClass="text-indigo-600" />
          </div>
        </div>
      )}

      {reportType === 'pl' && (
        <Card className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Community P&L Analysis</h3>
              <p className="text-xs text-slate-500 mt-1">Breakdown of profitability by geographic community.</p>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportingData.plData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="area" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => formatCurrency(val)}
                />
                <Legend iconType="circle" />
                <Bar dataKey="income" fill="#6366f1" radius={[4, 4, 0, 0]} name="Gross Income" />
                <Bar dataKey="expenses" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Total Expenses" />
                <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {reportType === 'occupancy' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="p-10 flex flex-col items-center justify-center">
            <div className="relative w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie 
                    data={[
                      { name: 'Rented', value: metrics.allAssets.filter(a => a.status === 'Rented').length },
                      { name: 'Vacant', value: metrics.allAssets.filter(a => a.status !== 'Rented').length }
                    ]} 
                    innerRadius={80} 
                    outerRadius={110} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    <Cell fill="#6366f1" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </RePieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-900 dark:text-white">{metrics.occupancyRate.toFixed(1)}%</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Occupancy</span>
              </div>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Occupancy Health</h3>
            <div className="space-y-6">
              {[
                { label: 'Apartments', value: 85, color: 'bg-indigo-500' },
                { label: 'Villas', value: 92, color: 'bg-emerald-500' },
                { label: 'Commercial', value: 45, color: 'bg-amber-500' },
              ].map(item => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                    <span className="text-slate-900 dark:text-white">{item.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-indigo-600 shrink-0" />
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <strong>Insight:</strong> Commercial assets are currently performing below target. Consider adjusting lease terms or launching a targeted marketing campaign.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI title="Total AUM" value={formatCurrency(metrics.totalAUM)} sub="Aggregated Portfolio Value" icon={Wallet} colorClass="text-indigo-600" trend={12.4} />
        <KPI title="Annual Net Rent" value={formatCurrency(metrics.totalRent)} sub="Realized Rental Income" icon={Landmark} colorClass="text-emerald-600" trend={5.2} />
        <KPI title="Total Managed Units" value={metrics.units} sub="Across all sectors" icon={Building2} colorClass="text-blue-600" />
        <KPI title="Occupancy Rate" value={`${metrics.occupancyRate.toFixed(1)}%`} sub="Total portfolio health" icon={Percent} colorClass="text-amber-600" trend={1.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-8">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">AUM Growth Performance</h3>
            <div className="flex gap-2">
              <button className={`text-[10px] font-bold px-3 py-1.5 ${activeTheme.bg} text-white rounded-lg uppercase tracking-wider`}>12M View</button>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{n:'JAN',v:35},{n:'FEB',v:38},{n:'MAR',v:37},{n:'APR',v:42},{n:'MAY',v:45},{n:'JUN',v:48}]}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeTheme.bg.split('-')[1] === 'indigo' ? '#4f46e5' : '#10b981'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={activeTheme.bg.split('-')[1] === 'indigo' ? '#4f46e5' : '#10b981'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="v" stroke={activeTheme.text.split('-')[1] === 'indigo' ? '#4f46e5' : '#10b981'} fillOpacity={1} fill="url(#colorVal)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-8">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">Asset Allocation</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie data={[{n:'Apt',v:60},{n:'Villa',v:30},{n:'Comm',v:10}]} innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="v">
                  <Cell fill="#6366f1" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-4">
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Apartments</div>
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Villas</div>
             <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-amber-500" /> Commercial</div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAssetDetails = () => {
    if (!activeAsset) return null;
    return (
      <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
        <div className="flex justify-between items-center">
          <button onClick={() => setActiveView('properties')} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" /> Back to Portfolio
          </button>
          <div className="flex gap-3">
            <button className={`px-6 py-2.5 ${activeTheme.bg} text-white rounded-xl text-sm font-bold hover:opacity-90 shadow-lg shadow-indigo-500/20`}>
              Edit Asset Specs
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="p-10">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">{activeAsset.name}</h1>
                  <p className="text-slate-500 flex items-center gap-1.5 mt-2 font-medium">
                    <MapPin className="w-4 h-4 text-rose-500" /> {activeAsset.area}, Dubai
                  </p>
                </div>
                <div className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest border ${activeAsset.status === 'Rented' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                  {activeAsset.status}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 py-10 border-y border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Valuation</p>
                  <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(activeAsset.value)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Rent/Yr</p>
                  <p className="text-2xl font-mono font-bold text-emerald-600">{formatCurrency(activeAsset.rent)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">ROI</p>
                  <p className="text-2xl font-mono font-bold text-indigo-600">{((activeAsset.rent / activeAsset.value) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-2">Area</p>
                  <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{activeAsset.size} sqft</p>
                </div>
              </div>

              <div className="mt-10 p-8 border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-900/10 rounded-3xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-6 h-6" />
                    <h3 className="text-xl font-bold">AI Portfolio Intelligence</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                  Analyze market liquidity and real-time transaction history for the {activeAsset.area} sector to estimate this asset's liquidity and valuation accurately.
                </p>
                <button 
                  disabled={isValuating}
                  onClick={handleAIValuation}
                  className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg"
                >
                  {isValuating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  Generate Instant AI Valuation
                </button>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-8">
              <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Beneficiary Owner</h4>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xl">
                  {activeAsset.clientName?.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{activeAsset.clientName}</p>
                  <p className="text-xs text-slate-400 font-medium">VIP Portfolio Member</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderPropertyList = () => (
    <Card className="animate-fade-in shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white uppercase text-[10px] font-bold tracking-widest">
            <tr>
              <th className="px-8 py-5">Property Details</th>
              <th className="px-8 py-5">Owner</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Valuation</th>
              <th className="px-8 py-5 text-right">Rent</th>
              <th className="px-8 py-5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAssets.map(asset => (
              <tr key={asset.id} onClick={() => { setActiveAssetId(asset.id); setActiveView('property_details'); }} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors cursor-pointer group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className={`${activeTheme.light} ${activeTheme.text} w-10 h-10 rounded-xl flex items-center justify-center shrink-0`}>
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{asset.name}</div>
                      <div className="text-xs text-slate-400">{asset.area} • {asset.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-sm text-slate-500 font-medium">{asset.clientName}</td>
                <td className="px-8 py-5"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${asset.status === 'Rented' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{asset.status}</span></td>
                <td className="px-8 py-5 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">{formatCurrency(asset.value)}</td>
                <td className="px-8 py-5 text-right font-mono font-bold text-emerald-600 text-sm">{formatCurrency(asset.rent)}</td>
                <td className="px-8 py-5 text-center"><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className={`${activeTheme.bg} p-2 rounded-xl text-white shadow-lg`}><Briefcase className="w-7 h-7" /></div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tighter">NEO PRO</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enterprise Suite</p>
          </div>
        </div>
        <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
          <NavItem id="dashboard" label="Performance Hub" icon={LayoutDashboard} active={activeView === 'dashboard'} onClick={setActiveView} theme={activeTheme} />
          <NavItem id="reporting" label="Financial Reports" icon={PieChart} active={activeView === 'reporting'} onClick={setActiveView} theme={activeTheme} />
          <NavItem id="properties" label="Asset Portfolio" icon={Building2} active={activeView === 'properties' || activeView === 'property_details'} onClick={setActiveView} theme={activeTheme} />
          <NavItem id="clients" label="Client Database" icon={Users} active={activeView === 'clients'} onClick={setActiveView} theme={activeTheme} />
        </nav>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800">
          <NavItem id="settings" label="System Settings" icon={Settings} active={activeView === 'settings'} onClick={setActiveView} theme={activeTheme} />
          <div className="mt-4 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl flex items-center gap-2 text-[10px] font-bold text-emerald-600 tracking-wider"><ShieldCheck className="w-3 h-3" /> SECURE CONSOLE</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-10 flex items-center justify-between z-10 shrink-0">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search across all sectors..." className="w-full pl-12 pr-6 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-6">
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button onClick={() => setTheme('light')} className={`p-2 rounded-lg ${theme === 'light' ? 'bg-white shadow-sm text-amber-500' : 'text-slate-400'}`}><Sun className="w-4 h-4" /></button>
                <button onClick={() => setTheme('dark')} className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-slate-700 shadow-sm text-indigo-400' : 'text-slate-400'}`}><Moon className="w-4 h-4" /></button>
             </div>
             <div className="w-10 h-10 rounded-2xl bg-indigo-100 overflow-hidden shadow-sm border-2 border-white dark:border-slate-800"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" /></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight capitalize">{activeView.replace('_', ' ')}</h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">
                {activeView === 'reporting' ? 'Deep financial analysis and performance metrics.' : 'Real-time enterprise intelligence and management.'}
              </p>
            </div>
            {(activeView === 'properties' || activeView === 'clients') && (
              <button className={`${activeTheme.bg} text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/30 flex items-center gap-2 hover:opacity-90`}><Plus className="w-5 h-5" /> Add New {activeView === 'properties' ? 'Asset' : 'Client'}</button>
            )}
          </div>

          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'reporting' && renderReporting()}
          {activeView === 'properties' && renderPropertyList()}
          {activeView === 'property_details' && renderAssetDetails()}
          
          {activeView === 'settings' && (
            <div className="max-w-xl mx-auto space-y-8 animate-fade-in">
              <Card className="p-10">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">System Customization</h3>
                <div className="space-y-10">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-4 uppercase tracking-widest">Brand Accent Color</label>
                    <div className="flex gap-4">
                      {Object.entries(themes).map(([key, t]) => (
                        <button key={key} onClick={() => setColorTheme(key)} className={`w-14 h-14 rounded-2xl transition-all border-4 ${colorTheme === key ? 'border-white dark:border-slate-700 scale-110 shadow-xl' : 'border-transparent opacity-40'} ${t.bg}`} />
                      ))}
                    </div>
                  </div>
                  <div className="pt-10 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="flex items-center justify-center gap-2 w-full p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl font-bold text-sm text-red-600 hover:bg-red-100 transition-colors">
                      <RotateCcw className="w-5 h-5" /> Restore Factory Default Database
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
