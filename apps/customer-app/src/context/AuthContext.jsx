// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from "react";
import { setAuthToken, setRefreshTokenHandler, setUnauthorizedHandler } from "../services/apiClient";
import { authService } from "../services/authService";
import { storage } from "../services/storage";
import { notificationService } from "../services/notificationService";

const AuthContext = createContext();

const AUTH_TOKEN_KEY = "@salon_app_token";
const AUTH_REFRESH_TOKEN_KEY = "@salon_app_refresh_token";
const AUTH_USER_KEY = "@salon_app_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // "Remember me" off: the session lives only in memory and ends when the app is closed.
  // The refresh token is kept here so silent refresh still works during that session.
  const rememberRef = useRef(true);
  const memoryRefreshTokenRef = useRef(null);

  const logout = useCallback(async () => {
    await notificationService.unregisterPushToken();
    setUser(null);
    setToken(null);
    setAuthToken(null);
    memoryRefreshTokenRef.current = null;
    await storage.removeItem(AUTH_TOKEN_KEY);
    await storage.removeItem(AUTH_REFRESH_TOKEN_KEY);
    await storage.removeItem(AUTH_USER_KEY);
  }, []);

  const handleSilentRefresh = useCallback(async () => {
    try {
      const savedRefreshToken = memoryRefreshTokenRef.current || (await storage.getItem(AUTH_REFRESH_TOKEN_KEY));
      if (!savedRefreshToken) {
        throw new Error("No refresh token available");
      }

      console.log("[AuthContext] Triggering silent refresh via refresh token...");
      const res = await authService.refresh(savedRefreshToken);
      const newAccessToken = res?.data?.accessToken || res?.accessToken;

      if (newAccessToken) {
        setToken(newAccessToken);
        setAuthToken(newAccessToken);
        if (rememberRef.current) await storage.setItem(AUTH_TOKEN_KEY, newAccessToken);
        console.log("[AuthContext] Silent token refresh succeeded.");
        return newAccessToken;
      }
      throw new Error("No access token returned from refresh endpoint");
    } catch (err) {
      console.warn("[AuthContext] Silent token refresh failed:", err.message);
      await logout();
      throw err;
    }
  }, [logout]);

  // Attach push token & wire API interceptor handlers
  useEffect(() => {
    if (!token || !user) return;
    notificationService.registerPushToken();
  }, [token, user]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    setRefreshTokenHandler(handleSilentRefresh);
  }, [logout, handleSilentRefresh]);

  // Restore user session automatically on app startup from hardware secure storage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedToken = await storage.getItem(AUTH_TOKEN_KEY);
        const savedUser = await storage.getItem(AUTH_USER_KEY);

        if (savedToken) {
          setToken(savedToken);
          setAuthToken(savedToken);

          if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser) {
                setUser(parsedUser);
              }
            } catch (e) {
              console.warn("Invalid saved user JSON, clearing user cache:", e);
              await storage.removeItem(AUTH_USER_KEY);
            }
          }

          // Background sync profile to keep user info fresh
          authService.getProfile().then((meRes) => {
            const freshUser = meRes?.data?.user || meRes?.data || meRes?.user;
            if (freshUser) {
              setUser(freshUser);
              storage.setItem(AUTH_USER_KEY, JSON.stringify(freshUser)).catch(() => {});
            }
          }).catch((err) => {
            console.log("[AuthContext] Profile background sync skipped:", err?.message);
          });
        }
      } catch (err) {
        console.warn("Failed to restore auth session:", err.message);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(async (email, password, { remember = true } = {}) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const accessToken = res?.data?.accessToken || res?.accessToken;
      const refreshToken = res?.data?.refreshToken || res?.refreshToken;
      const userData = res?.data?.user || res?.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData || null);
        setAuthToken(accessToken);
        rememberRef.current = remember;

        if (remember) {
          // Persist session securely across app restarts
          memoryRefreshTokenRef.current = null;
          await storage.setItem(AUTH_TOKEN_KEY, accessToken);
          if (refreshToken) {
            await storage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
          }
          if (userData) {
            await storage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
          }
          await storage.setItem("@salon_app_has_onboarded", "true");
        } else {
          // Keep this session in memory only, and drop any older saved session
          memoryRefreshTokenRef.current = refreshToken || null;
          await storage.removeItem(AUTH_TOKEN_KEY);
          await storage.removeItem(AUTH_REFRESH_TOKEN_KEY);
          await storage.removeItem(AUTH_USER_KEY);
        }

        return { success: true, user: userData };
      }
      throw new Error(res?.message || "Invalid response from server");
    } catch (err) {
      const msg = err.message || "Failed to log in";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, phone, gender) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.register(name, email, password, phone, gender);
      const accessToken = res?.data?.accessToken || res?.accessToken;
      const refreshToken = res?.data?.refreshToken || res?.refreshToken;
      const userData = res?.data?.user || res?.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData || null);
        setAuthToken(accessToken);
        // These sign-in flows always keep the session
        rememberRef.current = true;
        memoryRefreshTokenRef.current = null;

        // Persist session securely across app restarts
        await storage.setItem(AUTH_TOKEN_KEY, accessToken);
        if (refreshToken) {
          await storage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
        }
        if (userData) {
          await storage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        }
        await storage.setItem("@salon_app_has_onboarded", "true");

        return { success: true, user: userData };
      }
      throw new Error(res?.message || "Registration failed");
    } catch (err) {
      const msg = err.message || "Failed to register";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (googlePayload) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.googleLogin(googlePayload);
      const accessToken = res?.data?.accessToken || res?.accessToken;
      const refreshToken = res?.data?.refreshToken || res?.refreshToken;
      const userData = res?.data?.user || res?.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData || null);
        setAuthToken(accessToken);
        // These sign-in flows always keep the session
        rememberRef.current = true;
        memoryRefreshTokenRef.current = null;

        await storage.setItem(AUTH_TOKEN_KEY, accessToken);
        if (refreshToken) {
          await storage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
        }
        if (userData) {
          await storage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        }
        await storage.setItem("@salon_app_has_onboarded", "true");

        return { success: true, user: userData };
      }
      throw new Error(res?.message || "Google authentication failed");
    } catch (err) {
      const msg = err.message || "Failed to log in with Google";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithApple = useCallback(async (applePayload) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.appleLogin(applePayload);
      const accessToken = res?.data?.accessToken || res?.accessToken;
      const refreshToken = res?.data?.refreshToken || res?.refreshToken;
      const userData = res?.data?.user || res?.user;

      if (accessToken) {
        setToken(accessToken);
        setUser(userData || null);
        setAuthToken(accessToken);
        // These sign-in flows always keep the session
        rememberRef.current = true;
        memoryRefreshTokenRef.current = null;

        await storage.setItem(AUTH_TOKEN_KEY, accessToken);
        if (refreshToken) {
          await storage.setItem(AUTH_REFRESH_TOKEN_KEY, refreshToken);
        }
        if (userData) {
          await storage.setItem(AUTH_USER_KEY, JSON.stringify(userData));
        }
        await storage.setItem("@salon_app_has_onboarded", "true");

        return { success: true, user: userData };
      }
      throw new Error(res?.message || "Apple authentication failed");
    } catch (err) {
      const msg = err.message || "Failed to log in with Apple";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      const next = prev ? { ...prev, ...patch } : prev;
      if (next) {
        storage.setItem(AUTH_USER_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const res = await authService.forgotPassword(email);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message || "Failed to send reset code" };
    }
  }, []);

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    try {
      const res = await authService.resetPassword(email, otp, newPassword);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message || "Failed to reset password" };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const res = await authService.changePassword(currentPassword, newPassword);
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message || "Failed to change password" };
    }
  }, []);

  const deleteAccount = useCallback(async () => {
    try {
      const res = await authService.deleteAccount();
      await logout();
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message || "Failed to delete account" };
    }
  }, [logout]);

  const refreshProfile = useCallback(async () => {
    if (!token) return null;
    try {
      const res = await authService.getProfile();
      const userData = res?.data?.user || res?.data;
      if (userData) {
        setUser((prev) => {
          const verified = Boolean(userData.isEmailVerified || userData.email_verified);
          const merged = { ...prev, ...userData, isEmailVerified: verified, email_verified: verified };
          storage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
          return merged;
        });
        return userData;
      }
    } catch (e) {
      console.warn("Failed to refresh user profile:", e.message);
    }
    return null;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        loading,
        error,
        login,
        loginWithGoogle,
        loginWithApple,
        register,
        logout,
        updateUser,
        refreshProfile,
        forgotPassword,
        resetPassword,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
