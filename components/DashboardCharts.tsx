"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function DashboardCharts({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* CHART 1: Revenue Bar */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl h-[350px] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <BarChart3 size={18} />
          </div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Performance Overview
          </h3>
        </div>

        <div className="flex-1 w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "8px 12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
                itemStyle={{ paddingBottom: "2px" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  paddingBottom: "20px",
                  fontSize: "10px",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  color: "#64748b",
                }}
              />
              <Bar
                dataKey="sales"
                name="Income"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
              <Bar
                dataKey="purchase"
                name="Expense"
                fill="#f43f5e"
                radius={[4, 4, 0, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: Inflow Area */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl h-[350px] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <TrendingUp size={18} />
          </div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Cash Flow Trend
          </h3>
        </div>

        <div className="flex-1 w-full text-[10px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(value) => `${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: "600",
                  padding: "8px 12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Net Inflow"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorSales)"
                strokeWidth={3}
                activeDot={{ r: 6, strokeWidth: 0, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
