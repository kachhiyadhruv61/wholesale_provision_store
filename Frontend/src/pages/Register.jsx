import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    shopName: "",
    ownerName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    gstNumber: "",
    businessAddress: "",
    city: "",
    state: "",
    pincode: "",
    businessType: "",
    yearsInBusiness: "",
    referenceBy: "",
    expectedMonthlyOrder: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!formData.agreeTerms) {
      alert("Please accept the terms and conditions");
      return;
    }
    // For demo purposes, just navigate to login
    alert("Registration successful! Please login to continue.");
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-left">
          <div className="auth-branding">
            <div className="brand-icon">🏪</div>
            <h1>Join DK TRADE</h1>
            <p>Register your wholesale provision store and get access to the best rates in the market</p>
          </div>
          
          <div className="auth-features">
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>Wholesale Rates for Retailers</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚚</span>
              <span>Free Home Delivery</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📦</span>
              <span>Bulk Order Discounts</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💳</span>
              <span>Credit Facility Available</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Easy Order Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎁</span>
              <span>Exclusive Member Deals</span>
            </div>
          </div>
        </div>

        <div className="auth-right register-form-section">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h2>Create Wholesale Account</h2>
              <p>Complete all details to register your business</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form register-form">
              
              {/* Personal Information */}
              <div className="form-section">
                <h3 className="section-heading">👤 Personal Information</h3>
                
                <div className="input-group">
                  <label htmlFor="username">
                    <span className="label-icon">🔤</span>
                    Username *
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="Choose a unique username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                  <small className="input-hint">This will be your login username</small>
                </div>

                <div className="input-group">
                  <label htmlFor="ownerName">
                    <span className="label-icon">👨‍💼</span>
                    Full Name *
                  </label>
                  <input
                    id="ownerName"
                    type="text"
                    name="ownerName"
                    placeholder="Enter your full name"
                    value={formData.ownerName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Business Information */}
              <div className="form-section">
                <h3 className="section-heading">📋 Business Information</h3>
                
                <div className="input-group">
                  <label htmlFor="shopName">
                    <span className="label-icon">🏪</span>
                    Shop/Business Name *
                  </label>
                  <input
                    id="shopName"
                    type="text"
                    name="shopName"
                    placeholder="Enter your shop name"
                    value={formData.shopName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="gstNumber">
                    <span className="label-icon">📄</span>
                    GST Number
                  </label>
                  <input
                    id="gstNumber"
                    type="text"
                    name="gstNumber"
                    placeholder="22AAAAA0000A1Z5 (Optional)"
                    value={formData.gstNumber}
                    onChange={handleChange}
                  />
                  <small className="input-hint">GST registration number if available</small>
                </div>

                <div className="input-group">
                  <label htmlFor="businessType">
                    <span className="label-icon">🏢</span>
                    Business Type *
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Business Type</option>
                    <option value="retail">Retail Store</option>
                    <option value="kirana">Kirana Store</option>
                    <option value="supermarket">Supermarket</option>
                    <option value="restaurant">Restaurant/Hotel</option>
                    <option value="distributor">Distributor</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="input-group">
                  <label htmlFor="yearsInBusiness">
                    <span className="label-icon">📅</span>
                    Years in Business *
                  </label>
                  <input
                    id="yearsInBusiness"
                    type="number"
                    name="yearsInBusiness"
                    placeholder="Enter years of experience"
                    value={formData.yearsInBusiness}
                    onChange={handleChange}
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="form-section">
                <h3 className="section-heading">📞 Contact Information</h3>
                
                <div className="input-group">
                  <label htmlFor="email">
                    <span className="label-icon">📧</span>
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label htmlFor="phone">
                      <span className="label-icon">📱</span>
                      Primary Mobile Number *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      name="phone"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                      pattern="[0-9+\s-]+"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="alternatePhone">
                      <span className="label-icon">☎️</span>
                      Alternate Mobile Number
                    </label>
                    <input
                      id="alternatePhone"
                      type="tel"
                      name="alternatePhone"
                      placeholder="+91 9876543210"
                      value={formData.alternatePhone}
                      onChange={handleChange}
                      pattern="[0-9+\s-]+"
                    />
                  </div>
                </div>
              </div>

              {/* Business Address */}
              <div className="form-section">
                <h3 className="section-heading">📍 Business Address</h3>
                
                <div className="input-group">
                  <label htmlFor="businessAddress">
                    <span className="label-icon">🏠</span>
                    Street Address *
                  </label>
                  <textarea
                    id="businessAddress"
                    name="businessAddress"
                    placeholder="Shop No., Building, Street Name"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    rows="2"
                    required
                  />
                </div>

                <div className="input-row">
                  <div className="input-group">
                    <label htmlFor="city">
                      <span className="label-icon">🌆</span>
                      City *
                    </label>
                    <input
                      id="city"
                      type="text"
                      name="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="state">
                      <span className="label-icon">🗺️</span>
                      State *
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select State</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="input-group">
                    <label htmlFor="pincode">
                      <span className="label-icon">📮</span>
                      PIN Code *
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      name="pincode"
                      placeholder="380001"
                      value={formData.pincode}
                      onChange={handleChange}
                      pattern="[0-9]{6}"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Order Information */}
              <div className="form-section">
                <h3 className="section-heading">💼 Order Information</h3>
                
                <div className="input-group">
                  <label htmlFor="expectedMonthlyOrder">

                <div className="input-group">
                  <label htmlFor="referenceBy">
                    <span className="label-icon">🤝</span>
                    Reference By
                  </label>
                  <input
                    id="referenceBy"
                    type="text"
                    name="referenceBy"
                    placeholder="Name of person who referred you (Optional)"
                    value={formData.referenceBy}
                    onChange={handleChange}
                  />
                  <small className="input-hint">If someone referred you to DK TRADE</small>
                </div>
                    <span className="label-icon">💰</span>
                    Expected Monthly Order Value *
                  </label>
                  <select
                    id="expectedMonthlyOrder"
                    name="expectedMonthlyOrder"
                    value={formData.expectedMonthlyOrder}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Range</option>
                    <option value="below-10k">Below ₹10,000</option>
                    <option value="10k-25k">₹10,000 - ₹25,000</option>
                    <option value="25k-50k">₹25,000 - ₹50,000</option>
                    <option value="50k-1l">₹50,000 - ₹1,00,000</option>
                    <option value="above-1l">Above ₹1,00,000</option>
                  </select>
                  <small className="input-hint">This helps us serve you better</small>
                </div>
              </div>

              {/* Security */}
              <div className="form-section">
                <h3 className="section-heading">🔒 Security</h3>
                
                <div className="input-group">
                  <label htmlFor="password">
                    <span className="label-icon">🔑</span>
                    Password *
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength="6"
                    required
                  />
                  <small className="input-hint">Minimum 6 characters</small>
                </div>

                <div className="input-group">
                  <label htmlFor="confirmPassword">
                    <span className="label-icon">🔑</span>
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    minLength="6"
                    required
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="agreeTerms" className="checkbox-label">
                  I agree to the <a href="#" className="terms-link">Terms & Conditions</a> and <a href="#" className="terms-link">Privacy Policy</a> of DK TRADE
                </label>
              </div>

              <button type="submit" className="auth-submit-btn">
                <span>Complete Registration</span>
                <span className="btn-arrow">→</span>
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Login Here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
