"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Camera, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserAvatar } from "@/components/user/UserAvatar";
import { apiFetch } from "@/lib/api/client";
import type {
  Gender,
  AgeRange,
  Education,
  Occupation,
  PoliticalParty,
  PoliticalStance,
} from "@/types/database";

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "no_answer", label: "回答しない" },
];

const AGE_RANGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: "18-24", label: "18-24歳" },
  { value: "25-29", label: "25-29歳" },
  { value: "30-34", label: "30-34歳" },
  { value: "35-39", label: "35-39歳" },
  { value: "40-44", label: "40-44歳" },
  { value: "45-49", label: "45-49歳" },
  { value: "50-54", label: "50-54歳" },
  { value: "55-59", label: "55-59歳" },
  { value: "60-64", label: "60-64歳" },
  { value: "65_and_over", label: "65歳以上" },
];

const EDUCATION_OPTIONS: { value: Education; label: string }[] = [
  { value: "junior_high", label: "中学校卒" },
  { value: "high_school", label: "高校卒" },
  { value: "vocational", label: "専門学校卒" },
  { value: "junior_college", label: "短大卒" },
  { value: "university", label: "大学卒" },
  { value: "masters", label: "大学院卒（修士）" },
  { value: "doctorate", label: "大学院卒（博士）" },
  { value: "other", label: "その他" },
];

const OCCUPATION_OPTIONS: { value: Occupation; label: string }[] = [
  { value: "company_employee", label: "会社員" },
  { value: "civil_servant", label: "公務員" },
  { value: "self_employed", label: "自営業・フリーランス" },
  { value: "executive", label: "経営者・役員" },
  { value: "professional", label: "専門職（医師・弁護士等）" },
  { value: "educator_researcher", label: "教育・研究職" },
  { value: "student", label: "学生" },
  { value: "homemaker", label: "主婦・主夫" },
  { value: "part_time", label: "パート・アルバイト" },
  { value: "unemployed", label: "無職" },
  { value: "retired", label: "退職者" },
  { value: "other", label: "その他" },
];

const POLITICAL_PARTY_OPTIONS: { value: PoliticalParty; label: string }[] = [
  { value: "ldp", label: "自由民主党" },
  { value: "cdp", label: "立憲民主党" },
  { value: "nippon_ishin", label: "日本維新の会" },
  { value: "komeito", label: "公明党" },
  { value: "dpfp", label: "国民民主党" },
  { value: "jcp", label: "日本共産党" },
  { value: "reiwa", label: "れいわ新選組" },
  { value: "sdp", label: "社会民主党" },
  { value: "sanseito", label: "参政党" },
  { value: "other", label: "その他" },
  { value: "no_party", label: "支持政党なし" },
  { value: "no_answer", label: "回答しない" },
];

const POLITICAL_STANCE_OPTIONS: {
  value: PoliticalStance;
  label: string;
}[] = [
  { value: "left", label: "左派" },
  { value: "center_left", label: "やや左派" },
  { value: "center", label: "中道" },
  { value: "center_right", label: "やや右派" },
  { value: "right", label: "右派" },
];

interface UserProfile {
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  attributes: {
    gender: Gender | null;
    age_range: AgeRange | null;
    education: Education | null;
    occupation: Occupation | null;
    political_party: PoliticalParty | null;
    political_stance: PoliticalStance | null;
    is_gender_public: boolean;
    is_age_range_public: boolean;
    is_education_public: boolean;
    is_occupation_public: boolean;
    is_political_party_public: boolean;
    is_political_stance_public: boolean;
  } | null;
}

