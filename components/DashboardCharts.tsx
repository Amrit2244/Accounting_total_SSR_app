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
      <div className="bg-white p-6 border border-gray-300 shadow-sm rounded-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">
          Sales vs Purchase Performance
        </h3>
        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
              <Legend />
              <Bar
                dataKey="sales"
                name="Total Sales"
                fill="#003366"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
              <Bar
                dataKey="purchase"
                name="Total Purchase"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CHART 2: Cash Flow Trend (Area) */}
      {/* Uses same data but visualizes 'Sales' as generic 'Inflow' trend for visual variety */}
      <div className="bg-white p-6 border border-gray-300 shadow-sm rounded-sm">
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-4">
          Revenue Trend Line
        </h3>
        <div className="h-[300px] w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004b8d" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#004b8d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="sales"
                stroke="#004b8d"
                fillOpacity={1}
                fill="url(#colorSales)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
