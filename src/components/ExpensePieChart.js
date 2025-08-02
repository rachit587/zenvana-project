// src/components/ExpensePieChart.js

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatIndianCurrency = (num) => {
    if (typeof num !== 'number') num = parseFloat(num || 0);
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return formatter.format(num);
};

const ExpensePieChart = ({ expenses }) => {
  const chartData = Object.entries(expenses || {})
    .map(([key, value]) => ({ 
        name: key.charAt(0).toUpperCase() + key.slice(1), 
        value: parseFloat(value || 0) 
    }))
    .filter(item => item.value > 0);
    
  const COLORS = ['#10B981', '#FBBF24', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6', '#F59E0B', '#6366F1', '#D946EF'];

  if (chartData.length === 0) { 
      return ( 
        <div className="bg-gray-800 p-5 rounded-xl flex items-center justify-center h-full min-h-[300px]">
            <p className="text-gray-400">No expense data to display.</p>
        </div> 
      );
  }

  return (
    <div className="bg-gray-800 p-5 rounded-xl h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie 
            data={chartData} 
            cx="50%" 
            cy="50%" 
            labelLine={false} 
            outerRadius={120} 
            fill="#8884d8" 
            dataKey="value" 
            nameKey="name" 
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1F2B37', borderColor: '#374151', color: '#F9FAFB' }} 
            formatter={(value) => `${formatIndianCurrency(value)}`} 
          />
          <Legend wrapperStyle={{ color: '#D1D5DB' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ExpensePieChart;
