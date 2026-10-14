import { Area, AreaChart, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from 'recharts';

export interface ChartPoint {
  label: string;
  value: number;
}

/** Línea/área del 1RM por sesión. Se carga en diferido (Recharts pesa). */
export default function OneRepMaxChart({ points }: { points: readonly ChartPoint[] }) {
  const data = points.map((p, index) => ({ index, value: p.value }));
  const last = data[data.length - 1];
  const tick = { fill: 'var(--color-muted)', fontSize: 11 };

  return (
    <ResponsiveContainer
      width="100%"
      height="100%"
      minWidth={0}
      initialDimension={{ width: 320, height: 176 }}
    >
      <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 16 }}>
        <defs>
          <linearGradient id="oneRepMaxFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="index"
          type="number"
          domain={[0, Math.max(data.length - 1, 1)]}
          ticks={data.length === 1 ? [0] : undefined}
          allowDecimals={false}
          tickFormatter={(i: number) => points[i]?.label ?? ''}
          tick={tick}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          hide
          domain={[(min: number) => Math.floor(min - 5), (max: number) => Math.ceil(max + 5)]}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          fill="url(#oneRepMaxFill)"
          dot={false}
          isAnimationActive={false}
        />
        {last && (
          <ReferenceDot
            x={last.index}
            y={last.value}
            r={6}
            fill="var(--color-accent)"
            stroke="var(--color-background)"
            strokeWidth={3}
            ifOverflow="visible"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
