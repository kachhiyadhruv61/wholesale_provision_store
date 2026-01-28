import React from "react";
import { Link } from "react-router-dom";

// Project-focused highlights for DK TRADERS
const highlights = [
  { label: "Wholesale Products", value: "10+", hint: "with MOQ & bulk pricing" },
  { label: "Payment Methods", value: "4", hint: "COD · UPI · Card · Bank" },
  { label: "Checkout", value: "3-Step", hint: "Delivery → Payment → Confirm" },
];

// Project pillars that describe what DK TRADERS offers
const pillars = [
  {
    title: "MOQ & Bulk Pricing",
    detail: "Automatic Minimum Order Quantity validation and tiered pricing for wholesale buyers.",
  },
  {
    title: "Modern Cart & Orders",
    detail: "Sticky order summary, clear totals, and complete order history for retailers.",
  },
  {
    title: "Secure Auth & Profile",
    detail: "Retailer login, comprehensive registration, and profile management with local persistence.",
  },
];

// Tech stack used in this project
const techStack = [
  {
    title: "Frontend",
    description: "React 19, React Router 7, Context API, HTML5, CSS3",
  },
  {
    title: "State & Storage",
    description: "React Context for global state and localStorage persistence",
  },
  {
    title: "Build & Tooling",
    description: "Create React App, npm scripts, VS Code, Web Vitals",
  },
];

function About() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero__overlay" />
        <div className="about-hero__grid">
          <div className="about-hero__copy">
            <p className="page-tag">About DK TRADERS</p>
            <h1 className="about-hero__title">
              Wholesale B2B platform for <span className="accent">smart</span> retail purchasing
            </h1>
            <p className="about-hero__subtitle">
              DK TRADERS is a modern wholesale e‑commerce project built for B2B retailers. 
              It features MOQ validation, bulk pricing, a smooth 3‑step checkout, multiple payment options, 
              and complete order management — all with a clean, responsive UI.
            </p>
            <div className="about-hero__ctas">
              <Link className="btn-hero-primary" to="/products">Browse Products</Link>
              <Link className="btn-hero-secondary" to="/contact">Contact Support</Link>
            </div>
            <div className="about-hero__highlights">
              {highlights.map((item) => (
                <div className="highlight-card" key={item.label}>
                  <p className="highlight-value">{item.value}</p>
                  <p className="highlight-label">{item.label}</p>
                  <p className="highlight-hint">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="about-hero__panel">
            <div className="panel-block">
              <h3>What DK TRADERS Offers</h3>
              <ul>
                <li>Wholesale catalog with search, filters, and MOQ enforcement</li>
                <li>Bulk pricing tiers with clear savings</li>
                <li>3-step checkout with method-specific validations</li>
                <li>Order history, profile management, and secure auth</li>
              </ul>
            </div>
            <div className="panel-block panel-block__accent">
              <h3>Quality Focus</h3>
              <p className="panel-note">Responsive UI, accessible forms, and performance-first design.</p>
              <div className="impact-grid">
                <div>
                  <p className="impact-number">3</p>
                  <p className="impact-label">step checkout</p>
                </div>
                <div>
                  <p className="impact-number">4</p>
                  <p className="impact-label">payment methods</p>
                </div>
                <div>
                  <p className="impact-number">A11y</p>
                  <p className="impact-label">accessible inputs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="about-pillars">
        <div className="section-header">
          <p className="page-tag">Project Pillars</p>
          <h2>Built for wholesale workflows</h2>
          <p className="section-subtitle">Practical features that make day-to-day B2B ordering easier.</p>
        </div>
        <div className="pillars-grid">
          {pillars.map((skill) => (
            <div className="pillar-card" key={skill.title}>
              <h3>{skill.title}</h3>
              <p>{skill.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-timeline">
        <div className="section-header">
          <p className="page-tag">Tech Stack</p>
          <h2>Technologies used in DK TRADERS</h2>
        </div>
        <div className="timeline-grid">
          {techStack.map((item, index) => (
            <div className="timeline-card" key={item.title}>
              <span className="timeline-step">0{index + 1}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <div>
          <p className="page-tag">Continue Shopping</p>
          <h2>Ready to place a wholesale order?</h2>
          <p className="section-subtitle">
            Explore products with MOQ and bulk pricing, add items to your cart, 
            and checkout with COD, UPI, Card, or Bank Transfer — fast and simple.
          </p>
        </div>
        <div className="cta-buttons">
          <Link className="btn-hero-primary" to="/products">Browse Catalog</Link>
          <Link className="btn-hero-secondary" to="/cart">View Cart</Link>
        </div>
      </section>
    </div>
  );
}

export default About;
