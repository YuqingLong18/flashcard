import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { buildObjectKey, createUploadUrl, getImageUrl } from "@/lib/storage";
import { uploadInitSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  try {
    const body = await request.json();
    const parsed = uploadInitSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const key = buildObjectKey(
      `${guard.session.user.id}-${parsed.data.filename}`,
    );

    const signed = await createUploadUrl({
      key,
      contentType: parsed.data.contentType,
    });

    return jsonOk({
      ...signed,
      storedUrl: signed.publicUrl,
      imageUrl: getImageUrl(signed.publicUrl),
    });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create upload URL.", 500);
  }
}
