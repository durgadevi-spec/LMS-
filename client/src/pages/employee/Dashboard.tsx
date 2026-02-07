import { useAuth } from '@/context/AuthContext';
import { getStoredLeaves, getLeaveBalance, getStoredPermissions } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CheckCircle2, XCircle, Lock } from 'lucide-react';
import { StatCards } from '@/components/StatCards';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Permission from './Permission';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const allLeaves = await getStoredLeaves();
        const matchedLeaves = allLeaves.filter((l: any) => (
          l.employeeCode === user.code ||
          l.employeeId === user.id ||
          l.employeeCode === user.id ||
          l.employeeId === user.code
        ));
        setLeaves(matchedLeaves);

        const allPermissions = await getStoredPermissions();
        const matchedPermissions = allPermissions.filter((p: any) => (
          p.employeeCode === user.code ||
          p.employeeId === user.id ||
          p.employeeCode === user.id ||
          p.employeeId === user.code
        ));
        setPermissions(matchedPermissions);
        const leaveBalance = await getLeaveBalance(user.code, user.id);
        setBalance(leaveBalance);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  // include both leaves and permissions in counts so employees see overall totals
  const pending = leaves.filter(l => l.status === 'Pending').length + permissions.filter(p => p.status === 'Pending').length;
  const approved = leaves.filter(l => l.status === 'Approved').length + permissions.filter(p => p.status === 'Approved').length;
  const rejected = leaves.filter(l => l.status === 'Rejected').length + permissions.filter(p => p.status === 'Rejected').length;

  // Determine current active leave (today between start and end) or most recent request
  const today = new Date();
  const currentLeave = leaves.find(l => {
    try {
      const s = new Date(l.startDate);
      const e = new Date(l.endDate);
      return s <= today && today <= e;
    } catch (e) {
      return false;
    }
  });

  const mostRecent = ([...leaves, ...permissions]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())[0]) || null;

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
      </Dialog>

      {/* Current Request summary */}
      <div className="mb-4">
        <Card className="bg-card/30 border-white/5">
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Request</p>
                {currentLeave ? (
                  <p className="text-white font-semibold">{currentLeave.type} — {currentLeave.status}</p>
                ) : mostRecent ? (
                  <p className="text-white font-semibold">{mostRecent.type || mostRecent.title} — {mostRecent.status}</p>
                ) : (
                  <p className="text-gray-400">No active requests</p>
                )}
              </div>
              <div>
                {currentLeave ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${currentLeave.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    currentLeave.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>{currentLeave.status}</span>
                ) : mostRecent ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${mostRecent.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                    mostRecent.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    }`}>{mostRecent.status}</span>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <StatCards stats={[
        {
          label: 'Leave Quota',
          value: `${(balance?.casual.remaining ?? 0) + (balance?.sick.remaining ?? 0)} Days`,
          type: 'quota',
          subtext: `Casual: ${balance?.casual.remaining ?? 0} | Sick: ${balance?.sick.remaining ?? 0}`
        },
        { label: 'Pending', value: pending, type: 'pending' },
        { label: 'Approved', value: approved, type: 'approved' },
        { label: 'Rejected', value: rejected, type: 'rejected' },
      ]} />

      <div className="space-y-4">
        <h3 className="text-xl font-display font-semibold text-white">Recent Activity</h3>
        <div className="bg-card/30 border border-white/5 rounded-lg overflow-hidden backdrop-blur-sm">
          {(leaves.length + permissions.length) === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No leave or permission history found.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {/* merge leaves and permissions into a single recent activity feed */}
              {([
                ...leaves.map(l => ({
                  ...l,
                  kind: 'leave',
                  title: `${l.type} Leave`,
                  sortDate: l.appliedDate,
                })),
                ...permissions.map(p => ({
                  ...p,
                  kind: 'permission',
                  title: p.type,
                  sortDate: p.appliedDate,
                }))
              ] as any)
                .sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime())
                .slice(0, 5)
                .map((item: any) => (
                  <div key={`${item.kind}-${item.id}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${item.status === 'Approved' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                        item.status === 'Rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                          'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                        }`}>
                        {item.status === 'Approved' ? <CheckCircle2 className="w-5 h-5" /> :
                          item.status === 'Rejected' ? <XCircle className="w-5 h-5" /> :
                            <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-white font-medium">{item.title}</p>
                        {item.kind === 'leave' ? (
                          <p className="text-sm text-muted-foreground">{format(new Date(item.startDate), 'MMM dd, yyyy')} - {item.duration}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">{item.startTime} - {item.endTime}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.status === 'Approved' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        item.status === 'Rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>{item.status}</span>
                      <p className="text-xs text-muted-foreground mt-1">Applied: {format(new Date(item.appliedDate), 'MMM dd')}</p>
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
