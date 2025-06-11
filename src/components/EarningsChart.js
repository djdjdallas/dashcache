'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function EarningsChart({ earnings }) {
  // Group earnings by month
  const monthlyData = earnings.reduce((acc, earning) => {
    const date = new Date(earning.earned_at)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month: monthKey,
        earnings: 0,
        count: 0
      }
    }
    
    acc[monthKey].earnings += parseFloat(earning.amount || 0)
    acc[monthKey].count += 1
    
    return acc
  }, {})

  // Convert to array and sort by month
  const chartData = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(item => ({
      ...item,
      monthDisplay: new Date(item.month + '-01').toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      })
    }))

  if (chartData.length === 0) {
    return (
      <div className=\"h-64 flex items-center justify-center text-gray-500\">\n        No earnings data to display\n      </div>\n    )\n  }

  return (
    <div className=\"h-64\">\n      <ResponsiveContainer width=\"100%\" height=\"100%\">\n        <LineChart data={chartData}>\n          <CartesianGrid strokeDasharray=\"3 3\" />\n          <XAxis \n            dataKey=\"monthDisplay\" \n            tick={{ fontSize: 12 }}\n          />\n          <YAxis \n            tick={{ fontSize: 12 }}\n            tickFormatter={(value) => `$${value}`}\n          />\n          <Tooltip \n            formatter={(value, name) => [`$${value.toFixed(2)}`, 'Earnings']}\n            labelFormatter={(label) => `Month: ${label}`}\n          />\n          <Line \n            type=\"monotone\" \n            dataKey=\"earnings\" \n            stroke=\"#3B82F6\" \n            strokeWidth={2}\n            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}\n          />\n        </LineChart>\n      </ResponsiveContainer>\n    </div>\n  )\n}