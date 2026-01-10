import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { User as UserIcon, Mail, Briefcase, Building, AlertCircle, Calendar } from 'lucide-react';
import { getStoredLeaves, getLeaveBalance } from '@/lib/storage';
import { ALL_HOLIDAYS } from '@/lib/data';
import { useState, useEffect } from 'react';

export default function Profile() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<any>(null);
  const [approvedLeaves, setApprovedLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const loadData = async () => {
      if (user) {
        const leaveBalance = await getLeaveBalance(user.code);
        setBalance(leaveBalance);
        
        const allLeaves = await getStoredLeaves();
        const leaves = allLeaves.filter(l => l.employeeCode === user.code && l.status === 'Approved');
        setApprovedLeaves(leaves);
      }
      setLoading(false);
    };
    loadData();
  }, [user]);
  
  if (!user || loading) return null;
  
  // Get upcoming holidays (from current date onwards)
  const today = new Date();
  const upcomingHolidays = ALL_HOLIDAYS
    .filter(h => new Date(h.date) > today)
    .slice(0, 8);

  // Calculate worked days (total business days - holidays - approved leaves)
  const totalWorkingDays = 30; // Days in current month
  const holidaysCount = ALL_HOLIDAYS.length;
  const leavesCount = approvedLeaves.length;
  
  const workedDays = Math.max(0, totalWorkingDays - holidaysCount - leavesCount);
  const targetDays = 25;
  const isBelowTarget = workedDays < targetDays;
  const attendanceRate = Math.round((workedDays / targetDays) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-start gap-6">
        <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] shrink-0">
          <span className="text-5xl font-bold text-white">{user.name.charAt(0)}</span>
        </div>
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">{user.name}</h2>
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
              <Briefcase className="w-4 h-4 text-primary" />
              <span>{user.code}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
              <Building className="w-4 h-4 text-primary" />
              <span>{user.designation}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
              <UserIcon className="w-4 h-4 text-primary" />
              <span>{user.role}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Productivity Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Worked Days vs Target</span>
                <span className={isBelowTarget ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                  {workedDays} / {targetDays} Days
                </span>
              </div>
              <Progress value={(workedDays / targetDays) * 100} className={`h-2 ${isBelowTarget ? "bg-red-900" : "bg-primary/20"}`} />
               {isBelowTarget && (
                <p className="text-xs text-red-400 mt-1 animate-pulse">
                  Warning: Worked days are below the target of {targetDays} days.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div>
                <p className="text-sm text-muted-foreground">Approved Leaves</p>
                <p className="text-2xl font-bold text-white">{leavesCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
                <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Leave Balance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Personal (Casual) Leave</span>
                    <span className="text-white font-mono">{balance.casual.remaining} / {balance.casual.total}</span>
                  </div>
                  <Progress value={(balance.casual.used / balance.casual.total) * 100} className="h-2 bg-blue-900/50" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Sick Leave</span>
                    <span className="text-white font-mono">{balance.sick.remaining} / {balance.sick.total}</span>
                  </div>
                  <Progress value={(balance.sick.used / balance.sick.total) * 100} className="h-2 bg-purple-900/50" />
                </div>
                
                <div className="pt-2 border-t border-white/5 text-xs text-muted-foreground flex items-center gap-2">
                   <AlertCircle className="w-3 h-3 text-primary" />
                   <span>Balances reset on Jan 1st of every year.</span>
                </div>
             </div>
          </CardContent>
        </Card>

        <Card className="bg-card/40 backdrop-blur border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Holidays & Sundays
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-300">Public Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-gray-300">Sunday (Off)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-300">Worked on Off Day</span>
                </div>
             </div>
             
             <div className="pt-3 border-t border-white/5 space-y-2">
               <p className="text-xs text-gray-400 font-semibold">Upcoming Holidays</p>
               {upcomingHolidays.map((holiday) => (
                 <div key={holiday.date} className="flex justify-between items-center text-xs">
                   <span className="text-gray-300">{holiday.name}</span>
                   <span className="text-gray-500">{new Date(holiday.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
