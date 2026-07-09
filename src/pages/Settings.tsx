import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, X, Plus, Save, Loader2, ChevronDown, Ticket, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { resolveAvatarUrl } from "@/lib/utils";
import { useActivation } from "@/hooks/useActivation";
import DiscountCodeModal from "@/components/DiscountCodeModal";
import DeleteAccountDialog from "@/components/DeleteAccountDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COUNTRY_CODES = [
  // Africa (all 54 countries)
  { code: "+213", label: "🇩🇿 Algeria +213", country: "Algeria" },
  { code: "+244", label: "🇦🇴 Angola +244", country: "Angola" },
  { code: "+229", label: "🇧🇯 Benin +229", country: "Benin" },
  { code: "+267", label: "🇧🇼 Botswana +267", country: "Botswana" },
  { code: "+226", label: "🇧🇫 Burkina Faso +226", country: "Burkina Faso" },
  { code: "+257", label: "🇧🇮 Burundi +257", country: "Burundi" },
  { code: "+238", label: "🇨🇻 Cabo Verde +238", country: "Cabo Verde" },
  { code: "+237", label: "🇨🇲 Cameroon +237", country: "Cameroon" },
  { code: "+236", label: "🇨🇫 Central African Republic +236", country: "Central African Republic" },
  { code: "+235", label: "🇹🇩 Chad +235", country: "Chad" },
  { code: "+269", label: "🇰🇲 Comoros +269", country: "Comoros" },
  { code: "+242", label: "🇨🇬 Congo +242", country: "Congo" },
  { code: "+243", label: "🇨🇩 DR Congo +243", country: "DR Congo" },
  { code: "+225", label: "🇨🇮 Côte d'Ivoire +225", country: "Côte d'Ivoire" },
  { code: "+253", label: "🇩🇯 Djibouti +253", country: "Djibouti" },
  { code: "+20", label: "🇪🇬 Egypt +20", country: "Egypt" },
  { code: "+240", label: "🇬🇶 Equatorial Guinea +240", country: "Equatorial Guinea" },
  { code: "+291", label: "🇪🇷 Eritrea +291", country: "Eritrea" },
  { code: "+268", label: "🇸🇿 Eswatini +268", country: "Eswatini" },
  { code: "+251", label: "🇪🇹 Ethiopia +251", country: "Ethiopia" },
  { code: "+241", label: "🇬🇦 Gabon +241", country: "Gabon" },
  { code: "+220", label: "🇬🇲 Gambia +220", country: "Gambia" },
  { code: "+233", label: "🇬🇭 Ghana +233", country: "Ghana" },
  { code: "+224", label: "🇬🇳 Guinea +224", country: "Guinea" },
  { code: "+245", label: "🇬🇼 Guinea-Bissau +245", country: "Guinea-Bissau" },
  { code: "+254", label: "🇰🇪 Kenya +254", country: "Kenya" },
  { code: "+266", label: "🇱🇸 Lesotho +266", country: "Lesotho" },
  { code: "+231", label: "🇱🇷 Liberia +231", country: "Liberia" },
  { code: "+218", label: "🇱🇾 Libya +218", country: "Libya" },
  { code: "+261", label: "🇲🇬 Madagascar +261", country: "Madagascar" },
  { code: "+265", label: "🇲🇼 Malawi +265", country: "Malawi" },
  { code: "+223", label: "🇲🇱 Mali +223", country: "Mali" },
  { code: "+222", label: "🇲🇷 Mauritania +222", country: "Mauritania" },
  { code: "+230", label: "🇲🇺 Mauritius +230", country: "Mauritius" },
  { code: "+212", label: "🇲🇦 Morocco +212", country: "Morocco" },
  { code: "+258", label: "🇲🇿 Mozambique +258", country: "Mozambique" },
  { code: "+264", label: "🇳🇦 Namibia +264", country: "Namibia" },
  { code: "+227", label: "🇳🇪 Niger +227", country: "Niger" },
  { code: "+234", label: "🇳🇬 Nigeria +234", country: "Nigeria" },
  { code: "+250", label: "🇷🇼 Rwanda +250", country: "Rwanda" },
  { code: "+239", label: "🇸🇹 São Tomé & Príncipe +239", country: "São Tomé & Príncipe" },
  { code: "+221", label: "🇸🇳 Senegal +221", country: "Senegal" },
  { code: "+248", label: "🇸🇨 Seychelles +248", country: "Seychelles" },
  { code: "+232", label: "🇸🇱 Sierra Leone +232", country: "Sierra Leone" },
  { code: "+252", label: "🇸🇴 Somalia +252", country: "Somalia" },
  { code: "+27", label: "🇿🇦 South Africa +27", country: "South Africa" },
  { code: "+211", label: "🇸🇸 South Sudan +211", country: "South Sudan" },
  { code: "+249", label: "🇸🇩 Sudan +249", country: "Sudan" },
  { code: "+255", label: "🇹🇿 Tanzania +255", country: "Tanzania" },
  { code: "+228", label: "🇹🇬 Togo +228", country: "Togo" },
  { code: "+216", label: "🇹🇳 Tunisia +216", country: "Tunisia" },
  { code: "+256", label: "🇺🇬 Uganda +256", country: "Uganda" },
  { code: "+260", label: "🇿🇲 Zambia +260", country: "Zambia" },
  { code: "+263", label: "🇿🇼 Zimbabwe +263", country: "Zimbabwe" },
  // Rest of the world
  { code: "+93", label: "🇦🇫 Afghanistan +93", country: "Afghanistan" },
  { code: "+54", label: "🇦🇷 Argentina +54", country: "Argentina" },
  { code: "+61", label: "🇦🇺 Australia +61", country: "Australia" },
  { code: "+43", label: "🇦🇹 Austria +43", country: "Austria" },
  { code: "+880", label: "🇧🇩 Bangladesh +880", country: "Bangladesh" },
  { code: "+32", label: "🇧🇪 Belgium +32", country: "Belgium" },
  { code: "+55", label: "🇧🇷 Brazil +55", country: "Brazil" },
  { code: "+1", label: "🇨🇦 Canada +1", country: "Canada" },
  { code: "+56", label: "🇨🇱 Chile +56", country: "Chile" },
  { code: "+86", label: "🇨🇳 China +86", country: "China" },
  { code: "+57", label: "🇨🇴 Colombia +57", country: "Colombia" },
  { code: "+45", label: "🇩🇰 Denmark +45", country: "Denmark" },
  { code: "+358", label: "🇫🇮 Finland +358", country: "Finland" },
  { code: "+33", label: "🇫🇷 France +33", country: "France" },
  { code: "+49", label: "🇩🇪 Germany +49", country: "Germany" },
  { code: "+30", label: "🇬🇷 Greece +30", country: "Greece" },
  { code: "+91", label: "🇮🇳 India +91", country: "India" },
  { code: "+62", label: "🇮🇩 Indonesia +62", country: "Indonesia" },
  { code: "+353", label: "🇮🇪 Ireland +353", country: "Ireland" },
  { code: "+972", label: "🇮🇱 Israel +972", country: "Israel" },
  { code: "+39", label: "🇮🇹 Italy +39", country: "Italy" },
  { code: "+1876", label: "🇯🇲 Jamaica +1876", country: "Jamaica" },
  { code: "+81", label: "🇯🇵 Japan +81", country: "Japan" },
  { code: "+60", label: "🇲🇾 Malaysia +60", country: "Malaysia" },
  { code: "+52", label: "🇲🇽 Mexico +52", country: "Mexico" },
  { code: "+31", label: "🇳🇱 Netherlands +31", country: "Netherlands" },
  { code: "+64", label: "🇳🇿 New Zealand +64", country: "New Zealand" },
  { code: "+47", label: "🇳🇴 Norway +47", country: "Norway" },
  { code: "+92", label: "🇵🇰 Pakistan +92", country: "Pakistan" },
  { code: "+63", label: "🇵🇭 Philippines +63", country: "Philippines" },
  { code: "+48", label: "🇵🇱 Poland +48", country: "Poland" },
  { code: "+351", label: "🇵🇹 Portugal +351", country: "Portugal" },
  { code: "+974", label: "🇶🇦 Qatar +974", country: "Qatar" },
  { code: "+966", label: "🇸🇦 Saudi Arabia +966", country: "Saudi Arabia" },
  { code: "+65", label: "🇸🇬 Singapore +65", country: "Singapore" },
  { code: "+82", label: "🇰🇷 South Korea +82", country: "South Korea" },
  { code: "+34", label: "🇪🇸 Spain +34", country: "Spain" },
  { code: "+94", label: "🇱🇰 Sri Lanka +94", country: "Sri Lanka" },
  { code: "+46", label: "🇸🇪 Sweden +46", country: "Sweden" },
  { code: "+41", label: "🇨🇭 Switzerland +41", country: "Switzerland" },
  { code: "+66", label: "🇹🇭 Thailand +66", country: "Thailand" },
  { code: "+90", label: "🇹🇷 Turkey +90", country: "Turkey" },
  { code: "+971", label: "🇦🇪 UAE +971", country: "UAE" },
  { code: "+44", label: "🇬🇧 United Kingdom +44", country: "United Kingdom" },
  { code: "+1", label: "🇺🇸 United States +1", country: "United States" },
  { code: "+84", label: "🇻🇳 Vietnam +84", country: "Vietnam" },
].sort((a, b) => a.country.localeCompare(b.country));

