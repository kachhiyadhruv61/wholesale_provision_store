import { createContext, useEffect, useMemo, useState } from "react";

export const NotificationContext = createContext();

const STORAGE_KEY = "adminNotifications";

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        setNotifications(parsed);
      }
    } catch (error) {
      console.warn("Unable to parse notifications from storage.", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      createdAt: new Date().toISOString(),
      read: false,
      type: "general",
      title: "Notification",
      message: "",
      meta: {},
      ...notification,
    };

    setNotifications((prev) => [newNotification, ...prev]);
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markNotificationRead,
        clearNotifications,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
