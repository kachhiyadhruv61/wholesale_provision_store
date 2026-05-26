import { createContext, useState, useEffect, useCallback } from "react";
import { apiRequest, getResponseList, normalizeMongoId } from "../utils/api";

export const DeliveryContext = createContext();

export function DeliveryProvider({ children }) {
  // Delivery records from API
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(false);

  const mapDeliveryRecord = (record) => {
    const item = normalizeMongoId(record);
    return {
      ...item,
      id: item.id || item._id,
      orderId: item.orderId || "",
      customerName: item.customerName || "",
      address: item.address || "",
      city: item.city || "",
      state: item.state || "",
      pincode: item.pincode || "",
      phone: item.phone || "",
      status: item.status || "Pending",
      deliveryDate: item.deliveryDate || item.date || "",
      deliveryTime: item.deliveryTime || "",
      trackingId: item.trackingId || "",
      notes: item.notes || "",
      createdAt: item.createdAt || new Date().toISOString(),
    };
  };

  // Load deliveries from API
  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const payload = await apiRequest("/api/deliveries");
      const rows = getResponseList(payload);
      setDeliveries(rows.map(mapDeliveryRecord));
    } catch (error) {
      console.error("Failed to fetch deliveries from API", error);
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeliveries();
  }, [loadDeliveries]);

  // Get single delivery by ID
  const getDeliveryById = async (deliveryId) => {
    const targetId = deliveryId?.toString?.() || deliveryId;
    try {
      const payload = await apiRequest(`/api/deliveries/${encodeURIComponent(targetId)}`);
      return { success: true, data: mapDeliveryRecord(payload?.data || payload) };
    } catch (error) {
      console.error("Failed to get delivery by ID", error);
      return { success: false, message: error.message };
    }
  };

  // Add delivery
  const addDelivery = async (delivery) => {
    const newDelivery = {
      orderId: delivery.orderId || "",
      customerName: delivery.customerName || "",
      address: delivery.address || "",
      city: delivery.city || "",
      state: delivery.state || "",
      pincode: delivery.pincode || "",
      phone: delivery.phone || "",
      status: delivery.status || "Pending",
      deliveryDate: delivery.deliveryDate || "",
      deliveryTime: delivery.deliveryTime || "",
      trackingId: delivery.trackingId || `TRK${Date.now()}`,
      notes: delivery.notes || "",
    };

    try {
      const payload = await apiRequest("/api/deliveries", {
        method: "POST",
        body: JSON.stringify(newDelivery),
      });

      const createdId = payload?.insertedId || Date.now().toString();
      const created = mapDeliveryRecord({ ...newDelivery, id: createdId, _id: createdId });
      setDeliveries((prev) => [created, ...prev]);
      return { success: true, data: created };
    } catch (error) {
      console.error("Failed to add delivery", error);
      return { success: false, message: error.message };
    }
  };

  // Update delivery
  const updateDelivery = async (deliveryId, updates) => {
    const targetId = deliveryId?.toString?.() || deliveryId;
    try {
      await apiRequest(`/deliveries/${encodeURIComponent(targetId)}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id?.toString() === targetId ? { ...d, ...updates } : d
        )
      );
      return { success: true };
    } catch (error) {
      console.error("Failed to update delivery", error);
      return { success: false, message: error.message };
    }
  };

  // Update delivery status
  const updateDeliveryStatus = async (deliveryId, newStatus) => {
    return updateDelivery(deliveryId, { status: newStatus });
  };

  // Delete delivery
  const deleteDelivery = async (deliveryId) => {
    const targetId = deliveryId?.toString?.() || deliveryId;
    try {
      await apiRequest(`/deliveries/${encodeURIComponent(targetId)}`, {
        method: "DELETE",
      });
      setDeliveries((prev) => prev.filter((d) => d.id?.toString() !== targetId));
      return { success: true };
    } catch (error) {
      console.error("Failed to delete delivery", error);
      return { success: false, message: error.message };
    }
  };

  // Store locations with coordinates (latitude, longitude)
  const [deliveryLocations] = useState([
    {
      id: 1,
      name: "LDCE Area",
      city: "Anand",
      state: "Gujarat",
      lat: 22.5588,
      lng: 72.9278,
      distance: 0,
      baseCharge: 0
    },
    {
      id: 2,
      name: "Akshar Marg",
      city: "Anand",
      state: "Gujarat",
      lat: 22.5546,
      lng: 72.8975,
      distance: 2.8,
      baseCharge: 30
    },
    {
      id: 3,
      name: "Vallabh Vidyanagar",
      city: "Anand",
      state: "Gujarat",
      lat: 22.5744,
      lng: 72.9283,
      distance: 1.8,
      baseCharge: 20
    },
    {
      id: 4,
      name: "Anand City Center",
      city: "Anand",
      state: "Gujarat",
      lat: 22.5580,
      lng: 72.8933,
      distance: 3.2,
      baseCharge: 40
    },
    {
      id: 5,
      name: "Anand Railway Station",
      city: "Anand",
      state: "Gujarat",
      lat: 22.5501,
      lng: 72.9172,
      distance: 1.2,
      baseCharge: 15
    },
    {
      id: 6,
      name: "Anand Hospital Area",
      city: "Anand",
      state: "Gujarat",
      lat: 22.5654,
      lng: 72.8845,
      distance: 4.5,
      baseCharge: 50
    }
  ]);

  // Calculate delivery charge based on distance and order value
  const calculateDeliveryCharge = (distance, orderValue) => {
    let charge = 0;

    // Base charge per km
    const chargePerKm = 5;
    charge += Math.ceil(distance) * chargePerKm;

    // Discount based on order value
    if (orderValue >= 5000) {
      charge = 0; // Free delivery for orders >= 5000
    } else if (orderValue >= 3000) {
      charge = Math.max(0, charge - 30); // 30 rupees discount
    } else if (orderValue >= 1500) {
      charge = Math.max(0, charge - 15); // 15 rupees discount
    }

    return charge;
  };

  // Get delivery charge by location
  const getDeliveryChargeByLocation = (locationId, orderValue) => {
    const location = deliveryLocations.find(loc => loc.id === locationId);
    if (!location) return null;

    const charge = calculateDeliveryCharge(location.distance, orderValue);
    return {
      location,
      distance: location.distance,
      baseCharge: charge,
      originalCharge: location.baseCharge,
      discount: location.baseCharge - charge,
      finalCharge: Math.max(0, charge)
    };
  };

  // Get delivery info with estimated time
  const getDeliveryInfo = (locationId, orderValue) => {
    const chargeInfo = getDeliveryChargeByLocation(locationId, orderValue);
    if (!chargeInfo) return null;

    // Calculate estimated delivery time (in hours) based on distance
    const distance = chargeInfo.distance;
    let estimatedHours = 0.5; // Base 30 mins
    estimatedHours += (distance / 3) * 0.5; // ~10 mins per km average

    return {
      ...chargeInfo,
      estimatedDeliveryHours: Math.ceil(estimatedHours * 2) / 2, // Round to nearest 0.5 hour
      estimatedDeliveryText: `${Math.ceil(estimatedHours)} hour${Math.ceil(estimatedHours) > 1 ? 's' : ''}`
    };
  };

  // Check if location is available
  const isLocationAvailable = (location) => {
    // All locations in Anand are available
    if (location.city === "Anand" && location.state === "Gujarat") {
      return true;
    }
    return false;
  };

  // Custom location delivery (outside predefined areas)
  const calculateCustomDelivery = (distance, orderValue) => {
    const charge = calculateDeliveryCharge(distance, orderValue);
    return {
      location: null,
      distance,
      baseCharge: charge,
      originalCharge: Math.ceil(distance) * 5,
      discount: Math.ceil(distance) * 5 - charge,
      finalCharge: Math.max(0, charge),
      estimatedDeliveryHours: 0.5 + (distance / 3) * 0.5,
      estimatedDeliveryText: `${Math.ceil(0.5 + (distance / 3) * 0.5)} hour${Math.ceil(0.5 + (distance / 3) * 0.5) > 1 ? 's' : ''}`
    };
  };

  return (
    <DeliveryContext.Provider
      value={{
        // Delivery records from API
        deliveries,
        loading,
        loadDeliveries,
        getDeliveryById,
        addDelivery,
        updateDelivery,
        updateDeliveryStatus,
        deleteDelivery,
        // Local delivery calculation
        deliveryLocations,
        calculateDeliveryCharge,
        getDeliveryChargeByLocation,
        getDeliveryInfo,
        isLocationAvailable,
        calculateCustomDelivery
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}
