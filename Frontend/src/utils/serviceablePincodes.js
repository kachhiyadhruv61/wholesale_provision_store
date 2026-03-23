const SERVICEABLE_PINCODES = new Set([
  "388001", "388110", "388120", "388121", "388130", "388150", "388160", "388180", "388205", "388210",
  "388220", "388305", "388306", "388307", "388310", "388315", "388320", "388325", "388330", "388335",
  "388340", "388345", "388350", "388355", "388360", "388365", "388370", "388430", "388450", "388460",
  "388510", "388520", "388530", "388540", "388543", "388545", "388550", "388560", "388570", "388620",
  "388625", "387001", "387002", "387110", "387120", "387130", "387210", "387220", "387240", "387310",
  "387320", "390001", "390002", "390003", "390004", "390007", "390010", "391110", "391243", "391244",
  "382220", "382225", "382230", "382260", "382265", "392001", "392015", "392020", "392150",
]);

export const sanitizePincode = (value) => String(value || "").replace(/\D/g, "").slice(0, 6);

export const isServiceablePincode = (value) => {
  const normalized = sanitizePincode(value);
  return normalized.length === 6 && SERVICEABLE_PINCODES.has(normalized);
};

export const getPincodeDeliveryMessage = (value) => {
  const normalized = sanitizePincode(value);

  if (normalized.length < 6) {
    return "Please enter a 6-digit PIN code.";
  }

  if (!isServiceablePincode(normalized)) {
    return "Sorry, delivery is not available in your area yet.";
  }

  return "Delivery available at your location.";
};

export const serviceablePincodes = Object.freeze(Array.from(SERVICEABLE_PINCODES));
