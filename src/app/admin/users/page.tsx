"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { getFirebase, getRole, callable } from "@/lib/firebaseClient";

type UserRow = { id: string; email: string; role?: string; hourlyRate?: number; isActive?: boolean };

export default function UsersPage() {
  const { db } = getFirebase();
  const [role, setRole] = useState<"admin"|"supervisor"|"worker"|"anon">("anon");
  const [rows, setRows] = useState<UserRow[]>([]);
  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin"|"supervisor"|"worker">("worker");
  const [hourlyRate, setHourlyRate] = useState<number>(28);

  const inviteUser = callable<{email:string, role:"admin"|"supervisor"|"worker"}, {uid:string,email:string,tempPassword:string}>("inviteUser");
  const setRoleClaim = callable<{uid:string, role:"admin"|"supervisor"|"worker", hourlyRate?:number}, {ok:true}>("setRoleClaim");

  async function refresh() {
    const snap = await getDocs(collection(db, "users"));
    const list: UserRow[] = [];
    snap.forEach(d => {
      const data = d.data() as any;
      list.push({ id: d.id, email: data.email, role: data.role, hourlyRate: data.hourlyRate, isActive: data.isActive });
    });
    setRows(list);
  }

  useEffect(() => {
    (async () => {
      setRole(await getRole());
      await refresh();
    })();
  }, [db]);

  if (role === "anon") return <div className="p-6">Please sign in.</div>;
  if (role !== "admin") return <div className="p-6">Admins only.</div>;

  async function doInvite() {
    if (!email) return;
    const res = await inviteUser({ email, role: newRole });
    alert(`Invited ${res.data.email}\nTemp password: ${res.data.tempPassword}`);
    setEmail("");
    await refresh();
  }

  async function saveHourly(uid: string, value: number) {
    await setDoc(doc(db, "users", uid), { hourlyRate: Number(value) }, { merge: true });
    await setRoleClaim({ uid, role: (rows.find(r=>r.id===uid)?.role as any) || "worker" });
    await refresh();
  }

  async function saveRole(uid: string, role: "admin"|"supervisor"|"worker") {
    await setDoc(doc(db, "users", uid), { role }, { merge: true });
    await setRoleClaim({ uid, role });
    await refresh();
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Users</h1>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm">Email</label>
          <input className="border rounded p-2" placeholder="newuser@delawarefencesolutions.com"
            value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select className="border rounded p-2" value={newRole} onChange={(e)=>setNewRole(e.target.value as any)}>
            <option value="worker">worker</option>
            <option value="supervisor">supervisor</option>
            <option value="admin">admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Hourly Rate</label>
          <input type="number" className="border rounded p-2"
            value={hourlyRate} onChange={(e)=>setHourlyRate(Number(e.target.value))} />
        </div>
        <button onClick={async ()=>{ await doInvite(); if (email) {
          // if you want to set initial hourly rate immediately:
          const snapshot = await getDocs(collection(db, "users"));
          const created = snapshot.docs.find(d => (d.data() as any).email === email);
          if (created) await setDoc(doc(db,"users",created.id), { hourlyRate }, { merge: true });
        }}}
          className="px-4 py-2 rounded bg-blue-700 text-white">Invite</button>
      </div>

      <table className="w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Email</th>
            <th className="p-2">Role</th>
            <th className="p-2">Hourly Rate</th>
            <th className="p-2">Active</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.email}</td>
              <td className="p-2">
                <select className="border rounded p-1" value={r.role || "worker"}
                  onChange={(e)=>saveRole(r.id, e.target.value as any)}>
                  <option value="worker">worker</option>
                  <option value="supervisor">supervisor</option>
                  <option value="admin">admin</option>
                </select>
              </td>
              <td className="p-2">
                <input type="number" className="border rounded p-1 w-28"
                  defaultValue={r.hourlyRate ?? 0}
                  onBlur={(e)=>saveHourly(r.id, Number(e.target.value))}/>
              </td>
              <td className="p-2">{String(r.isActive ?? true)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
