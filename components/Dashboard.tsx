import React, { useRef, useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Download, Loader2, Calendar, Filter, ChevronDown } from 'lucide-react';
import { MOCK_MONTHLY_DATA, MOCK_EXPENSE_CATEGORIES, MOCK_KPIS } from '../constants';
import { IncomeExpenseBarChart, ProfitTrendLineChart, CategoryPieChart } from './charts/FinancialCharts';
import AiInsight from './AiInsight';
// @ts-ignore
import html2canvas from 'html2canvas';
// @ts-ignore
import { jsPDF } from 'jspdf';

interface DashboardProps {
  apiKey: string;
}

type QuickFilter = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'allTime' | 'custom';

const Dashboard: React.FC<DashboardProps> = ({ apiKey }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Date Filter State
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-06-30`);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<QuickFilter>('last6Months');
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [showMonthSelector, setShowMonthSelector] = useState(false);

  // Helper to parse month name to date for current year
  const getMonthDate = (monthName: string, year: number) => {
    const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
    if (monthIndex === -1) return new Date(year, 0, 1); // Default fallback
    return new Date(year, monthIndex, 15); // Use mid-month to avoid timezone edge cases
  };

  // Get all available months from data
  const availableMonths = useMemo(() => {
    return MOCK_MONTHLY_DATA.map(item => item.name);
  }, []);

  // Helper functions for quick filters
  const applyQuickFilter = (filter: QuickFilter) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    let start: Date;
    let end: Date = new Date(currentYear, currentMonth, 1);
    end.setHours(23, 59, 59, 999);

    switch (filter) {
      case 'thisMonth':
        start = new Date(currentYear, currentMonth, 1);
        break;
      case 'lastMonth':
        start = new Date(currentYear, currentMonth - 1, 1);
        end = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
        break;
      case 'last3Months':
        start = new Date(currentYear, currentMonth - 3, 1);
        break;
      case 'last6Months':
        start = new Date(currentYear, currentMonth - 6, 1);
        break;
      case 'thisYear':
        start = new Date(currentYear, 0, 1);
        break;
      case 'allTime':
        // Get earliest and latest dates from data
        const allDates = MOCK_MONTHLY_DATA.map(item => getMonthDate(item.name, currentYear));
        start = new Date(Math.min(...allDates.map(d => d.getTime())));
        end = new Date(Math.max(...allDates.map(d => d.getTime())));
        end.setHours(23, 59, 59, 999);
        break;
      default:
        return; // Keep current dates for 'custom'
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
    setSelectedQuickFilter(filter);
  };

  // Initialize with last6Months filter
  React.useEffect(() => {
    applyQuickFilter('last6Months');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close month selector when clicking outside
  React.useEffect(() => {
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

  // Filter Data based on Date Range or Selected Months
  const filteredData = useMemo(() => {
    // If specific months are selected, filter by month names
    if (selectedMonths.length > 0) {
      return MOCK_MONTHLY_DATA.filter(item => selectedMonths.includes(item.name));
    }

    // Otherwise, use date range filter
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);

    return MOCK_MONTHLY_DATA.filter(item => {
      const itemDate = getMonthDate(item.name, currentYear);
      return itemDate >= start && itemDate <= end;
    });
  }, [startDate, endDate, currentYear, selectedMonths]);

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

  // Clear month selection and use date range
  const handleClearMonthSelection = () => {
    setSelectedMonths([]);
    setSelectedQuickFilter('custom');
  };

  // Recalculate KPIs based on filtered data
  const calculatedKPIs = useMemo(() => {
    return filteredData.reduce((acc, curr) => ({
      totalRevenue: acc.totalRevenue + curr.income,
      totalExpense: acc.totalExpense + curr.expense,
      netProfit: acc.netProfit + curr.profit
    }), { totalRevenue: 0, totalExpense: 0, netProfit: 0 });
  }, [filteredData]);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;

    try {
      setIsExporting(true);
      
      // Use html2canvas to take a screenshot of the dashboard
      // We scale it up for better resolution in the PDF
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true, // Essential for external images/fonts if any
        logging: false,
        backgroundColor: '#f8fafc', // Ensure background is captured correctly
        ignoreElements: (element: HTMLElement) => element.id === 'download-action-btn' // Don't include the button itself
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF (A4 Portrait)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      
      // Calculate image dimensions to fit A4 width
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      pdf.save('ShweFinance_Report.pdf');

    } catch (error) {
      console.error("Export failed:", error);
      alert("PDF ထုတ်ယူ၍မရပါ (Export Failed)");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div ref={dashboardRef} className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500 text-sm">Overview of your financial performance</p>
        </div>
        <button 
          id="download-action-btn"
          onClick={handleExportPDF}
          disabled={isExporting}
          className={`
            flex items-center justify-center gap-2 bg-white border border-slate-200 
            hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors 
            text-sm font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed
          `}
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin text-emerald-600" />
          ) : (
            <Download size={16} />
          )}
          <span>{isExporting ? 'PDF ထုတ်ယူနေသည်...' : 'Report ဒေါင်းလုပ်ဆွဲရန်'}</span>
        </button>
      </div>

      {/* Month Filter Section */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-4">
        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-slate-700 font-medium min-w-fit">
            <Filter size={18} className="text-emerald-600" />
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
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Month Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 font-medium text-sm">
            <Calendar size={16} className="text-emerald-600" />
            <span>လများကို ရွေးချယ်ရန် (Select Months):</span>
          </div>
          <div className="relative month-selector-container">
            <button
              onClick={() => setShowMonthSelector(!showMonthSelector)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700"
            >
              <span>{selectedMonths.length > 0 ? `${selectedMonths.length} လရွေးထားသည်` : 'လများရွေးချယ်ရန်'}</span>
              <ChevronDown size={16} className={`transition-transform ${showMonthSelector ? 'rotate-180' : ''}`} />
            </button>
            
            {showMonthSelector && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10 p-3 min-w-[200px]">
                <div className="grid grid-cols-3 gap-2">
                  {availableMonths.map(month => (
                    <button
                      key={month}
                      onClick={() => handleMonthToggle(month)}
                      className={`
                        px-3 py-1.5 text-xs font-medium rounded transition-colors
                        ${selectedMonths.includes(month)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }
                      `}
                    >
                      {month}
                    </button>
                  ))}
                </div>
                {selectedMonths.length > 0 && (
                  <button
                    onClick={handleClearMonthSelection}
                    className="mt-3 w-full px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 border border-slate-200 rounded hover:bg-slate-50"
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
                  className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full flex items-center gap-1"
                >
                  {month}
                  <button
                    onClick={() => handleMonthToggle(month)}
                    className="hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Custom Date Range (shown when custom is selected) */}
        {(selectedQuickFilter === 'custom' || selectedMonths.length === 0) && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 font-medium text-sm min-w-fit">
              <Calendar size={16} className="text-slate-400" />
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
                  className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 text-sm"
                />
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
              <span className="text-slate-400 font-medium">-</span>
              <div className="relative flex-1 sm:flex-none">
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedQuickFilter('custom');
                    setSelectedMonths([]);
                  }}
                  className="w-full sm:w-auto pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600 text-sm"
                />
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              +{MOCK_KPIS.revenueGrowth}%
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-1">စုစုပေါင်း ဝင်ငွေ (Total Revenue)</p>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            {calculatedKPIs.totalRevenue.toLocaleString()} <span className="text-base font-normal text-slate-400">MMK</span>
          </h3>
        </div>

        {/* Expense Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-rose-50 rounded-lg">
              <TrendingDown className="text-rose-500" size={24} />
            </div>
            <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
              +{MOCK_KPIS.expenseGrowth}%
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-1">စုစုပေါင်း ထွက်ငွေ (Total Expense)</p>
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            {calculatedKPIs.totalExpense.toLocaleString()} <span className="text-base font-normal text-slate-400">MMK</span>
          </h3>
        </div>

        {/* Profit Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Wallet className="text-indigo-600" size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-sm mb-1">အသားတင်အမြတ် (Net Profit)</p>
          <h3 className="text-2xl font-bold text-indigo-900 tracking-tight">
            {calculatedKPIs.netProfit.toLocaleString()} <span className="text-base font-normal text-slate-400">MMK</span>
          </h3>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">ဝင်ငွေ နှင့် ထွက်ငွေ နှိုင်းယှဉ်ချက်</h3>
            {filteredData.length > 0 ? (
              <IncomeExpenseBarChart monthlyData={filteredData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                ရွေးချယ်ထားသော ရက်စွဲအတွင်း အချက်အလက်မရှိပါ (No data found)
              </div>
            )}
          </div>

          {/* Line Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6">အမြတ်ရရှိမှုနှုန်း (Profit Trend)</h3>
            {filteredData.length > 0 ? (
              <ProfitTrendLineChart monthlyData={filteredData} />
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-400">
                ရွေးချယ်ထားသော ရက်စွဲအတွင်း အချက်အလက်မရှိပါ (No data found)
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Pie Chart & AI Insight */}
        <div className="space-y-6">
          
          {/* AI Insight Box */}
          <AiInsight 
            data={filteredData.map(item => ({
              month: item.name,
              revenue: item.income,
              expenses: item.expense,
              netProfit: item.profit
            }))}
            lang="my"
            currency="MMK"
            apiKey={apiKey}
          />

          {/* Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-fit">
            <h3 className="font-bold text-slate-800 mb-2">ကုန်ကျစရိတ် ခွဲခြမ်းစိတ်ဖြာမှု</h3>
            <CategoryPieChart expenseCategories={MOCK_EXPENSE_CATEGORIES} />
            {/* Custom Legend for Pie Chart for better mobile view */}
            <div className="mt-4 space-y-2">
              {MOCK_EXPENSE_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-slate-600">{cat.name}</span>
                  </div>
                  <span className="font-medium text-slate-800">{((cat.value / MOCK_KPIS.totalExpense) * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;