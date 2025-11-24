import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, TooltipProps
} from 'recharts';
import { MonthlyData, ExpenseCategory } from '../../types';

interface ChartProps {
  monthlyData: MonthlyData[];
  expenseCategories: ExpenseCategory[];
}

const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toString();
};

// Custom Tooltip Component for a more polished, animated look
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-3 border border-slate-100 shadow-xl rounded-xl ring-1 ring-slate-100 transform transition-all duration-200">
        {label && <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">{label}</p>}
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-slate-600 font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-slate-800 font-mono">
                {entry.value?.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">MMK</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const IncomeExpenseBarChart: React.FC<Pick<ChartProps, 'monthlyData'>> = ({ monthlyData }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        key={JSON.stringify(monthlyData)} // Force re-animation on data change
        data={monthlyData} 
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94a3b8', fontSize: 11 }} 
          tickFormatter={formatCurrency}
        />
        <Tooltip 
          cursor={{ fill: '#f8fafc', opacity: 0.8 }}
          content={<CustomChartTooltip />}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} 
          iconType="circle"
        />
        <Bar 
          name="ဝင်ငွေ (Income)" 
          dataKey="income" 
          fill="#10b981" 
          radius={[6, 6, 0, 0]} 
          barSize={24} 
          animationDuration={1000}
          animationEasing="ease-out"
        />
        <Bar 
          name="ထွက်ငွေ (Expense)" 
          dataKey="expense" 
          fill="#f43f5e" 
          radius={[6, 6, 0, 0]} 
          barSize={24} 
          animationDuration={1000}
          animationEasing="ease-out"
          animationBegin={150} // Slight stagger
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const ProfitTrendLineChart: React.FC<Pick<ChartProps, 'monthlyData'>> = ({ monthlyData }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart 
        key={JSON.stringify(monthlyData)} // Force re-animation on data change
        data={monthlyData} 
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }} 
          dy={10}
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#94a3b8', fontSize: 11 }} 
          tickFormatter={formatCurrency}
        />
        <Tooltip content={<CustomChartTooltip />} />
        <Line 
          name="အသားတင်အမြတ် (Profit)"
          type="monotone" 
          dataKey="profit" 
          stroke="#6366f1" 
          strokeWidth={3} 
          dot={{ fill: '#6366f1', r: 4, strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 7, stroke: '#818cf8', strokeWidth: 4 }}
          animationDuration={1200}
          animationEasing="ease-in-out"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const CategoryPieChart: React.FC<Pick<ChartProps, 'expenseCategories'>> = ({ expenseCategories }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart key={JSON.stringify(expenseCategories)}>
        <Pie
          data={expenseCategories as any}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
          animationDuration={800}
          animationEasing="ease-out"
          stroke="none"
        >
          {expenseCategories.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomChartTooltip />} />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right" 
          wrapperStyle={{ fontSize: '12px', opacity: 0.8 }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
};