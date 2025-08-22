
"use client"

import * as React from "react"
import { db } from "@/lib/firebase"
import { collection, doc, getDocs, setDoc, addDoc, deleteDoc, updateDoc } from "firebase/firestore"
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
import { PlusCircle, Trash2, FileUp, FileDown, X, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { TaskType, User, MaterialCatalogItem, OrganizationRates } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const { toast } = useToast()
  const [users, setUsers] = React.useState<User[]>([]);
  const [taskTypes, setTaskTypes] = React.useState<TaskType[]>([]);
  const [materials, setMaterials] = React.useState<MaterialCatalogItem[]>([]);
  const [rates, setRates] = React.useState<OrganizationRates>({ defaultLaborRate: 0, defaultOverheadPct: 0 });
  
  const [loading, setLoading] = React.useState(true);

  // States for forms/dialogs
  const [newTaskTypeName, setNewTaskTypeName] = React.useState("");
  const [selectedTask, setSelectedTask] = React.useState<TaskType | null>(null)
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false)

  // Fetch all data on component mount
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));

        const taskTypesSnapshot = await getDocs(collection(db, "taskTypes"));
        setTaskTypes(taskTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskType)));
        
        const materialsSnapshot = await getDocs(collection(db, "materialsCatalog"));
        setMaterials(materialsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MaterialCatalogItem)));

        const ratesDoc = await getDocs(collection(db, "rates"));
        if (!ratesDoc.empty) {
          setRates(ratesDoc.docs[0].data() as OrganizationRates);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to load data from Firestore." });
      }
      setLoading(false);
    };
    fetchData();
  }, [toast]);


  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
  
  const handleTaskRowClick = (task: TaskType) => {
    setSelectedTask(task)
    setIsTaskDialogOpen(true)
  }
  
  const handleSaveChanges = async () => {
    if (!selectedTask) return;
    try {
      await updateDoc(doc(db, "taskTypes", selectedTask.id), {
        name: selectedTask.name,
        defaultMaterials: selectedTask.defaultMaterials || []
      });
      // Refresh local state
      setTaskTypes(prev => prev.map(t => t.id === selectedTask.id ? selectedTask : t));
      toast({ title: "Success", description: "Task type updated successfully." });
      setIsTaskDialogOpen(false);
    } catch(error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to save changes." });
    }
  }

  const handleSaveRates = async () => {
    try {
      await setDoc(doc(db, "rates", "default"), rates, { merge: true });
      toast({ title: "Success", description: "Rates saved successfully." });
    } catch (error) {
      console.error("Error saving rates:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not save rates." });
    }
  };
  
  const handleAddTaskType = async () => {
    if (!newTaskTypeName) {
      toast({ variant: 'destructive', title: "Error", description: "Task type name cannot be empty." });
      return;
    }
    try {
      const docRef = await addDoc(collection(db, "taskTypes"), { name: newTaskTypeName, isActive: true });
      setTaskTypes(prev => [...prev, { id: docRef.id, name: newTaskTypeName, isActive: true }]);
      toast({ title: "Success", description: `Task type "${newTaskTypeName}" added.` });
      setNewTaskTypeName("");
    } catch (error) {
      console.error("Error adding task type:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not add task type." });
    }
  }

  const handleDeleteTaskType = async (taskId: string) => {
    try {
      await deleteDoc(doc(db, "taskTypes", taskId));
      setTaskTypes(prev => prev.filter(t => t.id !== taskId));
      toast({ title: "Success", description: "Task type deleted." });
    } catch (error) {
      console.error("Error deleting task type:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not delete task type." });
    }
  }
  
  const handleInviteUser = () => {
     toast({ title: "Invite Sent", description: "A user has been invited (placeholder)." })
  }
  
  const handleDeleteUser = (userId: string) => {
    toast({ title: "User Removed", description: `User ${userId} has been removed (placeholder).` })
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <p>Loading admin data...</p>
        </div>
      </AppLayout>
    );
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
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell className="text-right">{formatCurrency(user.rate)}/hr</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">No users found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter>
                 <Button onClick={handleInviteUser}><PlusCircle className="mr-2 h-4 w-4"/> Invite User</Button>
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
                    <Input id="default-labor" type="number" placeholder="Enter rate" value={rates.defaultLaborRate} onChange={(e) => setRates(prev => ({...prev, defaultLaborRate: Number(e.target.value)}))} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="overhead-percentage">Default Overhead (%)</Label>
                    <Input id="overhead-percentage" type="number" placeholder="Enter percentage" value={rates.defaultOverheadPct} onChange={(e) => setRates(prev => ({...prev, defaultOverheadPct: Number(e.target.value)}))} />
                    <p className="text-sm text-muted-foreground">Percentage added to jobs for overhead costs.</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveRates}>Save Rates</Button>
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
                      {taskTypes.map((task) => (
                        <TableRow key={task.id} className="cursor-pointer">
                          <TableCell className="font-medium" onClick={() => handleTaskRowClick(task)}>{task.name}</TableCell>
                          <TableCell onClick={() => handleTaskRowClick(task)}>{task.defaultMaterials?.length ?? 0} items</TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteTaskType(task.id) }}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                       {taskTypes.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">No task types found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="gap-4">
                <Input placeholder="New task type name..." value={newTaskTypeName} onChange={(e) => setNewTaskTypeName(e.target.value)} />
                <Button onClick={handleAddTaskType}><PlusCircle className="mr-2 h-4 w-4"/> Add Task Type</Button>
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
                  <Button variant="outline" onClick={() => toast({ title: "Import", description: "Import CSV clicked"})}><FileUp className="mr-2 h-4 w-4"/> Import CSV</Button>
                  <Button variant="outline" onClick={() => toast({ title: "Export", description: "Export CSV clicked"})}><FileDown className="mr-2 h-4 w-4"/> Export CSV</Button>
                  <Button onClick={() => toast({ title: "Add Material", description: "Add new material clicked"})}><PlusCircle className="mr-2 h-4 w-4"/> Add New Material</Button>
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
                      {materials.map((material) => (
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
                             <Button variant="ghost" size="icon" onClick={() => toast({title: "Edit", description: `Edit ${material.name} clicked`})}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toast({title: "Delete", description: `Delete ${material.name} clicked`})}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {materials.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24">No materials found.</TableCell>
                            </TableRow>
                        )}
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
              <Input id="task-name" value={selectedTask?.name ?? ""} onChange={(e) => setSelectedTask(prev => prev ? {...prev, name: e.target.value} : null)} />
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
                        {materials.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.name} ({m.sku})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                 </div>
                 <div className="grid gap-1.5">
                    <Label htmlFor="material-quantity" className="sr-only">Quantity</Label>
                    <Input id="material-quantity" type="number" placeholder="Qty" className="w-20" />
                 </div>
                <Button variant="outline" onClick={() => toast({ title: "Add Material", description: "Material added to task"})}><PlusCircle className="mr-2 h-4 w-4"/>Add</Button>
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
                       const material = materials.find(m => m.sku === dm.sku);
                       return (
                         <TableRow key={dm.sku}>
                           <TableCell className="font-medium">{material?.name ?? 'Unknown'}</TableCell>
                           <TableCell>{dm.quantity} {material?.unit}(s)</TableCell>
                           <TableCell className="text-right">
                             <Button variant="ghost" size="icon" onClick={() => toast({ title: "Remove Material", description: `Removed material from ${selectedTask?.name}`})}>
                               <X className="h-4 w-4 text-destructive" />
                             </Button>
                           </TableCell>
                         </TableRow>
                       );
                    })}
                    {(!selectedTask?.defaultMaterials || selectedTask.defaultMaterials.length === 0) && (
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
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
