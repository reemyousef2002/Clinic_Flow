import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { AuthLayout } from "./auth.login";

export const Route = createFileRoute("/auth/forgot")({
  head: () => ({ meta: [{ title: "Forgot password — ClinicFlow" }] }),
  component: ForgotPage,
});

function ForgotPage() {
  const [sent, setSent] = useState(false);
  return (
    <AuthLayout>
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <h1 className="text-2xl font-semibold tracking-tight">Forgot password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter your email and we'll send you a reset link.</p>
          {sent ? (
            <div className="mt-6 rounded-lg bg-success/10 p-4 text-sm text-success-foreground">
              <div className="font-semibold text-success">Check your inbox</div>
              <p className="mt-1 text-muted-foreground">If an account exists, a reset link is on its way.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
                toast.success("Reset link sent (demo)");
              }}
              className="mt-6 space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required />
              </div>
              <Button type="submit" className="w-full">Send reset link</Button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember it?{" "}
            <Link to="/auth/login" className="font-medium text-primary hover:underline">Back to sign in</Link>
          </p>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
