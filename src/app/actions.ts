"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { extractTags, isEntryKind } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { error: string | null };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { supabase, user };
}

export async function createEntry(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "何か書いてから保存してな" };

  const kindValue = formData.get("kind");
  const kind = isEntryKind(kindValue) ? kindValue : "note";

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("entries").insert({
    user_id: user.id,
    kind,
    body,
    tags: extractTags(body),
  });

  if (error) return { error: `保存できひんかった: ${error.message}` };

  revalidatePath("/");
  return { error: null };
}

export async function toggleDone(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const done = formData.get("done") === "true";

  const { supabase } = await requireUser();
  await supabase.from("entries").update({ done }).eq("id", id);

  revalidatePath("/");
}

export async function updateBody(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const { supabase } = await requireUser();
  await supabase
    .from("entries")
    .update({ body, tags: extractTags(body) })
    .eq("id", id);

  revalidatePath("/");
}

export async function deleteEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  const { supabase } = await requireUser();
  await supabase.from("entries").delete().eq("id", id);

  revalidatePath("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
