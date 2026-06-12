"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

interface Props {
  history: { date: string; position: number | null }[]
}

export function PositionChart({ history }: Props) {
  const data = history.map((h) => ({
    date: h.date.slice(5), // "MM-DD"
    position: h.position,
  }))

  const positions = data.filter((d) => d.position !== null).map((d) => d.position as number)
  const maxPos = positions.length ? Math.max(...positions) + 2 : 12

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(258 20% 16% / 1)" />
        <XAxis
          dataKey="date"
          tick={{ fill: "#94A3B8", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          reversed
          domain={[maxPos, 0]}
          tick={{ fill: "#94A3B8", fontSize: 11 }}
          tickCount={5}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip
          contentStyle={{
            background: "#13101F",
            border: "1px solid hsl(258 20% 16% / 1)",
            borderRadius: "6px",
            fontSize: 12,
          }}
          labelStyle={{ color: "#94A3B8" }}
          itemStyle={{ color: "#7C3AED" }}
          formatter={(value) => [
            value == null ? "Not found" : `#${value}`,
            "Position",
          ]}
        />
        <Line
          type="monotone"
          dataKey="position"
          stroke="#7C3AED"
          strokeWidth={2}
          dot={{ fill: "#7C3AED", r: 3, strokeWidth: 0 }}
          activeDot={{ fill: "#7C3AED", r: 5, strokeWidth: 0 }}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