export default function ProfileEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [gender, setGender] = useState<Gender | null>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [education, setEducation] = useState<Education | null>(null);
  const [occupation, setOccupation] = useState<Occupation | null>(null);
  const [politicalParty, setPoliticalParty] = useState<PoliticalParty | null>(null);
  const [politicalStance, setPoliticalStance] = useState<PoliticalStance | null>(null);

  const [isGenderPublic, setIsGenderPublic] = useState(true);
  const [isAgeRangePublic, setIsAgeRangePublic] = useState(true);
  const [isEducationPublic, setIsEducationPublic] = useState(true);
  const [isOccupationPublic, setIsOccupationPublic] = useState(true);
  const [isPoliticalPartyPublic, setIsPoliticalPartyPublic] = useState(true);
  const [isPoliticalStancePublic, setIsPoliticalStancePublic] = useState(true);

  useEffect(() => {
    apiFetch<UserProfile>("/api/users/me")
      .then((data) => {
        setDisplayName(data.display_name);
        setBio(data.bio ?? "");
        setAvatarUrl(data.avatar_url);
        if (data.attributes) {
          setGender(data.attributes.gender);
          setAgeRange(data.attributes.age_range);
          setEducation(data.attributes.education);
          setOccupation(data.attributes.occupation);
          setPoliticalParty(data.attributes.political_party);
          setPoliticalStance(data.attributes.political_stance);
          setIsGenderPublic(data.attributes.is_gender_public);
          setIsAgeRangePublic(data.attributes.is_age_range_public);
          setIsEducationPublic(data.attributes.is_education_public);
          setIsOccupationPublic(data.attributes.is_occupation_public);
          setIsPoliticalPartyPublic(data.attributes.is_political_party_public);
          setIsPoliticalStancePublic(data.attributes.is_political_stance_public);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const data = await apiFetch<{ avatarUrl: string }>("/api/users/me/avatar", {
        method: "POST",
        headers: {},
        body: formData,
      });
      setAvatarUrl(data.avatarUrl);
    } catch {
      // handle error
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSuccessMessage("");
    try {
      await apiFetch("/api/users/me", {
        method: "PUT",
        body: JSON.stringify({ displayName, bio: bio || null }),
      });

      await apiFetch("/api/users/me/attributes", {
        method: "PUT",
        body: JSON.stringify({
          gender,
          ageRange,
          education,
          occupation,
          politicalParty,
          politicalStance,
          isGenderPublic,
          isAgeRangePublic,
          isEducationPublic,
          isOccupationPublic,
          isPoliticalPartyPublic,
          isPoliticalStancePublic,
        }),
      });

      setSuccessMessage("保存しました");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-40 border-b bg-background/80 backdrop-blur-lg lg:top-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">プロフィール編集</h1>
          </div>
          <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-full">
            {saving ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-1.5 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      </div>

      {successMessage && (
        <div className="border-b bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary">
          {successMessage}
        </div>
      )}

      <div className="space-y-8 px-4 py-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <UserAvatar src={avatarUrl} displayName={displayName} size="lg" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105"
            >
              {uploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground">
            JPG/PNG、最大2MB
          </p>
        </div>

        {/* Basic Info */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            基本情報
          </h2>
          <div className="space-y-2">
            <Label htmlFor="displayName">ユーザー名（表示名）</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={30}
              className="rounded-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={160}
              className="resize-none rounded-lg"
            />
            <p className="text-right text-xs text-muted-foreground">{bio.length}/160</p>
          </div>
        </section>

        {/* Attributes */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            プロフィール情報
          </h2>
          <p className="text-xs text-muted-foreground">
            各項目の公開/非公開を切り替えられます。非公開にしても統計集計には利用されます。
          </p>

          <div className="space-y-4 rounded-xl border bg-card p-4">
            <AttributeField
              label="性別"
              value={gender}
              options={GENDER_OPTIONS}
              onChange={(v) => setGender(v as Gender | null)}
              isPublic={isGenderPublic}
              onPublicChange={setIsGenderPublic}
            />

            <AttributeField
              label="年齢帯"
              value={ageRange}
              options={AGE_RANGE_OPTIONS}
              onChange={(v) => setAgeRange(v as AgeRange | null)}
              isPublic={isAgeRangePublic}
              onPublicChange={setIsAgeRangePublic}
            />

            <AttributeField
              label="学歴"
              value={education}
              options={EDUCATION_OPTIONS}
              onChange={(v) => setEducation(v as Education | null)}
              isPublic={isEducationPublic}
              onPublicChange={setIsEducationPublic}
            />

            <AttributeField
              label="職業"
              value={occupation}
              options={OCCUPATION_OPTIONS}
              onChange={(v) => setOccupation(v as Occupation | null)}
              isPublic={isOccupationPublic}
              onPublicChange={setIsOccupationPublic}
            />
          </div>
        </section>

        {/* Political Attributes */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            政治的な立場
          </h2>
          <div className="rounded-xl border border-amber-200/60 bg-amber-50/50 p-3 text-xs text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/20 dark:text-amber-300">
            政治的な立場・支持政党は「要配慮個人情報」に該当します。公開設定の変更はいつでも可能です。
          </div>

          <div className="space-y-4 rounded-xl border bg-card p-4">
            <AttributeField
              label="支持政党"
              value={politicalParty}
              options={POLITICAL_PARTY_OPTIONS}
              onChange={(v) => setPoliticalParty(v as PoliticalParty | null)}
              isPublic={isPoliticalPartyPublic}
              onPublicChange={setIsPoliticalPartyPublic}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>政治的な立場</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {isPoliticalStancePublic ? "公開" : "非公開"}
                  </span>
                  <Switch
                    checked={isPoliticalStancePublic}
                    onCheckedChange={setIsPoliticalStancePublic}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between gap-1.5">
                {POLITICAL_STANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setPoliticalStance(
                        politicalStance === opt.value ? null : opt.value
                      )
                    }
                    className={`flex-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all duration-200 ${
                      politicalStance === opt.value
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-border bg-background hover:bg-accent"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function AttributeField({
  label,
  value,
  options,
  onChange,
  isPublic,
  onPublicChange,
}: {
  label: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (value: string | null) => void;
  isPublic: boolean;
  onPublicChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isPublic ? "公開" : "非公開"}
          </span>
          <Switch checked={isPublic} onCheckedChange={onPublicChange} />
        </div>
      </div>
      <Select
        value={value ?? ""}
        onValueChange={(v) => onChange(v || null)}
      >
        <SelectTrigger className="rounded-lg">
          <SelectValue placeholder="選択してください" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
