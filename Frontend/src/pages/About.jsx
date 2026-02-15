import React from "react";
import { Link } from "react-router-dom";

// Project-focused highlights for DK TRADERS
const highlights = [
  { label: "Wholesale Products", value: "50+", hint: "with MOQ & bulk pricing" },

  { label: "Payment Methods", value: "Multiple", hint: "COD · UPI · Card · Bank " },

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

const benefits = [
  {
    title: "Retailer-first onboarding",
    detail: "Quick registration with profile verification and MOQ-ready access.",
  },
  {
    title: "Clear pricing transparency",
    detail: "Tiered wholesale pricing with visible savings at each quantity slab.",
  },
  {
    title: "Reliable fulfillment",
    detail: "Order status tracking, delivery updates, and invoice-friendly records.",
  },
  {
    title: "Secure transactions",
    detail: "Multiple payment options with method-wise validation and confirmations.",
  },
];

const steps = [
  {
    step: "01",
    title: "Create account",
    detail: "Register as a retailer and complete your business profile.",
  },
  {
    step: "02",
    title: "Browse & shortlist",
    detail: "Filter products, compare MOQ, and lock your best bulk deals.",
  },
  {
    step: "03",
    title: "Place wholesale order",
    detail: "Review totals, choose a payment method, and confirm instantly.",
  },
];

const trustBadges = ["MOQ Ready", "Bulk Pricing", "Secure Checkout", "Fast Support", "Order History"];

const whyChooseIcons = [
  {
    icon: "🏪",
    title: "Local wholesale experience",
    detail: "Built by retailers, for retailers in India.",
  },
  {
    icon: "📦",
    title: "MOQ & bulk pricing focus",
    detail: "Clear tiers, smart validation, real savings.",
  },
  {
    icon: "🚚",
    title: "Reliable delivery & support",
    detail: "Fast dispatch, tracking, 24/7 help.",
  },
  {
    icon: "🔐",
    title: "Secure B2B ordering",
    detail: "Multiple payments, verified retailers, safe.",
  },
];

const credibilityStats = [
  { icon: "🏬", label: "Retailers served", value: "100+" },
  { icon: "📦", label: "Products in catalog", value: "50+" },
  { icon: "🚚", label: "Daily bulk dispatch", value: "Yes" },
  { icon: "⭐", label: "Trusted in", value: "Anand & nearby" },
];

const businessProof = [
  "GST Registered Wholesale Business",
  "Local Warehouse & Logistics",
  "Secure B2B Payment Gateway",
  "Made for Indian Retailers",
];

const howItWorksFlow = [
  { step: "1", title: "Register as Retailer", desc: "Complete verification in minutes" },
  { step: "2", title: "Browse Bulk Catalog", desc: "MOQ enforced, pricing transparent" },
  { step: "3", title: "Meet pricing tiers", desc: "Buy more, save more instantly" },
  { step: "4", title: "Secure checkout", desc: "Multiple payment methods available" },
  { step: "5", title: "Fast support", desc: "WhatsApp, Call, Email—24/7" },
  { step: "6", title: "Same-day dispatch", desc: "Track orders, get real updates" },
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
            <div className="panel-image-card" aria-hidden="true">
              <img
                src="/images/Cover/Cover%20about.jpg"
                alt=""
                loading="lazy"
                className="panel-image"
              />
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

      <section className="about-benefits">
        <div className="section-header">
          <p className="page-tag">Why choose DK TRADERS</p>
          <h2>Built to grow wholesale businesses</h2>
          <p className="section-subtitle">Everything retailers need to order faster and smarter.</p>
        </div>
        <div className="benefits-grid">
          {benefits.map((benefit) => (
            <div className="benefit-card" key={benefit.title}>
              <h3>{benefit.title}</h3>
              <p>{benefit.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-steps">
        <div className="section-header">
          <p className="page-tag">How it works</p>
          <h2>Three simple steps to order</h2>
        </div>
        <div className="about-steps-grid">
          {steps.map((step) => (
            <div className="about-step-card" key={step.title}>
              <span className="about-step-number">{step.step}</span>
              <h3>{step.title}</h3>
              <p>{step.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-why-icons">
        <div className="section-header">
          <p className="page-tag">Why DK TRADERS?</p>
          <h2>See what makes us different</h2>
        </div>
        <div className="why-icons-grid">
          {whyChooseIcons.map((item) => (
            <div className="why-icon-card" key={item.title}>
              <div className="why-icon-emoji">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-story">
        <div className="section-header">
          <p className="page-tag">Our Story</p>
          <h2>From local wholesale to digital platform</h2>
        </div>
        <div className="story-content">
          <div className="story-text">
            <p>
              DK TRADERS started with a simple realization: Retail shop owners in India deserve a better way to buy wholesale. 
              Physical wholesale markets are chaotic, prices are unclear, and bulk ordering takes days. We built DK TRADERS to fix that.
            </p>
            <p>
              Today, we're a trusted wholesale platform serving retailers in Anand and nearby areas. Our mission is simple: 
              <strong> give retailers the power to grow their business faster with smarter wholesale buying.</strong>
            </p>
          </div>
          <div className="story-icon">🏭</div>
        </div>
      </section>

      <section className="about-credibility">
        <div className="section-header">
          <p className="page-tag">By the numbers</p>
          <h2>Trusted by Indian retailers</h2>
        </div>
        <div className="credibility-stats-grid">
          {credibilityStats.map((stat) => (
            <div className="credibility-stat" key={stat.label}>
              <span className="credibility-stat-icon">{stat.icon}</span>
              <p className="credibility-stat-value">{stat.value}</p>
              <p className="credibility-stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-proof">
        <div className="section-header">
          <p className="page-tag">Business legitimacy</p>
          <h2>Built for real B2B commerce</h2>
        </div>
        <div className="proof-badges">
          {businessProof.map((badge) => (
            <div className="proof-badge" key={badge}>
              <span className="proof-check">✓</span>
              <span>{badge}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="about-flow">
        <div className="section-header">
          <p className="page-tag">The workflow</p>
          <h2>How DK TRADERS works</h2>
          <p className="section-subtitle">Six simple steps to smarter wholesale buying.</p>
        </div>
        <div className="about-flow-grid">
          {howItWorksFlow.map((item) => (
            <div className="about-flow-card" key={item.title}>
              <span className="flow-step-badge">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-cta">
        <div>
          <p className="page-tag">Ready to grow</p>
          <h2>Ready to grow your retail business with smarter wholesale buying?</h2>
          <p className="section-subtitle">
            Start exploring our catalog now. Discover MOQ-friendly products, transparent bulk pricing, 
            and fast support whenever you need it. Order today and experience the difference.
          </p>
        </div>
        <div className="cta-buttons">
          <Link className="btn-hero-primary" to="/products">🟣 Browse Wholesale Catalog</Link>
          <a className="btn-hero-secondary" href="https://wa.me/919999999999?text=Hi%20I%20need%20wholesale%20support" target="_blank" rel="noreferrer">🟢 Talk to Sales</a>
        </div>
      </section>
    </div>
  );
}

export default About;
