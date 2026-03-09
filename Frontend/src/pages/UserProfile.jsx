import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext";

function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUserProfile, changePassword, logoutUser } =
    useContext(UserContext);

  const [editMode, setEditMode] = useState(false);
  const [changePassMode, setChangePassMode] = useState(false);
  const [formData, setFormData] = useState(
    user || { username: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" }
  );
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");

  if (!user) {
    return (
      <div className="profile-page empty">
        <div className="empty-card">
          <div className="empty-icon">👤</div>
          <h3>Please log in to view your profile</h3>
          <button className="btn-primary" onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      </div>
    );
  }

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSaveProfile = async () => {
    const result = await updateUserProfile(formData);
    if (!result?.success) {
      setMessage(result?.message || "Unable to update profile.");
      setTimeout(() => setMessage(""), 3000);
      return;
    }
    setMessage("Profile updated successfully!");
    setEditMode(false);
    setTimeout(() => setMessage(""), 3000);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({ ...passwordData, [name]: value });
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage("New passwords do not match!");
      return;
    }
    const result = await changePassword(passwordData.oldPassword, passwordData.newPassword);
    if (result.success) {
      setMessage("Password changed successfully!");
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setChangePassMode(false);
    } else {
      setMessage(result.message);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const handleLogout = () => {
    logoutUser();
    navigate("/");
  };

  const initial = String(formData.username || "U").charAt(0).toUpperCase();

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-circle">{initial}</div>
        <div className="header-texts">
          <h2>{formData.username || "User"}</h2>
          <p className="subtitle">Wholesale Retailer • Member since {new Date(user.joinDate).toLocaleDateString()}</p>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={() => navigate("/orders")}>View Orders</button>
          <button className="btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {message && <div className="profile-alert">{message}</div>}

      <div className="profile-grid">
        <div className="profile-card">
          <div className="card-title">
            <span className="card-icon">👤</span>
            <h3>Account Details</h3>
          </div>
          {!editMode ? (
            <div className="details-list">
              <div className="detail-row"><span className="label">Username</span><span className="value">{formData.username}</span></div>
              <div className="detail-row"><span className="label">Email</span><span className="value">{formData.email}</span></div>
              <div className="detail-row"><span className="label">Phone</span><span className="value">{formData.phone}</span></div>
              <div className="detail-row"><span className="label">Address</span><span className="value">{formData.address}</span></div>
              <div className="detail-row"><span className="label">City</span><span className="value">{formData.city}</span></div>
              <div className="detail-row"><span className="label">State</span><span className="value">{formData.state}</span></div>
              <div className="detail-row"><span className="label">PIN Code</span><span className="value">{formData.pincode}</span></div>
              <button className="btn-primary" onClick={() => setEditMode(true)}>Edit Profile</button>
            </div>
          ) : (
            <div className="edit-form">
              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea name="address" value={formData.address} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>City</label>
                <input type="text" name="city" value={formData.city} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>State</label>
                <input type="text" name="state" value={formData.state} onChange={handleEditChange} />
              </div>
              <div className="form-group">
                <label>PIN Code</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleEditChange} pattern="[0-9]{6}" />
              </div>
              <div className="form-actions">
                <button className="btn-success" onClick={handleSaveProfile}>Save Changes</button>
                <button className="btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="profile-card">
          <div className="card-title">
            <span className="card-icon">🔒</span>
            <h3>Security</h3>
          </div>
          {!changePassMode ? (
            <button className="btn-primary" onClick={() => setChangePassMode(true)}>Change Password</button>
          ) : (
            <div className="edit-form">
              <div className="form-group">
                <label>Old Password</label>
                <input type="password" name="oldPassword" value={passwordData.oldPassword} onChange={handlePasswordChange} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} />
              </div>
              <div className="form-actions">
                <button className="btn-success" onClick={handleChangePassword}>Update Password</button>
                <button className="btn-secondary" onClick={() => setChangePassMode(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
