import { useAuth } from "@/hooks/useAuth";

import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Check,
  X,
  Sparkles,
  RefreshCw,
  Shield,
  UserPlus,
  Ticket,
  Copy,
  Loader2,
  Trash2,
  Ban,
  ClipboardList,
  MessageSquare,
  Upload,
  Mail,
  CalendarDays,
  Camera,
  BookOpen,
  MessagesSquare,
  Quote,
  Star,
  LifeBuoy,
  FileSignature,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SmartAvatarImage } from "@/components/SmartAvatarImage";
import AdminDeleteUserDialog from "@/components/admin/AdminDeleteUserDialog";
import AdminMessaging from "@/components/admin/AdminMessaging";
import AdminMentorImport from "@/components/admin/AdminMentorImport";
import AdminMentorInvites from "@/components/admin/AdminMentorInvites";
import AdminPairingsManagement from "@/components/admin/AdminPairingsManagement";
import AdminWorkshops from "@/components/admin/AdminWorkshops";
import AdminCoursesView from "@/components/courses/AdminCoursesView";
import AdminAiMatching from "@/components/admin/AdminAiMatching";
import AdminForum from "@/components/admin/AdminForum";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import AdminFeedback from "@/components/admin/AdminFeedback";
import AdminHelpCenter from "@/components/admin/AdminHelpCenter";
import AdminAgreements from "@/components/admin/AdminAgreements";
import AdminAgreementTemplate from "@/components/admin/AdminAgreementTemplate";

