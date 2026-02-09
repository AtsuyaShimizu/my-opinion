import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { extractPublicAttributes } from "@/lib/utils/attributes";

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

    // Get public attributes (use service client to bypass RLS restriction)
    const serviceClient = createServiceClient();
    const { data: attributes } = await serviceClient
      .from("user_attributes")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const publicAttributes = extractPublicAttributes(attributes);

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
    const isOwnProfile = currentUser?.id === user.id;
    if (currentUser && !isOwnProfile) {
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
        isOwnProfile,
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
