
"use client"

import * as React from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockUsers, mockTaskTypes, mockMaterials } from "@/lib/data"
import { PlusCircle, Trash2, FileUp, FileDown, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { TaskType } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AdminPage() {
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
  const [selectedTask, setSelectedTask] = React.useState<TaskType | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false)

  const handleTaskRowClick = (task: TaskType) => {
    setSelectedTask(task)
    setIsTaskDialogOpen(true)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
        <Tabs defaultValue="users">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="rates">Organization Rates</TabsTrigger>
            <TabsTrigger value="tasks">Task Types</TabsTrigger>
            <TabsTrigger value="materials">Materials Catalog</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card className="shadow-lg mt-4">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Invite and manage users in your organization.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Hourly Rate</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell className="text-right">{formatCurrency(user.rate)}/hr</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                 <Button><PlusCircle className="mr-2 h-4 w-4"/> Invite User</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="rates">
            <Card className="shadow-lg mt-4">
              <CardHeader>
                <CardTitle>Organization Rates</CardTitle>
                <CardDescription>Set default billing and overhead rates.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="default-labor">Default Labor Rate ($/hr)</Label>
                    <Input id="default-labor" type="number" placeholder="28" defaultValue="28" />
                    <p className="text-sm text-muted-foreground">Default hourly rate for new workers.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overhead-percentage">Default Overhead (%)</Label>
                    <Input id="overhead-percentage" type="number" placeholder="20" defaultValue="20" />
                    <p className="text-sm text-muted-foreground">Percentage added to jobs for overhead costs.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save Rates</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card className="shadow-lg mt-4">
              <CardHeader>
                <CardTitle>Task Types</CardTitle>
                <CardDescription>Manage the task types and their default materials. Click a row to edit.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task Name</TableHead>
                        <TableHead>Default Materials</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTaskTypes.map((task) => (
                        <TableRow key={task.id} onClick={() => handleTaskRowClick(task)} className="cursor-pointer">
                          <TableCell className="font-medium">{task.name}</TableCell>
                          <TableCell>{task.defaultMaterials?.length ?? 0} items</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); /* logic to delete */ }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="gap-4">
                <Input placeholder="New task type name..."/>
                <Button><PlusCircle className="mr-2 h-4 w-4"/> Add Task Type</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="materials">
            <Card className="shadow-lg mt-4">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Materials Catalog</CardTitle>
                  <CardDescription>Manage your inventory of fence materials.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline"><FileUp className="mr-2 h-4 w-4"/> Import CSV</Button>
                  <Button variant="outline"><FileDown className="mr-2 h-4 w-4"/> Export CSV</Button>
                  <Button><PlusCircle className="mr-2 h-4 w-4"/> Add New Material</Button>
                </div>
              </CardHeader>
              <CardContent>
                 <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-center">Active</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockMaterials.map((material) => (
                        <TableRow key={material.id}>
                          <TableCell className="font-mono">{material.sku}</TableCell>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell className="text-right">{formatCurrency(material.cost)}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={material.isActive ? "secondary" : "destructive"}>
                              {material.isActive ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Task Type: {selectedTask?.name}</DialogTitle>
            <DialogDescription>
              Manage the default materials associated with this task.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="task-name">Task Name</Label>
              <Input id="task-name" value={selectedTask?.name} />
            </div>
            
            <div className="space-y-4">
              <Label>Default Materials</Label>
              <div className="flex items-end gap-2">
                 <div className="grid gap-1.5 flex-1">
                   <Label htmlFor="material-select" className="sr-only">Material</Label>
                    <Select>
                      <SelectTrigger id="material-select">
                        <SelectValue placeholder="Select a material to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockMaterials.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-1.5">
                    <Label htmlFor="material-quantity" className="sr-only">Quantity</Label>
                    <Input id="material-quantity" type="number" placeholder="Qty" className="w-20" />
                 </div>
                <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>
              </div>

              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTask?.defaultMaterials?.map(dm => {
                       const material = mockMaterials.find(m => m.sku === dm.sku);
                       return (
                         <TableRow key={dm.sku}>
                           <TableCell className="font-medium">{material?.name ?? 'Unknown'}</TableCell>
                           <TableCell>{dm.quantity} {material?.unit}(s)</TableCell>
                           <TableCell className="text-right">
                             <Button variant="ghost" size="icon">
                               <X className="h-4 w-4 text-destructive" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       );
                    })}
                    {!selectedTask?.defaultMaterials?.length && (
                       <TableRow>
                         <TableCell colSpan={3} className="text-center h-24">No materials associated.</TableCell>
                       </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
            <Button>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
