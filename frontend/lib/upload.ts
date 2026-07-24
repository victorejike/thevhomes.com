import { api } from "./api";

/**
 * Uploads a File/Blob directly to Cloudflare R2 via a short-lived presigned
 * PUT URL (see backend/internal/handlers/upload_handler.go), returning the
 * public URL to store on a Property/PropertyTourScene/AgentApplication
 * record. Throws with a friendly message if R2 credentials aren't
 * configured on the backend yet.
 */
export async function uploadFile(file: File | Blob, filename: string): Promise<string> {
  const contentType = file.type || "application/octet-stream";
  const key = `${Date.now()}-${filename}`.replace(/\s+/g, "-");

  const { upload_url, public_url } = await api.uploads.presign(key, contentType);

  const putResponse = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error("Upload to storage failed. Please try again.");
  }

  return public_url;
}
