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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* CHART 1: Sales vs Purchase (Bar) */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
          Revenue vs Expense Performance
        </h3>
        <div className="h-[300px] w-full text-xs font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
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
                tick={{ fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: "#0f172a",
                  color: "#fff",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                }}
                itemStyle={{ color: "#fff" }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{
                  paddingBottom: "20px",
                  fontSize: "10px",
                  textTransform: "uppercase",
                }}
              />
              <Bar
                dataKey="sales"
                name="Revenue"
                fill="#3b82f6"
                radius={[6, 6, 0, 0]}
                barSize={12}
              />
              <Bar
                dataKey="purchase"
                name="Expense"
                fill="#f43f5e"
                radius={[6, 6, 0, 0]}
                barSize={12}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: Cash Flow Trend (Area) */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm rounded-2xl">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">
          Inflow Trend Line
        </h3>
        <div className="h-[300px] w-full text-xs font-bold">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
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
                tick={{ fill: "#94a3b8" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8" }}
              />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sales"
                name="Revenue Inflow"
                stroke="#3b82f6"
                fillOpacity={1}
                fill="url(#colorSales)"
                strokeWidth={4}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
