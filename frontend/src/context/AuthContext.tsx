import React, { createContext, useContext, useState, useEffect } from "react";

export interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "client" | "freelancer" | "admin";
  googleId?: string | null;
  isEmailVerified: boolean;
  phone?: string;
  bio?: string;
  avatar?: {
    url: string;
    public_id: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<{ success: boolean; message: string }>;
  signup: (userData: any) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  googleAuth: (googleToken: string, role?: string) => Promise<{ success: boolean; message: string }>;
  verifyEmail: (token: string) => Promise<{ success: boolean; message: string }>;
  resendVerification: (email: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper fetch function that handles credentials and JSON formatting
  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        credentials: "include", // Essential to send cookies
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }
      return data;
    } catch (error: any) {
      throw new Error(error.message || "Network error. Please try again.");
    }
  };

  // Get current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await apiCall("/api/v1/auth/me");
        if (res.success && res.data) {
          setUser(res.data);
        }
      } catch (error) {
        // Silent fail - user simply not logged in
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser();
  }, []);

  // Standard username/email and password login
  const login = async (emailOrUsername: string, password: string) => {
    try {
      const isEmail = emailOrUsername.includes("@");
      const payload = isEmail 
        ? { email: emailOrUsername, password } 
        : { username: emailOrUsername, password };

      const res = await apiCall("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, message: res.message || "Logged in successfully." };
      }
      return { success: false, message: "Failed to authenticate user." };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // User registration
  const signup = async (userData: any) => {
    try {
      const res = await apiCall("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify(userData),
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, message: res.message || "Registered successfully." };
      }
      return { success: false, message: "Registration succeeded but user details were not received." };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // User logout
  const logout = async () => {
    try {
      await apiCall("/api/v1/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      setUser(null);
    }
  };

  // Google OAuth Login
  const googleAuth = async (googleToken: string, role?: string) => {
    try {
      const res = await apiCall("/api/v1/auth/google", {
        method: "POST",
        body: JSON.stringify({ token: googleToken, role }),
      });

      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true, message: res.message || "Logged in with Google." };
      }
      return { success: false, message: "Google authentication failed." };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // Verify Email Address via Token
  const verifyEmail = async (token: string) => {
    try {
      const res = await apiCall("/api/v1/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (res.success && user) {
        setUser({ ...user, isEmailVerified: true });
      }
      return { success: true, message: res.message || "Email verified successfully." };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // Resend email verification token
  const resendVerification = async (email: string) => {
    try {
      const res = await apiCall("/api/v1/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return { success: true, message: res.message || "Verification email sent." };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // Forgot password request
  const forgotPassword = async (email: string) => {
    try {
      const res = await apiCall("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      return { success: true, message: res.message || "Password reset email sent." };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  // Reset password implementation
  const resetPassword = async (token: string, password: string) => {
    try {
      const res = await apiCall(`/api/v1/auth/reset-password/${token}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      return { success: true, message: res.message || "Password reset successfully." };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        googleAuth,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
