/**
 * Astrology API Service
 * Handles communication with the Spring Boot backend astrology profile endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

export interface KundaliProfileRequest {
  birthDate: string; // "YYYY-MM-DD"
  birthTime: string; // "HH:MM" or "HH:MM:SS"
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: number;
}

export interface KundaliProfileResponse {
  id: string;
  profileId: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthLatitude: number;
  birthLongitude: number;
  birthTimezone: number;
  createdAt: string;
  updatedAt: string;
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("jwt_token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function getKundaliProfile(): Promise<KundaliProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/astrology/profile`, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
      "Accept": "application/json",
    },
  });

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to load Kundali profile");
  }

  return response.json();
}

export async function createKundaliProfile(data: KundaliProfileRequest): Promise<KundaliProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/astrology/profile`, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to create Kundali profile");
  }

  return response.json();
}

export async function updateKundaliProfile(data: KundaliProfileRequest): Promise<KundaliProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/astrology/profile`, {
    method: "PUT",
    headers: {
      ...getAuthHeader(),
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to update Kundali profile");
  }

  return response.json();
}

export async function deleteKundaliProfile(): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/astrology/profile`, {
    method: "DELETE",
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to delete Kundali profile");
  }
}
