import { createContext, useState, useEffect } from "react";
import { apiRequest, getResponseList, normalizeMongoId } from "../utils/api";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  const toUserProfile = (record) => {
    const item = normalizeMongoId(record || {});
    return {
      id: item.id || item._id || Date.now().toString(),
      username: item.username || item.name || "",
      email: item.email || "",
      password: item.password || "",
      joinDate: item.joinDate || item.createdAt || new Date().toISOString(),
      phone: item.phone || item.phonenumber || "+91-9876543210",
      address: item.address || item.shopaddress || "",
      city: item.city || "Anand",
      state: item.state || "Gujarat",
      pincode: item.pincode || "388001",
      fullname: item.fullname || item.ownerName || "",
      shopname: item.shopname || item.shopName || "",
      shopaddress: item.shopaddress || item.address || "",
    };
  };

  const persistUser = (profile) => {
    setUser(profile);
    localStorage.setItem("user", JSON.stringify(profile));
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const updateUserProfile = async (updatedData) => {
    const newUser = { ...user, ...updatedData };
    persistUser(newUser);
    return { success: true };
  };

  const changePassword = async (oldPassword, newPassword) => {
    if (user && user.password === oldPassword) {
      await updateUserProfile({ password: newPassword });
      return { success: true };
    }
    return { success: false, message: "Incorrect old password" };
  };

  const loginUser = async (identifier, password) => {
    const loginId = identifier.trim();

    try {
      const isEmail = /\S+@\S+\.\S+/.test(loginId);

      let email = loginId;
      if (!isEmail) {
        const usersPayload = await apiRequest("/auth/users");
        const users = getResponseList(usersPayload);
        const matched = users.find(
          (entry) =>
            entry?.username?.toString().toLowerCase() === loginId.toLowerCase()
        );
        if (!matched?.email) {
          return { success: false, message: "User not found" };
        }
        email = matched.email;
      }

      const payload = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      const userData = toUserProfile(payload?.data || { email, username: loginId });
      persistUser(userData);
      return { success: true, data: userData };
    } catch (error) {
      try {
        const registerPayload = await apiRequest("/register");
        const registerUsers = getResponseList(registerPayload);

        const matched = registerUsers.find((entry) => {
          const username = entry?.username?.toString().toLowerCase();
          const email = entry?.email?.toString().toLowerCase();
          const lookup = loginId.toLowerCase();
          return username === lookup || email === lookup;
        });

        if (!matched) {
          return { success: false, message: error.message || "User not found" };
        }

        if ((matched?.password || "") !== password) {
          return { success: false, message: "Invalid password" };
        }

        const fallbackUser = toUserProfile(matched);
        persistUser(fallbackUser);

        try {
          await apiRequest("/auth/register", {
            method: "POST",
            body: JSON.stringify({
              username: fallbackUser.username,
              email: fallbackUser.email,
              password,
            }),
          });
        } catch (syncError) {
          console.warn("Auth sync skipped:", syncError.message);
        }

        return { success: true, data: fallbackUser };
      } catch {
        return { success: false, message: error.message || "Login failed" };
      }
    }
  };

  const resetPassword = async (identifier, newPassword) => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      return { success: false, message: "No user found. Please register first." };
    }

    const parsedUser = JSON.parse(savedUser);
    const matchesIdentifier =
      parsedUser.username === identifier || parsedUser.email === identifier;

    if (!matchesIdentifier) {
      return { success: false, message: "User not found with provided details." };
    }

    const updatedUser = { ...parsedUser, password: newPassword };
    persistUser(updatedUser);
    return { success: true };
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("user");
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
