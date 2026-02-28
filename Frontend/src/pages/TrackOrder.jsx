import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./TrackOrder.module.css";

const TIMELINE_STEPS = [
  { key: "Pending", title: "Order Placed" },
  { key: "Confirmed", title: "Confirmed" },
  { key: "Processing", title: "Packed" },
  { key: "Shipped", title: "Shipped" },
  { key: "Out for Delivery", title: "Out for Delivery" },
  { key: "Delivered", title: "Delivered" },
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

function getStepDates(data) {
  const stepDates = {};
  const history = Array.isArray(data?.history)
    ? data.history
    : Array.isArray(data?.statusHistory)
      ? data.statusHistory
      : [];

  history.forEach((entry) => {
    const normalized = normalizeStatus(entry?.status);
    const dateValue = entry?.date || entry?.updatedAt || entry?.timestamp || entry?.createdAt || null;

    if (dateValue && !stepDates[normalized]) {
      stepDates[normalized] = dateValue;
    }
  });

  if (!stepDates.Pending && (data?.orderDate || data?.date || data?.createdAt)) {
    stepDates.Pending = data.orderDate || data.date || data.createdAt;
  }

  return stepDates;
}

function getStatusHeadline(status) {
  if (status === "Delivered") return "Order delivered";
  if (status === "Out for Delivery") return "Order is out for delivery";
  if (status === "Shipped") return "Order has been shipped";
  if (status === "Processing") return "Seller is preparing your order";
  if (status === "Confirmed") return "Order has been confirmed";
  if (status === "Cancelled") return "Order was cancelled";
  return "Order has been placed";
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
      return { currentStepIndex: -1, isCancelled: false, headline: "" };
    }

    const status = normalizeStatus(trackingData.currentStatus);
    if (status === "Cancelled") {
      return { currentStepIndex: -1, isCancelled: true, headline: getStatusHeadline(status) };
    }

    const stepIndex = TIMELINE_STEPS.findIndex((step) => step.key === status);
    return { currentStepIndex: stepIndex, isCancelled: false, headline: getStatusHeadline(status) };
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
        statusUpdatedAt: data.statusUpdatedAt || data.updatedAt || data.lastUpdated || null,
        stepDates: getStepDates(data),
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
            <div className={styles.summaryCard}>
              <div>
                <p className={styles.summaryLabel}>Current Update</p>
                <h2 className={styles.summaryTitle}>{timelineState.headline}</h2>
                <p className={styles.summarySubtext}>
                  Status: <strong>{trackingData.currentStatus}</strong>
                </p>
              </div>
              <div className={styles.etaBlock}>
                <span className={styles.metaLabel}>Expected Delivery</span>
                <strong>{formatDateTime(trackingData.estimatedDelivery)}</strong>
              </div>
            </div>

            <div className={styles.resultGrid}>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Tracking ID</span>
                <strong>{trackingData.trackingId}</strong>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Order Date</span>
                <strong>{formatDateTime(trackingData.orderDate)}</strong>
              </div>
              <div className={styles.metaItem}>
                <span className={styles.metaLabel}>Last Updated</span>
                <strong>{formatDateTime(trackingData.statusUpdatedAt || trackingData.orderDate)}</strong>
              </div>
            </div>

            <div className={styles.timelineBlock}>
              <h2>Tracking Progress</h2>
              {timelineState.isCancelled ? (
                <div className={styles.cancelledState}>This order has been cancelled.</div>
              ) : null}

              <ol className={`${styles.timeline} ${timelineState.isCancelled ? styles.timelineCancelled : ""}`}>
                {TIMELINE_STEPS.map((step, index) => {
                  const isCompleted = !timelineState.isCancelled && index <= timelineState.currentStepIndex;
                  const isCurrent = !timelineState.isCancelled && index === timelineState.currentStepIndex;
                  const stepDate = trackingData.stepDates?.[step.key] || null;

                  return (
                    <li
                      key={step.key}
                      className={`${styles.step} ${isCompleted ? styles.stepCompleted : ""} ${
                        isCurrent ? styles.stepCurrent : ""
                      }`}
                    >
                      <span className={styles.stepDot} aria-hidden="true">
                        {isCompleted ? "✓" : index + 1}
                      </span>
                      <div className={styles.stepContent}>
                        <span className={styles.stepLabel}>{step.title}</span>
                        <span className={styles.stepMeta}>
                          {isCompleted
                            ? formatDateTime(stepDate)
                            : isCurrent
                              ? "In progress"
                              : "Pending"}
                        </span>
                      </div>
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
