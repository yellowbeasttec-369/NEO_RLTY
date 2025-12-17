
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, Building2, PieChart, Settings, Search, Plus, 
  Wallet, AlertCircle, Briefcase, Calendar, MapPin, X, 
  Sparkles, Loader2, FileText, UserPlus, TrendingUp, ChevronRight,
  ArrowLeft, Printer, History, Landmark, Palette, Sun, Moon, Monitor,
  Activity, RotateCcw, CheckCircle2, AlertTriangle, Key, Trash2,
  ArchiveRestore, Clock, Download, Wrench, Calculator, ListTodo, Banknote,
  FileCheck, ShieldCheck, Globe
} from 'lucide-react';
import { Asset, Client, AssetStatus, ThemeClasses } from './types';
import { 
  STORAGE_KEY, BACKUP_KEY, THEME_KEY, COLOR_THEME_KEY, 
  FINAL_ASSET_DEFAULTS 
} from './constants';
import { 
  normalizeClient, normalizeAsset, formatCurrency, formatArea, calculateDaysVacant 
} from './utils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart as RePieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';

// --- THEME HOOK ---
const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(THEME_KEY) || 'system';
    }
    return 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      root.classList.remove('dark', 'light');
      if (theme === 'system') {
        root.classList.add(mediaQuery.matches ? 'dark' : 'light');
      } else {
        root.classList.add(theme);
      }
    };

    applyTheme();
    localStorage.setItem(THEME_KEY, theme);
    const handleChange = () => { if (theme === 'system') applyTheme(); };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return { theme, setTheme };
};

// --- COMPONENTS ---

