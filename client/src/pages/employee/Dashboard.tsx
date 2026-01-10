import { useAuth } from '@/context/AuthContext';
import { getStoredLeaves, getLeaveBalance } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, FileText, CheckCircle2, XCircle, AlertCircle, PieChart, Lock } from 'lucide-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Permission from './Permission';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const allLeaves = await getStoredLeaves();
        setLeaves(allLeaves.filter(l => l.employeeCode === user.code));
        const leaveBalance = await getLeaveBalance(user.code);
        setBalance(leaveBalance);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);
  
  const pending = leaves.filter(l => l.status === 'Pending').length;
  const approved = leaves.filter(l => l.status === 'Approved').length;
  const rejected = leaves.filter(l => l.status === 'Rejected').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Welcome, {user?.name.split(' ')[0]}</h2>
          <p className="text-muted-foreground">Here's an overview of your leave status</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowPermissionModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-[0_0_15px_rgba(234,88,12,0.5)] flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Request Permission
          </Button>
          <Link href="/employee/apply-leave">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              + Apply New Leave
            </Button>
          </Link>
        </div>
      </div>

      <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Lock className="w-5 h-5 text-orange-500" />
              Request Permission
            </DialogTitle>
          </DialogHeader>
          <Permission onClose={() => setShowPermissionModal(false)} />
        </DialogContent>
      </Dialog>      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leave Quota</CardTitle>
            <PieChart className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            {balance && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400">Casual</span>
                   <span className="font-bold text-white">{balance.casual.remaining}/{balance.casual.total}</span>
                </div>
                <div className="flex justify-between text-sm">
                   <span className="text-gray-400">Sick</span>
                   <span className="font-bold text-white">{balance.sick.remaining}/{balance.sick.total}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white group-hover:text-yellow-500 transition-colors">{pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white group-hover:text-green-500 transition-colors">{approved}</div>
            <p className="text-xs text-muted-foreground mt-1">Total approved this year</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all duration-300 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-white group-hover:text-red-500 transition-colors">{rejected}</div>
            <p className="text-xs text-muted-foreground mt-1">Requests declined</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold text-white">Recent Activity</h3>
        <div className="bg-card/30 border border-white/5 rounded-lg overflow-hidden backdrop-blur-sm">
          {leaves.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No leave history found.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {leaves.slice(0, 5).map((leave) => (
                <div key={leave.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                      leave.status === 'Approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                      leave.status === 'Rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                      'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                    }`}>
                      {leave.status === 'Approved' ? <CheckCircle2 className="w-5 h-5" /> :
                       leave.status === 'Rejected' ? <XCircle className="w-5 h-5" /> :
                       <Clock className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{leave.type} Leave</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(leave.startDate), 'MMM dd, yyyy')} - {leave.duration}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      leave.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                      leave.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>
                      {leave.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">Applied: {format(new Date(leave.appliedDate), 'MMM dd')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
