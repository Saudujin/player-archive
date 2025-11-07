import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Loader2 } from "lucide-react";

interface AdminLoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AdminLoginDialog({
  open,
  onOpenChange,
}: AdminLoginDialogProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAdminAuth();

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess: async (data) => {
      // Store admin info in context
      localStorage.setItem("admin", JSON.stringify(data));
      // Reload to update context
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || "فشل تسجيل الدخول");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    loginMutation.mutate({ username, password });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>تسجيل دخول المشرف</DialogTitle>
          <DialogDescription>
            أدخل اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">اسم المستخدم</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loginMutation.isPending}
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
              autoComplete="current-password"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loginMutation.isPending}
            >
              إلغاء
            </Button>
            <Button type="submit" disabled={loginMutation.isPending}>
              {loginMutation.isPending && (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              )}
              تسجيل الدخول
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
