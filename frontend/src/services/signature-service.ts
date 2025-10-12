import apiClient from "@/lib/api";
import type { Signature } from "@/types/signature";

export async function fetchSignatures(userId: string): Promise<Signature[]> {
  try {
    console.log("Fetching signatures for user:", userId);
    const response = await apiClient.get(`/api/signatures/teacher/${userId}`) as { data?: Signature[] } | Signature[];
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
      throw new Error("403: Only responsible teachers can manage signatures");
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

    const blob: Blob = await apiClient.get<Blob>(
      `/api/signatures/image/${filename}`,
      {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // @shafty1 tcree url fel front bach ydir display lel image kima hna 
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