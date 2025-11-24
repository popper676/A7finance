import React, { useState, useEffect, useRef, useMemo } from 'react';
import { currencyService } from './currencyService';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  User, 
  TrendingUp,
  TrendingDown, 
  Briefcase,
  Brain,
  Zap,
  FileSpreadsheet,
  ArrowRight,
  UploadCloud,
  BarChart3,
  Bot,
  Sparkles,
  LineChart,
  PieChart as PieChartIcon,
  Download,
  RefreshCcw,
  Layers,
  Target,
  Send,
  FileJson,
  Globe,
  CheckCircle2,
  FileUp,
  DollarSign,
  Coins,
  Loader2,
  AlertTriangle,
  Table as TableIcon,
  Activity,
  Scale,
  AlertOctagon,
  KeyRound,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
  Lock,
  Filter,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area,
  LineChart as ReLineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
// @ts-ignore
import { read, utils } from 'xlsx';
import OpenAI from 'openai';
import AiInsight from './components/AiInsight';

// --- HELPER: ENVIRONMENT VARIABLES ---
const getEnvApiKey = () => {
  let key = '';
  
  // 1. Prioritize OPENAIAPI (GitHub Secret / Custom Env)
  // @ts-ignore
  if (typeof process !== 'undefined' && process.env?.OPENAIAPI) key = process.env.OPENAIAPI;
  // @ts-ignore
  else if (typeof import.meta !== 'undefined' && import.meta.env?.OPENAIAPI) key = import.meta.env.OPENAIAPI;
  // @ts-ignore
  else if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_OPENAI_API_KEY) key = import.meta.env.VITE_OPENAI_API_KEY;

  // STRICT VALIDATION
  if (key && !key.startsWith('sk-')) {
      console.warn("Ignored invalid API Key (Did not start with 'sk-'). Check your environment variables.");
      return '';
  }

  return key;
};

// --- TYPES & TRANSLATIONS ---
type AppState = 'UPLOAD' | 'ANALYZING' | 'DASHBOARD';
type Language = 'en' | 'my';
type Currency = 'MMK' | 'USD';

const TRANSLATIONS = {
  en: {
    tagline: "AI-Powered Business Intelligence",
    uploadTitle: "Data Ingestion",
    uploadDesc: "Upload CSV/Excel files. The AI will automatically map your financial data columns.",
    dropHere: "Drop Financial Data Here",
    browse: "Click to browse files",
    sampleBtn: "Download Sample CSV",
    demoBtn: "Use Demo Data",
    processing: "AI ANALYZING STRUCTURE",
    dashboard: "Dashboard",
    analytics: "Analytics",
    aiAssistant: "AI Assistant",
    dataView: "Data View",
    settings: "Settings",
    tools: "Data Tools",
    totalRevenue: "Total Revenue",
    grossProfit: "Gross Profit",
    netProfit: "Net Profit",
    expenses: "Operating Expenses",
    grossMargin: "Gross Margin",
    netMargin: "Net Margin",
    vsLastMonth: "vs last month",
    revVsExp: "Revenue vs Expenses vs Profit",
    growthTraj: "Growth Trajectory",
    loadNew: "Load New Data",
    converterTitle: "Data Converter Tool",
    converterDesc: "Upload any messy Excel file. The AI will standardize it into a clean format ready for the Dashboard.",
    convertBtn: "Convert & Download CSV",
    convertSuccess: "File Converted Successfully!",
    chatPlaceholder: "Ask a question about your data...",
    chatWelcome: "Hello. I have analyzed your financial data. You can ask me about Revenue, Gross Profit, Net Profit, or trends. How can I help?",
    clearChat: "Clear Chat",
    currency: "Currency",
    systemReady: "System Ready",
    secureMode: "Secure Connection"
  },
  my: {
    tagline: "ဉာဏ်ရည်တု သုံး ဘဏ္ဍာရေး ဆန်းစစ်မှုစနစ်",
    uploadTitle: "စာရင်းသွင်းရန်",
    uploadDesc: "Excel/CSV ဖိုင်တင်သွင်းပါ။ AI မှ သင့်စာရင်းခေါင်းစဉ်များကို အလိုအလျောက် နားလည်ပေးပါမည်။",
    dropHere: "ဖိုင်ကို ဤနေရာတွင် ဆွဲထည့်ပါ",
    browse: "ဖိုင်ရွေးရန် နှိပ်ပါ",
    sampleBtn: "နမူနာဖိုင် ဒေါင်းလုပ်ဆွဲရန်",
    demoBtn: "စမ်းသပ်အချက်အလက်များဖြင့် ကြည့်မည်",
    processing: "AI မှ တွက်ချက်နေပါသည်",
    dashboard: "ပင်မစာမျက်နှာ",
    analytics: "ဆန်းစစ်ချက်များ",
    aiAssistant: "AI လက်ထောက်",
    dataView: "စာရင်းအင်းများ",
    settings: "ဆက်တင်များ",
    tools: "ဖိုင် ပြုပြင်ရန်",
    totalRevenue: "စုစုပေါင်း ဝင်ငွေ",
    grossProfit: "အကြမ်းဖျင်း အမြတ်",
    netProfit: "အသားတင် အမြတ်",
    expenses: "လုပ်ငန်းသုံး စရိတ်များ",
    grossMargin: "အကြမ်းဖျင်း အမြတ်နှုန်း",
    netMargin: "အသားတင် အမြတ်နှုန်း",
    vsLastMonth: "ယခင်လ နှင့် နှိုင်းယှဉ်ချက်",
    revVsExp: "ဝင်ငွေ၊ ထွက်ငွေ နှင့် အမြတ် နှိုင်းယှဉ်ချက်",
    growthTraj: "တိုးတက်မှုနှုန်း လမ်းကြောင်း",
    loadNew: "ဖိုင်အသစ် တင်မည်",
    converterTitle: "ဖိုင်ပြောင်းလဲခြင်း ကိရိယာ",
    converterDesc: "မိမိ Excel ဖိုင်ကို တင်လိုက်ပါ။ စနစ်မှ Dashboard နှင့် ကိုက်ညီသော ပုံစံသို့ အလိုအလျောက် ပြောင်းလဲပေးပါမည်။",
    convertBtn: "ပြောင်းလဲပြီး ဒေါင်းလုပ်ယူမည်",
    convertSuccess: "ဖိုင်ပြောင်းလဲမှု အောင်မြင်ပါသည်",
    chatPlaceholder: "သိလိုသည်များကို မေးမြန်းနိုင်ပါသည်...",
    chatWelcome: "မင်္ဂလာပါ။ လူကြီးမင်း၏ စာရင်းများကို လေ့လာပြီးပါပြီ။ ဝင်ငွေ၊ အမြတ်ငွေ နှင့် ပတ်သက်သည်များကို မေးမြန်းနိုင်ပါပြီ။",
    clearChat: "ရှင်းလင်းမည်",
    currency: "ငွေကြေး",
    systemReady: "စနစ်အဆင်သင့်ဖြစ်ပါပြီ",
    secureMode: "လုံခြုံသောစနစ်"
  }
};

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface FinancialData {
  month: string;
  description: string;
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  category?: string;
  rawDate?: string; // For sorting YYYY-MM
  rawRow?: any;
}

