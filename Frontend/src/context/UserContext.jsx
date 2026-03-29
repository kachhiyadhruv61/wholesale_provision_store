import { createContext, useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

export const UserContext = createContext();

const DEFAULT_CITY = "Anand";
const DEFAULT_STATE = "Gujarat";

const mapProfilePayload = (input = {}, currentUser = {}) => ({
  username: String(input.username ?? currentUser.username ?? "").trim(),
  fullname: String(input.ownerName ?? input.fullname ?? currentUser.ownerName ?? currentUser.username ?? "").trim(),
  shopname: String(input.shopName ?? input.shopname ?? currentUser.shopName ?? "").trim(),
  shopaddress: String(input.address ?? input.shopaddress ?? currentUser.address ?? "").trim(),
  email: String(input.email ?? currentUser.email ?? "").trim(),
  phonenumber: String(input.phone ?? input.phonenumber ?? currentUser.phone ?? "").trim(),
  city: String(input.city ?? currentUser.city ?? DEFAULT_CITY).trim(),
  state: String(input.state ?? currentUser.state ?? DEFAULT_STATE).trim(),
  pincode: String(input.pincode ?? currentUser.pincode ?? "").trim(),
});

const unwrapUserPayload = (payload = {}) => {
  if (payload && typeof payload === "object" && payload.data && typeof payload.data === "object") {
    return payload.data;
  }
  return payload;
};

const includesText = (value, text) => String(value || "").toLowerCase().includes(String(text || "").toLowerCase());

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }
  }, []);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("user", JSON.stringify(nextUser));
      return;
    }
    localStorage.removeItem("user");
  };

  const normalizeUser = (input = {}) => {
    const userInput = unwrapUserPayload(input);

    return {
    id: userInput.id || userInput._id || userInput.registerId || Date.now().toString(),
    _id: userInput.registerId || userInput._id || userInput.id || null,
    registerId: userInput.registerId || userInput._id || userInput.id || null,
    loginId: userInput.loginId || null,
    username: userInput.username || "",
    email: userInput.email || "",
    password: "",
    phone: userInput.phone || userInput.phonenumber || "",
    address: userInput.address || userInput.shopaddress || "",
    city: userInput.city || DEFAULT_CITY,
    state: userInput.state || DEFAULT_STATE,
    pincode: userInput.pincode || "",
    joinDate: userInput.joinDate || userInput.createdAt || new Date().toISOString(),
    ownerName: userInput.ownerName || userInput.fullname || "",
    shopName: userInput.shopName || userInput.shopname || "",
    role: userInput.role || "customer",
  };
  };

  const setAuthenticatedUser = (input = {}) => {
    const normalized = normalizeUser(input);
    persistUser(normalized);
    return normalized;
  };

  const findRegisterIdByUser = async (candidate = {}) => {
    const email = String(candidate.email || "").trim().toLowerCase();
    const username = String(candidate.username || "").trim().toLowerCase();

    if (!email && !username) return null;

    const response = await apiClient.get("/api/register");
    const registers = Array.isArray(response?.data) ? response.data : [];

    const matched = registers.find((entry) => {
      const entryEmail = String(entry?.email || "").trim().toLowerCase();
      const entryUsername = String(entry?.username || "").trim().toLowerCase();
      return (email && entryEmail === email) || (username && entryUsername === username);
    });

    return matched?._id ? String(matched._id) : null;
  };

  const findLoginRecordByUser = async (candidate = {}) => {
    const email = String(candidate.email || "").trim().toLowerCase();
    const username = String(candidate.username || "").trim().toLowerCase();

    if (!email && !username) return null;

    const response = await apiClient.get("/api/users");
    const logins = Array.isArray(response?.data) ? response.data : [];

    return (
      logins.find((entry) => {
        const entryEmail = String(entry?.email || "").trim().toLowerCase();
        const entryUsername = String(entry?.username || "").trim().toLowerCase();
        return (email && entryEmail === email) || (username && entryUsername === username);
      }) || null
    );
  };

  const seedRegisterFromLogin = async (candidate = {}) => {
    const loginRecord = await findLoginRecordByUser(candidate);
    if (!loginRecord?.email || !loginRecord?.password) return null;

    const payload = {
      username: String(candidate.username || loginRecord.username || "").trim(),
      email: String(candidate.email || loginRecord.email || "").trim().toLowerCase(),
      password: String(loginRecord.password || ""),
      confirmpassword: String(loginRecord.password || ""),
      fullname: String(candidate.ownerName || candidate.fullname || "").trim(),
      shopname: String(candidate.shopName || candidate.shopname || "").trim(),
      shopaddress: String(candidate.address || candidate.shopaddress || "").trim(),
      phonenumber: String(candidate.phone || candidate.phonenumber || "").trim(),
      city: String(candidate.city || DEFAULT_CITY).trim(),
      state: String(candidate.state || DEFAULT_STATE).trim(),
      pincode: String(candidate.pincode || "").trim(),
    };

    await apiClient.post("/api/register", payload);
    return await findRegisterIdByUser(payload);
  };

  const updateUserProfile = async (updatedData) => {
    const newUser = { ...user, ...updatedData };
    let registerId = newUser?._id || newUser?.registerId || null;

    if (!registerId) {
      try {
        registerId = await findRegisterIdByUser(newUser);
      } catch {
        registerId = null;
      }
    }

    if (!registerId) {
      persistUser(normalizeUser(newUser));
      return { success: true };
    }

    try {
      let response = null;

      try {
        response = await apiClient.put(
          `/api/register/${encodeURIComponent(registerId)}`,
          mapProfilePayload(newUser, user)
        );
      } catch (innerError) {
        const canRetryWithResolvedId = includesText(innerError?.message, "user not found") || includesText(innerError?.message, "invalid register id");
        if (!canRetryWithResolvedId) {
          throw innerError;
        }

        let resolvedId = await findRegisterIdByUser(newUser);
        if (!resolvedId) {
          resolvedId = await seedRegisterFromLogin(newUser);
        }
        if (!resolvedId) {
          throw innerError;
        }

        response = await apiClient.put(
          `/api/register/${encodeURIComponent(resolvedId)}`,
          mapProfilePayload(newUser, user)
        );
      }

      const normalizedUser = normalizeUser({ ...newUser, ...unwrapUserPayload(response) });
      persistUser(normalizedUser);
      return { success: true, data: normalizedUser };
    } catch (error) {
      return { success: false, message: error.message || "Profile update failed" };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (!user?._id && !user?.email) {
      return { success: false, message: "Please login again and retry." };
    }

    try {
      let response = null;

      try {
        response = await apiClient.post("/api/auth/change-password", {
          userId: user._id || user.registerId || user.id,
          email: user.email,
          identifier: user.username || user.email,
          oldPassword,
          newPassword,
        });
      } catch (innerError) {
        const canRetryWithSeed = includesText(innerError?.message, "user not found");
        if (!canRetryWithSeed) {
          throw innerError;
        }

        await seedRegisterFromLogin(user);

        response = await apiClient.post("/api/auth/change-password", {
          userId: user._id || user.registerId || user.id,
          email: user.email,
          identifier: user.username || user.email,
          oldPassword,
          newPassword,
        });
      }

      const normalizedUser = normalizeUser({ ...user, ...unwrapUserPayload(response) });
      persistUser(normalizedUser);
      return { success: true, data: normalizedUser };
    } catch (error) {
      return { success: false, message: error.message || "Unable to change password." };
    }
  };

  const loginUser = async (identifier, password) => {
    try {
      const normalizedIdentifier = String(identifier || "").trim();
      const response = await apiClient.post("/user/login", {
        identifier: normalizedIdentifier,
        username: normalizedIdentifier,
        email: normalizedIdentifier,
        password,
      });

      const merged = normalizeUser(response);
      persistUser(merged);

      // Set admin flag if this is an admin user
      if (merged.role === "admin") {
        localStorage.setItem("adminLoggedIn", "true");
      } else {
        localStorage.removeItem("adminLoggedIn");
      }

      return { success: true, data: merged };
    } catch (error) {
      return { success: false, message: error.message || "Login failed" };
    }
  };

  const resetPassword = async (identifier, newPassword) => {
    try {
      const response = await apiClient.post("/api/auth/reset-password", {
        identifier,
        newPassword,
      });

      const responseUser = unwrapUserPayload(response);

      if (user && responseUser) {
        const responseUserId = responseUser.registerId || responseUser._id;
        if (user._id === responseUserId || user.email === responseUser.email) {
          persistUser(normalizeUser({ ...user, ...responseUser }));
        }
      }

      return { success: true, data: responseUser };
    } catch (error) {
      return { success: false, message: error.message || "Unable to reset password." };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("adminLoggedIn");
    persistUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setAuthenticatedUser,
        updateUserProfile,
        changePassword,
        loginUser,
        logoutUser,
        resetPassword,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
