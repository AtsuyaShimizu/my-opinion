import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { extractPublicAttributes } from "@/lib/utils/attributes";

// GET /api/users/suggested - Get suggested users to follow
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    const limitParam = request.nextUrl.searchParams.get("limit");
    const limit = Math.min(parseInt(limitParam ?? "5", 10), 10);

    // Get IDs the user already follows
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = follows?.map((f) => f.following_id) ?? [];
    const excludeIds = [user.id, ...followingIds];

    // Fetch active users not already followed, ordered by most recent posts
    const { data: users, error } = await supabase
      .from("users")
      .select("id, user_handle, display_name, avatar_url")
      .eq("status", "active")
      .not("id", "in", `(${excludeIds.join(",")})`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: "ユーザーの取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const userIds = (users ?? []).map((u) => u.id);

    // Fetch public attributes using service client (RLS restricts user_attributes to own records)
    const serviceClient = createServiceClient();
    const { data: attributes } = await serviceClient
      .from("user_attributes")
      .select("*")
      .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

    const attrMap = new Map(attributes?.map((a) => [a.user_id, a]) ?? []);

    const enrichedUsers = (users ?? []).map((u) => ({
      ...u,
      attributes: extractPublicAttributes(attrMap.get(u.id)),
    }));

    return NextResponse.json({
      data: enrichedUsers,
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
