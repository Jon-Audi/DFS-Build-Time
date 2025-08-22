
"use client"

import * as React from "react"
import { db, functions } from "@/lib/firebase"
import { httpsCallable } from "firebase/functions"
import { collection, doc, getDocs, setDoc, addDoc, deleteDoc, updateDoc, writeBatch, query, where } from "firebase/firestore"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
import { PlusCircle, Trash2, FileUp, FileDown, X, Edit, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { TaskType, User, MaterialCatalogItem, OrganizationRates } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"

export default function AdminPage() {
  const { toast } = useToast()
  const [users, setUsers] = React.useState<User[]>([]);
  const [taskTypes, setTaskTypes] = React.useState<TaskType[]>([]);
  const [materials, setMaterials] = React.useState<MaterialCatalogItem[]>([]);
  const [rates, setRates] = React.useState<OrganizationRates>({ defaultLaborRate: 0, defaultOverheadPct: 0 });
  
  const [loading, setLoading] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // --- Dialog states ---
  const [isTaskDialogOpen, setIsTaskDialogOpen] = React.useState(false)
  const [isInviteUserOpen, setIsInviteUserOpen] = React.useState(false)
  const [isMaterialDialogOpen, setIsMaterialDialogOpen] = React.useState(false)

  // --- Form states ---
  const [newTaskTypeName, setNewTaskTypeName] = React.useState("");
  const [selectedTask, setSelectedTask] = React.useState<TaskType | null>(null)
  const [newInvite, setNewInvite] = React.useState({ email: '', role: 'Worker', hourlyRate: 0 });
  const [editingMaterial, setEditingMaterial] = React.useState<Partial<MaterialCatalogItem> | null>(null);

  const fetchData = React.useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)
  
  const handleTaskRowClick = (task: TaskType) => {
    setSelectedTask(task)
    setIsTaskDialogOpen(true)
  }
  
  const handleSaveChanges = async () => {
    if (!selectedTask) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "taskTypes", selectedTask.id), {
        name: selectedTask.name,
        defaultMaterials: selectedTask.defaultMaterials || []
      });
      await fetchData()
      toast({ title: "Success", description: "Task type updated successfully." });
      setIsTaskDialogOpen(false);
    } catch(error) {
      console.error(error);
      toast({ variant: 'destructive', title: "Error", description: "Failed to save changes." });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleSaveRates = async () => {
    setIsProcessing(true);
    try {
      await setDoc(doc(db, "rates", "default"), rates, { merge: true });
      toast({ title: "Success", description: "Rates saved successfully." });
    } catch (error) {
      console.error("Error saving rates:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not save rates." });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAddTaskType = async () => {
    if (!newTaskTypeName) {
      toast({ variant: 'destructive', title: "Error", description: "Task type name cannot be empty." });
      return;
    }
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "taskTypes"), { name: newTaskTypeName, isActive: true });
      await fetchData()
      toast({ title: "Success", description: `Task type "${newTaskTypeName}" added.` });
      setNewTaskTypeName("");
    } catch (error) {
      console.error("Error adding task type:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not add task type." });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleDeleteTaskType = async (taskId: string) => {
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "taskTypes", taskId));
      await fetchData();
      toast({ title: "Success", description: "Task type deleted." });
    } catch (error) {
      console.error("Error deleting task type:", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not delete task type." });
    } finally {
      setIsProcessing(false);
    }
  }
  
  const handleInviteUser = async () => {
    if (!newInvite.email || !newInvite.role) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please enter email and select a role." });
      return;
    }
    setIsProcessing(true);
    try {
      const inviteUserFn = httpsCallable(functions, 'inviteUser');
      const result = await inviteUserFn(newInvite);
      console.log(result.data);
      toast({
        title: "User Invited",
        description: `An invitation has been sent to ${newInvite.email}. Temporary password: ${(result.data as any).tempPassword}`
      });
      await fetchData();
      setIsInviteUserOpen(false);
      setNewInvite({ email: '', role: 'Worker', hourlyRate: 0 });
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Failed to invite user." });
    } finally {
      setIsProcessing(false);
    }
  }
  
  const handleDeleteUser = async (userId: string) => {
    setIsProcessing(true);
    try {
      // In a real app, this would call a Cloud Function to delete the user from Auth and Firestore.
      await deleteDoc(doc(db, "users", userId));
      await fetchData();
      toast({ title: "User Removed", description: `User ${userId} has been removed.` })
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete user." });
    } finally {
      setIsProcessing(false);
    }
  }

  const handleUpdateUser = async (userId: string, field: keyof User, value: any) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { [field]: value });
      if (field === 'role') {
        const setRoleClaimFn = httpsCallable(functions, 'setRoleClaim');
        await setRoleClaimFn({ uid: userId, role: value });
      }
      setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
      toast({ title: 'User Updated', description: `User ${userId} has been updated.` });
    } catch (error) {
      console.error('Error updating user:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user.' });
      fetchData(); // Re-fetch to revert optimistic update on error
    }
  };

  const openMaterialDialog = (material: Partial<MaterialCatalogItem> | null = null) => {
    setEditingMaterial(material || {});
    setIsMaterialDialogOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!editingMaterial || !editingMaterial.sku || !editingMaterial.name) {
      toast({ variant: 'destructive', title: 'Error', description: 'SKU and Name are required.' });
      return;
    }
    setIsProcessing(true);
    try {
      const { id, ...dataToSave } = editingMaterial;
      if (id) {
        await setDoc(doc(db, "materialsCatalog", id), dataToSave, { merge: true });
        toast({ title: "Success", description: "Material updated." });
      } else {
        await setDoc(doc(db, "materialsCatalog", dataToSave.sku!), dataToSave, { merge: true });
        toast({ title: "Success", description: "Material added." });
      }
      await fetchData();
      setIsMaterialDialogOpen(false);
      setEditingMaterial(null);
    } catch (error) {
      console.error("Error saving material:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save material.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteMaterial = async (materialId: string) => {
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "materialsCatalog", materialId));
      await fetchData();
      toast({ title: "Success", description: "Material deleted." });
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not delete material.' });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="ml-2">Loading admin data...</p>
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
                          <TableCell>
                            <Select
                                value={user.role}
                                onValueChange={(value) => handleUpdateUser(user.id, 'role', value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Worker">Worker</SelectItem>
                                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                                    <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                                type="number"
                                value={user.rate}
                                onBlur={(e) => handleUpdateUser(user.id, 'rate', Number(e.target.value))}
                                onChange={(e) => setUsers(users.map(u => u.id === user.id ? {...u, rate: Number(e.target.value)} : u))}
                                className="w-24 ml-auto text-right"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the user.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                 <Button onClick={() => setIsInviteUserOpen(true)} disabled={isProcessing}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Invite User
                 </Button>
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
                <Button onClick={handleSaveRates} disabled={isProcessing}>
                  {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Rates
                </Button>
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
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the task type.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTaskType(task.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
                <Button onClick={handleAddTaskType} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Task Type
                </Button>
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
                  <Button onClick={() => openMaterialDialog()}><PlusCircle className="mr-2 h-4 w-4"/> Add New Material</Button>
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
                             <Button variant="ghost" size="icon" onClick={() => openMaterialDialog(material)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the material.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMaterial(material.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
      
      {/* --- Dialogs --- */}

      <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                    Enter the new user's details. They will receive an email with a temporary password.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" value={newInvite.email} onChange={(e) => setNewInvite({...newInvite, email: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right">Role</Label>
                    <Select value={newInvite.role} onValueChange={(value) => setNewInvite({...newInvite, role: value as any})}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="Worker">Worker</SelectItem>
                             <SelectItem value="Supervisor">Supervisor</SelectItem>
                             <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="rate" className="text-right">Hourly Rate</Label>
                    <Input id="rate" type="number" value={newInvite.hourlyRate} onChange={(e) => setNewInvite({...newInvite, hourlyRate: Number(e.target.value)})} className="col-span-3" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteUserOpen(false)}>Cancel</Button>
                <Button onClick={handleInviteUser} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send Invite
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isMaterialDialogOpen} onOpenChange={setIsMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMaterial?.id ? 'Edit Material' : 'Add New Material'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">SKU</Label>
              <Input id="sku" value={editingMaterial?.sku ?? ''} onChange={(e) => setEditingMaterial(prev => ({ ...prev, sku: e.target.value }))} className="col-span-3" disabled={!!editingMaterial?.id} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input id="name" value={editingMaterial?.name ?? ''} onChange={(e) => setEditingMaterial(prev => ({ ...prev, name: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit" className="text-right">Unit</Label>
              <Input id="unit" value={editingMaterial?.unit ?? ''} onChange={(e) => setEditingMaterial(prev => ({ ...prev, unit: e.target.value }))} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cost" className="text-right">Unit Cost</Label>
              <Input id="cost" type="number" value={editingMaterial?.cost ?? 0} onChange={(e) => setEditingMaterial(prev => ({ ...prev, cost: Number(e.target.value) }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Input id="description" value={editingMaterial?.description ?? ''} onChange={(e) => setEditingMaterial(prev => ({ ...prev, description: e.target.value }))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="is-active" className="text-right">Is Active</Label>
              <Switch id="is-active" checked={editingMaterial?.isActive ?? true} onCheckedChange={(checked) => setEditingMaterial(prev => ({ ...prev, isActive: checked }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMaterialDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveMaterial} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Material
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


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
            <Button onClick={handleSaveChanges} disabled={isProcessing}>
                {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}
