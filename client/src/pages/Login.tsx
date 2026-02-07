import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef, useState } from 'react';
import { Lock } from 'lucide-react';
import gsap from 'gsap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

import logoUrl from '@assets/Screenshot_2025-10-15_183825_1765652253224.png';

const loginSchema = z.object({
  code: z.string().min(1, "Employee Code is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [employeeCodeForReset, setEmployeeCodeForReset] = useState('');
  const [sending, setSending] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      code: '',
      password: '',
    }
  });

  useEffect(() => {
    if (user) {
      if (user.role === 'Admin') {
        setLocation('/admin/dashboard');
      } else if (user.role === 'HR') {
        setLocation('/admin/view-leaves');
      } else {
        setLocation('/employee/dashboard');
      }
    }
  }, [user, setLocation]);

  useEffect(() => {
    const tl = gsap.timeline();
    tl.fromTo(
      containerRef.current,
      { opacity: 0, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.8, ease: "power3.out" }
    ).fromTo(
      ".login-element",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.1, duration: 0.5 },
      "-=0.4"
    );
  }, []);

  const onSubmit = async (data: LoginForm) => {
    const code = data.code.trim().toUpperCase();
    const password = data.password.trim();

    const success = await login(code, password);

    if (success) {
      toast({
        title: "Welcome back",
        description: "Login successful",
        className: "bg-primary/10 border-primary/20 text-white"
      });
      return;
    }

    toast({
      title: "Login Failed",
      description: "Invalid Employee Code or Password",
      variant: "destructive",
    });
  };

  const handleForgotPassword = async () => {
    const code = employeeCodeForReset.trim().toUpperCase();

    if (!code) {
      toast({
        title: "Error",
        description: "Employee Code is required",
        variant: "destructive"
      });
      return;
    }

    try {
      setSending(true);

      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeCode: code })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      toast({
        title: "Success",
        description: "Reset link sent to your registered email",
        className: "bg-green-500/10 border-green-500/20 text-white"
      });

      setEmployeeCodeForReset('');
      setForgotPasswordOpen(false);

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send reset link",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      </div>

      <div ref={containerRef} className="w-full max-w-md px-4 relative z-10">
        <div className="mb-8 text-center login-element flex flex-col items-center">
          <img
            src={logoUrl}
            alt="Knockturn Logo"
            className="w-64 h-auto object-contain mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]"
          />
        </div>

        <Card className="bg-card/50 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader className="space-y-1 login-element">
            <CardTitle className="text-3xl text-center text-white font-display mb-2">
              Welcome to LMS Application
            </CardTitle>
            <CardDescription className="text-center text-gray-300">
              Knockturn Private Limited Leave Management System
            </CardDescription>
          </CardHeader>

          <CardContent className="login-element">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Employee Code</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                  <Input
                    {...form.register("code")}
                    placeholder="e.g. A0001 or E0041"
                    className="relative bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 transition-all h-12"
                    autoCapitalize="characters"
                    autoCorrect="off"
                  />
                </div>
                {form.formState.errors.code && (
                  <p className="text-red-400 text-xs mt-1">{form.formState.errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
                  <Input
                    {...form.register("password")}
                    type="password"
                    placeholder="••••••••"
                    className="relative bg-black/40 border-white/10 text-white placeholder:text-gray-600 focus:border-primary/50 transition-all h-12"
                    autoComplete="current-password"
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90 font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-300 mt-6"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "Authenticating..." : "LOGIN TO DASHBOARD"}
              </Button>

              <div className="text-center mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-primary hover:text-primary/80 text-xs font-medium transition-colors"
                  data-testid="button-forgot-password"
                >
                  Forgot Password?
                </button>
                <p className="text-xs text-muted-foreground">
                  Restricted Access. Authorized Personnel Only.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="bg-card border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Forgot Password
            </DialogTitle>
            <DialogDescription>
              Enter your employee code to receive a reset link
            </DialogDescription>
          </DialogHeader>


          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Employee Code</Label>
              <Input
                value={employeeCodeForReset}
                onChange={(e) => setEmployeeCodeForReset(e.target.value)}
                placeholder="Enter your employee code"
                className="bg-black/20 border-white/10 text-white"
                autoCapitalize="characters"
                autoCorrect="off"
              />
              <p className="text-xs text-gray-400">
                We will send a reset link to your registered email
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForgotPasswordOpen(false)}
              className="text-gray-300"
            >
              Cancel
            </Button>

            <Button
              onClick={handleForgotPassword}
              className="bg-primary hover:bg-primary/90"
              disabled={sending}
            >
              {sending ? "Sending..." : "Send Reset Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
