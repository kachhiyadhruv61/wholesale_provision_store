import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from "../utils/apiClient";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    shopName: "",
    shopAddress: "",
    ownerName: "",
    email: "",
    phone: "",
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

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    if (!formData.agreeTerms) {
      alert("Please accept the terms and conditions");
      return;
    }

    try {
      await apiClient.post("/registers", {
        username: formData.username.trim(),
        fullname: formData.ownerName.trim(),
        shopname: formData.shopName.trim(),
        shopaddress: formData.shopAddress.trim(),
        email: formData.email.trim(),
        phonenumber: formData.phone.replace(/\D/g, "").slice(-10),
        password: formData.password,
        confirmpassword: formData.confirmPassword,
      });

      navigate("/verify-registration-otp", {
        state: {
          email: formData.email.trim(),
          fullname: formData.ownerName.trim(),
        },
      });
    } catch (error) {
      alert(error.message || "Unable to register right now.");
    }
  };

  return (
    <div className="auth-page register-page">
      <div className="auth-container register-container register-center">
        <div className="auth-right register-form-section">
          <div className="auth-form-wrapper">
            <div className="form-header">
              <h2>Create Wholesale Account</h2>
              <p>Complete the details to register your business</p>
            </div>

            <form onSubmit={handleRegister} className="auth-form register-form">
              
              {/* Personal Information */}
              <div className="form-section">
                <h3 className="section-heading"> Personal Information</h3>
                
                <div className="input-group">
                  <label htmlFor="username">
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
                <h3 className="section-heading"> Business Information</h3>
                
                <div className="input-group">
                  <label htmlFor="shopName">
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
                  <label htmlFor="shopAddress">
                    Shop Address *
                  </label>
                  <input
                    id="shopAddress"
                    type="text"
                    name="shopAddress"
                    placeholder="Enter shop address"
                    value={formData.shopAddress}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="form-section">
                <h3 className="section-heading"> Contact Information</h3>
                
                <div className="input-group">
                  <label htmlFor="email">
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
                </div>
              </div>

              {/* Security */}
              <div className="form-section">
                <h3 className="section-heading"> Security</h3>
                
                <div className="input-group">
                  <label htmlFor="password">
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
                  I agree to the Terms & Conditions and Privacy Policy of DK TRADERS
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
