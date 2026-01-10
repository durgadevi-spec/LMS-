import { useEffect, useState } from 'react';
import { getStoredLeaves, getStoredUsers } from '@/lib/storage';
import { LeaveRequest, User } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Clock, CheckCircle2, XCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminDashboard() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const l = await getStoredLeaves();
        const u = getStoredUsers();
        if (!mounted) return;
        setLeaves(l);
        setUsers(u);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const pending = leaves.filter(l => l.status === 'Pending').length;
  const approved = leaves.filter(l => l.status === 'Approved').length;
  const rejected = leaves.filter(l => l.status === 'Rejected').length;
  const employees = users.filter(u => u.role === 'Employee').length;
  const departments = new Set(users.map(u => (u as any).department).filter(Boolean)).size;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">Overview of organization performance</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search Employee, Code, or Dept..." 
            className="pl-10 bg-black/20 border-white/10 text-white focus:border-primary/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{employees}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{departments}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions or Recent Pending */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {pending === 0 ? (
               <div className="text-muted-foreground py-4">No pending requests</div>
            ) : (
              <div className="space-y-4">
                 {leaves.filter(l => l.status === 'Pending').slice(0, 5).map(leave => (
                   <div key={leave.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                     <div>
                       <p className="text-white font-medium">{leave.employeeName}</p>
                       <p className="text-xs text-muted-foreground">{leave.type} • {leave.duration}</p>
                     </div>
                     <div className="text-xs text-right text-gray-400">
                       {leave.startDate}
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
