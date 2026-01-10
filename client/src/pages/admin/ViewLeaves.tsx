import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStoredLeaves, updateLeaveStatus } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ViewLeaves() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaves = async () => {
      const allLeaves = await getStoredLeaves();
      setLeaves(allLeaves.filter(l => l.status === 'Pending'));
      setLoading(false);
    };
    loadLeaves();
  }, []);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
    console.log('ViewLeaves.handleAction', { id, status, reason, user });
    if (!user) {
      console.warn('No user in context; aborting action');
      return;
    }
    
    await updateLeaveStatus(id, status, `${user.code} (${user.name})`, reason);
    const allLeaves = await getStoredLeaves();
    setLeaves(allLeaves.filter(l => l.status === 'Pending'));
    
    toast({
      title: `Leave ${status}`,
      description: `Request has been ${status.toLowerCase()}.`,
      className: status === 'Approved' ? "bg-green-500/10 border-green-500/20 text-white" : "bg-red-500/10 border-red-500/20 text-white"
    });
    
    setRejectReason('');
    setSelectedLeaveId(null);
  };

  const filteredLeaves = leaves.filter(l => 
    l.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">View Pending Leaves</h2>
          <p className="text-muted-foreground">Review and take action on leave requests</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search by Name, Code, Type..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-black/20 border-white/10 text-white focus:border-primary/50"
          />
        </div>
      </div>

      {/* Note for OD/Comp Off dual approval */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
        <p className="font-medium">⚠️ Note: OD and Comp Off leaves require approval from both HR and Admin before they are finalized.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredLeaves.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card/20 rounded-lg border border-white/5">
            No pending leave requests found matching your search.
          </div>
        ) : (
          filteredLeaves.map((leave) => (
            <Card key={leave.id} className="bg-card/40 backdrop-blur border-white/10 hover:border-primary/30 transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">{leave.employeeName}</h3>
                      <Badge variant="outline" className="text-primary border-primary/20">{leave.employeeCode}</Badge>
                      <Badge variant="secondary" className="bg-white/5">{leave.type}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-400">
                      <div><span className="text-gray-500">Duration:</span> {leave.startDate} to {leave.endDate} ({leave.duration})</div>
                      <div><span className="text-gray-500">Applied:</span> {leave.appliedDate}</div>
                    </div>

                    <div className="mt-4 p-3 bg-black/20 rounded-md border border-white/5">
                      <p className="text-sm text-gray-300 italic">"{leave.description}"</p>
                    </div>
                    
                    {leave.attachment && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div role="button" className="flex items-center gap-2 text-xs text-primary mt-2 cursor-pointer hover:underline">
                            <FileText className="w-3 h-3" />
                            View Attachment
                          </div>
                        </DialogTrigger>
                        <DialogContent className="bg-card/95 border-white/10 w-[90vw] max-w-4xl">
                          <DialogHeader>
                            <DialogTitle className="text-white">Attachment Preview</DialogTitle>
                            <DialogDescription className="text-sm text-gray-400">Preview the uploaded attachment</DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            {leave.attachment.startsWith('data:application/pdf') ? (
                              <iframe src={leave.attachment} className="w-full h-[70vh] border rounded" title="attachment-pdf" />
                            ) : (
                              <img src={leave.attachment} alt="attachment" className="mx-auto max-h-[70vh] object-contain" />
                            )}
                          </div>
                          <DialogFooter>
                            <a href={leave.attachment} download className="text-sm text-primary hover:underline">Download</a>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  <div className="flex items-center gap-3 md:flex-col md:justify-center min-w-[150px]">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedLeaveId(leave.id)}
                          className="flex-1 w-full bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-600/20 hover:border-green-600/50"
                          data-testid={`button-approve-${leave.id}`}
                          title={['OD', 'Comp Off'].includes(leave.type) ? 'Requires approval from both HR and Admin' : ''}
                        >
                          <Check className="w-4 h-4 mr-2" /> Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card/95 border-white/10">
                        <DialogHeader>
                          <DialogTitle className="text-white">Approve Leave Request</DialogTitle>
                          <DialogDescription className="text-sm text-gray-400">Are you sure you want to approve this leave request?</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" className="border-white/10 hover:bg-white/5">Cancel</Button>
                          <DialogClose asChild>
                            <Button onClick={() => handleAction(leave.id, 'Approved')} className="bg-green-600 hover:bg-green-700 text-white">Confirm Approval</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline"
                          className="flex-1 w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border-red-600/20 hover:border-red-600/50"
                          data-testid={`button-reject-${leave.id}`}
                        >
                          <X className="w-4 h-4 mr-2" /> Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-white/10 text-white">
                        <DialogHeader>
                          <DialogTitle>Reject Leave Request</DialogTitle>
                          <DialogDescription>
                            Please provide a reason for rejection. This will be visible to the employee.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                          <Label htmlFor="reason" className="text-gray-300">Rejection Reason</Label>
                          <Textarea 
                            id="reason" 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g. Critical project delivery deadline..."
                            className="bg-black/20 border-white/10 text-white mt-2"
                          />
                        </div>
                        <DialogFooter>
                          <Button variant="outline" className="border-white/10 hover:bg-white/5">Cancel</Button>
                          <DialogClose asChild>
                            <Button 
                              onClick={() => handleAction(leave.id, 'Rejected', rejectReason)}
                              disabled={!rejectReason}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Confirm Rejection
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
