import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const TEAL = "#11a1a2";
export const PURPLE = "#724abe";
export const ORANGE = "#f2953a";
export const GREY = "#cecece";

const AXIS_TICK = { fontSize: 10, fill: "#6b7280" };
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e8ecf1" };

/** Gridline step: `base` for small ranges, a round number (<= ~8 lines) for big ones. */
function step(ymax, base) {
  if (ymax <= base * 8) return base;
  const raw = ymax / 8;
  const mag = 10 ** (String(Math.trunc(raw)).length - 1);
  for (const m of [1, 2, 5, 10]) if (raw <= m * mag) return m * mag;
  return Math.trunc(raw);
}

const ticksFor = (top, dtick) => Array.from({ length: Math.floor(top / dtick) + 1 }, (_, i) => i * dtick);
const ceilTo = (v, n) => Math.ceil(v / n) * n;

export function EmptyChart({ message }) {
  return <div className="chart-empty">{message}</div>;
}

/** Teal vertical bars, y axis 0-80 (grows only if data needs it), step 10. */
export function ResponsesBarChart({ labels, values }) {
  const top = Math.max(80, ...values.map((v) => ceilTo(v, 10)));
  const data = labels.map((l, i) => ({ label: l, value: values[i] }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e8ecf1" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis domain={[0, top]} ticks={ticksFor(top, step(top, 10))} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} contentStyle={tooltipStyle} formatter={(v) => [`${v} responses`, ""]} labelFormatter={(l) => l} separator="" />
        <Bar dataKey="value" fill={TEAL} barSize={26} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Purple line with circular markers, y axis 0-2000 step 500. */
export function RegistrationLineChart({ months, values }) {
  const top = Math.max(2000, ...values.map((v) => ceilTo(v, 500)));
  const data = months.map((m, i) => ({ month: m, value: values[i] }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e8ecf1" />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis domain={[0, top]} ticks={ticksFor(top, step(top, 500))} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${Number(v).toLocaleString("en-US")} new users`, ""]} separator="" />
        <Line type="linear" dataKey="value" stroke={PURPLE} strokeWidth={2} dot={{ r: 3, fill: PURPLE, stroke: PURPLE }} activeDot={{ r: 5 }} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Demographics pie, legend on the right: '18-24 (28%)' ... */
export function DemographicsPie({ groups }) {
  if (!groups.reduce((a, g) => a + g.count, 0)) return <EmptyChart message="No age data yet" />;
  const colors = [TEAL, PURPLE, ORANGE, GREY];
  const data = groups.map((g) => ({ name: `${g.label} (${g.percent}%)`, value: g.count }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="32%" cy="50%" outerRadius="80%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
          {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(v, n) => [`${Number(v).toLocaleString("en-US")} users`, n]} />
        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" wrapperStyle={{ fontSize: 11, color: "#374151" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Horizontal bars for one survey question (Analytics page). */
export function OptionBar({ labels, counts }) {
  const total = counts.reduce((a, b) => a + b, 0) || 1;
  const data = labels.map((l, i) => ({ label: l, count: counts[i], text: `${counts[i]} (${Math.round((counts[i] * 100) / total)}%)` }));
  const max = Math.max(...counts, 1) * 1.25;
  return (
    <ResponsiveContainer width="100%" height={60 + 34 * labels.length}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 64, left: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e8ecf1" />
        <XAxis type="number" domain={[0, max]} allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <YAxis type="category" dataKey="label" width={170} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "#374151" }} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,.04)" }} contentStyle={tooltipStyle} formatter={(v) => [v, ""]} separator="" />
        <Bar dataKey="count" fill={TEAL} barSize={16} isAnimationActive={false}>
          <LabelList dataKey="text" position="right" style={{ fontSize: 11, fill: "#374151" }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
