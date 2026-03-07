import { createContext, useState, useEffect } from "react";
import { apiRequest, getResponseList, normalizeMongoId } from "../utils/api";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [registers, setRegisters] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // ==================== Users API ====================
  
  // GET all users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const payload = await apiRequest("/users");
      const rows = getResponseList(payload);
      setUsers(rows.map(toUserProfile));
      return { success: true, data: rows };
    } catch (error) {
      console.error("Failed to fetch users", error);
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // GET user by ID
  const getUserById = async (userId) => {
    const targetId = userId?.toString?.() || userId;
    try {
      const payload = await apiRequest(`/users/${encodeURIComponent(targetId)}`);
      return { success: true, data: toUserProfile(payload?.data || payload) };
    } catch (error) {
      console.error("Failed to get user by ID", error);
      return { success: false, message: error.message };
    }
  };

  // POST create user
  const createUser = async (userData) => {
    try {
      const payload = await apiRequest("/users", {
        method: "POST",
        body: JSON.stringify(userData),
      });
      const createdId = payload?.insertedId || Date.now().toString();
      const created = toUserProfile({ ...userData, id: createdId, _id: createdId });
      setUsers((prev) => [created, ...prev]);
      return { success: true, data: created };
    } catch (error) {
      console.error("Failed to create user", error);
      return { success: false, message: error.message };
    }
  };

  // PUT update user
  const updateUser = async (userId, updates) => {
    const targetId = userId?.toString?.() || userId;
    try {
      await apiRequest(`/users/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id?.toString() === targetId ? { ...u, ...updates } : u
        )
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to update user", error);
      return { success: false, message: error.message };
    }
  };

  // DELETE user
  const deleteUser = async (userId) => {
    const targetId = userId?.toString?.() || userId;
    try {
      await apiRequest(`/users/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      setUsers((prev) => prev.filter((u) => u.id?.toString() !== targetId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete user", error);
      return { success: false, message: error.message };
    }
  };

  // ==================== Register API ====================
  
  // GET all registers
  const loadRegisters = async () => {
    try {
      const payload = await apiRequest("/register");
      const rows = getResponseList(payload);
      setRegisters(rows.map(toUserProfile));
      return { success: true, data: rows };
    } catch (error) {
      console.error("Failed to fetch registers", error);
      return { success: false, message: error.message };
    }
  };

  // GET register by ID
  const getRegisterById = async (registerId) => {
    const targetId = registerId?.toString?.() || registerId;
    try {
      const payload = await apiRequest(`/register/${encodeURIComponent(targetId)}`);
      return { success: true, data: toUserProfile(payload?.data || payload) };
    } catch (error) {
      console.error("Failed to get register by ID", error);
      return { success: false, message: error.message };
    }
  };

  // PUT update register
  const updateRegister = async (registerId, updates) => {
    const targetId = registerId?.toString?.() || registerId;
    try {
      await apiRequest(`/register/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setRegisters((prev) =>
        prev.map((r) =>
          r.id?.toString() === targetId ? { ...r, ...updates } : r
        )
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to update register", error);
      return { success: false, message: error.message };
    }
  };

  // DELETE register
  const deleteRegister = async (registerId) => {
    const targetId = registerId?.toString?.() || registerId;
    try {
      await apiRequest(`/register/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      setRegisters((prev) => prev.filter((r) => r.id?.toString() !== targetId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete register", error);
      return { success: false, message: error.message };
    }
  };

  // ==================== Auth API ====================
  
  // DELETE auth user
  const deleteAuthUser = async (authUserId) => {
    const targetId = authUserId?.toString?.() || authUserId;
    try {
      await apiRequest(`/auth/users/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to delete auth user", error);
      return { success: false, message: error.message };
    }
  };

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
        // Current user state
        user,
        loading,
        updateUserProfile,
        changePassword,
        loginUser,
        logoutUser,
        resetPassword,
        // Users API
        users,
        loadUsers,
        getUserById,
        createUser,
        updateUser,
        deleteUser,
        // Register API
        registers,
        loadRegisters,
        getRegisterById,
        updateRegister,
        deleteRegister,
        // Auth API
        deleteAuthUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
