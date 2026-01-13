import { useAuth } from '@/context/AuthContext';
import { getStoredLeaves } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';

export default function LeaveHistory() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) return;
      const all = await getStoredLeaves();
      if (!mounted) return;
      // Match by employeeCode (username) OR employeeId (user_id) to handle different DB states
      const matched = all.filter((l: any) => (
        l.employeeCode === user.code ||
        l.employeeId === user.id ||
        l.employeeCode === user.id ||
        l.employeeId === user.code
      ));
      // sort newest first
      matched.sort((a: any, b: any) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
      setLeaves(matched);
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-6">
        <h2 className="text-3xl font-display font-bold text-white mb-2">Leave History</h2>
        <p className="text-muted-foreground">Track all your past and current leave applications</p>
      </div>

      <Card className="bg-card/40 backdrop-blur border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5">
              <TableRow className="hover:bg-transparent border-white/10">
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Dates</TableHead>
                <TableHead className="text-gray-300">Duration</TableHead>
                <TableHead className="text-gray-300">Reason</TableHead>
                <TableHead className="text-gray-300">Applied On</TableHead>
                <TableHead className="text-gray-300">Attachment</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Action By</TableHead>
                <TableHead className="text-gray-300">Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave) => (
                  <TableRow key={leave.id} className="hover:bg-white/5 border-white/10 transition-colors">
                    <TableCell className="font-medium text-white">{leave.type}</TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-gray-300">{leave.duration}</TableCell>
                    <TableCell className="text-gray-300 max-w-[200px] truncate" title={leave.description}>
                      {leave.description}
                    </TableCell>
                    <TableCell className="text-gray-300">{format(new Date(leave.appliedDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="text-gray-300">
                      {leave.attachment ? (
                        <a href={leave.attachment} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(leave.status)}>
                        {leave.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {leave.actionBy ? (
                        <div className="flex flex-col">
                          <span>{leave.actionBy}</span>
                          <span className="text-[10px]">{leave.actionDate ? format(new Date(leave.actionDate), 'MMM dd, yyyy') : ''}</span>
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-300 max-w-[220px] truncate" title={leave.reasonForAction || ''}>
                      {leave.reasonForAction || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
