import { useEffect, useState } from "react";
import EmployerLayout from "@/components/employer/EmployerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMyEmployer } from "@/hooks/useEmployer";
import { Loader2, Save, Building2, CreditCard } from "lucide-react";

const EmployerProfilePage = () => {
  const { employer, loading, refresh } = useMyEmployer();
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (employer) {
      setCompanyName(employer.company_name ?? "");
      setWebsite(employer.website ?? "");
      setLogoUrl(employer.logo_url ?? "");
      setDescription(employer.description ?? "");
    }
  }, [employer]);

  const save = async () => {
    if (!employer) return;
    setSaving(true);
    const { error } = await supabase
      .from("employer_details")
      .update({
        company_name: companyName.trim() || null,
        website: website.trim() || null,
        logo_url: logoUrl.trim() || null,
        description: description.trim() || null,
      })
      .eq("id", employer.id);
    setSaving(false);
    if (error) {
      toast({ title: "Could not save", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Company profile updated" });
    await refresh();
  };

  return (
    <EmployerLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Company profile</h1>
          <p className="font-body text-sm text-foreground/70 sora-regular mt-1">
            Details about your organization and your Ascendency plan.
          </p>
        </div>

        {loading || !employer ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="font-body text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" /> Organization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="font-body">Company name</Label>
                  <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-body">Website</Label>
                    <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-body">Logo URL</Label>
                    <Input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-body">Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={600} />
                </div>
                <div className="flex justify-end">
                  <Button onClick={save} disabled={saving} className="font-body sora-semibold">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-body text-lg flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" /> Plan & seats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-body">{employer.plan}</Badge>
                  <Badge variant="outline" className="font-body capitalize">{employer.subscription_status}</Badge>
                </div>
                <p className="font-body text-sm text-foreground/70 sora-regular">
                  You can add up to <strong>{employer.seat_limit}</strong> team members on your current plan.
                </p>
                <Button size="sm" variant="outline" className="font-body sora-semibold" disabled>
                  Upgrade plan (coming soon)
                </Button>
                <p className="font-body text-xs text-muted-foreground">
                  Employer plans are separate from mentee subscription tiers.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </EmployerLayout>
  );
};

export default EmployerProfilePage;