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
      id: Date.now(),
      username,
      email,
      password: "password123",
      joinDate: new Date().toISOString(),
      phone: "+91-9876543210",
      address: "123 Business Street",
      city: "Anand",
      state: "Gujarat",
      pincode: "388001",
    };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const resetPassword = (identifier, newPassword) => {
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
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
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
