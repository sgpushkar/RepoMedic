"use client";

import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const LANG_COLORS: Record<string, string> = {
  Python:'#3572A5', JavaScript:'#f1e05a', TypeScript:'#2b7489',
  HTML:'#e34c26', CSS:'#563d7c', Java:'#b07219', 'C++':'#f34b7d',
  C:'#555555', Rust:'#dea584', Go:'#00ADD8', Ruby:'#701516',
  PHP:'#4F5D95', Shell:'#89e051', Other:'#666677',
}

function scoreColor(s: number) {
  if (s >= 80) return '#00ff9d'
  if (s >= 60) return '#f59e0b'
  return '#ef4444'
}
function scoreLabel(s: number) {
  if (s >= 85) return 'Excellent'
  if (s >= 70) return 'Healthy'
  if (s >= 55) return 'Fair'
  if (s >= 40) return 'Needs Work'
  return 'Critical'
}

const RADIAN = Math.PI / 180
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.07) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  return (
    <text x={cx + r * Math.cos(-midAngle * RADIAN)} y={cy + r * Math.sin(-midAngle * RADIAN)}
      fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="Space Mono">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function HealthRing({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-44 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="70%" outerRadius="90%"
            data={[{ value: score, fill: color }]} startAngle={225} endAngle={-45} barSize={12}>
            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: '#252535' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-bold text-4xl" style={{ color }}>{score}</span>
          <span className="text-muted text-xs font-mono">/ 100</span>
        </div>
      </div>
      <span className="text-sm font-semibold px-3 py-1 rounded-full border"
        style={{ color, borderColor:`${color}33`, background:`${color}11` }}>
        {scoreLabel(score)}
      </span>
    </div>
  )
}

export function LanguagePie({ data = [] }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data.map(d => ({ name: d.name, value: d.percent }))}
          cx="50%" cy="50%" outerRadius={90} dataKey="value" labelLine={false} label={renderLabel}>
          {data.map((d, i) => <Cell key={d.name} fill={LANG_COLORS[d.name] || LANG_COLORS.Other} />)}
        </Pie>
        <Tooltip contentStyle={{ background:'#16162a', border:'1px solid #252535', borderRadius:8, fontFamily:'Space Mono', fontSize:12 }}
          formatter={(v: any) => [`${v}%`, '']} />
        <Legend iconType="circle" iconSize={8}
          formatter={v => <span style={{ fontSize:11, fontFamily:'Space Mono', color:'#9999aa' }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ScoreBreakdown({ breakdown = {} }: { breakdown: any }) {
  const data = [
    { name:'File Clean',   value: breakdown.fileClean    || 0, fill:'#00ff9d' },
    { name:'Deps',         value: breakdown.dependencies || 0, fill:'#7c3aed' },
    { name:'No Dupes',     value: breakdown.duplicates   || 0, fill:'#f59e0b' },
    { name:'Structure',    value: breakdown.structure    || 0, fill:'#3b82f6' },
    { name:'Docs',         value: breakdown.documentation|| 0, fill:'#ec4899' },
  ]
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#252535" vertical={false} />
        <XAxis dataKey="name" tick={{ fontFamily:'Space Mono', fontSize:10, fill:'#6b6b88' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0,100]} tick={{ fontFamily:'Space Mono', fontSize:10, fill:'#6b6b88' }} axisLine={false} tickLine={false} width={28} />
        <Tooltip cursor={{ fill:'rgba(255,255,255,0.03)' }}
          contentStyle={{ background:'#16162a', border:'1px solid #252535', borderRadius:8, fontFamily:'Space Mono', fontSize:12 }} />
        <Bar dataKey="value" radius={[6,6,0,0]}>
          {data.map(d => <Cell key={d.name} fill={d.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function IssuesSummary({ issues = [] }: { issues: any[] }) {
  const high = issues.filter(i => i.severity === 'high').length
  const med  = issues.filter(i => i.severity === 'medium').length
  const low  = issues.filter(i => i.severity === 'low').length
  const data = [
    { name:'High', value:high, fill:'#ef4444' },
    { name:'Medium', value:med, fill:'#f59e0b' },
    { name:'Low', value:low, fill:'#00ff9d' },
  ].filter(d => d.value > 0)
  if (!data.length) return <p className="text-muted text-sm text-center py-8">No issues found 🎉</p>
  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
          {data.map(d => <Cell key={d.name} fill={d.fill} />)}
        </Pie>
        <Tooltip contentStyle={{ background:'#16162a', border:'1px solid #252535', borderRadius:8, fontFamily:'Space Mono', fontSize:12 }} />
        <Legend iconType="circle" iconSize={8}
          formatter={v => <span style={{ fontSize:11, fontFamily:'Space Mono', color:'#9999aa' }}>{v}</span>} />
      </PieChart>
    </ResponsiveContainer>
  )
}
