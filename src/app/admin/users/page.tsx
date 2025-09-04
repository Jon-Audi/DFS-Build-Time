
"use client"

import * as React from "react"
import { db, functions } from "@/lib/firebase"
import { httpsCallable } from "firebase/functions"
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
import { PlusCircle, Trash2, Loader2 } from "lucide-react"
import type { User } from "@/lib/types"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"


export default function UsersPage() {
    const { toast } = useToast()
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isProcessing, setIsProcessing] = React.useState(false);

    const [isInviteUserOpen, setIsInviteUserOpen] = React.useState(false)
    const [newInvite, setNewInvite] = React.useState({ email: '', role: 'Worker', hourlyRate: 0, name: '' });

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        } catch (error) {
        console.error("Error fetching users:", error);
        toast({ variant: 'destructive', title: "Error", description: "Failed to load users from Firestore." });
        } finally {
        setLoading(false);
        }
    }, [toast]);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

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
            description: `An invitation has been sent to ${newInvite.email}. Temporary Password: ${(result.data as any).tempPassword}`
          });
          await fetchData();
          setIsInviteUserOpen(false);
          setNewInvite({ email: '', role: 'Worker', hourlyRate: 0, name: '' });
        } catch (error: any) {
          console.error(error);
          toast({ variant: "destructive", title: "Error Inviting User", description: error.message });
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

          if (field === 'role' || field === 'rate') {
            const setRoleClaimFn = httpsCallable(functions, 'setRoleClaim');
            const user = users.find(u => u.id === userId);
            const updatedUser = { ...user, [field]: value };
            await setRoleClaimFn({ uid: userId, role: updatedUser.role, rate: updatedUser.rate });
          }
          
          setUsers(users.map(u => u.id === userId ? { ...u, [field]: value } : u));
          toast({ title: 'User Updated', description: `User ${userId} has been updated.` });
        } catch (error: any) {
          console.error('Error updating user:', error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update user: ' + error.message });
          fetchData(); // Re-fetch to revert optimistic update on error
        }
    };

    if (loading) {
        return (
          <AppLayout>
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="ml-2">Loading users...</p>
            </div>
          </AppLayout>
        );
    }
  
  return (
    <AppLayout>
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
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
                        <TableHead>Email / Login ID</TableHead>
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
        </div>

        <Dialog open={isInviteUserOpen} onOpenChange={setIsInviteUserOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite New User</DialogTitle>
                    <DialogDescription>
                        Enter the new user's email. The system will generate a temporary password.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={newInvite.name} onChange={(e) => setNewInvite({...newInvite, name: e.target.value})} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" value={newInvite.email} onChange={(e) => setNewInvite({...newInvite, email: e.target.value})} className="col-span-3" />
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
    </AppLayout>
  )
}