// --- STRICT MATHEMATICAL MOCK DATA ---
// Helper to generate data where Net Profit = Revenue - COGS - Expenses is guaranteed
const generateStrictMockData = (): FinancialData[] => {
  const months = [
    { m: 'Jan 2024', rev: 15000000, cogs: 8000000, exp: 2500000 },
    { m: 'Feb 2024', rev: 16500000, cogs: 8500000, exp: 2800000 },
    { m: 'Mar 2024', rev: 14000000, cogs: 7000000, exp: 2200000 },
    { m: 'Apr 2024', rev: 18500000, cogs: 9500000, exp: 3000000 },
    { m: 'May 2024', rev: 19000000, cogs: 9800000, exp: 3100000 },
    { m: 'Jun 2024', rev: 22000000, cogs: 11000000, exp: 3500000 },
  ];

  return months.map(d => {
    // Strict calculation:
    const grossProfit = d.rev - d.cogs;
    const netProfit = grossProfit - d.exp;

    // Map to YYYY-MM for sorting
    const dateObj = new Date(d.m);
    const rawDate = !isNaN(dateObj.getTime()) 
      ? `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`
      : d.m;

    return {
      month: d.m,
      description: 'Monthly Aggregated Data',
      revenue: d.rev,
      cogs: d.cogs,
      expenses: d.exp, // This represents Operating Expenses
      grossProfit: grossProfit,
      netProfit: netProfit,
      category: 'Sales',
      rawDate: rawDate
    };
  });
};

const MOCK_FINANCIAL_DATA: FinancialData[] = generateStrictMockData();

const ANALYSIS_STEPS = [
  "Scanning File Structure...",
  "AI Detecting Header Rows...",
  "Identifying Financial Strategy...",
  "Normalizing Dates & Currencies...",
  "Calculating Profit Margins..."
];

// Global exchange rate (updated when fetched)
let globalExchangeRate: number | null = null;

// Helper to convert MMK to USD
const convertToUSD = (mmkValue: number, rate: number | null): number => {
  if (!rate) return mmkValue; // Fallback to MMK if rate not available
  return mmkValue * rate;
};

// Helper to format currency (uses global exchange rate)
const formatCurrency = (val: number, currency: Currency, compact: boolean = false) => {
  // Convert MMK to USD if needed
  let displayValue = val;
  if (currency === 'USD' && globalExchangeRate) {
    displayValue = convertToUSD(val, globalExchangeRate);
  }
  
  const prefix = currency === 'USD' ? '$' : '';
  const suffix = currency === 'MMK' ? ' MMK' : '';
  
  if (compact) {
    let formatted = displayValue.toString();
    if (Math.abs(displayValue) >= 1000000000) formatted = `${(displayValue / 1000000000).toFixed(2)}B`;
    else if (Math.abs(displayValue) >= 1000000) formatted = `${(displayValue / 1000000).toFixed(1)}M`;
    else if (Math.abs(displayValue) >= 1000) formatted = `${(displayValue / 1000).toFixed(1)}K`;
    else formatted = displayValue.toLocaleString();
    return `${prefix}${formatted}${suffix}`;
  }

  return `${prefix}${displayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
};

// --- ROBUST PARSING HELPERS ---

const getCellValue = (row: any, targetHeader: string) => {
  if (!targetHeader) return undefined;
  if (!row) return undefined;
  
  // 1. Exact Match
  if (Object.prototype.hasOwnProperty.call(row, targetHeader)) return row[targetHeader];

  // 2. Case Insensitive / Trimmed Match
  const keys = Object.keys(row);
  const normalizedTarget = targetHeader.trim().toLowerCase();
  const matchedKey = keys.find(k => k.trim().toLowerCase() === normalizedTarget);
  
  return matchedKey ? row[matchedKey] : undefined;
};

const parseFinancialValue = (val: any): number => {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  
  const str = String(val).trim();
  if (!str || str === '-') return 0; // Handle dash as 0

  // Handle Accounting Format: (123.45) means -123.45
  const isNegative = str.startsWith('(') && str.endsWith(')');
  
  const cleanStr = str.replace(/[^0-9.-]/g, '');
  
  let num = parseFloat(cleanStr);
  if (isNaN(num)) return 0;
  
  return isNegative ? -num : num;
};

const parseDateKey = (val: any): { label: string, key: string } => {
    if (!val) return { label: 'Unknown', key: '0000-00' };
    
    let date: Date | null = null;
    
    // Excel Serial Number (e.g., 45321)
    if (typeof val === 'number' && val > 30000) {
         date = new Date(Math.round((val - 25569) * 86400 * 1000));
    } else {
         // Attempt string parse
         date = new Date(val);
    }

    if (date && !isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = date.getMonth(); // 0-11
        const mStr = String(m + 1).padStart(2, '0');
        const mNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return {
            label: `${mNames[m]} '${String(y).slice(-2)}`, // "Jan '24"
            key: `${y}-${mStr}` // "2024-01" for sorting
        };
    }

    // Fallback for simple strings like "January"
    const strVal = String(val);
    return { label: strVal, key: strVal };
};

// --- DATA AGGREGATION HELPER ---
const aggregateFinancialData = (data: FinancialData[]): FinancialData[] => {
  const groups: Record<string, FinancialData> = {};

  data.forEach(row => {
    // Ensure we group by the parsed DATE KEY (YYYY-MM)
    const { label, key } = parseDateKey(row.month);

    if (!groups[key]) {
      groups[key] = {
        month: label,
        description: 'Aggregated Monthly Data',
        rawDate: key,
        revenue: 0,
        cogs: 0,
        grossProfit: 0,
        expenses: 0,
        netProfit: 0,
        category: 'Aggregated'
      };
    }

    groups[key].revenue += row.revenue;
    groups[key].cogs += row.cogs;
    groups[key].grossProfit += row.grossProfit;
    groups[key].expenses += row.expenses;
    groups[key].netProfit += row.netProfit;
  });

  // Sort by the YYYY-MM key
  return Object.values(groups).sort((a, b) => {
     if (a.rawDate && b.rawDate) return a.rawDate.localeCompare(b.rawDate);
     return 0;
  });
};

