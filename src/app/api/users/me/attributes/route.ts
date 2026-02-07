import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateAttributesSchema } from "@/lib/validations/profile";

// PUT /api/users/me/attributes - Update user attributes
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateAttributesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, status: 400 },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    const fieldMap: Record<string, string> = {
      gender: "gender",
      ageRange: "age_range",
      education: "education",
      occupation: "occupation",
      politicalParty: "political_party",
      politicalStance: "political_stance",
      isGenderPublic: "is_gender_public",
      isAgeRangePublic: "is_age_range_public",
      isEducationPublic: "is_education_public",
      isOccupationPublic: "is_occupation_public",
      isPoliticalPartyPublic: "is_political_party_public",
      isPoliticalStancePublic: "is_political_stance_public",
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      const value = parsed.data[key as keyof typeof parsed.data];
      if (value !== undefined) {
        updateData[dbField] = value;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新する項目がありません", status: 400 },
        { status: 400 }
      );
    }

    const { data: attributes, error } = await supabase
      .from("user_attributes")
      .update(updateData)
      .eq("user_id", authUser.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "属性の更新に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: attributes, status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
