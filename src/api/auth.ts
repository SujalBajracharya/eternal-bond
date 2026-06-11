/**
 * Authentication API Service
 * Handles communication with the Spring Boot backend REST endpoints.
 */

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface SignUpResponse {
  message?: string;
  token?: string;
  user?: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserDto;
}

// Get the backend API base URL from Vite environment variables (fallback to localhost:8081)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

/**
 * Registers a new user with the Spring Boot backend.
 */
export async function signupUser(data: SignUpRequest): Promise<SignUpResponse> {
  const url = `${API_BASE_URL}/auth/signup`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json();
    }

    let errorMessage = "An error occurred during sign up.";
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.message === "string") {
        errorMessage = errorData.message;
      } else if (errorData && typeof errorData.error === "string") {
        errorMessage = errorData.error;
      }
    } catch {
      if (response.status === 409) {
        errorMessage = "This email is already registered. Try signing in.";
      } else if (response.status === 400) {
        errorMessage = "Invalid registration details. Please check your inputs.";
      } else if (response.status >= 500) {
        errorMessage = "Internal server error. Please try again later.";
      }
    }

    throw new Error(errorMessage);
  } catch (error: any) {
    if (error instanceof Error && !error.message.includes("Failed to fetch") && !error.message.includes("NetworkError")) {
      throw error;
    }
    console.error("SignUp API Error:", error);
    throw new Error(
      "Unable to connect to the server. Please check your internet connection or try again later."
    );
  }
}

/**
 * Authenticates a user with the Spring Boot backend and retrieves a JWT.
 */
export async function loginUser(data: LoginRequest): Promise<AuthResponse> {
  const url = `${API_BASE_URL}/auth/signin`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return await response.json();
    }

    let errorMessage = "An error occurred during sign in.";
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.message === "string") {
        errorMessage = errorData.message;
      } else if (errorData && typeof errorData.error === "string") {
        errorMessage = errorData.error;
      }
    } catch {
      if (response.status >= 500) {
        errorMessage = "Internal server error. Please try again later.";
      }
    }

    throw new Error(errorMessage);
  } catch (error: any) {
    if (error instanceof Error && !error.message.includes("Failed to fetch") && !error.message.includes("NetworkError")) {
      throw error;
    }
    console.error("Login API Error:", error);
    throw new Error(
      "Unable to connect to the server. Please check your internet connection or try again later."
    );
  }
}

/**
 * Fetches the currently authenticated user's details using the JWT.
 */
export async function getMe(token: string): Promise<UserDto> {
  const url = `${API_BASE_URL}/auth/me`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    if (response.ok) {
      return await response.json();
    }

    throw new Error("Session verification failed.");
  } catch (error: any) {
    console.error("GetMe API Error:", error);
    throw new Error("Session expired.");
  }
}
