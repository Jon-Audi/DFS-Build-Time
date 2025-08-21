
"use client"

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
import { PlusCircle, Trash2, FileUp, FileDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AdminPage() {
  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

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
                <CardDescription>Manage the task types available for job tracking.</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task Name</TableHead>
                        <TableHead className="text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockTaskTypes.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.name}</TableCell>
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
    </AppLayout>
  )
}
