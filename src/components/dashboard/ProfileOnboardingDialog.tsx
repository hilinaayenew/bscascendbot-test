/**
 * First-run onboarding dialog. Appears once per user after they land on
 * the dashboard with an incomplete profile. Fully skippable; skip state
 * is stored per-user in localStorage so it does not nag on every visit.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SmartAvatarImage } from "@/components/SmartAvatarImage";
import { Camera, Check, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { profileChecks, profileStrength } from "@/lib/profileStrength";

const SKIP_KEY_PREFIX = "onboarding_skipped:";

export default function ProfileOnboardingDialog() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Decide whether to open the dialog when auth/profile loads.
  useEffect(() => {
    if (!user || !profile) return;
    const skipKey = SKIP_KEY_PREFIX + user.id;
    const skipped = localStorage.getItem(skipKey) === "true";
    const strength = profileStrength(profile as any);
    // Show only when profile is meaningfully incomplete and not previously dismissed.
    if (!skipped && strength < 80) {
      setOpen(true);
    }
  }, [user, profile]);

  // Sync form state when profile hydrates.
  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name || "");
    setBio(profile.bio || "");
    setCountry((profile as any).country || "");
    setPhone(profile.phone || "");
    setLinkedinUrl(profile.linkedin_url || "");
    setAvatarUrl(profile.avatar_url || null);
  }, [profile]);

  const draftProfile = useMemo(
    () => ({
      ...(profile || {}),
      full_name: fullName,
      bio,
      country,
      phone,
      linkedin_url: linkedinUrl,
      avatar_url: avatarUrl,
    }),
    [profile, fullName, bio, country, phone, linkedinUrl, avatarUrl],
  );

  const strength = profileStrength(draftProfile as any);
  const checks = profileChecks(draftProfile as any);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) return toast.error("Please upload an image file.");
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be under 2MB.");

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed. Please try again.");
      setUploading(false);
      return;
    }
    setAvatarUrl(path);
    await supabase.from("profiles").update({ avatar_url: path }).eq("user_id", user.id);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!fullName.trim()) return toast.error("Please add your full name.");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        bio: bio.trim(),
        country: country.trim(),
        phone: phone.trim(),
        linkedin_url: linkedinUrl.trim(),
      } as any)
      .eq("user_id", user.id);
    setSaving(false);
    if (error) return toast.error("Failed to save. Please try again.");
    toast.success("Profile updated!");
    await refreshProfile();
    localStorage.setItem(SKIP_KEY_PREFIX + user.id, "true");
    setOpen(false);
  };

  const handleSkip = () => {
    if (user) localStorage.setItem(SKIP_KEY_PREFIX + user.id, "true");
    setOpen(false);
  };

  const goToSettings = () => {
    if (user) localStorage.setItem(SKIP_KEY_PREFIX + user.id, "true");
    setOpen(false);
    navigate("/dashboard/settings");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleSkip())}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full text-[11px] font-body font-semibold bg-primary/10 text-primary">
            <Sparkles className="h-3 w-3" />
            Welcome to Ascendency
          </div>
          <DialogTitle className="font-display text-xl">Let's set up your profile</DialogTitle>
          <DialogDescription className="font-body">
            A strong profile helps you connect faster. This only takes a minute — you can skip and finish later in Settings.
          </DialogDescription>
        </DialogHeader>

        {/* Strength meter */}
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-body text-xs font-semibold text-foreground/80">Profile strength</span>
            <span className="font-body text-xs font-bold text-primary">{strength}%</span>
          </div>
          <Progress value={strength} className="h-2" />
          <p className="font-body text-[11px] text-muted-foreground">
            {strength < 50
              ? "Getting started — a photo, bio and skills go a long way."
              : strength < 100
              ? "Nice progress. A few more details will make your profile shine."
              : "Your profile looks great."}
          </p>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            {avatarUrl ? (
              <SmartAvatarImage avatarUrl={avatarUrl} alt={fullName || "You"} />
            ) : (
              <AvatarFallback className="font-body text-lg">
                {(fullName || "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-body"
            >
              {uploading ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Camera className="h-4 w-4 mr-1.5" />}
              {avatarUrl ? "Change photo" : "Add photo"}
            </Button>
            <p className="font-body text-[11px] text-muted-foreground mt-1">Max 2MB. JPG or PNG.</p>
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <Label className="font-body text-xs font-semibold">Full name</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="font-body mt-1"
            />
          </div>
          <div>
            <Label className="font-body text-xs font-semibold">Country</Label>
            <Input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. Nigeria"
              className="font-body mt-1"
            />
          </div>
          <div>
            <Label className="font-body text-xs font-semibold">Short bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A sentence or two about what you do and what you're working on."
              rows={3}
              maxLength={500}
              className="font-body mt-1 resize-none"
            />
            <p className="font-body text-[11px] text-muted-foreground mt-0.5">{bio.length}/500</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="font-body text-xs font-semibold">Phone (optional)</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 …"
                className="font-body mt-1"
              />
            </div>
            <div>
              <Label className="font-body text-xs font-semibold">LinkedIn (optional)</Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/…"
                className="font-body mt-1"
              />
            </div>
          </div>
        </div>

        {/* Remaining checklist to encourage full completion in Settings */}
        <div className="rounded-lg border border-dashed border-border p-3">
          <p className="font-body text-xs font-semibold text-foreground/80 mb-2">What's left</p>
          <div className="flex flex-wrap gap-1.5">
            {checks.map((c) => (
              <Badge
                key={c.key}
                variant={c.done ? "secondary" : "outline"}
                className="font-body text-[11px] gap-1"
              >
                {c.done && <Check className="h-3 w-3" />}
                {c.label}
              </Badge>
            ))}
          </div>
          <p className="font-body text-[11px] text-muted-foreground mt-2">
            Skills and more can be added in Settings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button variant="ghost" onClick={handleSkip} className="font-body sm:w-auto">
            Skip for now
          </Button>
          <div className="sm:ml-auto flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={goToSettings} className="font-body">
              Finish in Settings <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button onClick={handleSave} disabled={saving} className="font-body">
              {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Save & continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}