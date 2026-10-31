"use client";

import React, { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Sector,
} from "recharts";
import {
  TrendingUp,
  Ship,
  Plane,
  Truck,
  Layers,
  DollarSign,
  Package,
  ArrowUpRight,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Calendar,
} from "lucide-react";

// Format IDR currency
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Compact format for charts (Jt, Miliar)
export function formatCompactIDR(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}Jt`;
  }
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export interface MonthlyDataPoint {
  month: string;
  year: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  marginPercent: number;
  shipments: number;
  isCurrent: boolean;
}

export interface MultimodalDataPoint {
  name: string;
  key: string;
  value: number;
  count: number;
  percentage: number;
  color: string;
  iconName: "sea" | "air" | "inland";
}

interface DashboardChartsProps {
  monthlyData: MonthlyDataPoint[];
  multimodalData: MultimodalDataPoint[];
  totalRevenue: number;
  totalGrossProfit: number;
  totalShipments: number;
}

// Custom Interactive Tooltip for Revenue / Profit Area Chart
function RevenueTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload as MonthlyDataPoint;
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl text-white min-w-[210px] animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 mb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-violet-400" />
            {data.month} {data.year}
          </span>
          {data.isCurrent && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Bulan Berjalan
            </span>
          )}
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-violet-400" />
              Omset (AR):
            </span>
            <span className="font-bold text-violet-300 font-mono">
              {formatIDR(data.revenue)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Laba Bersih:
            </span>
            <span className="font-bold text-emerald-300 font-mono">
              {formatIDR(data.grossProfit)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Hutang Vendor (COGS):
            </span>
            <span className="font-semibold text-rose-300 font-mono">
              {formatIDR(data.cogs)}
            </span>
          </div>

          <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Margin / Volume:</span>
            <span className="font-bold text-amber-300">
              {data.marginPercent}% · {data.shipments} BL
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Active Shape for Donut Chart on Hover
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        className="transition-all duration-300"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 11}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

export function DashboardInteractiveCharts({
  monthlyData,
  multimodalData,
  totalRevenue,
  totalGrossProfit,
  totalShipments,
}: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"revenue" | "volume" | "cashflow">("revenue");
  const [activeDonutIndex, setActiveDonutIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200 dark:border-white/[0.08] h-96 animate-pulse flex items-center justify-center text-slate-400 text-xs">
          Memuat Grafik Finansial &amp; Operasional Database...
        </div>
        <div className="lg:col-span-4 bg-white dark:bg-[#121620] p-6 rounded-3xl border border-slate-200 dark:border-white/[0.08] h-96 animate-pulse flex items-center justify-center text-slate-400 text-xs">
          Memuat Distribusi Multimoda...
        </div>
      </div>
    );
  }

  const activeDonut = multimodalData[activeDonutIndex] || multimodalData[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 min-w-0">
      {/* ==================================================================== */}
      {/* 1. MAIN INTERACTIVE REVENUE & AR/AP ANALYTICS (8 COLS) */}
      {/* ==================================================================== */}
      <div className="lg:col-span-8 bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors min-w-0 overflow-hidden flex flex-col justify-between">
        <div>
          {/* Header & Interactive View Switcher Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/[0.08] gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-300">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Tren Performa Keuangan &amp; Arus Kas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live PostgreSQL
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
                Visualisasi dinamis omset piutang (AR) vs hutang carrier (AP) &amp; volume shipment
              </p>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 self-start sm:self-auto">
              <button
                onClick={() => setActiveTab("revenue")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "revenue"
                    ? "bg-white dark:bg-[#1e2433] text-violet-600 dark:text-violet-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Omset &amp; Laba</span>
              </button>

              <button
                onClick={() => setActiveTab("volume")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "volume"
                    ? "bg-white dark:bg-[#1e2433] text-violet-600 dark:text-violet-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Package className="h-3.5 w-3.5" />
                <span>Volume BL</span>
              </button>

              <button
                onClick={() => setActiveTab("cashflow")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === "cashflow"
                    ? "bg-white dark:bg-[#1e2433] text-violet-600 dark:text-violet-300 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>AR vs AP</span>
              </button>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="mt-4 sm:mt-6 w-full h-[280px] sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "revenue" ? (
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-white/[0.06]"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactIDR(val).replace("Rp ", "")}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Omset (AR)"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="grossProfit"
                    name="Gross Margin"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#profitGradient)"
                    isAnimationActive={true}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              ) : activeTab === "volume" ? (
                <BarChart
                  data={monthlyData}
                  margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-white/[0.06]"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar
                    dataKey="shipments"
                    name="Jumlah Shipment"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1000}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isCurrent ? "#8b5cf6" : "#c7d2fe"}
                        className="hover:opacity-80 transition-opacity"
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={monthlyData}
                  margin={{ top: 12, right: 12, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-100 dark:text-white/[0.06]"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatCompactIDR(val).replace("Rp ", "")}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar
                    dataKey="revenue"
                    name="Piutang (AR)"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                  <Bar
                    dataKey="cogs"
                    name="Hutang Vendor (AP)"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={1000}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Footer Aggregations */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-start p-2.5 sm:p-0 rounded-xl bg-slate-50/70 sm:bg-transparent dark:bg-white/[0.02] sm:dark:bg-transparent">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Omset (Gross AR)</span>
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
              {formatIDR(totalRevenue)}
            </span>
          </div>
          <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-start p-2.5 sm:p-0 rounded-xl bg-slate-50/70 sm:bg-transparent dark:bg-white/[0.02] sm:dark:bg-transparent">
            <span className="text-[10px] uppercase font-bold text-slate-400">Gross Margin (Laba Kotor)</span>
            <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              {formatIDR(totalGrossProfit)}
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="flex sm:flex-col justify-between sm:justify-start items-center sm:items-start p-2.5 sm:p-0 rounded-xl bg-slate-50/70 sm:bg-transparent dark:bg-white/[0.02] sm:dark:bg-transparent">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Order Shipment</span>
            <span className="text-sm sm:text-base font-black text-violet-600 dark:text-violet-400 mt-0.5">
              {totalShipments} Job Files Terbit
            </span>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. INTERACTIVE MULTIMODAL DONUT CHART (4 COLS) */}
      {/* ==================================================================== */}
      <div className="lg:col-span-4 bg-white dark:bg-[#121620] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition-colors min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-100 dark:border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-300">
                <PieIcon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Distribusi Moda Kargo
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Sea vs Air vs Inland
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              Interactive
            </span>
          </div>

          {/* Animated Donut Chart */}
          <div className="relative w-full h-52 sm:h-56 mt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  {...({
                    activeIndex: activeDonutIndex,
                    activeShape: renderActiveShape,
                  } as any)}
                  data={multimodalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={62}
                  outerRadius={84}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveDonutIndex(index)}
                  isAnimationActive={true}
                  animationDuration={1000}
                >
                  {multimodalData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      className="cursor-pointer transition-all duration-300"
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Donut Telemetry Badge */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                {activeDonut.percentage}%
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400 truncate max-w-[100px]">
                {activeDonut.name}
              </span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="space-y-2 mt-2">
            {multimodalData.map((item, idx) => {
              const isSelected = activeDonutIndex === idx;
              return (
                <div
                  key={item.key}
                  onClick={() => setActiveDonutIndex(idx)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-50 dark:bg-white/[0.06] border-slate-300 dark:border-white/20 shadow-sm"
                      : "bg-transparent border-transparent hover:bg-slate-50/50 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.count} Order Shipment
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                      {formatCompactIDR(item.value)}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {item.percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
          <span>Mode Terpilih:</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">
            {activeDonut.name} ({formatIDR(activeDonut.value)})
          </span>
        </div>
      </div>
    </div>
  );
}
