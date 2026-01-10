import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';
import { addPermissionRequest, PermissionRequest } from '@/lib/storage';

const permissionSchema = z.object({
  type: z.enum(['Late Entry Permission', 'Early Exit Permission', 'Personal Work Permission', 'Emergency Permission']),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  additionalInfo: z.string().optional(),
});

type PermissionForm = z.infer<typeof permissionSchema>;

export default function Permission({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<PermissionForm>({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      type: 'Late Entry Permission',
    }
  });

  const onSubmit = async (data: PermissionForm) => {
    console.log('Permission onSubmit called', data);
    if (!user) return;

    // Get the correct user_id from AuthContext (the DB user_id stored in `user.id`)
    const user_id = user.id;
    if (!user_id) {
      toast({ title: 'Error', description: 'User not properly logged in. Please log in again.', variant: 'destructive' });
      return;
    }

    const permissionRequest: PermissionRequest = {
      id: Math.random().toString(36).substr(2, 9),
      employeeId: user_id,
      employeeName: user.name,
      employeeCode: user.code,
      type: data.type,
      startTime: data.startTime,
      endTime: data.endTime,
      reason: data.reason,
      additionalInfo: data.additionalInfo,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };

    try {
      await addPermissionRequest(permissionRequest);
    } catch (err) {
      console.error('Failed to submit permission:', err);
      const message = (err as any)?.message || JSON.stringify(err) || 'Could not submit permission request.';
      toast({ title: 'Submission failed', description: message, variant: 'destructive' });
      return;
    }

    // Send email notification to HR and Admin (using fixed fallback emails)
    fetch('/api/send-permission-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeName: user.name,
        permissionType: data.type,
        startTime: data.startTime,
        endTime: data.endTime,
        reason: data.reason,
        hrEmails: ['naveen@ctint.in'],
        adminEmails: ['naveen@ctint.in']
      })
    }).catch(() => {});

    console.log('Permission Request Submitted:', permissionRequest);

    toast({
      title: "✅ Permission Request Submitted",
      description: "Your request has been sent to HR and Admin for approval. Notification sent to their email.",
      className: "bg-green-500/10 border-green-500/20 text-white"
    });

    if (onClose) {
      onClose();
    } else {
      setLocation('/employee/dashboard');
    }
  };

  return (
    <>
      {!onClose ? (
        <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Lock className="w-6 h-6 text-primary" />
              <h2 className="text-3xl font-display font-bold text-white">Request Permission</h2>
            </div>
            <p className="text-muted-foreground">Submit a request for permission you need</p>
          </div>
          <Card className="bg-card/50 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="pt-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-gray-300">Permission Type</Label>
                  <Select onValueChange={(val) => form.setValue('type', val as any)} defaultValue={form.getValues('type')}>
                    <SelectTrigger className="bg-black/20 border-white/10 text-white">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/10 text-white">
                      <SelectItem value="Late Entry Permission">Late Entry Permission</SelectItem>
                      <SelectItem value="Early Exit Permission">Early Exit Permission</SelectItem>
                      <SelectItem value="Personal Work Permission">Personal Work Permission</SelectItem>
                      <SelectItem value="Emergency Permission">Emergency Permission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Start Time</Label>
                    <Input 
                      type="time" 
                      {...form.register('startTime')}
                      className="bg-black/20 border-white/10 text-white" 
                    />
                    {form.formState.errors.startTime && <p className="text-red-400 text-xs">{form.formState.errors.startTime.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">End Time</Label>
                    <Input 
                      type="time" 
                      {...form.register('endTime')}
                      className="bg-black/20 border-white/10 text-white" 
                    />
                    {form.formState.errors.endTime && <p className="text-red-400 text-xs">{form.formState.errors.endTime.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Reason / Justification</Label>
                  <Textarea 
                    {...form.register('reason')}
                    placeholder="Please explain why you need this permission..."
                    className="bg-black/20 border-white/10 text-white min-h-[100px]"
                  />
                  {form.formState.errors.reason && <p className="text-red-400 text-xs">{form.formState.errors.reason.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Additional Information (Optional)</Label>
                  <Textarea 
                    {...form.register('additionalInfo')}
                    placeholder="Add any additional details or context..."
                    className="bg-black/20 border-white/10 text-white min-h-[80px]"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    Submit Permission Request
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-gray-300">Permission Type</Label>
            <Select onValueChange={(val) => form.setValue('type', val as any)} defaultValue={form.getValues('type')}>
              <SelectTrigger className="bg-black/20 border-white/10 text-white">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 text-white">
                <SelectItem value="Late Entry Permission">Late Entry Permission</SelectItem>
                <SelectItem value="Early Exit Permission">Early Exit Permission</SelectItem>
                <SelectItem value="Personal Work Permission">Personal Work Permission</SelectItem>
                <SelectItem value="Emergency Permission">Emergency Permission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Start Time</Label>
              <Input 
                type="time" 
                {...form.register('startTime')}
                className="bg-black/20 border-white/10 text-white" 
              />
              {form.formState.errors.startTime && <p className="text-red-400 text-xs">{form.formState.errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">End Time</Label>
              <Input 
                type="time" 
                {...form.register('endTime')}
                className="bg-black/20 border-white/10 text-white" 
              />
              {form.formState.errors.endTime && <p className="text-red-400 text-xs">{form.formState.errors.endTime.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Reason / Justification</Label>
            <Textarea 
              {...form.register('reason')}
              placeholder="Please explain why you need this permission..."
              className="bg-black/20 border-white/10 text-white min-h-[100px]"
            />
            {form.formState.errors.reason && <p className="text-red-400 text-xs">{form.formState.errors.reason.message}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-gray-300">Additional Information (Optional)</Label>
            <Textarea 
              {...form.register('additionalInfo')}
              placeholder="Add any additional details or context..."
              className="bg-black/20 border-white/10 text-white min-h-[80px]"
            />
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              Submit Permission Request
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