// --- COMPONENT: SMART UPLOAD ---
const SmartUploadView = ({ onFileDrop, onSkip, lang, apiKey }: { onFileDrop: (file?: File) => void, onSkip: () => void, lang: Language, apiKey: string }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[lang];

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileDrop(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileDrop(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleDownloadSample = () => {
    // Generate a robust 6-month sample with Revenue, COGS, and Expenses
    const headers = "Date,Description,Category,Revenue,COGS,Expense";
    const rows = [];
    
    // Helper for random integer in range
    const r = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min);
    
    // Generate data for the last 6 months
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
       const year = today.getFullYear();
       const month = today.getMonth() - i;
       // Use 1st of month as base
       const d = new Date(year, month, 1);
       const mStr = d.toISOString().slice(0, 7); // YYYY-MM
       
       // 1. Revenue Rows (2-3 per month)
       rows.push(`${mStr}-05,Product Sales (Batch A),Sales,${r(5000000, 8000000)},0,0`);
       rows.push(`${mStr}-15,Service Income,Service,${r(2000000, 4000000)},0,0`);
       if (i % 2 === 0) {
         rows.push(`${mStr}-22,Bulk Order (Corporate),Sales,${r(3000000, 5000000)},0,0`);
       }

       // 2. COGS Rows (Variable with sales)
       rows.push(`${mStr}-02,Inventory Purchase,COGS,0,${r(3000000, 5000000)},0`);
       rows.push(`${mStr}-10,Raw Materials,COGS,0,${r(1000000, 2000000)},0`);

       // 3. Expense Rows (Fixed + Variable)
       rows.push(`${mStr}-01,Office Rent,Rent,0,0,1500000`);
       rows.push(`${mStr}-25,Staff Salary,Payroll,0,0,2500000`);
       rows.push(`${mStr}-28,Electricity & Water,Utilities,0,0,${r(100000, 300000)}`);
       rows.push(`${mStr}-12,Marketing Ads,Marketing,0,0,${r(200000, 500000)}`);
    }

    const csvContent = headers + "\n" + rows.join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "A7_Finance_Sample.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
      {!apiKey && (
        <div className="absolute top-0 left-0 w-full bg-amber-500/10 border-b border-amber-500/20 p-2 text-center text-amber-500 text-xs font-medium">
           Warning: No API Key detected. Ensure VITE_OPENAI_API_KEY is set in .env (local) or GitHub Secrets (prod).
        </div>
      )}
      <div className="max-w-3xl w-full text-center z-10">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-padauk">
          {t.uploadTitle}
        </h2>
        <p className="text-slate-400 mb-8 font-padauk">{t.uploadDesc}</p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".csv,.xlsx,.xls"
        />

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`
            relative group cursor-pointer
            w-full aspect-[16/9] md:aspect-[21/9] 
            rounded-3xl border-2 border-dashed transition-all duration-500 ease-out
            flex flex-col items-center justify-center
            ${isDragging 
              ? 'border-cyan-400 bg-cyan-500/10 scale-105 shadow-[0_0_50px_rgba(34,211,238,0.3)]' 
              : 'border-slate-700 bg-slate-900/50 hover:border-slate-500 hover:bg-slate-800'
            }
          `}
        >
          <div className={`
            w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-transform duration-500
            ${isDragging ? 'bg-cyan-500 text-white scale-110 rotate-12' : 'bg-slate-800 text-slate-400 group-hover:scale-110'}
          `}>
            <UploadCloud size={48} />
          </div>
          <h3 className="text-xl font-bold text-slate-200 font-padauk mb-2">
            {t.dropHere}
          </h3>
          <p className="text-slate-500 text-sm mb-1 font-padauk group-hover:text-slate-400 transition-colors">
            Supports .csv, .xlsx
          </p>
          <p className="text-cyan-400 text-sm font-medium mb-4 font-padauk underline decoration-cyan-500/30 underline-offset-4 hover:text-cyan-300">
            {t.browse}
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <button 
            onClick={handleDownloadSample}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded-xl text-sm font-medium transition-all border border-cyan-500/30 hover:border-cyan-500/60 shadow-lg shadow-cyan-900/20 font-padauk"
          >
            <Download size={16} />
            <span>{t.sampleBtn}</span>
          </button>

          <button 
            onClick={onSkip}
            className="text-slate-600 hover:text-slate-400 text-sm font-medium hover:underline underline-offset-4 transition-colors font-padauk"
          >
            {t.demoBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: ANALYZING ANIMATION ---
const AnalyzingView = ({ lang }: { lang: Language }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950"></div>
      
      <div className="z-10 flex flex-col items-center">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
           <div className="absolute inset-0 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
           <Brain className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={32} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-4 font-orbitron tracking-widest">{TRANSLATIONS[lang].processing}</h2>
        
        <div className="h-8 overflow-hidden flex flex-col items-center">
          {ANALYSIS_STEPS.map((text, index) => (
            <p 
              key={index}
              className={`text-cyan-400/80 font-mono text-sm transition-all duration-500 transform
                ${index === step ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 absolute'}
              `}
            >
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: AI CHAT VIEW ---
const AIChatView = ({ data, lang, currency, apiKey }: { data: FinancialData[], lang: Language, currency: Currency, apiKey: string }) => {
  const t = TRANSLATIONS[lang];
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: t.chatWelcome,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recalculate stats from the AGGREGATED monthly data passed in
  const stats = useMemo(() => {
    const totalRevenue = data.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalCOGS = data.reduce((acc, curr) => acc + curr.cogs, 0);
    const totalGrossProfit = data.reduce((acc, curr) => acc + curr.grossProfit, 0);
    const totalExpenses = data.reduce((acc, curr) => acc + curr.expenses, 0);
    const totalNetProfit = data.reduce((acc, curr) => acc + curr.netProfit, 0);
    
    // Finding best month from aggregated data
    const bestMonthRev = [...data].sort((a,b) => b.revenue - a.revenue)[0];
    
    const grossMargin = totalRevenue ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue ? (totalNetProfit / totalRevenue) * 100 : 0;

    return { 
      totalRevenue: formatCurrency(totalRevenue, currency), 
      totalCOGS: formatCurrency(totalCOGS, currency),
      totalGrossProfit: formatCurrency(totalGrossProfit, currency),
      totalExpenses: formatCurrency(totalExpenses, currency),
      totalNetProfit: formatCurrency(totalNetProfit, currency),
      bestMonthRev: bestMonthRev ? `${bestMonthRev.month} (${formatCurrency(bestMonthRev.revenue, currency)})` : 'N/A',
      grossMargin: `${grossMargin.toFixed(1)}%`,
      netMargin: `${netMargin.toFixed(1)}%`
    };
  }, [data, currency]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    // Reset welcome message when language changes
    setMessages(prev => {
        if (prev.length === 1 && prev[0].sender === 'ai') {
            return [{ id: '1', sender: 'ai', text: t.chatWelcome, timestamp: new Date() }];
        }
        return prev;
    });
  }, [lang, t.chatWelcome]);


  const handleSend = async () => {
    if (!inputValue.trim()) return;
    if (!apiKey) {
       alert("AI functionality is disabled because no API Key was found.");
       return;
    }
    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: inputValue, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

      // Provide a summary of up to 24 months to keep token usage reasonable
      const dataContext = data.slice(-24).map(d => ({
         Month: d.month,
         Rev: d.revenue,
         Profit: d.netProfit,
         Exp: d.expenses
      }));

      const systemPrompt = `
        You are an expert financial analyst assistant for a Myanmar SME.
        
        OVERALL PERFORMANCE (Whole Dataset):
        - Total Revenue: ${stats.totalRevenue}
        - Total Net Profit: ${stats.totalNetProfit}
        - Gross Margin: ${stats.grossMargin}
        - Net Margin: ${stats.netMargin}
        - Best Month (Revenue): ${stats.bestMonthRev}

        MONTHLY TRENDS (Last 24 months max):
        ${JSON.stringify(dataContext)}

        Rules:
        1. Answer the user's question based on this data.
        2. Use the OVERALL PERFORMANCE stats for general questions.
        3. Use the MONTHLY TRENDS for specific months or trend questions.
        4. Provide concise, helpful, and analytical answers.
        5. If the user writes in Burmese, answer in Burmese. If English, answer in English.
        6. The current currency is ${currency}.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg.text }
        ]
      });

      const aiMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        sender: 'ai', 
        text: response.choices[0].message.content || "Sorry, I could not generate a response.", 
        timestamp: new Date() 
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg: ChatMessage = { 
         id: (Date.now() + 1).toString(), 
         sender: 'ai', 
         text: lang === 'en' ? "I'm having trouble connecting to the AI service. Please check your connection or API Key." : "AI စနစ်နှင့် ချိတ်ဆက်၍ မရပါ။ API Key စစ်ဆေးပါ။", 
         timestamp: new Date() 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = lang === 'en' 
    ? ["Total Net Profit?", "Show Revenue details", "Gross Margin?", "Highest profit month?"]
    : ["အသားတင်အမြတ် ဘယ်လောက်လဲ", "ဝင်ငွေ အခြေအနေ", "အမြတ်အများဆုံးလ", "ကုန်ကျစရိတ်များ"];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-fadeInUp">
      <div className="p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/50">
             <Bot size={20} className="text-cyan-400" />
          </div>
          <div>
            <h3 className="font-bold text-slate-200 font-padauk">{t.aiAssistant}</h3>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${apiKey ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
              <span className="text-xs text-slate-500 font-medium">{apiKey ? 'AI System Online' : 'AI Offline (No Key)'}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setMessages([])} className="text-xs text-slate-500 hover:text-slate-300 transition-colors font-padauk">{t.clearChat}</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${msg.sender === 'user' ? 'bg-cyan-600' : 'bg-slate-800 border border-slate-700'}`}>
                {msg.sender === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} className="text-cyan-400" />}
              </div>
              <div className={`p-4 rounded-2xl font-padauk leading-relaxed shadow-sm text-sm md:text-base ${msg.sender === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex w-full justify-start">
              <div className="flex gap-3 max-w-[75%] flex-row">
                 <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 bg-slate-800 border border-slate-700">
                    <Bot size={16} className="text-cyan-400" />
                 </div>
                 <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 rounded-tl-none flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-cyan-400" />
                    <span className="text-xs text-slate-400">Thinking...</span>
                 </div>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {suggestions.map((sug, idx) => (
            <button key={idx} onClick={() => setInputValue(sug)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/50 rounded-full text-xs text-cyan-400 transition-all whitespace-nowrap font-padauk">
              <Sparkles size={12} />{sug}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={t.chatPlaceholder} className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-padauk" />
          <button onClick={handleSend} disabled={!inputValue.trim() || isTyping || !apiKey} className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-white p-3 rounded-xl transition-colors flex items-center justify-center shadow-lg shadow-cyan-500/20"><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: ANALYTICS VIEW ---
const AnalyticsView = ({ data, rawData, lang, currency }: { data: FinancialData[], rawData: FinancialData[], lang: Language, currency: Currency }) => {
  const t = TRANSLATIONS[lang];
  const [viewMode, setViewMode] = useState<'income' | 'expense'>('expense');

  // Aggregate Data for "Top Contributors" using RAW DATA to capture all category rows
  const { incomeCategories, expenseCategories } = useMemo(() => {
     const incAgg: Record<string, number> = {};
     const expAgg: Record<string, number> = {};
     
     rawData.forEach(d => {
        // Skip aggregated rows
        if(d.category === 'Aggregated') return;
        
        const catName = d.category && d.category !== 'General' ? d.category : 'Uncategorized';
        
        if (d.revenue > 0) {
           incAgg[catName] = (incAgg[catName] || 0) + d.revenue;
        }
        if (d.expenses > 0) {
           expAgg[catName] = (expAgg[catName] || 0) + d.expenses;
        }
     });
     
     const inc = Object.keys(incAgg).map(k => ({ name: k, value: incAgg[k] })).sort((a,b) => b.value - a.value).slice(0, 5);
     const exp = Object.keys(expAgg).map(k => ({ name: k, value: expAgg[k] })).sort((a,b) => b.value - a.value).slice(0, 5);
     
     return { incomeCategories: inc, expenseCategories: exp };
  }, [rawData]);

  // Auto-switch to available data if one is empty
  useEffect(() => {
     if (expenseCategories.length === 0 && incomeCategories.length > 0) {
         setViewMode('income');
     }
  }, [expenseCategories, incomeCategories]);

  const activePieData = viewMode === 'income' ? incomeCategories : expenseCategories;
  const COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f59e0b', '#f43f5e'];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-fadeInUp pb-10">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-white font-padauk">{t.analytics}</h2>
            <p className="text-slate-400 text-sm font-padauk">Deep Dive Analysis & Forecasting</p>
         </div>
      </div>

      {/* Profit Margins Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg">
            <h3 className="font-bold text-lg text-slate-100 mb-6 flex items-center gap-2 font-padauk">
               <TrendingUp className="text-emerald-500" size={20} /> {t.grossProfit} vs {t.netProfit} (Monthly Trend)
            </h3>
            <div className="h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                  {/* Uses AGGREGATED data for smooth timeline */}
                  <AreaChart data={data}>
                     <defs>
                        <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                     <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
                     {/* Using exact number formatting but with compact logic handled in formatter if needed, but here we force standard */}
                     <YAxis width={85} stroke="#64748b" tickLine={false} axisLine={false} tickFormatter={(val) => formatCurrency(val, currency, false)} />
                     <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} formatter={(val: number) => formatCurrency(val, currency)} />
                     <Legend />
                     <Area type="monotone" dataKey="grossProfit" stroke="#06b6d4" fill="url(#colorGross)" name="Gross Profit" strokeWidth={2} />
                     <Area type="monotone" dataKey="netProfit" stroke="#10b981" fill="url(#colorNet)" name="Net Profit" strokeWidth={2} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Category Breakdown using Raw Data */}
         <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2 font-padauk">
                  <PieChartIcon className="text-amber-500" size={20} /> Breakdown
               </h3>
               <div className="flex bg-slate-800 rounded-lg p-1">
                  <button 
                     onClick={() => setViewMode('income')}
                     className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                     Income
                  </button>
                  <button 
                     onClick={() => setViewMode('expense')}
                     className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${viewMode === 'expense' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                     Expense
                  </button>
               </div>
            </div>
            
            <div className="h-[250px] flex-1 flex items-center justify-center">
               {activePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie 
                           data={activePieData} 
                           cx="50%" 
                           cy="50%" 
                           innerRadius={60} 
                           outerRadius={80} 
                           paddingAngle={5} 
                           dataKey="value"
                        >
                           {activePieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} formatter={(val: number) => formatCurrency(val, currency)} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                     </PieChart>
                  </ResponsiveContainer>
               ) : (
                   <div className="text-center text-slate-500 flex flex-col items-center">
                      <Layers size={48} className="mb-4 opacity-20" />
                      <p className="text-sm">No {viewMode} categories found.</p>
                   </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
};

// --- COMPONENT: DATA TABLE VIEW ---
const DataTableView = ({ data, currency }: { data: FinancialData[], currency: Currency }) => {
  return (
    <div className="space-y-6 animate-fadeInUp pb-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-white font-padauk">Data Inspector</h2>
            <p className="text-slate-400 text-sm font-padauk">Exact values parsed from your file</p>
         </div>
         <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            {data.length} records found
         </div>
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-950 text-slate-400 font-medium border-b border-slate-800 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right text-emerald-500">Revenue</th>
                <th className="px-6 py-4 text-right text-rose-500">Expense</th>
                <th className="px-6 py-4 text-right text-indigo-400">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="px-6 py-4 text-slate-300 font-mono">{row.month}</td>
                  <td className="px-6 py-4 font-medium text-slate-200 group-hover:text-white">{row.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-emerald-500">{row.revenue !== 0 ? row.revenue.toLocaleString() : '-'}</td>
                  <td className="px-6 py-4 text-right font-mono text-rose-500">{row.expenses !== 0 ? row.expenses.toLocaleString() : '-'}</td>
                  <td className={`px-6 py-4 text-right font-mono font-bold ${row.netProfit >= 0 ? 'text-slate-300' : 'text-rose-400'}`}>
                     {row.netProfit.toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                       No data available. Upload a file to see records.
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD VIEW (SUMMARY) ---
type QuickFilter = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'allTime' | 'custom';

const DashboardView = ({ data, rawData, lang, currency, apiKey }: { data: FinancialData[], rawData: FinancialData[], lang: Language, currency: Currency, apiKey: string }) => {
  const t = TRANSLATIONS[lang];
  
  // Month Filter State
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<QuickFilter>('allTime');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [showMonthSelector, setShowMonthSelector] = useState(false);
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  // Get unique months from data
  const availableMonths = useMemo(() => {
    const months = new Set(data.map(item => item.month));
    return Array.from(months).sort((a, b) => {
      const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return monthOrder.indexOf(a) - monthOrder.indexOf(b);
    });
  }, [data]);

  // Helper to parse month name to date
  const getMonthDate = (monthName: string, year: number) => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
    if (monthIndex === -1) return new Date(year, 0, 1);
    return new Date(year, monthIndex, 15);
  };

  // Helper functions for quick filters
  const applyQuickFilter = (filter: QuickFilter) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let start: Date;
    let end: Date = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    switch (filter) {
      case 'thisMonth':
        start = new Date(currentYear, currentMonth, 1);
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        break;
      case 'lastMonth':
        start = new Date(currentYear, currentMonth - 1, 1);
        end = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
        break;
      case 'last3Months':
        start = new Date(currentYear, currentMonth - 3, 1);
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        break;
      case 'last6Months':
        start = new Date(currentYear, currentMonth - 6, 1);
        end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
        break;
      case 'thisYear':
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        break;
      case 'allTime':
        if (data.length === 0) {
          start = new Date(currentYear, 0, 1);
          end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        } else {
          const allDates = data.map(item => {
            if (item.rawDate) {
              const [year, month] = item.rawDate.split('-');
              return new Date(parseInt(year), parseInt(month) - 1, 15);
            }
            return getMonthDate(item.month, currentYear);
          });
          start = new Date(Math.min(...allDates.map(d => d.getTime())));
          end = new Date(Math.max(...allDates.map(d => d.getTime())));
          end.setHours(23, 59, 59, 999);
        }
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setSelectedQuickFilter(filter);
  };

  // Initialize with allTime filter
  useEffect(() => {
    applyQuickFilter('allTime');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter Data based on Date Range or Selected Months
  const filteredData = useMemo(() => {
    // If specific months are selected, filter by month names
    if (selectedMonths.length > 0) {
      return data.filter(item => selectedMonths.includes(item.month));
    }

    // Otherwise, use date range filter
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return data.filter(item => {
      let itemDate: Date;
      if (item.rawDate) {
        const [year, month] = item.rawDate.split('-');
        itemDate = new Date(parseInt(year), parseInt(month) - 1, 15);
      } else {
        itemDate = getMonthDate(item.month, currentYear);
      }
      return itemDate >= start && itemDate <= end;
    });
  }, [data, startDate, endDate, currentYear, selectedMonths]);

  // Handle month selection
  const handleMonthToggle = (month: string) => {
    setSelectedMonths(prev => {
      if (prev.includes(month)) {
        const newSelection = prev.filter(m => m !== month);
        if (newSelection.length === 0) {
          setSelectedQuickFilter('custom');
        }
        return newSelection;
      } else {
        setSelectedQuickFilter('custom');
        return [...prev, month];
      }
    });
  };

  // Close month selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showMonthSelector && !target.closest('.month-selector-container')) {
        setShowMonthSelector(false);
      }
    };

    if (showMonthSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMonthSelector]);

  // Calculate aggregated totals for filtered period
  const aggregatedStats = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        totalNetProfit: 0,
        totalCogs: 0,
        totalGrossProfit: 0,
        periodLabel: 'No Data',
        monthCount: 0
      };
    }

    const totals = filteredData.reduce((acc, item) => ({
      totalRevenue: acc.totalRevenue + item.revenue,
      totalExpenses: acc.totalExpenses + item.expenses,
      totalNetProfit: acc.totalNetProfit + item.netProfit,
      totalCogs: acc.totalCogs + item.cogs,
      totalGrossProfit: acc.totalGrossProfit + item.grossProfit,
    }), {
      totalRevenue: 0,
      totalExpenses: 0,
      totalNetProfit: 0,
      totalCogs: 0,
      totalGrossProfit: 0,
    });

    // Determine period label
    const sortedData = [...filteredData].sort((a, b) => {
      if (a.rawDate && b.rawDate) return a.rawDate.localeCompare(b.rawDate);
      return 0;
    });
    
    let periodLabel = '';
    if (selectedMonths.length > 0) {
      if (selectedMonths.length === 1) {
        periodLabel = selectedMonths[0];
      } else {
        periodLabel = `${selectedMonths[0]} - ${selectedMonths[selectedMonths.length - 1]}`;
      }
    } else if (filteredData.length === 1) {
      periodLabel = sortedData[0].month;
    } else {
      const firstMonth = sortedData[0].month;
      const lastMonth = sortedData[sortedData.length - 1].month;
      periodLabel = `${firstMonth} - ${lastMonth}`;
    }

    return {
      ...totals,
      periodLabel,
      monthCount: filteredData.length
    };
  }, [filteredData, selectedMonths]);

  // For comparison (previous period) - get data before the filtered period
  const prevPeriodStats = useMemo(() => {
    if (filteredData.length === 0) {
      return { totalExpenses: 0 };
    }

    const sortedData = [...data].sort((a, b) => {
      if (a.rawDate && b.rawDate) return a.rawDate.localeCompare(b.rawDate);
      return 0;
    });

    // Get the date range of filtered data
    const filteredSorted = [...filteredData].sort((a, b) => {
      if (a.rawDate && b.rawDate) return a.rawDate.localeCompare(b.rawDate);
      return 0;
    });

    if (filteredSorted.length === 0) {
      return { totalExpenses: 0 };
    }

    const firstFilteredDate = filteredSorted[0].rawDate || filteredSorted[0].month;
    const monthCount = filteredData.length;

    // Find the month(s) before the filtered period
    const prevData: FinancialData[] = [];
    for (let i = sortedData.length - 1; i >= 0; i--) {
      const item = sortedData[i];
      const itemDate = item.rawDate || item.month;
      
      if (itemDate < firstFilteredDate) {
        prevData.unshift(item);
        if (prevData.length >= monthCount) break;
      }
    }

    const prevTotalExpenses = prevData.reduce((sum, item) => sum + item.cogs + item.expenses, 0);
    return { totalExpenses: prevTotalExpenses };
  }, [filteredData, data]);

  // Strict Calculation Variables for Filtered Period
  const curRevenue = aggregatedStats.totalRevenue;
  const curTotalExpenses = aggregatedStats.totalCogs + aggregatedStats.totalExpenses;
  const curNetProfit = aggregatedStats.totalNetProfit;

  // Metrics for "Big 5"
  const liquidityRatio = curTotalExpenses > 0 ? (curRevenue / curTotalExpenses).toFixed(2) : 'N/A';
  const prevTotalExpenses = prevPeriodStats.totalExpenses;
  const expenseGrowth = prevTotalExpenses > 0 
      ? Math.round(((curTotalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100) 
      : 0;
  
  const grossMargin = curRevenue ? ((aggregatedStats.totalGrossProfit / curRevenue) * 100).toFixed(1) : '0.0';
  const netMargin = curRevenue ? ((curNetProfit / curRevenue) * 100).toFixed(1) : '0.0';

  // Summary object for AI Context
  const overallStats = {
     "Period": aggregatedStats.periodLabel,
     "Revenue": formatCurrency(curRevenue, currency),
     "Total Expenses": formatCurrency(curTotalExpenses, currency),
     "Net Profit": formatCurrency(curNetProfit, currency),
     "Margin": netMargin + "%",
     "Month Count": aggregatedStats.monthCount.toString()
  };

  return (
    <div className="space-y-8 animate-fadeInUp pb-10 max-w-7xl mx-auto">
      
      {/* Month Filter Section */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm space-y-4">
        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-slate-300 font-medium min-w-fit">
            <Filter size={18} className="text-emerald-400" />
            <span className="text-sm">လပိုင်းရွေးချယ်ရန် (Quick Filter):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'thisMonth', label: 'ယခုလ (This Month)' },
              { key: 'lastMonth', label: 'ယခင်လ (Last Month)' },
              { key: 'last3Months', label: 'နောက်ဆုံး ၃ လ (Last 3 Months)' },
              { key: 'last6Months', label: 'နောက်ဆုံး ၆ လ (Last 6 Months)' },
              { key: 'thisYear', label: 'ယခုနှစ် (This Year)' },
              { key: 'allTime', label: 'အားလုံး (All Time)' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => {
                  applyQuickFilter(filter.key as QuickFilter);
                  setSelectedMonths([]);
                }}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  ${selectedQuickFilter === filter.key && selectedMonths.length === 0
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selector */}
        {availableMonths.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
              <Calendar size={16} className="text-emerald-400" />
              <span>လများကို ရွေးချယ်ရန် (Select Months):</span>
            </div>
            <div className="relative month-selector-container">
              <button
                onClick={() => setShowMonthSelector(!showMonthSelector)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-300 bg-slate-800"
              >
                <span>{selectedMonths.length > 0 ? `${selectedMonths.length} လရွေးထားသည်` : 'လများရွေးချယ်ရန်'}</span>
                <ChevronDown size={16} className={`transition-transform ${showMonthSelector ? 'rotate-180' : ''}`} />
              </button>
              
              {showMonthSelector && (
                <div className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-10 p-3 min-w-[200px]">
                  <div className="grid grid-cols-3 gap-2">
                    {availableMonths.map(month => (
                      <button
                        key={month}
                        onClick={() => handleMonthToggle(month)}
                        className={`
                          px-3 py-1.5 text-xs font-medium rounded transition-colors
                          ${selectedMonths.includes(month)
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }
                        `}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                  {selectedMonths.length > 0 && (
                    <button
                      onClick={() => {
                        setSelectedMonths([]);
                        setSelectedQuickFilter('custom');
                      }}
                      className="mt-3 w-full px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded hover:bg-slate-700"
                    >
                      ရှင်းလင်းရန် (Clear)
                    </button>
                  )}
                </div>
              )}
            </div>
            {selectedMonths.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedMonths.map(month => (
                  <span
                    key={month}
                    className="px-2 py-1 bg-emerald-600/20 text-emerald-400 text-xs rounded-full flex items-center gap-1 border border-emerald-600/30"
                  >
                    {month}
                    <button
                      onClick={() => handleMonthToggle(month)}
                      className="hover:text-emerald-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Date Range (shown when custom is selected) */}
        {(selectedQuickFilter === 'custom' || selectedMonths.length === 0) && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-700">
            <div className="flex items-center gap-2 text-slate-300 font-medium text-sm min-w-fit">
              <Calendar size={16} className="text-slate-500" />
              <span>ရက်စွဲအကွာအဝေး (Custom Date Range):</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 sm:flex-none">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedQuickFilter('custom');
                    setSelectedMonths([]);
                  }}
                  className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-300 text-sm bg-slate-800"
                />
                <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
              </div>
              <span className="text-slate-500 font-medium">-</span>
              <div className="relative flex-1 sm:flex-none">
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedQuickFilter('custom');
                    setSelectedMonths([]);
                  }}
                  className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-300 text-sm bg-slate-800"
                />
                <Calendar className="absolute left-3 top-2.5 text-slate-500" size={16} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* SECTION 1: FILTERED PERIOD OVERVIEW (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={64} className="text-blue-500" />
           </div>
           <p className="text-slate-400 text-sm font-medium mb-2 font-padauk uppercase tracking-wider">
             {aggregatedStats.monthCount === 1 ? 'Period Revenue' : 'Total Revenue'}
           </p>
           <h3 className="text-3xl font-bold text-white mb-1">{formatCurrency(curRevenue, currency)}</h3>
           <p className="text-xs text-slate-500">
             {aggregatedStats.periodLabel} {aggregatedStats.monthCount > 1 && `(${aggregatedStats.monthCount} months)`}
           </p>
        </div>

        {/* Total Expenses (Calculated as COGS + OpEx) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ArrowRight size={64} className="text-rose-500 rotate-45" />
           </div>
           <p className="text-slate-400 text-sm font-medium mb-2 font-padauk uppercase tracking-wider">
             {aggregatedStats.monthCount === 1 ? 'Period Expenses' : 'Total Expenses'}
           </p>
           <h3 className="text-3xl font-bold text-rose-400 mb-1">{formatCurrency(curTotalExpenses, currency)}</h3>
           <p className="text-xs text-rose-500/60">Includes COGS & OpEx</p>
        </div>

        {/* Net Profit (Strictly Rev - Exp) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target size={64} className="text-emerald-500" />
           </div>
           <p className="text-slate-400 text-sm font-medium mb-2 font-padauk uppercase tracking-wider">
             {aggregatedStats.monthCount === 1 ? 'Period Profit' : 'Total Net Profit'}
           </p>
           <h3 className="text-3xl font-bold text-emerald-400 mb-1">{formatCurrency(curNetProfit, currency)}</h3>
           <p className="text-xs text-emerald-500/60">Strict Calc: Rev - Total Exp</p>
        </div>
      </div>

      {/* SECTION 2: KEY PERFORMANCE INDICATORS (The "Big 5" Cards) */}
      <div>
         <h3 className="text-lg font-bold text-slate-200 mb-4 font-padauk flex items-center gap-2">
            <Activity size={18} className="text-cyan-400" /> Key Performance Indicators
         </h3>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* 1. Liquidity Ratio */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg">
               <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Scale size={16} />
                  <span className="text-xs font-bold uppercase">Liquidity</span>
               </div>
               <div className="text-xl font-bold text-white">{liquidityRatio}x</div>
               <div className="text-[10px] text-slate-500">Rev / Exp Ratio</div>
            </div>

            {/* 2. Cost Alert */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg">
               <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <AlertOctagon size={16} />
                  <span className="text-xs font-bold uppercase">Cost Alert</span>
               </div>
               <div className={`text-xl font-bold ${expenseGrowth > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {expenseGrowth > 0 ? '+' : ''}{expenseGrowth}%
               </div>
               <div className="text-[10px] text-slate-500">vs Prev Month</div>
            </div>

            {/* 3. Gross Margin */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg">
               <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <PieChartIcon size={16} />
                  <span className="text-xs font-bold uppercase">Gross Margin</span>
               </div>
               <div className="text-xl font-bold text-blue-400">{grossMargin}%</div>
               <div className="text-[10px] text-slate-500">Profit after COGS</div>
            </div>

            {/* 4. Net Margin */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg">
               <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Target size={16} />
                  <span className="text-xs font-bold uppercase">Net Margin</span>
               </div>
               <div className="text-xl font-bold text-emerald-400">{netMargin}%</div>
               <div className="text-[10px] text-slate-500">Final Take Home</div>
            </div>

             {/* 5. Operating Expenses (Metric) */}
             <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 shadow-lg">
               <div className="flex items-center gap-2 mb-2 text-slate-400">
                  <Layers size={16} />
                  <span className="text-xs font-bold uppercase">OpEx Only</span>
               </div>
               <div className="text-xl font-bold text-amber-400">{formatCurrency(aggregatedStats.totalExpenses, currency)}</div>
               <div className="text-[10px] text-slate-500">Excludes COGS</div>
             </div>

         </div>
      </div>

      {/* AI Insight & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* AI Insight Card */}
        <div className="lg:col-span-3 h-auto">
           <AiInsight data={filteredData} lang={lang} currency={currency} summary={overallStats} apiKey={apiKey} />
        </div>

        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-xl text-slate-100 mb-6 flex items-center gap-2 font-padauk"><BarChart3 className="text-slate-500" size={20} /> {t.revVsExp}</h3>
          <div className="h-[350px]">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={filteredData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                {/* Ensure exact formatting */}
                <YAxis width={85} stroke="#64748b" axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val, currency, false)} />
                <Tooltip 
                   cursor={{fill: '#1e293b'}} 
                   contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} 
                   formatter={(value: number) => [formatCurrency(value, currency), '']}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                <Bar name="Revenue" dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Net Profit" dataKey="netProfit" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar name="Expenses" dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                ရွေးချယ်ထားသော ရက်စွဲအတွင်း အချက်အလက်မရှိပါ (No data found)
              </div>
            )}
          </div>
        </div>
        
        {/* Growth Line Chart */}
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-xl text-slate-100 mb-2 flex items-center gap-2 font-padauk"><Target className="text-slate-500" size={20} /> {t.growthTraj}</h3>
          <div className="h-[350px]">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
               <ReLineChart data={filteredData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="month" stroke="#64748b" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} formatter={(val: number) => formatCurrency(val, currency)} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="netProfit" stroke="#10b981" strokeWidth={3} dot={false} />
               </ReLineChart>
            </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">
                ရွေးချယ်ထားသော ရက်စွဲအတွင်း အချက်အလက်မရှိပါ (No data found)
              </div>
            )}
          </div>
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg text-xs text-slate-400">
             <span className="text-blue-400 font-bold">Blue: Revenue</span> | <span className="text-emerald-400 font-bold">Green: Net Profit</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- DATA CONVERTER VIEW (Simplified for this context) ---
const DataConverterView = ({ lang }: { lang: Language }) => {
   return <div className="p-8 text-center text-slate-500">Tool moved to automatic ingestion.</div>
}

// --- MAIN APP SHELL ---
const MainAppShell = ({ 
  data, 
  onReset, 
  lang, 
  setLang, 
  currency, 
  setCurrency, 
  apiKey,
  exchangeRate
}: { 
  data: FinancialData[], 
  onReset: () => void, 
  lang: Language, 
  setLang: (l: Language) => void, 
  currency: Currency, 
  setCurrency: (c: Currency) => void, 
  apiKey: string,
  exchangeRate: number | null
}) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const t = TRANSLATIONS[lang];

  // Calculate Aggregated Data ONCE for use in Dashboard and Charts
  const aggregatedData = useMemo(() => aggregateFinancialData(data), [data]);

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'analytics', label: t.analytics, icon: LineChart },
    { id: 'dataview', label: t.dataView, icon: TableIcon },
    { id: 'chat', label: t.aiAssistant, icon: MessageSquare },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}
      <aside className={`fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
           <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center font-bold text-slate-900">A7</div>
           <span className="font-bold text-lg font-orbitron">FINANCE OS</span>
           <button onClick={() => setIsSidebarOpen(false)} className="ml-auto lg:hidden text-slate-400"><X size={20} /></button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800'}`}>
              <item.icon size={20} />
              <span className="font-medium font-padauk">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'my' : 'en')} className="flex-1 flex items-center justify-center gap-2 px-2 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors border border-slate-700">
               <Globe size={14} />
               <span className="text-xs font-bold">{lang === 'en' ? 'ENG' : 'MYA'}</span>
            </button>
            <button 
              onClick={() => setCurrency(currency === 'MMK' ? 'USD' : 'MMK')} 
              className="flex-1 flex items-center justify-center gap-2 px-2 py-2 bg-slate-800/50 hover:bg-slate-800 rounded-lg text-slate-300 transition-colors border border-slate-700"
              title={exchangeRate ? `1 USD = ${(1/exchangeRate).toLocaleString()} MMK` : 'Loading exchange rate...'}
            >
               {currency === 'MMK' ? <Coins size={14} /> : <DollarSign size={14} />}
               <span className="text-xs font-bold">{currency}</span>
               {exchangeRate && currency === 'USD' && (
                 <span className="text-[10px] text-slate-500">({(1/exchangeRate).toLocaleString()} MMK/$)</span>
               )}
            </button>
          </div>

          <button onClick={onReset} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-padauk">
             <RefreshCcw size={14} /> {t.loadNew}
          </button>
          
          <div className="w-full flex items-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <ShieldCheck size={16} className="text-emerald-500" />
            <div className="flex flex-col">
                <span className="text-xs font-bold text-emerald-400 font-padauk">{t.systemReady}</span>
                <span className="text-[10px] text-emerald-500/60 font-padauk">{t.secureMode}</span>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 lg:ml-72 flex flex-col min-h-screen">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-400"><Menu size={24} /></button>
            <h2 className="text-lg font-bold text-slate-200 hidden sm:block font-padauk">{menuItems.find(m => m.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>LIVE</div>
            <Bell className="text-slate-400 hover:text-white cursor-pointer" size={20} />
          </div>
        </header>
        <div className="p-6 overflow-y-auto">
          {/* Dashboard now uses RAW data for KPIs and Aggregated data for charts */}
          {activeTab === 'dashboard' && <DashboardView data={aggregatedData} rawData={data} lang={lang} currency={currency} apiKey={apiKey} />}
          
          {/* Analytics uses AGGREGATED data for trends, but RAW data for category breakdown */}
          {activeTab === 'analytics' && <AnalyticsView data={aggregatedData} rawData={data} lang={lang} currency={currency} />}
          
          {/* Data View uses RAW data */}
          {activeTab === 'dataview' && <DataTableView data={data} currency={currency} />}

          {/* Chat uses AGGREGATED data context so it understands monthly performance, not just transactions */}
          {activeTab === 'chat' && <AIChatView data={aggregatedData} lang={lang} currency={currency} apiKey={apiKey} />}
          
          {activeTab === 'tools' && <DataConverterView lang={lang} />}
          {activeTab === 'settings' && <div className="flex items-center justify-center h-[60vh] text-slate-500">Settings Module Under Development</div>}
        </div>
      </main>
    </div>
  );
};

