import { createContext, useState, useEffect } from "react";
import { apiRequest, getResponseList, normalizeMongoId } from "../utils/api";

export const ContactContext = createContext();

export function ContactProvider({ children }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);

  const mapContactRecord = (record) => {
    const item = normalizeMongoId(record);
    return {
      ...item,
      id: item.id || item._id,
      name: item.name || "",
      email: item.email || "",
      phone: item.phone || "",
      subject: item.subject || "",
      message: item.message || "",
      date: item.date || item.createdAt || new Date().toISOString(),
      status: item.status || "Unread",
    };
  };

  // Load contacts from API
  const loadContacts = async () => {
    setLoading(true);
    try {
      const payload = await apiRequest("/api/contacts");
      const rows = getResponseList(payload);
      setContacts(rows.map(mapContactRecord));
    } catch (error) {
      console.error("Failed to fetch contacts from API", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  // Get single contact by ID
  const getContactById = async (contactId) => {
    const targetId = contactId?.toString?.() || contactId;
    try {
      const payload = await apiRequest(`/api/contacts/${encodeURIComponent(targetId)}`);
      return { success: true, data: mapContactRecord(payload?.data || payload) };
    } catch (error) {
      console.error("Failed to get contact by ID", error);
      return { success: false, message: error.message };
    }
  };

  // Add contact (submit contact form)
  const addContact = async (contact) => {
    const newContact = {
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      subject: contact.subject || "",
      message: contact.message || "",
      date: new Date().toISOString().slice(0, 10),
      status: "Unread",
    };

    try {
      const payload = await apiRequest("/api/contacts", {
        method: "POST",
        body: JSON.stringify(newContact),
      });

      const createdId = payload?.insertedId || Date.now().toString();
      const created = mapContactRecord({ ...newContact, id: createdId, _id: createdId });
      setContacts((prev) => [created, ...prev]);
      return { success: true, data: created };
    } catch (error) {
      console.error("Failed to add contact", error);
      return { success: false, message: error.message };
    }
  };

  // Delete contact
  const deleteContact = async (contactId) => {
    const targetId = contactId?.toString?.() || contactId;
    try {
      await apiRequest(`/api/contacts/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      setContacts((prev) => prev.filter((c) => c.id?.toString() !== targetId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete contact", error);
      return { success: false, message: error.message };
    }
  };

  // Mark contact as read
  const markAsRead = (contactId) => {
    const targetId = contactId?.toString?.() || contactId;
    setContacts((prev) =>
      prev.map((c) =>
        c.id?.toString() === targetId ? { ...c, status: "Read" } : c
      )
    );
  };

  return (
    <ContactContext.Provider
      value={{
        contacts,
        loading,
        loadContacts,
        getContactById,
        addContact,
        deleteContact,
        markAsRead,
      }}
    >
      {children}
    </ContactContext.Provider>
  );
}
