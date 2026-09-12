import React, { useState } from 'react';
import { PerformancePoint } from '../types';

interface PortfolioPerformanceChartProps {
  data: PerformancePoint[];
  selectedRange: string;
  onRangeChange: (range: string) => void;
}

export const PortfolioPerformanceChart: React.FC<PortfolioPerformanceChartProps> = ({
  data,
  selectedRange,
  onRangeChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(5); // default Jun (index 5)
  const ranges = ['1D', '1W', '1M', '6M', '1Y'];

  const yLabels = ['200k', '150k', '100k', '50k', '10k'];
  const maxY = 220000;
  const minY = 0;

  // Chart dimensions & viewBox
  const width = 900;
  const height = 240;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Coordinates mapping
  const points = data.map((d, index) => {
    const x = paddingLeft + (index / (data.length - 1)) * chartWidth;
    const normY = (d.value - minY) / (maxY - minY);
    const y = paddingTop + chartHeight - normY * chartHeight;
    return { x, y, data: d, index };
  });

  // Generate smooth cubic bezier SVG path
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      // Catmull-Rom to Cubic Bezier conversion
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;

      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return path;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length > 0
    ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
    : '';

  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : points[5] || points[0];

  return (
    <div
      id="portfolio-performance-card"
      className="w-full bg-[#18191e] border border-[#262832] rounded-[24px] p-4 sm:p-5 select-none relative overflow-hidden"
    >
      {/* Subtle background cosmic glow */}
      <div className="absolute top-0 right-1/4 w-80 h-40 bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
        <h2 className="text-white font-bold text-sm sm:text-base tracking-tight">
          Portfolio Performance
        </h2>

        {/* Range Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#14151a] border border-[#242631] rounded-full self-start sm:self-auto">
          {ranges.map((range) => {
            const isActive = selectedRange === range;
            return (
              <button
                key={range}
                id={`btn-range-${range}`}
                onClick={() => onRangeChange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${
                  isActive
                    ? 'bg-[#292b37] text-white border border-[#3c3f50] shadow-sm'
                    : 'text-[#8e92a4] hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {range}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Interactive Chart */}
      <div className="relative w-full overflow-x-auto scrollbar-none pt-2">
        <div className="min-w-[620px] w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto overflow-visible cursor-crosshair"
            onMouseLeave={() => setHoveredIndex(5)}
          >
            <defs>
              {/* Gradient for area fill */}
              <linearGradient id="performanceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" stopOpacity="0.25" />
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#18191e" stopOpacity="0.0" />
              </linearGradient>

              {/* Stroke gradient */}
              <linearGradient id="performanceLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>

              {/* Radial glow for selected point */}
              <filter id="pinkGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f43f5e" floodOpacity="0.8" />
              </filter>
            </defs>

            {/* Horizontal Grid lines and Y-axis labels */}
            {yLabels.map((label, i) => {
              const yPos = paddingTop + (i / (yLabels.length - 1)) * chartHeight;
              return (
                <g key={label}>
                  <text
                    x={paddingLeft - 12}
                    y={yPos + 4}
                    textAnchor="end"
                    fill="#666b7e"
                    fontSize="11"
                    fontFamily="inherit"
                  >
                    {label}
                  </text>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={width - paddingRight}
                    y2={yPos}
                    stroke="#22242e"
                    strokeWidth="1"
                    strokeDasharray={i === yLabels.length - 1 ? 'none' : '3 3'}
                  />
                </g>
              );
            })}

            {/* Area under curve */}
            <path d={areaPath} fill="url(#performanceAreaGradient)" />

            {/* Spline line */}
            <path
              d={linePath}
              fill="none"
              stroke="url(#performanceLineGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Active Vertical Guideline to X Axis */}
            {activePoint && (
              <line
                x1={activePoint.x}
                y1={activePoint.y}
                x2={activePoint.x}
                y2={paddingTop + chartHeight}
                stroke="#ec4899"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.85"
              />
            )}

            {/* Interactive invisible hover column triggers */}
            {points.map((pt, i) => (
              <rect
                key={i}
                x={pt.x - chartWidth / (points.length * 2)}
                y={paddingTop}
                width={chartWidth / points.length}
                height={chartHeight}
                fill="transparent"
                onMouseEnter={() => setHoveredIndex(i)}
              />
            ))}

            {/* Active Glowing Point Marker */}
            {activePoint && (
              <g>
                {/* Outer halo */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="9"
                  fill="#f43f5e"
                  opacity="0.25"
                  className="animate-ping"
                />
                {/* Mid ring */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="6"
                  fill="#f43f5e"
                  filter="url(#pinkGlow)"
                />
                {/* Center dot */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="3.5"
                  fill="#ffffff"
                />
              </g>
            )}

            {/* X-axis Month labels */}
            {points.map((pt) => {
              const isSelected = activePoint && activePoint.data.month === pt.data.month;
              return (
                <text
                  key={pt.data.month}
                  x={pt.x}
                  y={paddingTop + chartHeight + 22}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#666b7e'}
                  fontWeight={isSelected ? 'bold' : 'normal'}
                  fontSize="11"
                  fontFamily="inherit"
                  className="transition-colors cursor-pointer"
                  onClick={() => setHoveredIndex(pt.index)}
                >
                  {pt.data.month}
                </text>
              );
            })}
          </svg>

          {/* Floating Tooltip Box (position dynamically based on active point) */}
          {activePoint && (
            <div
              className="absolute pointer-events-none transition-all duration-150 z-20"
              style={{
                left: `${(activePoint.x / width) * 100}%`,
                top: `${(activePoint.y / height) * 100 - 30}%`,
                transform: 'translate(-50%, -100%)',
              }}
            >
              <div className="bg-[#1c1d25]/95 border border-[#35384a] backdrop-blur-md rounded-xl px-3 py-2 shadow-2xl flex items-center gap-3">
                <div>
                  <p className="text-[10px] text-[#8e92a4] font-medium leading-none">
                    {activePoint.data.dateStr}
                  </p>
                  <p className="text-xs font-bold text-white mt-1">
                    $ {activePoint.data.value.toLocaleString()}
                  </p>
                </div>
                <div className="px-2 py-0.5 rounded-full bg-[#12281e] border border-emerald-500/40 text-emerald-400 text-[10px] font-bold">
                  {activePoint.data.change}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
