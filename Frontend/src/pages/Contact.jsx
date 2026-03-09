import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";
import { NotificationContext } from "../context/NotificationContext";
import { apiClient } from "../utils/apiClient";

const supportPhone = "+919313616159";
const supportWhatsApp = "919313616159";
const supportEmail = "support@dktrade.com";
const partnerEmail = "partners@dktrade.com";
const whatsappMessage = encodeURIComponent("Hi, I need wholesale support.");

const quickActions = [
  {
    title: "Quick Call",
    detail: "Speak to a real person for urgent queries.",
    icon: "📞",
    href: `tel:${supportPhone}`,
    label: "Call now",
  },
  {
    title: "WhatsApp Support",
    detail: "Share order IDs and photos instantly.",
    icon: "💬",
    href: `https://wa.me/${supportWhatsApp}?text=${whatsappMessage}`,
    label: "Chat on WhatsApp",
  },
  {
    title: "Email Support",
    detail: "For invoices, bulk quotes, or feedback.",
    icon: "📩",
    href: `mailto:${supportEmail}`,
    label: "Send email",
  },
];

const channels = [
  {
    title: "Order & delivery",
    detail: "Help with tracking, invoices, returns, and delivery timelines.",
    action: supportEmail,
    href: `mailto:${supportEmail}`,
    icon: "📦",
  },
  {
    title: "Partnerships",
    detail: "Vendors, distributors, and retail partners can reach us here.",
    action: partnerEmail,
    href: `mailto:${partnerEmail}`,
    icon: "🤝",
  },
  {
    title: "Urgent desk",
    detail: "Immediate help for payment or verification issues.",
    action: supportPhone,
    href: `tel:${supportPhone}`,
    icon: "☎️",
  },
];

const officeHours = [
  { label: "Weekdays", value: "8:00 AM – 10:00 PM" },
  { label: "Weekends", value: "9:00 AM – 7:00 PM" },
  { label: "Campus desk", value: "Block C, Level 2" },
];

function Contact() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const { addNotification } = useContext(NotificationContext);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    const formData = new FormData(event.target);
    const name = (formData.get("name") || "").toString().trim();
    const email = (formData.get("email") || "").toString().trim();
    const phone = (formData.get("phone") || "").toString().trim();
    const phoneNumber = phone.replace(/\D/g, "").slice(-10);
    const message = (formData.get("message") || "").toString().trim();

    if (phoneNumber.length !== 10) {
      alert("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      await apiClient.post("/contacts", {
        name,
        email,
        phoneNumber,
        message,
      });

      addNotification({
        type: "contact",
        title: "New contact message",
        message: message || "No message provided.",
        meta: {
          name,
          email,
          phone,
        },
      });

      event.target.reset();
      alert("Thanks! Your message has been sent.");
    } catch (error) {
      alert(error.message || "Unable to send message right now. Please try again.");
    }
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero__content">
          <p className="page-tag">Contact</p>
          <h1>We're here when you need us.</h1>
          <p className="contact-hero__subtitle">
            Reach out for support, partnerships, or quick guidance. We keep channels open so you never wait for answers.
          </p>
          <div className="contact-hero__actions">
            <a className="btn btn-hero-primary" href={`tel:${supportPhone}`}>
              📞 Call now
            </a>
            <a
              className="btn btn-hero-secondary"
              href={`https://wa.me/${supportWhatsApp}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
            >
              💬 WhatsApp
            </a>
            <a className="btn btn-hero-secondary" href={`mailto:${supportEmail}`}>
              📩 Email
            </a>
          </div>
          <div className="contact-hours">
            {officeHours.map((item) => (
              <div className="hour-chip" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="contact-hero__card">
          <h3>Response promise</h3>
          <p>Avg. first reply under 15 minutes during business hours.</p>
          <ul className="contact-hero__list">
            <li>Dedicated wholesale onboarding team</li>
            <li>Bulk order and pricing assistance</li>
            <li>Priority support for repeat buyers</li>
          </ul>
          <div className="contact-metrics">
            <div>
              <p className="metric-number">4.9/5</p>
              <p className="metric-label">support rating</p>
            </div>
            <div>
              <p className="metric-number">15m</p>
              <p className="metric-label">median reply</p>
            </div>
            <div>
              <p className="metric-number">7 days</p>
              <p className="metric-label">handover retention</p>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-quick-actions-section">
        <div className="contact-quick-actions">
          {quickActions.map((action) => (
            <a
              className="contact-quick-card"
              key={action.title}
              href={action.href}
              target={action.href.startsWith("https://") ? "_blank" : undefined}
              rel={action.href.startsWith("https://") ? "noreferrer" : undefined}
            >
              <div className="contact-quick-icon">{action.icon}</div>
              <div>
                <h3>{action.title}</h3>
                <p>{action.detail}</p>
                <span className="contact-quick-link">{action.label} →</span>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="contact-grid-section">
        <div className="contact-grid">
          {channels.map((channel) => (
            <div className="contact-card" key={channel.title}>
              <p className="page-tag">{channel.title}</p>
              <div className="contact-card__header">
                <span className="contact-card__icon">{channel.icon}</span>
                <h3>{channel.title}</h3>
              </div>
              <p>{channel.detail}</p>
              <a className="contact-action" href={channel.href}>
                {channel.action}
              </a>
            </div>
          ))}
        </div>
      </section>

      <section className="contact-form-section">
        <div className="section-header">
          <p className="page-tag">Drop a note</p>
          <h2>Tell us what you need</h2>
          <p className="section-subtitle">We'll route your message to the right person and reply quickly.</p>
        </div>
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>
              Name
              <input name="name" type="text" placeholder="Your full name" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="you@example.com" required />
            </label>
          </div>
          <div className="form-row">
            <label>
              Phone
              <input name="phone" type="tel" placeholder="10-digit phone number" required />
            </label>
          </div>
          <label>
            Message
            <textarea name="message" rows="4" placeholder="Share context or links" required />
          </label>
          <button type="submit" className="btn-hero-primary">Send message</button>
        </form>
      </section>

      <section className="contact-map-section">
        <div className="section-header">
          <p className="page-tag">Find us</p>
          <h2>Visit our location</h2>
          <p className="section-subtitle">We're located in Anand, Gujarat. Stop by during office hours.</p>
        </div>
        <div className="map-container">
          <iframe
            title="DK TRADERS Location - Anand"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117925.21689287055!2d72.86847!3d22.5546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x395e4e6bbd6e6ea7%3A0x7b1b5c6b8a5e5a7!2sAnand%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
            width="100%"
            height="450"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="location-details">
          <div className="location-info">
            <h3>📍 Address</h3>
            <p>DK TRADERS, Block C, Level 2<br />Anand, Gujarat - 388001</p>
          </div>
          <div className="location-info">
            <h3>🕒 Hours</h3>
            <p>Weekdays: 8:00 AM – 10:00 PM<br />Weekends: 9:00 AM – 7:00 PM</p>
          </div>
          <div className="location-info">
            <h3>📞 Contact</h3>
            <p>+91 9313616159<br />support@dktrade.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
