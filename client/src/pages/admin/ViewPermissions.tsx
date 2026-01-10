import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getStoredPermissions, updatePermissionStatus, PermissionRequest } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check, X, Lock, Clock } from 'lucide-react';
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

export default function ViewPermissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [selectedPermissionId, setSelectedPermissionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPermissions = async () => {
      const allPermissions = await getStoredPermissions();
      setPermissions(allPermissions.filter(p => p.status === 'Pending'));
      setLoading(false);
    };
    loadPermissions();
  }, []);

  const handleAction = async (id: string, status: 'Approved' | 'Rejected', reason?: string) => {
    console.log('ViewPermissions.handleAction', { id, status, reason, user });
    if (!user) {
      console.warn('No user in context; aborting action');
      return;
    }

    await updatePermissionStatus(id, status, `${user.code} (${user.name})`, reason);
    const allPermissions = await getStoredPermissions();
    setPermissions(allPermissions.filter(p => p.status === 'Pending'));

    toast({
      title: `Permission ${status}`,
      description: `Request has been ${status.toLowerCase()}.`,
      className: status === 'Approved' ? "bg-green-500/10 border-green-500/20 text-white" : "bg-red-500/10 border-red-500/20 text-white"
    });

    setRejectReason('');
    setSelectedPermissionId(null);
  };

  const filteredPermissions = permissions.filter(p =>
    p.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionTypeColor = (type: string) => {
    switch (type) {
      case 'Late Entry Permission':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Early Exit Permission':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'Personal Work Permission':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'Emergency Permission':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">View Pending Permissions</h2>
          <p className="text-muted-foreground">Review and take action on permission requests</p>
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

      <div className="grid grid-cols-1 gap-4">
        {filteredPermissions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground bg-card/20 rounded-lg border border-white/5">
            <Lock className="w-12 h-12 mx-auto mb-3 opacity-50" />
            No pending permission requests found.
          </div>
        ) : (
          filteredPermissions.map((permission) => (
            <Card key={permission.id} className="bg-card/40 backdrop-blur border-white/5 hover:border-primary/50 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{permission.employeeName}</p>
                      <p className="text-sm text-gray-400">{permission.employeeCode}</p>
                    </div>
                    <Badge className={`${getPermissionTypeColor(permission.type)} border`}>
                      {permission.type}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 px-3 bg-black/20 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-400">Start Time</p>
                      <p className="text-sm font-medium text-white">{permission.startTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">End Time</p>
                      <p className="text-sm font-medium text-white">{permission.endTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Applied Date</p>
                      <p className="text-sm font-medium text-white">{permission.appliedDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Status</p>
                      <Badge variant="secondary" className="mt-1">{permission.status}</Badge>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-1">Reason:</p>
                    <p className="text-sm text-gray-400 bg-black/20 p-3 rounded">{permission.reason}</p>
                  </div>

                  {permission.additionalInfo && (
                    <div>
                      <p className="text-sm font-medium text-gray-300 mb-1">Additional Info:</p>
                      <p className="text-sm text-gray-400 bg-black/20 p-3 rounded">{permission.additionalInfo}</p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedPermissionId(permission.id)}
                          className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card/95 border-white/10">
                        <DialogHeader>
                          <DialogTitle className="text-white">Approve Permission Request</DialogTitle>
                          <DialogDescription>
                            Employee: <span className="text-primary font-semibold">{permission.employeeName}</span>
                          </DialogDescription>
                        </DialogHeader>
                        <p className="text-sm text-gray-300">Are you sure you want to approve this permission request?</p>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            className="border-white/10 hover:bg-white/5"
                          >
                            Cancel
                          </Button>
                          <DialogClose asChild>
                            <Button
                              onClick={() => handleAction(permission.id, 'Approved')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Confirm Approval
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => setSelectedPermissionId(permission.id)}
                          className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card/95 border-white/10">
                        <DialogHeader>
                          <DialogTitle className="text-white">Reject Permission Request</DialogTitle>
                          <DialogDescription>
                            Employee: <span className="text-primary font-semibold">{permission.employeeName}</span>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="text-gray-300">Reason for Rejection (Optional)</Label>
                            <Textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="Provide a reason for rejection..."
                              className="mt-2 bg-black/20 border-white/10 text-white min-h-[100px]"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            className="border-white/10 hover:bg-white/5"
                          >
                            Cancel
                          </Button>
                          <DialogClose asChild>
                            <Button
                              onClick={() => handleAction(permission.id, 'Rejected', rejectReason)}
                              className="bg-red-600 hover:bg-red-700"
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
