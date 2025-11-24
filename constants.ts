import { MonthlyData, ExpenseCategory, KPIMetrics } from './types';

// Mock Financial Data for a Myanmar Trading Company
export const MOCK_MONTHLY_DATA: MonthlyData[] = [
  { name: 'Jan', income: 12000000, expense: 8500000, profit: 3500000 },
  { name: 'Feb', income: 11500000, expense: 9000000, profit: 2500000 },
  { name: 'Mar', income: 14000000, expense: 8800000, profit: 5200000 },
  { name: 'Apr', income: 10500000, expense: 7500000, profit: 3000000 },
  { name: 'May', income: 15500000, expense: 9500000, profit: 6000000 },
  { name: 'Jun', income: 18000000, expense: 10000000, profit: 8000000 },
];

export const MOCK_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { name: 'ဝန်ထမ်းလစာ (Salary)', value: 4500000, color: '#f43f5e' }, // Rose 500
  { name: 'ဆိုင်ခန်းငှားရမ်းခ (Rent)', value: 2000000, color: '#8b5cf6' }, // Violet 500
  { name: 'ကုန်ပစ္စည်း (Inventory)', value: 2500000, color: '#f59e0b' }, // Amber 500
  { name: 'အထွေထွေ (General)', value: 1000000, color: '#64748b' }, // Slate 500
];

export const MOCK_KPIS: KPIMetrics = {
  totalRevenue: 81500000,
  totalExpense: 53300000,
  netProfit: 28200000,
  revenueGrowth: 16.5,
  expenseGrowth: 5.2,
};

export const AI_INSIGHT_BURMESE = `
လုပ်ငန်း၏ ငွေကြေးအခြေအနေကို သုံးသပ်ချက် -

၁။ ယခုလတွင် ဝင်ငွေသည် ယခင်လထက် ၁၆.၅% တိုးတက်လာသည်ကို တွေ့ရပါသည်။
၂။ အသားတင်အမြတ်ငွေမှာ ကျေနပ်ဖွယ်ရာ အနေအထားတွင် ရှိနေသော်လည်း၊ ဝန်ထမ်းလစာစရိတ်သည် စုစုပေါင်းကုန်ကျစရိတ်၏ ၄၅% ခန့် ဖြစ်နေသဖြင့် သတိပြုသင့်ပါသည်။
၃။ လာမည့်လတွင် အရောင်းမြှင့်တင်ရေး (Marketing) အတွက် ပိုမိုရင်းနှီးမြှုပ်နှံရန် အကြံပြုအပ်ပါသည်။
`;

export const AI_INSIGHT_TITLE = "Shwe AI သုံးသပ်ချက်";