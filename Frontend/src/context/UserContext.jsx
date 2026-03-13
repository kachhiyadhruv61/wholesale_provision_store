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

  const normalizeUser = (input = {}) => ({
    id: input.id || input._id || Date.now().toString(),
    _id: input.registerId || input._id || input.id || null,
    username: input.username || "",
    email: input.email || "",
    password: "",
    phone: input.phone || input.phonenumber || "",
    address: input.address || input.shopaddress || "",
    city: input.city || DEFAULT_CITY,
    state: input.state || DEFAULT_STATE,
    pincode: input.pincode || "",
    joinDate: input.joinDate || input.createdAt || new Date().toISOString(),
    ownerName: input.ownerName || input.fullname || "",
    shopName: input.shopName || input.shopname || "",
  });

  const fetchRegisteredUsers = async () => {
    const response = await apiClient.get("/api/register");
    return Array.isArray(response?.data) ? response.data : [];
  };

  const updateUserProfile = async (updatedData) => {
    const newUser = { ...user, ...updatedData };

    if (!newUser?._id) {
      persistUser(normalizeUser(newUser));
      return { success: true };
    }

    try {
      const response = await apiClient.put(
        `/api/register/${encodeURIComponent(newUser._id)}`,
        mapProfilePayload(newUser, user)
      );

      const normalizedUser = normalizeUser({ ...newUser, ...(response?.data || {}) });
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
      const response = await apiClient.post("/api/auth/change-password", {
        userId: user._id,
        email: user.email,
        oldPassword,
        newPassword,
      });

      const normalizedUser = normalizeUser({ ...user, ...(response?.data || {}) });
      persistUser(normalizedUser);
      return { success: true, data: normalizedUser };
    } catch (error) {
      return { success: false, message: error.message || "Unable to change password." };
    }
  };

  const loginUser = async (identifier, password) => {
    try {
      const users = await fetchRegisteredUsers();
      const normalizedIdentifier = String(identifier || "").trim().toLowerCase();

      const matchedRegister = users.find((entry) => {
        const username = String(entry?.username || "").trim().toLowerCase();
        const email = String(entry?.email || "").trim().toLowerCase();
        return username === normalizedIdentifier || email === normalizedIdentifier;
      });

      const loginEmail = matchedRegister?.email || identifier;

      try {
        const response = await apiClient.post("/api/auth/login", {
          email: loginEmail,
          password,
        });

        const merged = normalizeUser({ ...matchedRegister, ...(response?.data || {}) });
        persistUser(merged);
        return { success: true, data: merged };
      } catch (loginError) {
        return { success: false, message: loginError.message || "Login failed" };
      }
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

      if (user && response?.data) {
        const responseUserId = response.data.registerId || response.data._id;
        if (user._id === responseUserId || user.email === response.data.email) {
          persistUser(normalizeUser({ ...user, ...response.data }));
        }
      }

      return { success: true, data: response?.data };
    } catch (error) {
      return { success: false, message: error.message || "Unable to reset password." };
    }
  };

  const logoutUser = () => {
    persistUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
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
