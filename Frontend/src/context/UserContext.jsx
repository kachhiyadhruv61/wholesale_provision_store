import { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const updateUserProfile = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const changePassword = (oldPassword, newPassword) => {
    if (user && user.password === oldPassword) {
      updateUserProfile({ password: newPassword });
      return { success: true };
    }
    return { success: false, message: "Incorrect old password" };
  };

  const loginUser = (username, email) => {
    const userData = {
      username,
      email,
      password: "password123",
      joinDate: new Date().toISOString(),
      phone: "+91-9876543210",
      address: "123 Business Street, City",
    };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <UserContext.Provider
      value={{ user, updateUserProfile, changePassword, loginUser, logoutUser }}
    >
      {children}
    </UserContext.Provider>
  );
}
