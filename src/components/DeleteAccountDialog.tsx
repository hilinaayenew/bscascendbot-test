import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activePairings?: number;
}

const DeleteAccountDialog = ({ open, onOpenChange, activePairings = 0 }: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { user, profile, roles, signOut } = useAuth();

  const handleDelete = async () => {
    if (confirmText !== "delete" || !user) return;
    setDeleting(true);

    try {
      const userEmail = profile?.email || user.email || "";
      const userRole = roles.includes("mentor") ? "mentor" : "mentee";

      // Log the deletion before wiping data
      await supabase.from("account_deletions_log").insert({
        deleted_email: userEmail,
        deleted_user_role: userRole,
        initiated_by: "self",
        email_blocked: false,
      } as any);

      // Send self-deletion confirmation email to the user
      supabase.functions.invoke("handle-admin-email", {
        body: {
          action: "account-self-deleted",
          recipientEmail: userEmail,
          name: profile?.full_name?.split(" ")[0] || "",
        },
      }).catch(console.error);

      // Notify admin via server-side email function
      supabase.functions.invoke("handle-admin-email", {
        body: {
          action: "admin-deletion-notice-self",
          userId: user.id,
          deletedEmail: userEmail,
          deletedRole: userRole,
        },
      }).catch(console.error);

      const { error } = await supabase.rpc("delete_user_account", {
        target_user_id: user.id,
      });
      if (error) throw error;

      await signOut();
      navigate("/", { replace: true });
      toast.success("Your account has been permanently deleted.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-body flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Delete Account
          </DialogTitle>
          <DialogDescription className="font-body">
            This action is permanent and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 font-body text-sm text-muted-foreground">
          {activePairings > 0 && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm font-body">
              <strong>Warning:</strong> You have {activePairings} active pairing{activePairings > 1 ? "s" : ""}. Your mentor/mentee will be notified that the pairing has ended.
            </div>
          )}

          <p>When you delete your account:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Your profile will be permanently removed from the platform</li>
            <li>You will no longer appear in search or on the Explore page</li>
            <li>Your message history will be deleted</li>
            <li>Any active pairings will be ended</li>
            <li>Your course progress will be deleted</li>
            <li>This action cannot be undone</li>
          </ul>

          <div className="pt-2">
            <p className="font-body text-sm text-foreground mb-2">
              Type <strong>delete</strong> to confirm:
            </p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "delete"'
              className="font-body"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmText !== "delete" || deleting}
            className="font-body"
          >
            {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Delete my account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
