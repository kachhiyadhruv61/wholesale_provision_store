import { useState } from "react";

function FAQs() {
  const [expandedId, setExpandedId] = useState(null);

  const faqData = [
    {
      id: 1,
      category: "General",
      question: "What is DK TRADERS?",
      answer: "DK TRADERS is a modern B2B wholesale e-commerce platform that connects retailers with quality products at unbeatable wholesale prices. We offer a wide range of products including grains, spices, oils, and more."
    },
    {
      id: 2,
      category: "General",
      question: "How do I register on DK TRADERS?",
      answer: "You can register by clicking the 'Create Account' button on the home page or navigating to the Register page. Fill in your details including name, email, and password, then submit. Your account will be created instantly."
    },
    {
      id: 3,
      category: "Products",
      question: "What does MOQ mean?",
      answer: "MOQ stands for Minimum Order Quantity. It's the smallest quantity of a product you must order at once. For example, if a product has an MOQ of 2 bags, you must order at least 2 bags."
    },
    {
      id: 4,
      category: "Products",
      question: "Do you offer bulk pricing?",
      answer: "Yes! We offer tiered bulk pricing. The more you order, the lower the per-unit price. Our bulk pricing tiers start at quantity 1, 5, 10, and 20+ units."
    },
    {
      id: 5,
      category: "Products",
      question: "What product categories are available?",
      answer: "We offer products in the following categories: Grains, Sweeteners, Oils, Spices, Snacks, and Others. Each category contains multiple quality products."
    },
    {
      id: 6,
      category: "Ordering",
      question: "How do I place an order?",
      answer: "1. Browse products and add them to your cart (respecting MOQ). 2. Go to checkout and review your order. 3. Select a payment method. 4. Complete the payment. Your order will be confirmed immediately."
    },
    {
      id: 7,
      category: "Ordering",
      question: "Can I modify my order after placing it?",
      answer: "Once an order is placed, you cannot modify it directly. If you need to make changes, please contact our support team at dktraders1027@gmail.com or call +91 9313616159."
    },
    {
      id: 8,
      category: "Ordering",
      question: "What is the minimum order value?",
      answer: "There is no specific minimum order value. Orders over ₹6000 get free delivery. Below ₹6000, delivery charges apply and are shown at checkout before payment."
    },
    {
      id: 9,
      category: "Payments",
      question: "What payment methods do you accept?",
      answer: "We accept 4 payment methods: 1) UPI (Google Pay, PhonePe, Paytm), 2) Debit Card, 3) Credit Card, and 4) Net Banking. All payments are secured with 100% protection."
    },
    {
      id: 10,
      category: "Payments",
      question: "Is my payment information secure?",
      answer: "Yes, absolutely. We use industry-standard encryption and secure payment gateways. Your payment information is never stored on our servers and is handled by trusted payment processors."
    },
    {
      id: 11,
      category: "Shipping & Delivery",
      question: "How long does delivery take?",
      answer: "Standard delivery takes 3-5 business days within India. Express delivery options may be available for select locations. You'll receive tracking information via email after your order is dispatched."
    },
    {
      id: 12,
      category: "Shipping & Delivery",
      question: "Do you deliver outside India?",
      answer: "Currently, we deliver only within India. We are working on expanding our delivery network to international locations. Check back soon for updates."
    },
    {
      id: 13,
      category: "Shipping & Delivery",
      question: "What are shipping charges?",
      answer: "Orders over ₹6000 get free delivery. Below ₹6000, delivery charges are calculated based on weight and location. Charges are displayed at checkout before payment."
    },
    {
      id: 14,
      category: "Returns & Refunds",
      question: "What is your return policy?",
      answer: "We accept returns within 7 days of delivery for damaged or defective products. Items must be in original packaging. Contact our support team to initiate a return."
    },
    {
      id: 15,
      category: "Returns & Refunds",
      question: "How long does refund processing take?",
      answer: "Once we receive and verify your returned item, refunds are processed within 5-7 business days. The refund will be credited to your original payment method."
    },
    {
      id: 16,
      category: "Account",
      question: "How do I reset my password?",
      answer: "Click 'Forgot Password' on the login page, enter your registered email, and follow the instructions sent to your email. You'll be able to set a new password."
    },
    {
      id: 17,
      category: "Account",
      question: "Can I view my order history?",
      answer: "Yes! Log into your account and go to 'Order History' to see all your past orders, their status, and details. You can track ongoing deliveries from there."
    },
    {
      id: 18,
      category: "Support",
      question: "How can I contact customer support?",
      answer: "You can reach us via: Email: dktraders1027@gmail.com | Phone: +91 9313616159 | Facebook: facebook.com/profile.php?id=61587681500936 | Instagram: instagram.com/dktraders1027/"
    },
    {
      id: 19,
      category: "Support",
      question: "What are your support hours?",
      answer: "We provide 24/7 support via email. Phone support is available Monday to Friday, 9 AM to 6 PM IST. For urgent matters, please email us anytime."
    },
    {
      id: 20,
      category: "Support",
      question: "Is there a live chat option?",
      answer: "Live chat support is coming soon! In the meantime, please reach out via email or phone for immediate assistance."
    }
  ];

  const categories = [...new Set(faqData.map(faq => faq.category))];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="faqs-page">
      {/* Header */}
      <div className="faqs-header">
        <h1>Frequently Asked Questions</h1>
        <p>Find answers to common questions about DK TRADERS</p>
      </div>

      {/* FAQs Container */}
      <div className="faqs-container">
        {categories.map(category => (
          <div key={category} className="faq-category">
            <h2 className="category-title">{category}</h2>
            
            <div className="faq-items">
              {faqData.filter(faq => faq.category === category).map(faq => (
                <div 
                  key={faq.id} 
                  className={`faq-item ${expandedId === faq.id ? 'expanded' : ''}`}
                >
                  <button 
                    className="faq-question"
                    onClick={() => toggleExpand(faq.id)}
                  >
                    <span className="question-text">{faq.question}</span>
                    <span className="faq-icon">
                      {expandedId === faq.id ? '−' : '+'}
                    </span>
                  </button>
                  
                  {expandedId === faq.id && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="faqs-contact-section">
        <h2>Didn't find your answer?</h2>
        <p>Contact our support team for immediate assistance</p>
        <div className="contact-buttons">
          <a href="mailto:dktraders1027@gmail.com" className="btn btn-hero-primary">
            📧 Email Support
          </a>
          <a href="tel:+919313616159" className="btn btn-hero-secondary">
            📞 Call Us
          </a>
        </div>
      </div>
    </div>
  );
}

export default FAQs;
