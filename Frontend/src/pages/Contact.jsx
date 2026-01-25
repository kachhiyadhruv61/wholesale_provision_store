import React from "react";

const channels = [
  {
    title: "Talk to support",
    detail: "Need help with an active order? We reply fast during campus hours.",
    action: "support@a1store.com",
  },
  {
    title: "Partner with us",
    detail: "Vendors and campus clubs can co-create curated collections.",
    action: "partners@a1store.com",
  },
  {
    title: "Call the desk",
    detail: "Live phone support for urgent delivery questions and verifications.",
    action: "+91 98765 43210",
  },
];

const officeHours = [
  { label: "Weekdays", value: "8:00 AM – 10:00 PM" },
  { label: "Weekends", value: "9:00 AM – 7:00 PM" },
  { label: "Campus desk", value: "Block C, Level 2" },
];

function Contact() {
  const handleSubmit = (event) => {
    event.preventDefault();
    // Prevent page reload; handoff could be wired to a backend later.
  };

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero__content">
          <p className="page-tag">Contact</p>
          <h1>We’re here when you need us.</h1>
          <p className="contact-hero__subtitle">
            Reach out for support, partnerships, or quick guidance. We keep channels open so you never wait for answers.
          </p>
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
          <p>Avg. first reply under 15 minutes during campus hours.</p>
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

      <section className="contact-grid">
        {channels.map((channel) => (
          <div className="contact-card" key={channel.title}>
            <p className="page-tag">{channel.title}</p>
            <h3>{channel.title}</h3>
            <p>{channel.detail}</p>
            <p className="contact-action">{channel.action}</p>
          </div>
        ))}
      </section>

      <section className="contact-form-section">
        <div className="section-header">
          <p className="page-tag">Drop a note</p>
          <h2>Tell us what you need</h2>
          <p className="section-subtitle">We’ll route your message to the right person and reply quickly.</p>
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
              Topic
              <select name="topic" defaultValue="support">
                <option value="support">Support</option>
                <option value="partnership">Partnership</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label>
              Phone (optional)
              <input name="phone" type="tel" placeholder="+91 90000 00000" />
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
            title="A1 Store Location - Anand"
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
            <p>A1 Store, Block C, Level 2<br />Anand, Gujarat - 388001</p>
          </div>
          <div className="location-info">
            <h3>🕒 Hours</h3>
            <p>Weekdays: 8:00 AM – 10:00 PM<br />Weekends: 9:00 AM – 7:00 PM</p>
          </div>
          <div className="location-info">
            <h3>📞 Contact</h3>
            <p>+91 98765 43210<br />support@a1store.com</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;
