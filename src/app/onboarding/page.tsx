"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, BadgeCheck, BarChart3, Shield } from "lucide-react";
import { toast } from "sonner";
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
  position: number;
}[] = [
  { value: "left", label: "左派", position: 0 },
  { value: "center_left", label: "やや左派", position: 1 },
  { value: "center", label: "中道", position: 2 },
  { value: "center_right", label: "やや右派", position: 3 },
  { value: "right", label: "右派", position: 4 },
];

interface ProfileData {
  displayName: string;
  bio: string;
  gender: Gender | null;
  ageRange: AgeRange | null;
  education: Education | null;
  occupation: Occupation | null;
  politicalParty: PoliticalParty | null;
  politicalStance: PoliticalStance | null;
  sensitiveInfoConsented: boolean;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    displayName: "",
    bio: "",
    gender: null,
    ageRange: null,
    education: null,
    occupation: null,
    politicalParty: null,
    politicalStance: null,
    sensitiveInfoConsented: false,
  });

  const totalSteps = 4;

  async function handleComplete() {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Update display name
      if (profile.displayName) {
        await supabase
          .from("users")
          .update({ display_name: profile.displayName, bio: profile.bio || null })
          .eq("id", user.id);
      }

      // Update attributes
      await supabase.from("user_attributes").upsert({
        user_id: user.id,
        gender: profile.gender,
        age_range: profile.ageRange,
        education: profile.education,
        occupation: profile.occupation,
        political_party: profile.politicalParty,
        political_stance: profile.politicalStance,
      });

      // Record consent for sensitive info if given
      if (profile.sensitiveInfoConsented) {
        await supabase.from("consent_records").insert({
          user_id: user.id,
          consent_type: "sensitive_personal_info",
          consent_version: "1.0",
        });
      }

      router.push("/home");
    } catch {
      toast.error("設定の保存に失敗しました。もう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-12">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            ステップ {step} / {totalSteps}
          </span>
          <span>{Math.round((step / totalSteps) * 100)}%</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">基本情報を設定しましょう</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              あなたのプロフィール情報を入力してください。
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">ユーザー名（表示名）</Label>
              <Input
                id="displayName"
                value={profile.displayName}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, displayName: e.target.value }))
                }
                placeholder="表示名を入力"
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">自己紹介</Label>
              <Textarea
                id="bio"
                value={profile.bio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="自己紹介を入力（任意）"
                maxLength={160}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {profile.bio.length}/160
              </p>
            </div>
          </div>

          <Button
            onClick={() => setStep(2)}
            disabled={profile.displayName.trim().length === 0}
            className="w-full gap-2"
          >
            次へ
            <ArrowRight className="h-4 w-4" />
          </Button>
          {profile.displayName.trim().length === 0 && (
            <p className="text-center text-xs text-muted-foreground">
              表示名を入力してください
            </p>
          )}
        </div>
      )}

      {/* Step 2: Attributes */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">あなたのことを教えてください</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              すべて任意です。入力した情報は意見を書いたときに表示されます。
            </p>
          </div>

          {/* Value proposition card */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <BadgeCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">あなたのバックグラウンドが投稿に表示されます</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  入力した情報は「バックグラウンドタグ」として投稿に表示され、あなたの意見に背景情報を添えます。どの情報を公開するかは後からいつでも変更できます。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>性別</Label>
              <Select
                value={profile.gender ?? ""}
                onValueChange={(v) =>
                  setProfile((p) => ({ ...p, gender: (v || null) as Gender | null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {GENDER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>年齢帯</Label>
              <Select
                value={profile.ageRange ?? ""}
                onValueChange={(v) =>
                  setProfile((p) => ({ ...p, ageRange: (v || null) as AgeRange | null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RANGE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>学歴</Label>
              <Select
                value={profile.education ?? ""}
                onValueChange={(v) =>
                  setProfile((p) => ({ ...p, education: (v || null) as Education | null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {EDUCATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>職業</Label>
              <Select
                value={profile.occupation ?? ""}
                onValueChange={(v) =>
                  setProfile((p) => ({ ...p, occupation: (v || null) as Occupation | null }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {OCCUPATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1 gap-2">
              次へ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setStep(3)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            あとで設定する
          </button>
        </div>
      )}

      {/* Step 3: Political Stance (Sensitive Info) */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">政治的な立場について</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              この情報は任意です。入力しなくても利用できます。
            </p>
          </div>

          {/* Value proposition cards */}
          <div className="space-y-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">「視野チェック」が利用可能に</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    政治的な立場を入力すると、あなたのタイムラインがどの程度偏っているかを可視化する「視野チェック」が利用できるようになります。
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">個人情報は厳格に保護されます</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    公開設定をOFFにした情報は他のユーザーには一切表示されません。統計データも匿名化して処理されます。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sensitive info consent notice */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold text-foreground">
              要配慮個人情報について
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              政治的な立場・支持政党は法律上「要配慮個人情報」に該当します。
              入力された情報は以下の目的で利用されます：
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>SNS上でのプロフィール表示（公開設定時）</li>
              <li>投稿に対する評価分析への利用</li>
              <li>匿名化された統計データの作成</li>
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              同意はいつでも撤回可能です。撤回時は該当情報が非公開化され、統計からも除外されます。
            </p>
            <div className="mt-3">
              <Button
                variant={profile.sensitiveInfoConsented ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setProfile((p) => ({
                    ...p,
                    sensitiveInfoConsented: !p.sensitiveInfoConsented,
                  }))
                }
              >
                {profile.sensitiveInfoConsented
                  ? "同意済み"
                  : "同意する"}
              </Button>
            </div>
          </div>

          {profile.sensitiveInfoConsented && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>支持政党</Label>
                <Select
                  value={profile.politicalParty ?? ""}
                  onValueChange={(v) =>
                    setProfile((p) => ({
                      ...p,
                      politicalParty: (v || null) as PoliticalParty | null,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    {POLITICAL_PARTY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>政治的な立場</Label>
                <div className="flex items-center justify-between gap-2">
                  {POLITICAL_STANCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setProfile((p) => ({
                          ...p,
                          politicalStance: opt.value,
                        }))
                      }
                      className={`flex-1 rounded-md border px-2 py-2 text-xs transition-colors ${
                        profile.politicalStance === opt.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-accent"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(2)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <Button onClick={() => setStep(4)} className="flex-1 gap-2">
              次へ
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            あとで設定する
          </button>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">設定完了!</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              プロフィールの設定が完了しました。
              <br />
              My Opinion を始めましょう!
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep(3)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
            <Button
              onClick={handleComplete}
              disabled={submitting}
              className="flex-1 gap-2"
            >
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              はじめる
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
