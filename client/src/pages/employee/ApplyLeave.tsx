import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { addLeaveRequest, getLeaveBalance } from '@/lib/storage';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';

const leaveSchema = z.object({
  type: z.enum(['Casual', 'Sick', 'LWP', 'Earned', 'OD', 'Comp Off']),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  duration: z.enum(['Full Day', 'Half Day']),
  description: z.string().min(5, "Reason is required"),
});

type LeaveForm = z.infer<typeof leaveSchema>;

export default function ApplyLeave() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const balance = user ? getLeaveBalance(user.code) : null;

  const form = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      type: 'Casual',
      duration: 'Full Day',
    }
  });

  const onSubmit = (data: LeaveForm) => {
    if (!user) return;

    // Optional: Check balance before submitting (soft check)
    if (data.type === 'Casual' && balance && balance.casual.remaining <= 0) {
      toast({
        title: "Warning",
        description: "You have exhausted your Casual Leave quota. This may be processed as LWP.",
        variant: "destructive"
      });
    }

    addLeaveRequest({
      id: Math.random().toString(36).substr(2, 9),
      employeeId: user.id,
      employeeName: user.name,
      employeeCode: user.code,
      ...data,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "Leave Application Submitted",
      description: "Your manager will review it shortly.",
      className: "bg-primary/10 border-primary/20 text-white"
    });

    setLocation('/employee/dashboard');
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-display font-bold text-white mb-2">Apply for Leave</h2>
          <p className="text-muted-foreground">Submit your leave request for approval</p>
        </div>
        {balance && (
          <div className="flex gap-4 text-xs">
            <div className="bg-card/40 border border-white/10 px-3 py-2 rounded-md">
              <span className="text-gray-400 block">Casual Balance</span>
              <span className={`font-bold ${balance.casual.remaining === 0 ? 'text-red-500' : 'text-primary'}`}>
                {balance.casual.remaining} / {balance.casual.total}
              </span>
            </div>
            <div className="bg-card/40 border border-white/10 px-3 py-2 rounded-md">
              <span className="text-gray-400 block">Sick Balance</span>
              <span className={`font-bold ${balance.sick.remaining === 0 ? 'text-red-500' : 'text-primary'}`}>
                {balance.sick.remaining} / {balance.sick.total}
              </span>
            </div>
          </div>
        )}
      </div>

      <Card className="bg-card/50 backdrop-blur-xl border-white/10 shadow-2xl">
        <CardContent className="pt-6">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="space-y-2">
              <Label className="text-gray-300">Leave Type</Label>
              <Select onValueChange={(val) => form.setValue('type', val as any)} defaultValue={form.getValues('type')}>
                <SelectTrigger className="bg-black/20 border-white/10 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 text-white">
                  <SelectItem value="Casual">Casual Leave</SelectItem>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="OD">On Duty (OD)</SelectItem>
                  <SelectItem value="Comp Off">Comp Off</SelectItem>
                  <SelectItem value="LWP">Leave Without Pay (LWP)</SelectItem>
                  <SelectItem value="Earned">Earned Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Start Date</Label>
                <Input 
                  type="date" 
                  {...form.register('startDate')}
                  className="bg-black/20 border-white/10 text-white" 
                />
                {form.formState.errors.startDate && <p className="text-red-400 text-xs">{form.formState.errors.startDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">End Date</Label>
                <Input 
                  type="date" 
                  {...form.register('endDate')}
                  className="bg-black/20 border-white/10 text-white" 
                />
                 {form.formState.errors.endDate && <p className="text-red-400 text-xs">{form.formState.errors.endDate.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Duration</Label>
              <RadioGroup 
                defaultValue="Full Day" 
                onValueChange={(val) => form.setValue('duration', val as any)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Full Day" id="full" className="border-primary text-primary" />
                  <Label htmlFor="full" className="text-white">Full Day</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Half Day" id="half" className="border-primary text-primary" />
                  <Label htmlFor="half" className="text-white">Half Day</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Reason / Description</Label>
              <Textarea 
                {...form.register('description')}
                placeholder="Please describe the reason for your leave..."
                className="bg-black/20 border-white/10 text-white min-h-[100px]"
              />
              {form.formState.errors.description && <p className="text-red-400 text-xs">{form.formState.errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Attachment (Optional)</Label>
              <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer bg-black/20">
                <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 5MB</p>
              </div>
            </div>

            <div className="pt-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                Submit Application
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}
