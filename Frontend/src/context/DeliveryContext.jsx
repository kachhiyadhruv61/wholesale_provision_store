import { createContext, useState } from "react";

export const DeliveryContext = createContext();

export function DeliveryProvider({ children }) {
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