const Admin = () => {
  const { user, roles, loading } = useAuth();
  const [pendingMentors, setPendingMentors] = useState<any[]>([]);
  const [pendingPairings, setPendingPairings] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [promoteEmail, setPromoteEmail] = useState("");
  const [discountCodes, setDiscountCodes] = useState<any[]>([]);
  const [codeStats, setCodeStats] = useState({ total: 0, redeemed: 0, remaining: 0 });
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [codeCount, setCodeCount] = useState("10");
  const [deleteUser, setDeleteUser] = useState<any>(null);
  const [blockedEmails, setBlockedEmails] = useState<any[]>([]);
  const [deletionLog, setDeletionLog] = useState<any[]>([]);
  const [deletionFilter, setDeletionFilter] = useState("all");
  const [deletionTypeFilter, setDeletionTypeFilter] = useState("all");
  const [recentSelfDeletions, setRecentSelfDeletions] = useState(0);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = roles.includes("admin");

  useEffect(() => {
    if (!user || !isAdmin) return;
    Promise.all([fetchAll(), fetchCodes(), fetchBlockedEmails(), fetchDeletionLog()]);
  }, [user, roles]);

  // Refetch pending lists when admin returns to the tab and on realtime mentor_details changes
  useEffect(() => {
    if (!user || !isAdmin) return;
    const onFocus = () => fetchAll();
    window.addEventListener("focus", onFocus);
    const channel = supabase
      .channel("admin-mentor-details")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mentor_details" },
        () => fetchAll(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pairings" },
        () => fetchAll(),
      )
      .subscribe();
    return () => {
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const fetchBlockedEmails = async () => {
    const { data } = await supabase.from("blocked_emails").select("*").order("created_at", { ascending: false });
    setBlockedEmails(data || []);
  };

  const fetchDeletionLog = async () => {
    const { data } = await supabase.from("account_deletions_log").select("*").order("created_at", { ascending: false });
    const logs = (data || []) as any[];
    setDeletionLog(logs);
    // Count self-deletions in the last 24 hours for notification badge
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    setRecentSelfDeletions(logs.filter((l: any) => l.initiated_by === "self" && l.created_at > oneDayAgo).length);
  };

  const fetchAll = async () => {
    // Fire all initial queries in parallel
    const [mentorsRes, pairingsRes, allProfilesRes, allRolesRes, contactsRes] = await Promise.all([
      supabase.from("mentor_details").select("*").eq("approval_status", "pending"),
      supabase.from("pairings").select("*").eq("admin_approved", false).eq("status", "pending"),
      supabase
        .from("profiles")
        .select(
          "id, user_id, full_name, avatar_url, bio, linkedin_url, expertise, interests, pathway_level, created_at, updated_at, portfolio_url, username, country",
        ),
      supabase.from("user_roles").select("*"),
      supabase.rpc("admin_get_profile_contacts", { _user_ids: null as any }),
    ]);

    const mentors = mentorsRes.data;
    const pairings = pairingsRes.data;
    const contactMap = new Map<string, { email: string | null; phone: string | null }>(
      ((contactsRes.data as any[]) || []).map((r: any) => [r.user_id, { email: r.email, phone: r.phone }]),
    );
    const allProfiles = ((allProfilesRes.data as any[]) || []).map((p: any) => ({
      ...p,
      email: contactMap.get(p.user_id)?.email ?? p.email ?? null,
      phone: contactMap.get(p.user_id)?.phone ?? p.phone ?? null,
    }));
    const allRoles = allRolesRes.data;

    // Build a profile map from all profiles for mentor/pairing lookups
    const allProfileMap = new Map(allProfiles.map((p) => [p.user_id, p]));

    // Pending mentors — enrich with profile data
    if (mentors?.length) {
      setPendingMentors(mentors.map((m) => ({ ...m, profile: allProfileMap.get(m.user_id) })));
    } else {
      setPendingMentors([]);
    }

    // Pending pairings — enrich with names
    if (pairings?.length) {
      setPendingPairings(
        pairings.map((p) => ({
          ...p,
          mentor_name: allProfileMap.get(p.mentor_id)?.full_name || "Unknown",
          mentee_name: allProfileMap.get(p.mentee_id)?.full_name || "Unknown",
        })),
      );
    } else {
      setPendingPairings([]);
    }

    // All users with roles
    if (allProfiles) {
      setAllUsers(
        allProfiles.map((p) => ({
          ...p,
          roles: (allRoles || []).filter((r) => r.user_id === p.user_id).map((r) => r.role),
        })),
      );
    }
  };

  const fetchCodes = async () => {
    const { data: codes } = await supabase.from("discount_codes").select("*").order("created_at", { ascending: false });

    const allCodes = codes || [];
    setDiscountCodes(allCodes);
    const redeemed = allCodes.filter((c: any) => c.redeemed_by).length;
    setCodeStats({ total: allCodes.length, redeemed, remaining: allCodes.length - redeemed });
  };

  const generateCodes = async () => {
    const count = parseInt(codeCount);
    if (isNaN(count) || count < 1 || count > 100) {
      toast.error("Enter a number between 1 and 100.");
      return;
    }
    setGeneratingCodes(true);
    const newCodes = Array.from({ length: count }, () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      return `ASC-${segment()}-${segment()}`;
    });

    const { error } = await supabase.from("discount_codes").insert(newCodes.map((code) => ({ code })));

    if (error) {
      toast.error("Failed to generate codes.");
    } else {
      toast.success(`${count} codes generated!`);
      await fetchCodes();
    }
    setGeneratingCodes(false);
  };

  const revokeCode = async (codeId: string, menteeName: string) => {
    if (!confirm(`Revoke access for ${menteeName}? Their code will become available again and they will lose full mentee access.`)) return;
    const { error } = await supabase
      .from("discount_codes")
      .update({ redeemed_by: null, redeemed_at: null })
      .eq("id", codeId);
    if (error) {
      toast.error("Failed to revoke access.");
    } else {
      toast.success("Access revoked.");
      await fetchCodes();
    }
  };

  const approveMentor = async (userId: string) => {
    const mentor = pendingMentors.find((m) => m.user_id === userId);
    const { error: updateError } = await supabase
      .from("mentor_details")
      .update({ approval_status: "approved" })
      .eq("user_id", userId);
    if (updateError) {
      toast.error("Failed to approve mentor. Please try again.");
      console.error("Mentor approval update failed:", updateError);
      return;
    }
    toast.success("Mentor approved!");
    setPendingMentors((prev) => prev.filter((m) => m.user_id !== userId));

    // Send approval email via server-side function
    {
      const { error: emailError } = await supabase.functions.invoke("handle-admin-email", {
        body: { action: "mentor-approved", mentorUserId: userId },
      });
      if (emailError) {
        toast.error("Mentor approved but approval email failed to send. You may need to resend it manually.");
        console.error("Approval email failed:", emailError);
      }
    }
  };

  const rejectMentor = async (userId: string) => {
    const mentor = pendingMentors.find((m) => m.user_id === userId);
    const { error: updateError } = await supabase
      .from("mentor_details")
      .update({ approval_status: "rejected" })
      .eq("user_id", userId);
    if (updateError) {
      toast.error("Failed to reject mentor. Please try again.");
      console.error("Mentor rejection update failed:", updateError);
      return;
    }
    toast.success("Mentor rejected.");
    setPendingMentors((prev) => prev.filter((m) => m.user_id !== userId));

    // Send rejection email via server-side function
    {
      const { error: emailError } = await supabase.functions.invoke("handle-admin-email", {
        body: { action: "mentor-rejected", mentorUserId: userId },
      });
      if (emailError) {
        toast.error("Mentor rejected but rejection email failed to send.");
        console.error("Rejection email failed:", emailError);
      }
    }
  };

  const approvePairing = async (pairingId: string) => {
    await supabase.from("pairings").update({ admin_approved: true, status: "active" }).eq("id", pairingId);
    toast.success("Pairing approved and activated!");
    setPendingPairings((prev) => prev.filter((p) => p.id !== pairingId));
  };

  const rejectPairing = async (pairingId: string) => {
    await supabase.from("pairings").update({ status: "cancelled" }).eq("id", pairingId);
    toast.success("Pairing rejected.");
    setPendingPairings((prev) => prev.filter((p) => p.id !== pairingId));
  };

  const runAiMatching = async () => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-match", {});
      if (error) throw error;
      setAiSuggestions(data?.suggestions || []);
      toast.success(`AI generated ${data?.suggestions?.length || 0} match suggestions!`);
    } catch (e: any) {
      toast.error(e.message || "AI matching failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const acceptAiMatch = async (suggestion: any) => {
    const { error } = await supabase.from("pairings").insert({
      mentor_id: suggestion.mentor_id,
      mentee_id: suggestion.mentee_id,
      status: "active",
      matched_by: "ai",
      ai_match_score: suggestion.score,
      ai_match_reason: suggestion.reason,
      admin_approved: true,
    });
    if (error) {
      if (error.code === "23505") toast.info("This pairing already exists.");
      else toast.error("Failed to create pairing.");
    } else {
      toast.success("AI match approved and created!");
      setAiSuggestions((prev) =>
        prev.filter((s) => !(s.mentor_id === suggestion.mentor_id && s.mentee_id === suggestion.mentee_id)),
      );
    }
  };

  const promoteToAdmin = async () => {
    if (!promoteEmail.trim()) return;
    const targetUser = allUsers.find((u) => u.email === promoteEmail.trim());
    if (!targetUser) {
      toast.error("User not found.");
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: targetUser.user_id,
      role: "admin" as any,
    });
    if (error) {
      if (error.code === "23505") toast.info("User is already an admin.");
      else toast.error("Failed to promote user.");
    } else {
      toast.success(`${promoteEmail} promoted to admin!`);
      setPromoteEmail("");
      fetchAll();
    }
  };

  const handleAdminAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${targetUserId}/avatar.${ext}`;

    try {
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: path })
        .eq("user_id", targetUserId);
      if (updateError) throw updateError;

      toast.success("User avatar updated successfully!");
      fetchAll(); // Refresh the list
    } catch (err: any) {
      toast.error("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploadingAvatar(false);
      setTargetUserId(null);
      if (adminFileInputRef.current) adminFileInputRef.current.value = "";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;

  return (
    <AdminLayout>
      <input
        type="file"
        ref={adminFileInputRef}
        onChange={handleAdminAvatarUpload}
        accept="image/*"
        className="hidden"
      />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
        </div>

        <Tabs defaultValue="mentors">
          <TabsList className="font-body flex-wrap h-auto w-full justify-start gap-1 p-1">
            <TabsTrigger value="mentors">Pending Mentors ({pendingMentors.length})</TabsTrigger>
            <TabsTrigger value="pairings">Pending Pairings ({pendingPairings.length})</TabsTrigger>
            <TabsTrigger value="active-pairings">Active Pairings</TabsTrigger>
            <TabsTrigger value="ai">
              <Sparkles className="h-4 w-4 mr-1" /> AI Matching
            </TabsTrigger>
            <TabsTrigger value="users">All Users ({allUsers.length})</TabsTrigger>
            <TabsTrigger value="codes">
              <Ticket className="h-4 w-4 mr-1" /> Codes ({codeStats.total})
            </TabsTrigger>
            <TabsTrigger value="blocked">
              <Ban className="h-4 w-4 mr-1" /> Blocked ({blockedEmails.length})
            </TabsTrigger>
            <TabsTrigger value="deletions" className="relative">
              <ClipboardList className="h-4 w-4 mr-1" /> Deletions
              {recentSelfDeletions > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center px-1">
                  {recentSelfDeletions}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-1" /> Messages
            </TabsTrigger>
            <TabsTrigger value="import" className="font-body">
              <Upload className="h-4 w-4 mr-1" /> Import
            </TabsTrigger>
            <TabsTrigger value="invites" className="font-body">
              <Mail className="h-4 w-4 mr-1" /> Invites
            </TabsTrigger>
            <TabsTrigger value="workshops" className="font-body">
              <CalendarDays className="h-4 w-4 mr-1" /> Workshops
            </TabsTrigger>
            <TabsTrigger value="courses" className="font-body">
              <BookOpen className="h-4 w-4 mr-1" /> Courses
            </TabsTrigger>
            <TabsTrigger value="forum" className="font-body">
              <MessagesSquare className="h-4 w-4 mr-1" /> Forum
            </TabsTrigger>
            <TabsTrigger value="testimonials" className="font-body">
              <Quote className="h-4 w-4 mr-1" /> Testimonials
            </TabsTrigger>
            <TabsTrigger value="feedback" className="font-body">
              <Star className="h-4 w-4 mr-1" /> Feedback
            </TabsTrigger>
            <TabsTrigger value="help" className="font-body">
              <LifeBuoy className="h-4 w-4 mr-1" /> Help Center
            </TabsTrigger>
            <TabsTrigger value="agreements" className="font-body">
              <FileSignature className="h-4 w-4 mr-1" /> Agreements
            </TabsTrigger>
            <TabsTrigger value="agreement-template" className="font-body">
              <FileSignature className="h-4 w-4 mr-1" /> Agreement Template
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mentors" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => fetchAll()} className="font-body">
                <RefreshCw className="h-4 w-4 mr-1" /> Refresh
              </Button>
            </div>
            {pendingMentors.map((m) => (
              <Card key={m.user_id} className="shadow-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-body font-semibold">{m.profile?.full_name || "Unknown"}</p>
                    <p className="font-body text-sm text-muted-foreground">{m.profile?.email}</p>
                    <div className="flex gap-1 mt-1">
                      {m.specializations?.map((s: string) => (
                        <Badge key={s} variant="secondary" className="font-body text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approveMentor(m.user_id)} className="font-body">
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectMentor(m.user_id)} className="font-body">
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingMentors.length === 0 && (
              <p className="font-body text-muted-foreground text-center py-8">No pending mentor approvals.</p>
            )}
          </TabsContent>

          <TabsContent value="pairings" className="space-y-4 mt-4">
            {pendingPairings.map((p) => (
              <Card key={p.id} className="shadow-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-body text-sm">
                      <span className="font-semibold">{p.mentee_name}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span className="font-semibold">{p.mentor_name}</span>
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-1">Matched by: {p.matched_by}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => approvePairing(p.id)} className="font-body">
                      <Check className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => rejectPairing(p.id)} className="font-body">
                      <X className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingPairings.length === 0 && (
              <p className="font-body text-muted-foreground text-center py-8">No pending pairings.</p>
            )}
          </TabsContent>

          <TabsContent value="active-pairings" className="mt-4">
            <AdminPairingsManagement allUsers={allUsers} />
          </TabsContent>

          <TabsContent value="ai" className="mt-4">
            <AdminAiMatching />
          </TabsContent>

          <TabsContent value="users" className="space-y-4 mt-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-body text-base flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Promote User to Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="User email..."
                    value={promoteEmail}
                    onChange={(e) => setPromoteEmail(e.target.value)}
                    className="font-body"
                  />
                  <Button onClick={promoteToAdmin} className="font-body">
                    <Shield className="h-4 w-4 mr-1" /> Promote
                  </Button>
                </div>
              </CardContent>
            </Card>

            {allUsers.map((u) => (
              <Card key={u.user_id} className="shadow-card">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 shrink-0">
                      <SmartAvatarImage avatarUrl={u.avatar_url} alt={u.full_name || "User"} />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {u.full_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-body font-medium truncate">{u.full_name || "No name"}</p>
                      <p className="font-body text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        setTargetUserId(u.user_id);
                        adminFileInputRef.current?.click();
                      }}
                      disabled={uploadingAvatar && targetUserId === u.user_id}
                    >
                      {uploadingAvatar && targetUserId === u.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="h-4 w-4" />
                      )}
                    </Button>
                    {u.roles.map((r: string) => (
                      <Badge key={r} variant="secondary" className="font-body text-xs">
                        {r}
                      </Badge>
                    ))}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteUser(u)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="codes" className="space-y-4 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Generated", value: codeStats.total },
                { label: "Redeemed", value: codeStats.redeemed },
                { label: "Remaining", value: codeStats.remaining },
              ].map((s) => (
                <Card key={s.label} className="shadow-card">
                  <CardContent className="p-4 text-center">
                    <p className="font-body text-sm text-muted-foreground">{s.label}</p>
                    <p className="font-display text-2xl font-bold mt-1">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Generate */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-body text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4" /> Generate Discount Codes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={codeCount}
                    onChange={(e) => setCodeCount(e.target.value)}
                    placeholder="Number of codes..."
                    className="font-body w-32"
                  />
                  <Button onClick={generateCodes} disabled={generatingCodes} className="font-body">
                    {generatingCodes ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Ticket className="h-4 w-4 mr-1" />
                    )}
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Activated mentees */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-body text-base">Activated Mentees</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {discountCodes
                  .filter((c: any) => c.redeemed_by)
                  .map((c: any) => {
                    const mentee = allUsers.find((u) => u.user_id === c.redeemed_by);
                    return (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                        <div>
                          <p className="font-body text-sm font-medium">{mentee?.full_name || "Unknown user"}</p>
                          <p className="font-body text-xs text-muted-foreground">
                            Code: {c.code} · {c.redeemed_at ? new Date(c.redeemed_at).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="font-body text-xs">Activated</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            className="font-body text-xs h-7"
                            onClick={() => revokeCode(c.id, mentee?.full_name || "this user")}
                          >
                            <Ban className="h-3.5 w-3.5 mr-1" /> Revoke
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                {discountCodes.filter((c: any) => c.redeemed_by).length === 0 && (
                  <p className="font-body text-sm text-muted-foreground text-center py-4">No codes redeemed yet.</p>
                )}
              </CardContent>
            </Card>

            {/* All codes list */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-body text-base">All Codes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 max-h-64 overflow-y-auto">
                {discountCodes.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/30">
                    <code className="font-mono text-sm">{c.code}</code>
                    <div className="flex items-center gap-2">
                      {c.redeemed_by ? (
                        <Badge variant="secondary" className="font-body text-xs">
                          Used
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="font-body text-xs">
                          Available
                        </Badge>
                      )}
                      <button
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          toast.success("Code copied!");
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                {discountCodes.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground text-center py-4">No codes generated yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4 mt-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-body text-base flex items-center gap-2">
                  <Ban className="h-4 w-4" /> Blocked Email Addresses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {blockedEmails.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                    <div>
                      <p className="font-body text-sm font-medium">{b.email}</p>
                      <p className="font-body text-xs text-muted-foreground">
                        Blocked {new Date(b.created_at).toLocaleDateString()}
                        {b.reason ? ` · ${b.reason}` : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="font-body text-xs"
                      onClick={async () => {
                        await supabase.from("blocked_emails").delete().eq("id", b.id);
                        toast.success("Email unblocked.");
                        fetchBlockedEmails();
                      }}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
                {blockedEmails.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground text-center py-4">No blocked emails.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deletions" className="space-y-4 mt-4">
            <div className="flex gap-2 flex-wrap">
              <Select value={deletionFilter} onValueChange={setDeletionFilter}>
                <SelectTrigger className="font-body w-[140px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="mentor">Mentors</SelectItem>
                  <SelectItem value="mentee">Mentees</SelectItem>
                </SelectContent>
              </Select>
              <Select value={deletionTypeFilter} onValueChange={setDeletionTypeFilter}>
                <SelectTrigger className="font-body w-[160px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="self">Self-deleted</SelectItem>
                  <SelectItem value="admin">Admin-deleted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="shadow-card">
              <CardContent className="space-y-2 p-4">
                {deletionLog
                  .filter((l: any) => deletionFilter === "all" || l.deleted_user_role === deletionFilter)
                  .filter((l: any) => deletionTypeFilter === "all" || l.initiated_by === deletionTypeFilter)
                  .map((l: any) => (
                    <div key={l.id} className="flex items-start justify-between p-3 rounded-md bg-muted/30 gap-4">
                      <div className="min-w-0">
                        <p className="font-body text-sm font-medium truncate">{l.deleted_email}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <Badge variant="secondary" className="font-body text-xs">
                            {l.deleted_user_role}
                          </Badge>
                          <Badge
                            variant={l.initiated_by === "self" ? "outline" : "default"}
                            className="font-body text-xs"
                          >
                            {l.initiated_by === "self" ? "Self-deleted" : "Admin-deleted"}
                          </Badge>
                          {l.email_blocked && (
                            <Badge variant="destructive" className="font-body text-xs">
                              Blocked
                            </Badge>
                          )}
                        </div>
                        {l.reason && <p className="font-body text-xs text-muted-foreground mt-1">Reason: {l.reason}</p>}
                      </div>
                      <p className="font-body text-xs text-muted-foreground shrink-0">
                        {new Date(l.created_at).toLocaleDateString()}{" "}
                        {new Date(l.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))}
                {deletionLog.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground text-center py-8">
                    No account deletions recorded.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-4">
            <AdminMessaging allUsers={allUsers} />
          </TabsContent>

          <TabsContent value="import" className="mt-4">
            <AdminMentorImport />
          </TabsContent>

          <TabsContent value="invites" className="mt-4">
            <AdminMentorInvites allUsers={allUsers} />
          </TabsContent>

          <TabsContent value="workshops" className="mt-4">
            <AdminWorkshops />
          </TabsContent>

          <TabsContent value="courses" className="mt-4">
            <AdminCoursesView />
          </TabsContent>

          <TabsContent value="forum" className="mt-4">
            <AdminForum />
          </TabsContent>

          <TabsContent value="testimonials" className="mt-4">
            <AdminTestimonials />
          </TabsContent>

          <TabsContent value="feedback" className="mt-4">
            <AdminFeedback />
          </TabsContent>

          <TabsContent value="help" className="mt-4">
            <AdminHelpCenter />
          </TabsContent>

          <TabsContent value="agreements" className="mt-4">
            <AdminAgreements />
          </TabsContent>

          <TabsContent value="agreement-template" className="mt-4">
            <AdminAgreementTemplate />
          </TabsContent>
        </Tabs>

        <AdminDeleteUserDialog
          open={!!deleteUser}
          onOpenChange={(open) => {
            if (!open) setDeleteUser(null);
          }}
          user={deleteUser}
          onDeleted={() => {
            fetchAll();
            fetchBlockedEmails();
            fetchDeletionLog();
          }}
        />
      </div>
    </AdminLayout>
  );
};

export default Admin;