const TECHNICAL_SKILLS = [
  "Agile Methodologies",
  "Android Development",
  "Angular",
  "API Design",
  "Artificial Intelligence",
  "AWS",
  "Azure",
  "Blockchain",
  "Business Analysis",
  "C++",
  "Cloud Architecture",
  "Cybersecurity",
  "Data Analysis",
  "Data Engineering",
  "Data Science",
  "Database Management",
  "DevOps",
  "Django",
  "Docker",
  "Embedded Systems",
  "Financial Modeling",
  "Flutter",
  "Go",
  "Google Cloud",
  "GraphQL",
  "HTML/CSS",
  "iOS Development",
  "Java",
  "JavaScript",
  "Kotlin",
  "Kubernetes",
  "Machine Learning",
  "Marketing Analytics",
  "MATLAB",
  "Microservices",
  "MongoDB",
  "Natural Language Processing",
  "Node.js",
  "NoSQL",
  "PHP",
  "PostgreSQL",
  "Product Management",
  "Python",
  "R",
  "React",
  "React Native",
  "REST APIs",
  "Ruby",
  "Rust",
  "Salesforce",
  "Scala",
  "Scrum",
  "SQL",
  "Swift",
  "Tableau",
  "TensorFlow",
  "TypeScript",
  "UI/UX Design",
  "Unity",
  "Vue.js",
  "Web Development",
].sort();

