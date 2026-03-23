import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "./OrderStatusTimeline.module.css";
import { apiClient } from "../utils/apiClient";

const TIMELINE_STEPS = [
  { key: "confirmed", label: "Confirmed" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

const MONGO_ID_REGEX = /^[a-f\d]{24}$/i;

function formatDate(value) {
  if (!value) return "Pending";
  const date = new Date(value); 
  if (Number.isNaN(date.getTime())) return "Pending";

  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeHistory(responseData) {
  const normalized = {
    confirmed: null,
    shipped: null,
    delivered: null,
  };

  if (!responseData || typeof responseData !== "object") {
    return normalized;
  }

  const directConfirmed = responseData.confirmedDate || responseData.confirmedAt || responseData.confirmed;
  const directShipped = responseData.shippedDate || responseData.shippedAt || responseData.shipped;
  const directDelivered = responseData.deliveredDate || responseData.deliveredAt || responseData.delivered;

  normalized.confirmed = directConfirmed || null;
  normalized.shipped = directShipped || null;
  normalized.delivered = directDelivered || null;

  const history = Array.isArray(responseData.history)
    ? responseData.history
    : Array.isArray(responseData.statusHistory)
      ? responseData.statusHistory
      : [];

  history.forEach((item) => {
    const status = String(item?.status || "").trim().toLowerCase();
    const dateValue = item?.date || item?.updatedAt || item?.timestamp || item?.createdAt || null;

    if (status === "confirmed" && !normalized.confirmed) normalized.confirmed = dateValue;
    if (status === "shipped" && !normalized.shipped) normalized.shipped = dateValue;
    if (status === "delivered" && !normalized.delivered) normalized.delivered = dateValue;
  });

  return normalized;
}

function OrderStatusTimeline() {
  const { orderId } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusDates, setStatusDates] = useState({
    confirmed: null,
    shipped: null,
    delivered: null,
  });

  useEffect(() => {
    if (!orderId) {
      setError("Order ID is missing.");
      return;
    }

    let isMounted = true;

    const fetchStatusHistory = async () => {
      setLoading(true);
      setError("");

      try {
        let orderData;

        if (MONGO_ID_REGEX.test(orderId)) {
          const response = await apiClient.get(`/api/orders/${encodeURIComponent(orderId)}`);
          orderData = response?.data || response;
        } else {
          const response = await apiClient.get("/api/orders");
          const allOrders = Array.isArray(response?.data) ? response.data : [];
          orderData = allOrders.find((entry) => {
            const candidateOrderId = String(entry?.orderId || "").trim().toLowerCase();
            const candidateMongoId = String(entry?._id || entry?.id || "").trim().toLowerCase();
            const lookup = String(orderId || "").trim().toLowerCase();
            return candidateOrderId === lookup || candidateMongoId === lookup;
          });
        }

        if (!orderData) {
          throw new Error("Order not found.");
        }

        if (!isMounted) return;

        setStatusDates(normalizeHistory(orderData));
      } catch (fetchError) {
        if (!isMounted) return;
        setError(fetchError.message || "Something went wrong while fetching timeline.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatusHistory();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const timelineRows = useMemo(
    () =>
      TIMELINE_STEPS.map((step) => {
        const dateValue = statusDates[step.key];
        const completed = Boolean(dateValue);

        return {
          ...step,
          completed,
          displayDate: completed ? formatDate(dateValue) : "Pending",
        };
      }),
    [statusDates]
  );

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1 className={styles.title}>Order Status Timeline</h1>
        <p className={styles.subtitle}>Track progress with clear milestone dates.</p>

        {loading ? <p className={styles.info}>Loading status timeline...</p> : null}
        {error ? <p className={styles.error}>{error}</p> : null}

        {!loading && !error ? (
          <ol className={styles.timeline}>
            {timelineRows.map((row) => (
              <li key={row.key} className={styles.item}>
                <span
                  className={`${styles.dot} ${row.completed ? styles.dotCompleted : styles.dotPending}`}
                  aria-hidden="true"
                />
                <div className={styles.content}>
                  <div className={styles.rowHeader}>
                    <span className={`${styles.status} ${row.completed ? styles.completed : styles.pending}`}>
                      {row.completed ? "✔" : "○"} {row.label}
                    </span>
                  </div>
                  <span className={styles.date}>{row.displayDate}</span>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
      </section>
    </main>
  );
}

export default OrderStatusTimeline;