const KPI = ({ title, value, sub, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between group hover:border-slate-300 dark:hover:border-slate-700 transition-all h-full relative overflow-hidden">
    <div className={`absolute -bottom-6 -right-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none z-0 ${colorClass}`}>
      <Icon className="w-24 h-24" />
    </div>
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('400', '900/20')} ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm ${trend > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold font-mono text-slate-900 dark:text-white leading-tight">{value}</h3>
        <p className="text-xs text-slate-500 mt-2 font-medium">{sub}</p>
      </div>
    </div>
  </div>
);

const SidebarItem = ({ id, label, icon: Icon, isActive, onClick, themeClasses }: any) => (
  <button 
    onClick={() => onClick(id)} 
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mb-1 ${isActive ? `${themeClasses.bg} text-white shadow-lg` : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
  >
    <Icon className="w-5 h-5" /> {label}
  </button>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = { 
    'Rented': 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', 
    'Vacant': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', 
    'Off-Plan': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800' 
  };
  return <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border ${styles[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{status}</span>;
};

// --- MAIN APPLICATION COMPONENT ---

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [portfolios, setPortfolios] = useState<Client[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState<'imperial' | 'metric'>('imperial');
  const [colorTheme, setColorTheme] = useState('amber');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { theme, setTheme } = useTheme();

  const themes: Record<string, ThemeClasses> = {
    amber: { name: 'Amber', bg: 'bg-amber-500', bgHover: 'hover:bg-amber-600', text: 'text-amber-500', textDark: 'dark:text-amber-500', border: 'border-amber-500', ring: 'focus:ring-amber-500', borderFocus: 'focus:border-amber-500', light: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' },
    indigo: { name: 'Indigo', bg: 'bg-indigo-600', bgHover: 'hover:bg-indigo-700', text: 'text-indigo-600', textDark: 'dark:text-indigo-400', border: 'border-indigo-600', ring: 'focus:ring-indigo-500', borderFocus: 'focus:border-indigo-500', light: 'bg-indigo-50', badge: 'bg-indigo-100 text-indigo-800' },
    emerald: { name: 'Emerald', bg: 'bg-emerald-600', bgHover: 'hover:bg-emerald-700', text: 'text-emerald-600', textDark: 'dark:text-emerald-400', border: 'border-emerald-600', ring: 'focus:ring-emerald-500', borderFocus: 'focus:border-emerald-500', light: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-800' },
  };

  const activeTheme = themes[colorTheme] || themes.amber;

  // Initial Data (Demo)
  const getInitialData = (): Client[] => {
    return [
      {
        id: 'c1',
        name: 'Ahmed Al-Mansouri',
        email: 'ahmed.m@holding.ae',
        phone: '+971 50 999 8877',
        nationality: 'UAE',
        passport: 'E784123456',
        emiratesId: '784-1985-1234567-1',
        type: 'Corporate / Holding Co.',
        tags: ['VIP', 'Local', 'Cash Buyer'],
        totalValue: 12500000,
        totalUnits: 1,
        assets: [
          {
            ...FINAL_ASSET_DEFAULTS,
            id: 'a101',
            name: 'Bluewaters Res 4, 302',
            type: 'Apartment',
            area: 'Bluewaters',
            value: 6500000,
            status: 'Rented',
            rent: 450000,
            purchasePrice: 5800000,
            bedrooms: '3',
            bathrooms: '4',
            parking: '2',
            ownerId: 'c1',
            clientName: 'Ahmed Al-Mansouri'
          }
        ]
      }
    ].map(normalizeClient);
  };

  // Hydration
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const initial = saved ? JSON.parse(saved) : getInitialData();
      setPortfolios(initial.map(normalizeClient));
      
      const savedTheme = localStorage.getItem(COLOR_THEME_KEY);
      if (savedTheme) setColorTheme(savedTheme);
      
      const savedUnit = localStorage.getItem('neo_measurement_unit');
      if (savedUnit) setMeasurementUnit(savedUnit as any);
      
    } catch (e) {
      setPortfolios(getInitialData());
    }
    setIsLoaded(true);
  }, []);

  // Autosave
  useEffect(() => {
    if (!isLoaded) return;
    const handler = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(portfolios));
      localStorage.setItem(COLOR_THEME_KEY, colorTheme);
      localStorage.setItem('neo_measurement_unit', measurementUnit);
      setLastSaved(new Date());
    }, 1000);
    return () => clearTimeout(handler);
  }, [portfolios, colorTheme, measurementUnit, isLoaded]);

  // Derived Metrics
  const metrics = useMemo(() => {
    const allAssets: Asset[] = portfolios.flatMap(c => c.assets.map(a => ({ ...a, clientName: c.name, ownerId: c.id })));
    const totalAUM = allAssets.reduce((sum, a) => sum + a.value, 0);
    const rentedAssets = allAssets.filter(a => a.status === 'Rented');
    const totalRent = rentedAssets.reduce((sum, a) => sum + (a.rent || 0), 0);
    const totalUnits = allAssets.length;
    const vacantCount = allAssets.filter(a => a.status === 'Vacant').length;
    const offPlanCount = allAssets.filter(a => a.status === 'Off-Plan').length;
    
    const occupancyRate = totalUnits > offPlanCount ? Math.round((rentedAssets.length / (totalUnits - offPlanCount)) * 100) : 0;
    
    return {
      totalAUM,
      totalRent,
      totalUnits,
      vacantCount,
      offPlanCount,
      occupancyRate,
      allAssets,
      alerts: [] // Logic for alerts like expiring leases could go here
    };
  }, [portfolios]);

  const filteredAssets = useMemo(() => {
    return metrics.allAssets.filter(a => 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [metrics.allAssets, searchQuery]);

  const filteredClients = useMemo(() => {
    return portfolios.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [portfolios, searchQuery]);

  // --- RENDERS ---

  const renderDashboard = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPI title="Total AUM" value={formatCurrency(metrics.totalAUM)} sub="Aggregated Portfolio Value" icon={Wallet} colorClass="text-indigo-600" trend={12.4} />
        <KPI title="Annual Rent" value={formatCurrency(metrics.totalRent)} sub="Gross Yield Portfolio" icon={Landmark} colorClass="text-emerald-600" trend={3.2} />
        <KPI title="Occupancy" value={`${metrics.occupancyRate}%`} sub={`${metrics.vacantCount} Units Vacant`} icon={Building2} colorClass={metrics.occupancyRate > 90 ? "text-emerald-600" : "text-amber-600"} trend={-1.5} />
        <KPI title="Total Units" value={metrics.totalUnits} sub={`${metrics.offPlanCount} Off-Plan Projects`} icon={PieChart} colorClass="text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">AUM Growth (Trailing 12m)</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', val: 10.2 }, { name: 'Feb', val: 10.5 }, { name: 'Mar', val: 11.1 },
                { name: 'Apr', val: 10.9 }, { name: 'May', val: 11.4 }, { name: 'Jun', val: 11.8 },
                { name: 'Jul', val: 12.1 }, { name: 'Aug', val: 12.5 }, { name: 'Sep', val: 12.3 },
                { name: 'Oct', val: 12.8 }, { name: 'Nov', val: 13.2 }, { name: 'Dec', val: 13.5 }
              ]}>
                <defs>
                  <linearGradient id="colorAum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="val" stroke="#4f46e5" fillOpacity={1} fill="url(#colorAum)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Asset Allocation</h3>
          <div className="h-64 flex flex-col items-center">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={[
                    { name: 'Apartments', value: 70 },
                    { name: 'Villas', value: 20 },
                    { name: 'Commercial', value: 10 },
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#4f46e5" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Apt</div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Villa</div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><div className="w-2 h-2 rounded-full bg-amber-500" /> Comm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                  {client.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{client.name}</h3>
                  <p className="text-xs text-slate-500">{client.type}</p>
                </div>
              </div>
              <button onClick={() => { setActiveClientId(client.id); setActiveView('client_details'); }} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Units</span>
                <span className="font-bold text-slate-900 dark:text-white">{client.totalUnits}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Portfolio Value</span>
                <span className="font-bold text-emerald-600">{formatCurrency(client.totalValue)}</span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              {client.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-500 uppercase">{t}</span>)}
            </div>
          </div>
        ))}
        <button onClick={() => setActiveView('add_client')} className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all group">
          <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-4 group-hover:bg-indigo-50">
            <UserPlus className="w-6 h-6" />
          </div>
          <span className="font-bold text-sm">Add New Client</span>
        </button>
      </div>
    </div>
  );

  const renderProperties = () => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-100 dark:border-slate-800 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Property</th>
              <th className="px-6 py-4">Owner</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Value</th>
              <th className="px-6 py-4 text-right">Rent/Yr</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredAssets.map(asset => (
              <tr key={asset.id} onClick={() => { setActiveAssetId(asset.id); setActiveView('property_details'); }} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{asset.name}</div>
                      <div className="text-xs text-slate-400">{asset.area} • {asset.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{asset.clientName}</td>
                <td className="px-6 py-4"><StatusBadge status={asset.status} /></td>
                <td className="px-6 py-4 text-right font-mono text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(asset.value)}</td>
                <td className="px-6 py-4 text-right font-mono text-sm font-bold text-emerald-600">{asset.rent > 0 ? formatCurrency(asset.rent) : '-'}</td>
                <td className="px-6 py-4 text-right"><ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600 transition-colors" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <div className={`${activeTheme.bg} p-2 rounded-xl text-white`}>
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white leading-tight">NEO PORTFOLIO</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Manager Pro</p>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem id="dashboard" label="Overview" icon={LayoutDashboard} isActive={activeView === 'dashboard'} onClick={setActiveView} themeClasses={activeTheme} />
          <SidebarItem id="clients" label="Clients" icon={Users} isActive={activeView === 'clients' || activeView === 'client_details'} onClick={setActiveView} themeClasses={activeTheme} />
          <SidebarItem id="properties" label="Properties" icon={Building2} isActive={activeView === 'properties' || activeView === 'property_details'} onClick={setActiveView} themeClasses={activeTheme} />
          <SidebarItem id="reporting" label="Reports" icon={Printer} isActive={activeView === 'reporting'} onClick={setActiveView} themeClasses={activeTheme} />
        </nav>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="px-4 py-2 mb-2 text-[10px] text-slate-400 flex items-center gap-2">
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-emerald-500" />}
            {isSaving ? "Saving changes..." : `Auto-saved at ${lastSaved?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
          </div>
          <SidebarItem id="settings" label="System Settings" icon={Settings} isActive={activeView === 'settings'} onClick={setActiveView} themeClasses={activeTheme} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search assets, clients, areas..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <History className="w-5 h-5" />
             </button>
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-2" />
             <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                 <p className="text-sm font-bold text-slate-900 dark:text-white">Admin Console</p>
                 <p className="text-[10px] text-slate-400 uppercase font-bold">Manager Mode</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <img src="https://picsum.photos/40/40" alt="Avatar" />
               </div>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                {activeView.replace('_', ' ')}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {activeView === 'dashboard' ? 'Welcome back, viewing overall portfolio performance.' : 'Manage and monitor your specific real estate assets.'}
              </p>
            </div>
            {(activeView === 'clients' || activeView === 'properties') && (
              <button onClick={() => setActiveView(activeView === 'clients' ? 'add_client' : 'add_property')} className={`${activeTheme.bg} text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-all`}>
                <Plus className="w-5 h-5" />
                Add New {activeView === 'clients' ? 'Client' : 'Property'}
              </button>
            )}
            {activeView === 'client_details' && (
               <button onClick={() => setActiveView('clients')} className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                 <ArrowLeft className="w-4 h-4" /> Back to Clients
               </button>
            )}
            {activeView === 'property_details' && (
               <button onClick={() => setActiveView('properties')} className="bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-600 dark:text-slate-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                 <ArrowLeft className="w-4 h-4" /> Back to Master List
               </button>
            )}
          </div>

          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'clients' && renderClients()}
          {activeView === 'properties' && renderProperties()}
          
          {activeView === 'settings' && (
            <div className="max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm animate-fade-in">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-8">System Preferences</h3>
              
              <div className="space-y-8">
                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-4 flex items-center gap-2"><Sun className="w-4 h-4" /> Appearance Mode</label>
                  <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                    {['light', 'dark', 'system'].map(m => (
                      <button key={m} onClick={() => setTheme(m as any)} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${theme === m ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-4 flex items-center gap-2"><Palette className="w-4 h-4" /> Brand Theme</label>
                  <div className="flex gap-4">
                    {Object.entries(themes).map(([key, t]) => (
                      <button key={key} onClick={() => setColorTheme(key)} className={`w-12 h-12 rounded-2xl transition-all border-4 ${colorTheme === key ? 'border-white dark:border-slate-700 scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'} ${t.bg}`} title={t.name} />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-4 flex items-center gap-2"><Globe className="w-4 h-4" /> Region & Units</label>
                  <div className="flex bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                    <button onClick={() => setMeasurementUnit('imperial')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${measurementUnit === 'imperial' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Imperial (sq.ft)</button>
                    <button onClick={() => setMeasurementUnit('metric')} className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${measurementUnit === 'metric' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}>Metric (m²)</button>
                  </div>
                </div>

                <div className="pt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                   <h4 className="font-bold text-slate-900 dark:text-white">Data Management</h4>
                   <div className="grid grid-cols-2 gap-4">
                     <button className="flex items-center justify-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors">
                       <Download className="w-5 h-5" /> Export DB (JSON)
                     </button>
                     <button className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl font-bold text-sm text-red-600 hover:bg-red-100 transition-colors">
                       <RotateCcw className="w-5 h-5" /> Factory Reset
                     </button>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
