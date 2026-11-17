import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import appLogo from "@/assets/app-icon.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronLeft, LogOut, Trash2, MoreVertical } from "lucide-react";

export const AVATAR_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#059669",
  "#d97706",
  "#0891b2",
  "#4f46e5",
];

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface AppHeaderProps {
  username?: string;
  backTo?: string;
  title?: string;
}

export function AppHeader({ username = "User", backTo, title }: AppHeaderProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.rpc("delete_user");
    if (error) {
      toast.error("Failed to delete account: " + error.message);
    } else {
      await supabase.auth.signOut();
      toast.success("Your account has been deleted.");
      navigate("/login");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/80 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {backTo && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(backTo)}
                className="h-9 w-9 text-muted-foreground hover:text-foreground"
                aria-label="Back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}

            <Link to="/" className="flex items-center gap-2 group">
              <img
                src={appLogo}
                alt="KeepTabs"
                className="h-8 w-8 transition-transform group-hover:scale-105 drop-shadow-sm"
              />
              <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline">
                KeepTabs
              </span>
            </Link>

            {title && (
              <div className="flex items-center gap-2 pl-2 border-l border-border text-foreground font-semibold">
                <span>{title}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-2 py-1.5 h-auto rounded-full hover:bg-accent focus-visible:ring-1"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      style={{ backgroundColor: getAvatarColor(username) }}
                    >
                      {getInitials(username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm hidden sm:inline max-w-[120px] truncate">
                    {username}
                  </span>
                  <MoreVertical className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-foreground truncate">{username}</p>
                  <p className="text-xs text-muted-foreground">KeepTabs Member</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4 text-muted-foreground" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="gap-2 text-destructive focus:bg-destructive/15 focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete Account</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all associated data from KeepTabs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount}>
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