const SOFT_SKILLS = [
  "Adaptability",
  "Coaching",
  "Communication",
  "Conflict Resolution",
  "Creative Thinking",
  "Critical Thinking",
  "Decision Making",
  "Delegation",
  "Emotional Intelligence",
  "Empathy",
  "Entrepreneurship",
  "Facilitation",
  "Giving Feedback",
  "Goal Setting",
  "Innovation",
  "Leadership",
  "Mentoring",
  "Negotiation",
  "Networking",
  "Organizational Skills",
  "Presentation Skills",
  "Problem Solving",
  "Project Management",
  "Public Speaking",
  "Resilience",
  "Self-Motivation",
  "Strategic Thinking",
  "Teamwork",
  "Time Management",
  "Work-Life Balance",
].sort();

const Settings = () => {
  const { user, profile, roles, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isMentor = roles.includes("mentor");
  const isMentee = roles.includes("mentee");
  const { isActivated, codeUsed, activatedAt, loading: activationLoading } = useActivation();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [activePairings, setActivePairings] = useState(0);
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setBio(profile.bio || "");
      setEmail(profile.email || "");
      setCountry((profile as any).country || "");
      const savedPhone = profile.phone || "";
      const matchedCode = COUNTRY_CODES.find((c) => savedPhone.startsWith(c.code));
      if (matchedCode) {
        setCountryCode(matchedCode.code);
        setPhone(savedPhone.slice(matchedCode.code.length).trim());
      } else {
        setPhone(savedPhone);
      }
      setLinkedinUrl(profile.linkedin_url || "");
      setPortfolioUrl((profile as any).portfolio_url || "");
      setExpertise(profile.expertise || []);
      setInterests(profile.interests || []);
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      supabase
        .from("pairings")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
        .then(({ count }) => setActivePairings(count || 0));
    }
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-body">Loading...</div>;
  if (!user) return <Navigate to="/mentee-auth" replace />;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB.");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    if (uploadError) {
      toast.error("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${urlData.publicUrl}?t=${Date.now()}`;
    setAvatarUrl(url);

    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    toast.success("Profile picture updated!");
    setUploading(false);
  };

  const addSkill = () => {
    const trimmed = newSkill.trim();
    if (expertise.length >= 6) {
      toast.error("Maximum of 6 technical skills allowed.");
      return;
    }
    if (trimmed && !expertise.includes(trimmed)) {
      setExpertise([...expertise, trimmed]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setExpertise(expertise.filter((s) => s !== skill));
  };

  const addInterest = () => {
    const trimmed = newInterest.trim();
    if (interests.length >= 6) {
      toast.error("Maximum of 6 soft skills allowed.");
      return;
    }
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter((i) => i !== interest));
  };

  const isValidUrl = (url: string): boolean => {
    if (!url.trim()) return true; // optional fields
    try {
      const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  };

  const isValidLinkedin = (url: string): boolean => {
    if (!url.trim()) return true;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    try {
      const parsed = new URL(normalized);
      return parsed.hostname.includes("linkedin.com");
    } catch {
      return false;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    } else if (fullName.trim().length > 100) {
      newErrors.fullName = "Name must be under 100 characters.";
    }

    if (bio.length > 500) {
      newErrors.bio = "Bio must be under 500 characters.";
    }

    if (linkedinUrl.trim() && !isValidLinkedin(linkedinUrl)) {
      newErrors.linkedinUrl = "Please enter a valid LinkedIn URL (e.g. linkedin.com/in/yourprofile).";
    }

    if (portfolioUrl.trim() && !isValidUrl(portfolioUrl)) {
      newErrors.portfolioUrl = "Please enter a valid URL.";
    }

    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving.");
      return;
    }

    const normalizeUrl = (u: string) => {
      const trimmed = u.trim();
      if (!trimmed) return "";
      if (trimmed.startsWith("http")) return trimmed;
      return `https://${trimmed}`;
    };
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        bio: bio.trim(),
        email: email.trim(),
        country: country.trim(),
        phone: phone.trim() ? `${countryCode} ${phone.trim()}` : "",
        linkedin_url: normalizeUrl(linkedinUrl),
        portfolio_url: normalizeUrl(portfolioUrl),
        expertise,
        interests,
      } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save. Please try again.");
    } else {
      toast.success("Profile updated successfully!");
      await refreshProfile();
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Profile Settings</h1>
            <p className="font-body text-muted-foreground mt-1">
              Manage your profile details. Your name, bio, and skills are visible to other community members.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="font-body shrink-0"
            onClick={() =>
              navigate("/dashboard/profile/preview", {
                state: {
                  formData: {
                    full_name: fullName,
                    bio,
                    email,
                    country,
                    phone: phone.trim() ? `${countryCode} ${phone.trim()}` : "",
                    linkedin_url: linkedinUrl,
                    portfolio_url: portfolioUrl,
                    expertise,
                    interests,
                    avatar_url: avatarUrl,
                  },
                },
              })
            }
          >
            <Eye className="h-4 w-4 mr-1.5" /> Preview my profile
          </Button>
        </div>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-lg">Profile Picture</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={resolveAvatarUrl(avatarUrl) || undefined} alt={fullName} />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {fullName?.[0]?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploading ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <p className="font-body text-sm text-muted-foreground">
                  Click the avatar to upload a new picture. Max 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-lg">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrors((p) => ({ ...p, fullName: "" }));
                }}
                placeholder="Your full name"
                className={`font-body mt-1.5 ${errors.fullName ? "border-destructive" : ""}`}
              />
              {errors.fullName && <p className="font-body text-xs text-destructive mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <Label className="font-body">Bio</Label>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the community about yourself..."
                className="font-body mt-1.5 min-h-[100px]"
                maxLength={500}
              />
              <p className="font-body text-xs text-muted-foreground mt-1">{bio.length}/500</p>
            </div>
            <div>
              <Label className="font-body">LinkedIn URL</Label>
              <Input
                value={linkedinUrl}
                onChange={(e) => {
                  setLinkedinUrl(e.target.value);
                  setErrors((p) => ({ ...p, linkedinUrl: "" }));
                }}
                placeholder="https://linkedin.com/in/yourprofile"
                className={`font-body mt-1.5 ${errors.linkedinUrl ? "border-destructive" : ""}`}
              />
              {errors.linkedinUrl && <p className="font-body text-xs text-destructive mt-1">{errors.linkedinUrl}</p>}
            </div>
            <div>
              <Label className="font-body">Portfolio / Website</Label>
              <Input
                value={portfolioUrl}
                onChange={(e) => {
                  setPortfolioUrl(e.target.value);
                  setErrors((p) => ({ ...p, portfolioUrl: "" }));
                }}
                placeholder="https://yourwebsite.com"
                className={`font-body mt-1.5 ${errors.portfolioUrl ? "border-destructive" : ""}`}
              />
              {errors.portfolioUrl && <p className="font-body text-xs text-destructive mt-1">{errors.portfolioUrl}</p>}
            </div>
            <div>
              <Label className="font-body">Country</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. United Kingdom"
                className="font-body mt-1.5"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-lg">Contact Details</CardTitle>
            <p className="font-body text-sm text-muted-foreground">
              This information is private and will not be displayed on your public profile.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-body">Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors((p) => ({ ...p, email: "" }));
                }}
                placeholder="your@email.com"
                className={`font-body mt-1.5 ${errors.email ? "border-destructive" : ""}`}
              />
              {errors.email && <p className="font-body text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div>
              <Label className="font-body">Phone</Label>
              <div className="flex gap-2 mt-1.5">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="font-body w-[110px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRY_CODES.map((c) => (
                      <SelectItem key={c.code} value={c.code} className="font-body">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="font-body"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-lg">Technical Skills</CardTitle>
            <p className="font-body text-sm text-muted-foreground">
              Select up to 6 technical skills ({expertise.length}/6).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex gap-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (expertise.length < 6 && !expertise.includes(value)) {
                      setExpertise([...expertise, value]);
                    } else if (expertise.length >= 6) {
                      toast.error("Maximum of 6 technical skills allowed.");
                    }
                  }}
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Choose from list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TECHNICAL_SKILLS.filter((s) => !expertise.includes(s)).map((skill) => (
                      <SelectItem key={skill} value={skill} className="font-body">
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  placeholder="Or type a custom skill..."
                  className="font-body"
                />
                <Button type="button" size="icon" variant="outline" onClick={addSkill} disabled={expertise.length >= 6}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {expertise.map((skill) => (
                  <Badge key={skill} variant="secondary" className="font-body gap-1 pr-1">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {expertise.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground">No technical skills added yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Soft Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="font-body text-lg">Soft Skills</CardTitle>
            <p className="font-body text-sm text-muted-foreground">
              Select up to 6 soft skills ({interests.length}/6).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex gap-2">
                <Select
                  value=""
                  onValueChange={(value) => {
                    if (interests.length < 6 && !interests.includes(value)) {
                      setInterests([...interests, value]);
                    } else if (interests.length >= 6) {
                      toast.error("Maximum of 6 soft skills allowed.");
                    }
                  }}
                >
                  <SelectTrigger className="font-body">
                    <SelectValue placeholder="Choose from list..." />
                  </SelectTrigger>
                  <SelectContent>
                    {SOFT_SKILLS.filter((s) => !interests.includes(s)).map((skill) => (
                      <SelectItem key={skill} value={skill} className="font-body">
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                  placeholder="Or type a custom skill..."
                  className="font-body"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={addInterest}
                  disabled={interests.length >= 6}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {interests.map((interest) => (
                  <Badge key={interest} variant="outline" className="font-body gap-1 pr-1">
                    {interest}
                    <button onClick={() => removeInterest(interest)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {interests.length === 0 && (
                  <p className="font-body text-sm text-muted-foreground">No soft skills added yet.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Code (mentees only) */}
        {isMentee && (
          <Card>
            <CardHeader>
              <CardTitle className="font-body text-lg flex items-center gap-2">
                <Ticket className="h-5 w-5" /> Access Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activationLoading ? (
                <p className="font-body text-sm text-muted-foreground">Checking activation status…</p>
              ) : isActivated ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="font-body">Activated</Badge>
                    <span className="font-body text-sm text-muted-foreground">Code: {codeUsed}</span>
                  </div>
                  {activatedAt && (
                    <p className="font-body text-xs text-muted-foreground">
                      Activated on {new Date(activatedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="font-body text-sm text-muted-foreground">
                    Enter a discount code to unlock full mentor access — pairing, sessions, and direct messaging.
                  </p>
                  <Button variant="outline" className="font-body" onClick={() => setShowCodeModal(true)}>
                    <Ticket className="h-4 w-4 mr-2" /> Enter Access Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={saving} className="font-body px-8">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>

        {/* Delete Account */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="font-body text-lg text-destructive flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="font-body text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button variant="destructive" size="sm" className="font-body" onClick={() => setShowDeleteDialog(true)}>
              Delete my account
            </Button>
          </CardContent>
        </Card>

        <div className="pb-8" />

        <DiscountCodeModal
          open={showCodeModal}
          onOpenChange={setShowCodeModal}
          onActivated={() => window.location.reload()}
        />
        <DeleteAccountDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          activePairings={activePairings}
        />
      </div>
    </DashboardLayout>
  );
};

export default Settings;
