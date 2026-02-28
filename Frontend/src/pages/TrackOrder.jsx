import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TrackOrder.module.css";

const TIMELINE_STEPS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const VALID_TRACKING_ID = /^[A-Za-z0-9_-]{4,40}$/;

function normalizeStatus(status) {
  const normalized = String(status || "Pending").trim().toLowerCase();
  if (normalized === "out for delivery") return "Out for Delivery";
  if (normalized === "delivered") return "Delivered";
  if (normalized === "shipped") return "Shipped";
  if (normalized === "processing") return "Processing";
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  return "Pending";
}

function formatDateTime(dateValue) {
  if (!dateValue) return "—";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TrackOrder() {
  const [trackingId, setTrackingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [trackingData, setTrackingData] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const timelineState = useMemo(() => {
    if (!trackingData) {
      return { currentStepIndex: -1, isCancelled: false };
    }

    const status = normalizeStatus(trackingData.currentStatus);
    if (status === "Cancelled") {
      return { currentStepIndex: -1, isCancelled: true };
    }

    const stepIndex = TIMELINE_STEPS.findIndex((step) => step === status);
    return { currentStepIndex: stepIndex, isCancelled: false };
  }, [trackingData]);

  const handleTrackOrder = async (event) => {
    event.preventDefault();
    const cleanTrackingId = trackingId.trim();

    if (!VALID_TRACKING_ID.test(cleanTrackingId)) {
      setTrackingData(null);
      setError("Please enter a valid Tracking ID.");
      return;
    }

    setLoading(true);
    setError("");
    setTrackingData(null);

    try {
      const response = await fetch(`/api/tracking/${encodeURIComponent(cleanTrackingId)}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Tracking ID not found. Please check and try again.");
        }
        throw new Error("Unable to fetch tracking details right now.");
      }

      const data = await response.json();
      const currentStatus = normalizeStatus(data.currentStatus || data.status);

      setTrackingData({
        trackingId: data.trackingId || cleanTrackingId,
        currentStatus,
        orderDate: data.orderDate || data.date || data.createdAt || null,
        estimatedDelivery:
          data.estimatedDelivery ||
          data.estimatedDeliveryAt ||
          data.estimatedDeliveryDate ||
          data.expectedDelivery ||
          data.expectedDeliveryAt ||
          data.eta ||
          null,
      });
    } catch (fetchError) {
      setError(fetchError.message || "Something went wrong while tracking your order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.pageWrap}>
      <section className={styles.card}>
        <header className={styles.header}>
          <h1>Track Your Order</h1>
          <p>Enter your tracking ID to see the latest delivery progress.</p>
        </header>

        <form onSubmit={handleTrackOrder} className={styles.form}>
          <label htmlFor="trackingId" className={styles.label}>
            Tracking ID
          </label>
          <div className={styles.inputRow}>
            <input
              id="trackingId"
              ref={inputRef}
              type="text"
              value={trackingId}
              onChange={(event) => setTrackingId(event.target.value)}
              placeholder="e.g. TRK-209184"
              className={styles.input}
              aria-label="Enter tracking ID"
            />
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Tracking..." : "Track Order"}
            </button>
          </div>
        </form>

        {error ? <p className={styles.error}>{error}</p> : null}

        {trackingData ? (
          <div className={styles.result}>
            <div className={styles.resultGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tracking ID</span>
                <strong>{trackingData.trackingId}</strong>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Current Status</span>
                <strong>{trackingData.currentStatus}</strong>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Order Date</span>
                <strong>{formatDateTime(trackingData.orderDate)}</strong>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Estimated Delivery</span>
                <strong>{formatDateTime(trackingData.estimatedDelivery)}</strong>
              </div>
            </div>

            <div className={styles.timelineBlock}>
              <h2>Order Timeline</h2>
              {timelineState.isCancelled ? (
                <div className={styles.cancelledState}>This order has been cancelled.</div>
              ) : null}

              <ol className={`${styles.timeline} ${timelineState.isCancelled ? styles.timelineCancelled : ""}`}>
                {TIMELINE_STEPS.map((step, index) => {
                  const isCompleted = !timelineState.isCancelled && index <= timelineState.currentStepIndex;
                  const isCurrent = !timelineState.isCancelled && index === timelineState.currentStepIndex;

                  return (
                    <li
                      key={step}
                      className={`${styles.step} ${isCompleted ? styles.stepCompleted : ""} ${
                        isCurrent ? styles.stepCurrent : ""
                      }`}
                    >
                      <span className={styles.stepDot} aria-hidden="true" />
                      <span className={styles.stepLabel}>{step}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default TrackOrder;