// --- MAIN COMPONENT ROOT ---
export default function App() {
  const [financialData, setFinancialData] = useState<FinancialData[]>(MOCK_FINANCIAL_DATA);
  const [language, setLanguage] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('MMK');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoadingRate, setIsLoadingRate] = useState(true);
  
  // Initialize key STRICTLY from Environment Variables
  const apiKey = useMemo(() => getEnvApiKey(), []);
  
  // Fetch exchange rate on mount
  useEffect(() => {
    const fetchRate = async () => {
      try {
        setIsLoadingRate(true);
        const rate = await currencyService.fetchExchangeRate();
        setExchangeRate(rate);
        // Update global rate for formatCurrency function
        globalExchangeRate = rate;
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        // Use fallback rate
        const fallbackRate = 2100;
        setExchangeRate(fallbackRate);
        globalExchangeRate = fallbackRate;
      } finally {
        setIsLoadingRate(false);
      }
    };

    fetchRate();
    
    // Refresh rate every hour
    const interval = setInterval(fetchRate, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  // App always starts at 'UPLOAD' (or Dashboard if mock data desired)
  const [appState, setAppState] = useState<AppState>('UPLOAD');
  
  const handleReset = () => {
     setFinancialData(MOCK_FINANCIAL_DATA);
     setAppState('UPLOAD');
  }
  
  const handleFileDrop = async (file: File) => {
    setAppState('ANALYZING');
    
    // Fallback: If no API key, we can't do AI analysis.
    // In a real app, we might fall back to regex parsing here.
    if (!apiKey) {
       console.warn("No API Key found. Skipping AI Analysis.");
       alert("API Key missing. Cannot perform AI structural analysis on this file.");
       setAppState('UPLOAD');
       return;
    }

    try {
      const buffer = await file.arrayBuffer();
      // @ts-ignore
      const workbook = read(buffer, { cellDates: true });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      
      // 1. HEURISTIC HEADER DETECTION
      // Read first 20 rows
      // @ts-ignore
      const rawRows = utils.sheet_to_json(ws, { header: 1, range: 0, raw: true }) as any[][];
      let headerRowIndex = 0;
      let maxStrings = 0;
      
      rawRows.slice(0, 20).forEach((row, idx) => {
          if (!row) return;
          const strCount = row.filter((c: any) => typeof c === 'string' && c.trim().length > 0).length;
          if (strCount > maxStrings) {
              maxStrings = strCount;
              headerRowIndex = idx;
          }
      });

      console.log(`Detected Header Row at index: ${headerRowIndex}`);

      // 2. PARSE DATA FROM DETECTED HEADER
      // @ts-ignore
      const jsonData = utils.sheet_to_json(ws, { range: headerRowIndex, raw: false });

      if (!jsonData || jsonData.length === 0) {
          throw new Error("Empty file or invalid format");
      }
      
      const headers = Object.keys(jsonData[0] as object);
      const sampleData = jsonData.slice(0, 5); // Take 5 rows for AI context

      // 3. AI STRATEGY DETECTION PROMPT (OpenAI Version)
      const openai = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

      const prompt = `
        You are a Senior Data Engineer. Analyze this financial dataset structure.
        Headers: ${JSON.stringify(headers)}
        Sample Rows: ${JSON.stringify(sampleData)}

        I need to extract: Date, Description, Revenue (Money In), Expense (Money Out), COGS (optional), Category.

        Determine the financial structure strategy:
        1. "separate_cols": Has distinct columns for Revenue and Expense.
        2. "type_col": Has one 'Amount' column and a 'Type' column (e.g. Type: "Income" vs "Expense").
        3. "signed_amount": Has one 'Amount' column where Positive = Income, Negative = Expense.

        Return JSON Config ONLY (No markdown):
        {
           "strategy": "separate_cols" | "type_col" | "signed_amount",
           "date_col": "exact header name for date",
           "description_col": "header name for description, memo, or details",
           "category_col": "exact header name for category (or null)",
           
           // IF separate_cols:
           "revenue_col": "header name for income",
           "expense_col": "header name for expense",
           "cogs_col": "header name for COGS (optional, else null)",
           
           // IF type_col or signed_amount:
           "amount_col": "header name for amount",
           
           // IF type_col:
           "type_col": "header name for type",
           "revenue_values": ["Income", "Credit", "Sale"],
           "expense_values": ["Expense", "Debit", "Purchase"],
           
           // IF signed_amount:
           "negative_is_expense": boolean
        }
      `;
      
      const response = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            { role: "system", content: "You are a Senior Data Engineer. Return JSON only." },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
      });

      const config = JSON.parse(response.choices[0].message.content || "{}");
      console.log("AI Strategy Config:", config);

      // 4. APPLY STRATEGY TO PARSE DATA
      const parsedData = jsonData.map((row: any) => {
        let revenue = 0;
        let expense = 0;
        let cogs = 0;
        
        const categoryRaw = getCellValue(row, config.category_col);
        let category = categoryRaw ? String(categoryRaw) : "General";
        
        const descriptionRaw = getCellValue(row, config.description_col);
        const description = descriptionRaw ? String(descriptionRaw) : (category !== "General" ? category : "Transaction");

        const dateRaw = getCellValue(row, config.date_col);
        const dateVal = dateRaw !== undefined ? dateRaw : "N/A";

        // Filter out Total rows
        const dateStr = String(dateVal).toLowerCase();
        if (dateStr.includes('total') || dateStr.includes('subtotal') || dateStr.includes('sum')) {
            return null;
        }
        const firstColVal = Object.values(row)[0];
        if (typeof firstColVal === 'string' && (firstColVal.toLowerCase().includes('total') || firstColVal.toLowerCase().includes('grand'))) {
           return null;
        }

        // STRATEGY 1: SEPARATE COLUMNS
        if (config.strategy === 'separate_cols') {
            const revRaw = getCellValue(row, config.revenue_col);
            revenue = parseFinancialValue(revRaw);
            
            const expRaw = getCellValue(row, config.expense_col);
            expense = Math.abs(parseFinancialValue(expRaw)); 
            
            const cogsRaw = getCellValue(row, config.cogs_col);
            cogs = cogsRaw ? Math.abs(parseFinancialValue(cogsRaw)) : 0;
        } 
        // STRATEGY 2: TYPE COLUMN
        else if (config.strategy === 'type_col') {
            const amtRaw = getCellValue(row, config.amount_col);
            const amount = parseFinancialValue(amtRaw);
            
            const typeRaw = getCellValue(row, config.type_col);
            const type = String(typeRaw || "").toLowerCase();
            
            const isRev = config.revenue_values?.some((v: string) => type.includes(v.toLowerCase()));
            const isExp = config.expense_values?.some((v: string) => type.includes(v.toLowerCase()));
            
            if (isRev) revenue = Math.abs(amount);
            if (isExp) expense = Math.abs(amount);
        } 
        // STRATEGY 3: SIGNED AMOUNT
        else if (config.strategy === 'signed_amount') {
            const amtRaw = getCellValue(row, config.amount_col);
            const amount = parseFinancialValue(amtRaw);
            if (config.negative_is_expense) {
                if (amount < 0) expense = Math.abs(amount);
                else revenue = amount;
            } else {
                if (amount > 0) expense = amount;
                else revenue = Math.abs(amount);
            }
        }

        const grossProfit = revenue - cogs;
        const netProfit = grossProfit - expense;

        return {
          month: dateVal,
          description,
          revenue,
          cogs,
          grossProfit,
          expenses: expense,
          netProfit,
          category,
          rawRow: row 
        };
      })
      .filter((d) => d !== null)
      .filter((d: any) => d.revenue !== 0 || d.expenses !== 0 || d.cogs !== 0);

      if (parsedData.length > 0) {
        setFinancialData(parsedData);
        handleAnalysisComplete();
      } else {
          console.error("AI Config mapped everything to 0. Config:", config);
          alert("Parsed successfully but no valid financial data found. Please check if column names match.");
          throw new Error("Parsing resulted in no data");
      }

    } catch (error: any) {
      console.error("Error parsing file:", error);
      alert("Cannot interpret file. Please ensure it has Date, Description, and Amount columns.");
      setAppState('UPLOAD');
    }
  };
  
  const handleAnalysisComplete = () => setAppState('DASHBOARD');
  const handleSkip = () => setAppState('DASHBOARD');

  return (
    <div className="text-slate-200 font-sans antialiased">
      {appState === 'UPLOAD' && <SmartUploadView onFileDrop={handleFileDrop} onSkip={handleSkip} lang={language} apiKey={apiKey} />}
      {appState === 'ANALYZING' && <AnalyzingView lang={language} />}
      {appState === 'DASHBOARD' && <MainAppShell data={financialData} onReset={handleReset} lang={language} setLang={setLanguage} currency={currency} setCurrency={setCurrency} apiKey={apiKey} exchangeRate={exchangeRate} />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Padauk:wght@400;700&display=swap');
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
        .font-padauk { font-family: 'Padauk', sans-serif; }
        .font-orbitron { font-family: 'Orbitron', sans-serif; }
        /* Hide scrollbar for Chrome, Safari and Opera */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        /* Hide scrollbar for IE, Edge and Firefox */
        .scrollbar-hide { -ms-overflow-style: none;  scrollbar-width: none; }
      `}</style>
    </div>
  );
}