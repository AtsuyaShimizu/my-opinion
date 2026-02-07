import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/users/:handle - Get user profile with public attributes
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const supabase = await createClient();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, user_handle, display_name, avatar_url, bio, status, created_at")
      .eq("user_handle", handle)
      .eq("status", "active")
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Get public attributes
    // TODO: RLSにより user_attributes の SELECT は auth.uid() = user_id に制限されている。
    // 他ユーザーの属性を取得するにはサービスロールクライアントを使用するか、
    // 公開属性のみ読み取り可能なRLSポリシーを追加する必要がある。
    const { data: attributes } = await supabase
      .from("user_attributes")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Filter to only public attributes
    const publicAttributes = attributes
      ? {
          gender: attributes.is_gender_public ? attributes.gender : null,
          age_range: attributes.is_age_range_public ? attributes.age_range : null,
          education: attributes.is_education_public ? attributes.education : null,
          occupation: attributes.is_occupation_public ? attributes.occupation : null,
          political_party: attributes.is_political_party_public ? attributes.political_party : null,
          political_stance: attributes.is_political_stance_public ? attributes.political_stance : null,
        }
      : null;

    // Get follower/following counts
    const [{ count: followerCount }, { count: followingCount }] = await Promise.all([
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id),
      supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id),
    ]);

    // Check if current user follows this user
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let isFollowing = false;
    if (currentUser) {
      const { data: follow } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUser.id)
        .eq("following_id", user.id)
        .single();
      isFollowing = !!follow;
    }

    return NextResponse.json({
      data: {
        ...user,
        attributes: publicAttributes,
        followerCount: followerCount ?? 0,
        followingCount: followingCount ?? 0,
        isFollowing,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
