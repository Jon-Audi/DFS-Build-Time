'use client'

import * as React from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'
import { DollarSign, HardHat, Hourglass } from "lucide-react"
import { mockJobs } from "@/lib/data"
import type { Job } from "@/lib/types"

const kpiData = [
  { title: "Total Hours Tracked", value: "1,234", icon: Hourglass, change: "+12%" },
  { title: "Total Material Cost", value: "$21,250", icon: DollarSign, change: "+8%" },
  { title: "Total Labor Cost", value: "$12,900", icon: HardHat, change: "+15%" },
]

export default function DashboardPage() {
  const topJobs = [...mockJobs].sort((a, b) => b.totalCost - a.totalCost).slice(0, 5)

  const formatCurrency = (value: number) => `$${new Intl.NumberFormat('en-US').format(value)}`;

  return (
    <AppLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kpiData.map((kpi) => (
            <Card key={kpi.title} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">{kpi.change} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-1">
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle>Top 5 Most Expensive Jobs</CardTitle>
              <CardDescription>
                A look at the jobs with the highest total cost.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={topJobs} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--secondary))' }}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="totalCost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                     <LabelList dataKey="totalCost" position="top" formatter={formatCurrency} fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
