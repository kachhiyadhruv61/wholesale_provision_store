const BUSINESS_START_HOUR = 9;
const BUSINESS_END_HOUR = 19;

function isWithinBusinessWindow(date) {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const startMinutes = BUSINESS_START_HOUR * 60;
  const endMinutes = BUSINESS_END_HOUR * 60;

  return totalMinutes >= startMinutes && totalMinutes <= endMinutes;
}

function getNextDayBusinessStart(date) {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(BUSINESS_START_HOUR, 0, 0, 0);
  return nextDay;
}

export function getDeliveryHoursByDistance(distanceKm) {
  return Number(distanceKm) <= 10 ? 4 : 8;
}

export function calculateDeliveryEta({ distanceKm, orderDate = new Date() }) {
  const safeDistance = Number.isFinite(Number(distanceKm)) ? Number(distanceKm) : 12;
  const estimatedDeliveryHours = getDeliveryHoursByDistance(safeDistance);
  const orderDateObj = orderDate instanceof Date ? orderDate : new Date(orderDate);
  const normalizedOrderDate = Number.isNaN(orderDateObj.getTime()) ? new Date() : orderDateObj;

  const inBusinessWindow = isWithinBusinessWindow(normalizedOrderDate);
  const baseDate = inBusinessWindow
    ? new Date(normalizedOrderDate)
    : getNextDayBusinessStart(normalizedOrderDate);

  const estimatedDeliveryAt = new Date(baseDate);
  estimatedDeliveryAt.setHours(estimatedDeliveryAt.getHours() + estimatedDeliveryHours);

  return {
    distanceKm: safeDistance,
    estimatedDeliveryHours,
    estimatedDeliveryText: `${estimatedDeliveryHours} hours`,
    estimatedDeliveryAt: estimatedDeliveryAt.toISOString(),
    nextDayDelivery: !inBusinessWindow,
  };
}
