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

export default function DashboardCharts({ data }: { data: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
      {/* CHART 1: Revenue Bar */}
      <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-xl h-[300px] flex flex-col">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">
          Performance Overview
        </h3>
        <div className="flex-1 w-full text-[9px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
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
                tick={{ fill: "#94a3b8", fontSize: 9 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 9 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#1e293b",
                  color: "#fff",
                  fontSize: "10px",
                  padding: "8px",
                }}
                itemStyle={{ color: "#fff" }}
                cursor={{ fill: "#f8fafc" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={6}
                wrapperStyle={{
                  paddingBottom: "10px",
                  fontSize: "9px",
                  textTransform: "uppercase",
                  fontWeight: 800,
                }}
              />
              <Bar
                dataKey="sales"
                name="Income"
                fill="#3b82f6"
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="purchase"
                name="Expense"
                fill="#f43f5e"
                radius={[2, 2, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: Inflow Area */}
      <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-xl h-[300px] flex flex-col">
        <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">
          Cash Flow Trend
        </h3>
        <div className="flex-1 w-full text-[9px] font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                tick={{ fill: "#94a3b8", fontSize: 9 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 9 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#1e293b",
                  color: "#fff",
                  fontSize: "10px",
                }}
              />
              <Area
                type="monotone"
                dataKey="sales"
                name="Inflow"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSales)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
