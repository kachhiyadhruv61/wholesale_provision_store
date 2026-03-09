import { createContext, useState, useEffect } from "react";
import { apiClient } from "../utils/apiClient";

export const UserContext = createContext();

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
    _id: input._id || input.id || null,
    username: input.username || "",
    email: input.email || "",
    password: input.password || "",
    phone: input.phone || input.phonenumber || "",
    address: input.address || input.shopaddress || "",
    city: input.city || "Anand",
    state: input.state || "Gujarat",
    pincode: input.pincode || "",
    joinDate: input.joinDate || input.createdAt || new Date().toISOString(),
    ownerName: input.ownerName || input.fullname || "",
    shopName: input.shopName || input.shopname || "",
  });

  const fetchRegisteredUsers = async () => {
    const response = await apiClient.get("/register");
    return Array.isArray(response?.data) ? response.data : [];
  };

  const updateUserProfile = async (updatedData) => {
    const newUser = { ...user, ...updatedData };
    persistUser(newUser);

    if (!newUser?._id) {
      return { success: true };
    }

    try {
      await apiClient.put(`/register/${encodeURIComponent(newUser._id)}`, {
        username: newUser.username,
        fullname: newUser.ownerName || newUser.username,
        shopname: newUser.shopName || "",
        shopaddress: newUser.address || "",
        email: newUser.email,
        phonenumber: newUser.phone || "0000000000",
        password: newUser.password || "password123",
        confirmpassword: newUser.password || "password123",
        city: newUser.city,
        state: newUser.state,
        pincode: newUser.pincode,
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || "Profile update failed" };
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (user && user.password === oldPassword) {
      return updateUserProfile({ password: newPassword });
    }
    return { success: false, message: "Incorrect old password" };
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
        const response = await apiClient.post("/auth/login", {
          email: loginEmail,
          password,
        });

        const merged = normalizeUser({ ...matchedRegister, ...(response?.data || {}) });
        persistUser(merged);
        return { success: true, data: merged };
      } catch (loginError) {
        const fallbackPassword = String(matchedRegister?.password || "");
        if (!matchedRegister || fallbackPassword !== String(password || "")) {
          return { success: false, message: loginError.message || "Login failed" };
        }

        // Sync missing auth login record in background for future /auth/login compatibility.
        apiClient
          .post("/auth/register", {
            username: matchedRegister.username,
            email: matchedRegister.email,
            password: fallbackPassword,
          })
          .catch(() => {
            // Ignore if already exists or backend rejects duplicate.
          });

        const merged = normalizeUser(matchedRegister);
        persistUser(merged);
        return { success: true, data: merged };
      }
    } catch (error) {
      return { success: false, message: error.message || "Login failed" };
    }
  };

  const resetPassword = async (identifier, newPassword) => {
    try {
      const users = await fetchRegisteredUsers();
      const normalizedIdentifier = String(identifier || "").trim().toLowerCase();
      const matchedUser = users.find((entry) => {
        const username = String(entry?.username || "").trim().toLowerCase();
        const email = String(entry?.email || "").trim().toLowerCase();
        return username === normalizedIdentifier || email === normalizedIdentifier;
      });

      if (!matchedUser?._id) {
        return { success: false, message: "User not found with provided details." };
      }

      await apiClient.put(`/register/${encodeURIComponent(matchedUser._id)}`, {
        ...matchedUser,
        password: newPassword,
        confirmpassword: newPassword,
      });

      if (user && (user._id === matchedUser._id || user.email === matchedUser.email)) {
        persistUser({ ...user, password: newPassword });
      }

      return { success: true };
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
