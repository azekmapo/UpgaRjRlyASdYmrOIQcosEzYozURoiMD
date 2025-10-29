import apiClient from "@/lib/api";
import type { Signature } from "@/types/signature";

export async function fetchSignatures(userId: string): Promise<Signature[]> {
  try {
    console.log("Fetching signatures for user:", userId);
    const response = await apiClient.get(`/api/signatures/user/${userId}`) as { data?: Signature[] } | Signature[];
    console.log("Fetch signatures response:", response);
    
    if (Array.isArray(response)) {
      return response;
    } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
      return response.data;
    } else {
      console.error("Unexpected response format:", response);
      return [];
    }
  } catch (error: any) {
    console.error("Error fetching signatures:", error);
    // Check if it's a 403 forbidden error
    if (error.response?.status === 403) {
      throw new Error("403: Only admin or jury presidents can manage signatures");
    }
    throw new Error("Failed to fetch signatures");
  }
}

export async function saveSignature(
  userId: string,
  signatureData: File
): Promise<Signature> {
  try {
    const formData = new FormData();
    formData.append("signature", signatureData);
    
    console.log("Sending signature data:", signatureData);
    
    const response = await apiClient.post(
      `/api/signatures/create-signature/${userId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    ) as { signature?: Signature; data?: { signature: Signature } };
    
    console.log("Signature response:", response);
    
    if (response.signature) {
      return response.signature;
    } else if (response.data && response.data.signature) {
      return response.data.signature;
    } else {
      console.error("Unexpected response format:", response);
      throw new Error("Unexpected response format from server");
    }
  } catch (error: any) {
    console.error("Error saving signature:", error);
    if (error.response?.status === 403) {
      throw new Error("403: Only responsible teachers can create signatures");
    }
    throw new Error("Failed to save signature");
  }
}
export async function activateSignature(
  userId: string,
  signatureId: string
): Promise<void> {
  try {
    await apiClient.post(`/api/signatures/${userId}/activate/${signatureId}`);
  } catch (error: any) {
    console.error("Error activating signature:", error);
    if (error.response?.status === 403) {
      throw new Error("403: Only responsible teachers can activate signatures");
    }
    throw new Error("Failed to activate signature");
  }
}

export async function deleteSignature(signatureId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/signatures/delete-signature/${signatureId}`);
  } catch (error: any) {
    console.error("Error deleting signature:", error);
    if (error.response?.status === 403) {
      throw new Error("403: Only responsible teachers can delete signatures");
    }
    throw new Error("Failed to delete signature");
  }
}

export async function getSignatureImage(path: string): Promise<string> {
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Authentication token is missing.");
    }

    const filename = path.split('/').pop() || path;

    // Get signed URL from backend
    const response = await apiClient.get<{ success: boolean; url: string; expires_at: string }>(
      `/api/signatures/image/${filename}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Return the signed URL directly - no need to create blob URL
    if (response && response.url) {
      return response.url;
    } else {
      throw new Error("Invalid response: missing signed URL");
    }
  } catch (error) {
    console.error("Error fetching signature image:", error);
    throw new Error("Failed to fetch signature image");
  }
}

export async function getSignatureImageDirect(path: string): Promise<string> {
  // Alternative method to get image as blob (for backward compatibility)
  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Authentication token is missing.");
    }

    const filename = path.split('/').pop() || path;

    const blob: Blob = await apiClient.get<Blob>(
      `/api/signatures/image-direct/${filename}`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (blob && blob instanceof Blob && blob.size > 0) {
      return URL.createObjectURL(blob);
    } else {
      throw new Error("Invalid or empty image data received");
    }
  } catch (error) {
    console.error("Error fetching signature image:", error);
    throw new Error("Failed to fetch signature image");
  }
}