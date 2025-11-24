export interface MonthlyData {
  name: string; // Month name in Burmese/English
  income: number;
  expense: number;
  profit: number;
}

export interface ExpenseCategory {
  name: string;
  value: number;
  color: string;
}

export interface KPIMetrics {
  totalRevenue: number;
  totalExpense: number;
  netProfit: number;
  revenueGrowth: number; // Percentage
  expenseGrowth: number; // Percentage
}

export enum ViewState {
  UPLOAD = 'UPLOAD',
  DASHBOARD = 'DASHBOARD',
}