
"use client"

import * as React from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/date-picker-range"
import { Download, ArrowDownUp } from "lucide-react"
import { Label } from "@/components/ui/label"
import type { Job, User } from "@/lib/types"

export default function ReportsPage() {
  const [reportData, setReportData] = React.useState<Job[]>([])
  const [users, setUsers] = React.useState<User[]>([]);
  const [sortConfig, setSortConfig] = React.useState<{ key: keyof Job | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const sortedData = React.useMemo(() => {
    let sortableItems = [...reportData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key!] < b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key!] > b[sortConfig.key!]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [reportData, sortConfig]);

  const requestSort = (key: keyof Job) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleRowClick = (job: Job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };
  
  const formatCurrency = (value: number) => `$${new Intl.NumberFormat('en-US').format(value)}`;

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Generate Report</CardTitle>
            <CardDescription>Filter and generate reports for jobs, costs, and productivity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <DatePickerWithRange />
              </div>
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="All Jobs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-jobs">All Jobs</SelectItem>
                    <SelectItem value="material-costs">Material Costs</SelectItem>
                    <SelectItem value="labor-costs">Labor Costs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select>
                  <SelectTrigger id="employee">
                    <SelectValue placeholder="All Employees" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>)}
                     {users.length === 0 && <SelectItem value="all" disabled>No employees found</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">Generate</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Job Cost Summary</CardTitle>
            <CardDescription>Detailed breakdown of job costs. Click a job to see details.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    {['name', 'materialCost', 'laborCost', 'totalCost', 'status'].map((key) => (
                      <TableHead key={key} className={key === 'name' ? '' : 'cursor-pointer'} onClick={() => key !== 'name' && requestSort(key as keyof Job)}>
                        <div className="flex items-center gap-2">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          {sortConfig.key === key && <ArrowDownUp className="h-4 w-4" />}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.length > 0 ? sortedData.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell 
                        className="font-medium cursor-pointer hover:underline"
                        onClick={() => handleRowClick(job)}
                      >
                        {job.name}
                      </TableCell>
                      <TableCell>{formatCurrency(job.materialCost)}</TableCell>
                      <TableCell>{formatCurrency(job.laborCost)}</TableCell>
                      <TableCell className="font-bold">{formatCurrency(job.totalCost)}</TableCell>
                      <TableCell>{job.status}</TableCell>
                    </TableRow>
                  )) : (
                     <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">No report data.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export as CSV
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedJob?.name}</DialogTitle>
            <DialogDescription>
              Detailed cost breakdown for this job.
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4 py-4">
               <div className="grid grid-cols-2 items-center gap-4">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium text-right">{selectedJob.client}</span>
               </div>
               <div className="grid grid-cols-2 items-center gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-medium text-right">{selectedJob.status}</span>
               </div>
               <hr className="border-border" />
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="text-muted-foreground">Material Cost</span>
                <span className="font-mono text-right">{formatCurrency(selectedJob.materialCost)}</span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="text-muted-foreground">Labor Cost</span>
                <span className="font-mono text-right">{formatCurrency(selectedJob.laborCost)}</span>
              </div>
              <div className="grid grid-cols-2 items-center gap-4">
                <span className="text-muted-foreground">Overhead Cost</span>
                <span className="font-mono text-right">{formatCurrency(selectedJob.overheadCost)}</span>
              </div>
              <hr className="border-border" />
              <div className="grid grid-cols-2 items-center gap-4 font-bold text-lg">
                <span>Total Cost</span>
                <span className="font-mono text-right">{formatCurrency(selectedJob.totalCost)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
