import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AdminDeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { user_id: string; full_name: string; email: string; roles: string[] } | null;
  onDeleted: () => void;
}

const AdminDeleteUserDialog = ({ open, onOpenChange, user, onDeleted }: AdminDeleteUserDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [blockEmail, setBlockEmail] = useState(false);
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [activePairings, setActivePairings] = useState(0);
  const [skipEmail, setSkipEmail] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setConfirmText("");
    setBlockEmail(false);
    setReason("");
    setSkipEmail(false);

    supabase
      .from("pairings")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .or(`mentor_id.eq.${user.user_id},mentee_id.eq.${user.user_id}`)
      .then(({ count }) => setActivePairings(count || 0));

    // Detect imported-but-never-invited mentors: no mentor-pool-invite email log
    // for their address AND they have never signed in. For these accounts we skip
    // the deletion notification email since they were never actually onboarded.
    (async () => {
      try {
        const emailLower = user.email.toLowerCase();
        const [{ data: wasInvitedData }, { data: lastSignIns }] = await Promise.all([
          (supabase as any).rpc("was_email_invited", { check_email: emailLower }),
          (supabase as any).rpc("get_mentors_last_sign_in"),
        ]);
        const wasInvited = wasInvitedData === true;
        const signInRow = Array.isArray(lastSignIns)
          ? lastSignIns.find((r: any) => r.user_id === user.user_id)
          : null;
        const hasSignedIn = !!signInRow?.last_sign_in_at;
        setSkipEmail(!wasInvited && !hasSignedIn);
      } catch (err) {
        console.warn("Could not determine invite status", err);
        setSkipEmail(false);
      }
    })();
  }, [open, user]);

  const handleDelete = async () => {
    if (!user || confirmText !== user.email) return;
    setDeleting(true);

    try {
      const adminUser = (await supabase.auth.getUser()).data.user;
      const userRole = user.roles.includes("mentor") ? "mentor" : "mentee";

      // Send account deletion email via server-side function before deleting.
      // Skip for imported mentors who were never invited or signed in — they
      // have no relationship with the platform yet, so the email would be noise.
      if (user.email && !skipEmail) {
        await supabase.functions.invoke("handle-admin-email", {
          body: {
            action: "account-deleted",
            recipientEmail: user.email,
            targetUserId: user.user_id,
            name: user.full_name?.split(" ")[0] || "",
          },
        }).catch(console.error);
      }

      // Block email if requested
      if (blockEmail) {
        await supabase.from("blocked_emails").insert({
          email: user.email.toLowerCase(),
          blocked_by: adminUser?.id || "",
          reason: reason.trim() || "Blocked by admin on account deletion",
        } as any);
      }

      // Log the deletion
      await supabase.from("account_deletions_log").insert({
        deleted_email: user.email,
        deleted_user_role: userRole,
        initiated_by: "admin",
        initiated_by_admin_id: adminUser?.id || null,
        reason: reason.trim() || null,
        email_blocked: blockEmail,
      } as any);

      const { error } = await supabase.rpc("delete_user_account", {
        target_user_id: user.user_id,
      });
      if (error) throw error;

      toast.success(`${user.full_name || "User"}'s account has been deleted.`);
      onOpenChange(false);
      onDeleted();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account.");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  const isAdmin = user.roles.includes("admin");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-body flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Delete User Account
          </DialogTitle>
          <DialogDescription className="font-body">
            Permanently delete <strong>{user.full_name || user.email}</strong>'s account.
          </DialogDescription>
        </DialogHeader>

        {isAdmin ? (
          <div className="font-body text-sm text-muted-foreground p-3 rounded-md bg-muted">
            Admin accounts cannot be deleted from the admin panel to prevent accidental loss of admin access.
          </div>
        ) : (
          <div className="space-y-3 font-body text-sm text-muted-foreground">
            {activePairings > 0 && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <strong>Warning:</strong> This user has {activePairings} active pairing{activePairings > 1 ? "s" : ""}. Their partner(s) will lose access to the pairing.
              </div>
            )}

            <p>The following data will be permanently removed:</p>
            <ul className="list-disc pl-5 space-y-1 text-xs">
              <li>Profile and account credentials</li>
              <li>All messages sent and received</li>
              <li>All pairings, goals, and session logs</li>
              <li>Course progress</li>
              <li>Role assignments</li>
            </ul>

            {skipEmail ? (
              <p className="p-2 rounded-md bg-muted text-xs">
                No deletion email will be sent — this account was imported but never invited or signed in.
              </p>
            ) : (
              <p>An automated email will be sent to <strong>{user.email}</strong> notifying them of the deletion.</p>
            )}

            <div>
              <Label className="font-body text-sm">Reason for deletion (optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Formal data deletion request..."
                className="font-body mt-1.5 min-h-[60px]"
                maxLength={500}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="block-email"
                checked={blockEmail}
                onCheckedChange={(checked) => setBlockEmail(checked === true)}
              />
              <Label htmlFor="block-email" className="font-body text-sm cursor-pointer">
                Prevent this email from creating a new account
              </Label>
            </div>

            <div className="pt-2">
              <p className="font-body text-sm text-foreground mb-2">
                Type <strong>{user.email}</strong> to confirm:
              </p>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={user.email}
                className="font-body"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="font-body">
            Cancel
          </Button>
          {!isAdmin && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={confirmText !== user.email || deleting}
              className="font-body"
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete account
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDeleteUserDialog;
