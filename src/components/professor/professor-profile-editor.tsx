"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/i18n";
import { apiFetch } from "@/lib/client-api";

interface ProfileEditorProps {
  professorId: string;
  initial: {
    bio: string;
    researchInterests: string[];
    personalLink: string | null;
    photoUrl: string | null;
  };
}

/** Professor self-service profile editor ("بیوگرافی", "علایق پژوهشی", ...). */
export function ProfessorProfileEditor({ professorId, initial }: ProfileEditorProps) {
  const router = useRouter();
  const [bio, setBio] = React.useState(initial.bio ?? "");
  const [interests, setInterests] = React.useState(initial.researchInterests.join("، "));
  const [personalLink, setPersonalLink] = React.useState(initial.personalLink ?? "");
  const [photoUrl, setPhotoUrl] = React.useState(initial.photoUrl ?? "");
  const [saving, setSaving] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await apiFetch<{ url: string }>("/api/upload", {
        method: "POST",
        body: formData,
      });
      setPhotoUrl(data.url);
      toast.success(t("professorForm.savedToast"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await apiFetch(`/api/professors/${professorId}`, {
        method: "PATCH",
        body: JSON.stringify({
          bio,
          researchInterests: interests
            .split(/[،,]/)
            .map((s) => s.trim())
            .filter(Boolean),
          personalLink,
          photoUrl,
        }),
      });
      toast.success(t("professorForm.savedToast"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("dashboard.profileEditor")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={save}>
          <div className="space-y-2">
            <Label htmlFor="profile-bio">{t("professorForm.bioLabel")}</Label>
            <Textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t("professorForm.bioPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-interests">{t("professorForm.researchLabel")}</Label>
            <Input
              id="profile-interests"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder={t("professorForm.researchPlaceholder")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-link">{t("professorForm.linkLabel")}</Label>
              <Input
                id="profile-link"
                dir="ltr"
                value={personalLink}
                onChange={(e) => setPersonalLink(e.target.value)}
                placeholder={t("professorForm.linkPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-photo">{t("professorForm.photoUrlLabel")}</Label>
              <Input
                id="profile-photo"
                dir="ltr"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder={t("professorForm.photoUrlPlaceholder")}
              />
            </div>
          </div>

          {/* Photo upload */}
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file);
              }}
            />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t("professorForm.uploadPhoto")}
            </Button>
            <span className="text-xs text-muted-foreground">
              JPEG/PNG/WebP — حداکثر ۲ مگابایت
            </span>
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
