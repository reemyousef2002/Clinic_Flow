import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth/login")({
  head: () => ({ meta: [{ title: "Sign in — ClinicFlow" }] }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(3, "Password required"),
  remember: z.boolean().optional(),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@clinicflow.io", password: "admin123", remember: true },
  });

  const onSubmit = handleSubmit(async (v) => {
    try {
      await login(v.email, v.password, v.remember);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  });

  return (
    <AuthLayout>
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Welcome back. Please enter your credentials.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@clinic.com" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPwd ? "text" : "password"} placeholder="••••••••" {...register("password")} />
                <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!watch("remember")} onCheckedChange={(v) => setValue("remember", !!v)} />
                Remember me
              </label>
              <Link to="/auth/forgot" className="text-sm font-medium text-primary hover:underline">Forgot password?</Link>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
          <div className="mt-6 rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">Demo accounts</div>
            <div className="mt-1">admin@clinicflow.io / admin123</div>
            <div>doctor@clinicflow.io / doctor123</div>
            <div>reception@clinicflow.io / reception123</div>
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link to="/auth/register" className="font-medium text-primary hover:underline">Create one</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary to-info lg:block">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">ClinicFlow</div>
              <div className="text-xs opacity-80">Health Suite</div>
            </div>
          </div>
          <div>
            <blockquote className="text-2xl font-medium leading-snug">
              "ClinicFlow transformed how we run our practice — appointments, patients and inventory finally in one place."
            </blockquote>
            <div className="mt-4 text-sm opacity-80">— Dr. Amelia Park, Chief of Medicine</div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <Stat n="12k+" l="Clinics" />
            <Stat n="99.9%" l="Uptime" />
            <Stat n="4.9★" l="Rating" />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-muted/30 p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold">{n}</div>
      <div className="opacity-80">{l}</div>
    </div>
  );
}
