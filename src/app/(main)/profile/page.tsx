import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: user } = await supabase
    .from("users")
    .select("user_handle")
    .eq("id", authUser.id)
    .single();

  if (!user) {
    redirect("/login");
  }

  redirect(`/users/${user.user_handle}`);
}
