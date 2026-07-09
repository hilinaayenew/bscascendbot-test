import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, CheckSquare, Square, Loader2, Users, Info, RotateCw, AlertTriangle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AdminMentorInvitesProps {
  allUsers: any[];
}

const AdminMentorInvites = ({ allUsers }: AdminMentorInvitesProps) => {
  const [invitedEmails, setInvitedEmails] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [sendingEmails, setSendingEmails] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSignIns, setLastSignIns] = useState<Record<string, string | null>>({});
  const [showOnlyInactive, setShowOnlyInactive] = useState(true);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);

  // Filter users to only those with 'mentor' role
  const mentors = allUsers.filter((u) => u.roles?.includes("mentor") && u.email);

  useEffect(() => {
    fetchEmailLogs();
  }, [allUsers]);

  const fetchEmailLogs = async () => {
    if (mentors.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Fetch logs to see who already received the invite.
      // email_send_log is service-role only, so we go through an admin RPC.
      const [emailLogs, loginData] = await Promise.all([
        (supabase as any).rpc("admin_get_invited_mentor_emails"),
        (supabase as any).rpc("get_mentors_last_sign_in"),
      ]);

      if (emailLogs.error) {
        console.error("admin_get_invited_mentor_emails failed", emailLogs.error);
      }
      // We ignore loginData error in case the RPC hasn't been deployed yet
      // but we log it for debugging
      if (loginData.error) {
        console.warn("RPC get_mentors_last_sign_in not available yet or failed", loginData.error);
      }

      setInvitedEmails((prev) => {
        // Merge server data with any optimistic additions so newly-sent
        // invites aren't wiped out before the email_send_log row is written.
        const merged = new Set(prev);
        if (emailLogs.data) {
          emailLogs.data.forEach((row: any) => {
            const email = row.recipient_email || row;
            if (email && typeof email === "string") {
              merged.add(email.toLowerCase());
            }
          });
        }
        return merged;
      });

      if (loginData.data) {
        const logins: Record<string, string | null> = {};
        loginData.data.forEach((item: any) => {
          logins[item.user_id] = item.last_sign_in_at;
        });
        setLastSignIns(logins);
      }
    } catch (error) {
      console.error("Error fetching admin data", error);
    } finally {
      setLoading(false);
    }
  };

  const isInactive = (user: any) => {
    // If we have login data, check if last_sign_in_at is null
    if (lastSignIns[user.id] !== undefined) {
      return lastSignIns[user.id] === null;
    }
    // Fallback: If no login data yet, assume inactive
    return true;
  };

  // PENDING = imported mentors (never signed in) AND not yet invited.
  // This list is strictly limited to imported, uninvited mentors regardless of the toggle.
  const notInvitedMentors = mentors.filter(
    (m) => isInactive(m) && !invitedEmails.has(m.email.toLowerCase())
  );

  // ALREADY INVITED = anyone who has received the invite email OR has signed in.
  // The toggle controls whether we hide signed-in mentors from this list.
  const invitedMentors = mentors.filter((m) => {
    const wasInvited = invitedEmails.has(m.email.toLowerCase());
    const hasSignedIn = !isInactive(m);
    if (showOnlyInactive) {
      // Only show invited mentors who haven't signed in yet
      return wasInvited && !hasSignedIn;
    }
    return wasInvited || hasSignedIn;
  });

  const toggleSelection = (email: string) => {
    const newSelection = new Set(selectedEmails);
    if (newSelection.has(email)) {
      newSelection.delete(email);
    } else {
      newSelection.add(email);
    }
    setSelectedEmails(newSelection);
  };

  const selectAll = () => {
    if (selectedEmails.size === notInvitedMentors.length && notInvitedMentors.length > 0) {
      setSelectedEmails(new Set());
    } else {
      setSelectedEmails(new Set(notInvitedMentors.map((m) => m.email)));
    }
  };

  const sendInvites = async () => {
    if (selectedEmails.size === 0) {
      toast.error("No mentors selected.");
      return;
    }

    setSendingEmails(true);
    setProgress(0);

    const emailsToInvite = Array.from(selectedEmails);

    try {
      // Send in batches of 10
      const batchSize = 10;

      for (let i = 0; i < emailsToInvite.length; i += batchSize) {
        const batch = emailsToInvite.slice(i, i + batchSize);

        const { data, error } = await supabase.functions.invoke("send-mentor-invites", {
          body: { emails: batch },
        });

        if (error) {
          console.error("Batch send error:", error);
          toast.error("Batch error: " + error.message);
        }

        setProgress(Math.min(100, Math.round(((i + batchSize) / emailsToInvite.length) * 100)));
      }

      toast.success(`Finished sending ${emailsToInvite.length} invite emails!`);
      // Optimistically move sent emails out of "pending" immediately so the UI updates
      // without waiting for the async email log write to be readable.
      setInvitedEmails((prev) => {
        const next = new Set(prev);
        emailsToInvite.forEach((e) => next.add(e.toLowerCase()));
        return next;
      });
      setSelectedEmails(new Set());
      // Refresh from the server in the background to confirm
      await fetchEmailLogs();
    } catch (err: any) {
      toast.error("Failed to send emails: " + (err.message || "Unknown error"));
    } finally {
      setSendingEmails(false);
    }
  };

  // Resend a fresh recovery link to a single mentor (e.g. their previous link expired).
  const resendInvite = async (email: string) => {
    if (!email) return;
    setResendingEmail(email);
    try {
      const { error } = await supabase.functions.invoke("send-mentor-invites", {
        body: { emails: [email] },
      });
      if (error) {
        toast.error("Failed to resend: " + error.message);
      } else {
        toast.success(`Fresh invite link sent to ${email}`);
        setInvitedEmails((prev) => {
          const next = new Set(prev);
          next.add(email.toLowerCase());
          return next;
        });
      }
    } catch (err: any) {
      toast.error("Failed to resend: " + (err.message || "Unknown error"));
    } finally {
      setResendingEmail(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context banner explaining link expiry */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs font-body text-amber-900 leading-relaxed">
          <strong>Invite links expire after ~1 hour.</strong> If a mentor reports they
          can't sign in or the link says "expired/invalid", use the <em>Resend</em>{" "}
          button next to their name in the <em>Already Invited</em> list to send a
          fresh link. "Never signed in" simply means they haven't completed password
          setup yet — it does not mean the email failed to deliver.
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-dashed border-muted-foreground/20">
        <div className="flex items-center gap-3">
          <Info className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm font-medium font-body">Activity Filter</p>
            <p className="text-xs text-muted-foreground font-body">
              {showOnlyInactive
                ? "Currently showing only mentors who haven't logged in yet."
                : "Showing all mentors regardless of login status."}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="inactive-filter" className="text-sm font-body cursor-pointer">
            Inactives Only
          </Label>
          <Switch id="inactive-filter" checked={showOnlyInactive} onCheckedChange={setShowOnlyInactive} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-card border-none bg-blue-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-body text-sm text-muted-foreground">Not Invited</p>
                <p className="font-display text-2xl font-bold text-blue-900">{notInvitedMentors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-none bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-body text-sm text-muted-foreground">Already Invited</p>
                <p className="font-display text-2xl font-bold text-green-900">{invitedMentors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-body text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Mentors Pending Invitations
          </CardTitle>
          {notInvitedMentors.length > 0 && (
            <Button
              onClick={sendInvites}
              disabled={sendingEmails || selectedEmails.size === 0}
              size="sm"
              className="font-body bg-purple-600 hover:bg-purple-700 text-white"
            >
              {sendingEmails ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Send {selectedEmails.size > 0 ? selectedEmails.size : ""} Invites
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sendingEmails && (
            <div className="mb-4 space-y-2">
              <div className="flex justify-between text-xs font-body text-muted-foreground">
                <span>Sending emails...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {notInvitedMentors.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 flex items-center border-b">
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 text-sm font-body text-muted-foreground hover:text-foreground"
                >
                  {selectedEmails.size === notInvitedMentors.length ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                  Select All
                </button>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left text-sm font-body">
                  <tbody>
                    {notInvitedMentors.map((m) => (
                      <tr
                        key={m.email}
                        className={`border-b last:border-0 hover:bg-muted/20 cursor-pointer ${
                          selectedEmails.has(m.email) ? "bg-purple-50/50" : ""
                        }`}
                        onClick={() => toggleSelection(m.email)}
                      >
                        <td className="px-4 py-3 w-10">
                          {selectedEmails.has(m.email) ? (
                            <CheckSquare className="h-4 w-4 text-purple-600" />
                          ) : (
                            <Square className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{m.full_name || "Unknown"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant="outline" className="text-amber-600 bg-amber-50">
                            Pending Invite
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center border rounded-md bg-muted/20 border-dashed">
              <p className="text-muted-foreground font-body text-sm">All imported mentors have been invited!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {invitedMentors.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-body text-base flex items-center gap-2 text-muted-foreground">
              <CheckSquare className="h-4 w-4" /> Already Invited
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              <table className="w-full text-left text-sm font-body">
                <tbody>
                  {invitedMentors.map((m) => (
                    <tr key={m.email} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium text-muted-foreground">{m.full_name || "Unknown"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{m.email}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="secondary" className="bg-green-50 text-green-700">
                            Invited
                          </Badge>
                          {lastSignIns[m.id] ? (
                            <span className="text-[10px] text-muted-foreground">
                              Active since {new Date(lastSignIns[m.id]!).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600">Not signed in yet</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right w-32">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={resendingEmail === m.email}
                          onClick={() => resendInvite(m.email)}
                          className="font-body text-xs h-8"
                        >
                          {resendingEmail === m.email ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <RotateCw className="h-3 w-3 mr-1" />
                          )}
                          Resend
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMentorInvites;
