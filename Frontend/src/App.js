import "./App.css";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import RouteLoader from "./components/RouteLoader";
import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHome from "./pages/AdminHome";
import AdminLoginPage from "./pages/AdminLoginPage";
import OrderSuccess from "./pages/OrderSuccess";
import UserProfile from "./pages/UserProfile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQs from "./pages/FAQs";
import TrackOrder from "./pages/TrackOrder";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";
import { PaymentProvider } from "./context/PaymentContext";
import { UserProvider } from "./context/UserContext";
import { DeliveryProvider } from "./context/DeliveryContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ContactProvider } from "./context/ContactContext";
import OrderHistory from "./pages/OrderHistory";

// Handles routing while conditionally hiding global chrome on admin pages
function AppShell() {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith("/admin");

  return (
    <>
      <ScrollToTop />
      <RouteLoader />
      {!hideChrome && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faqs" element={<FAQs />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/track-order" element={<TrackOrder />} />
        <Route path="/profile" element={<UserProfile />} />
        {/* Admin Routes - Dedicated admin login page */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin-home"
          element={
            <ProtectedRoute>
              <AdminHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/admin-analytics" element={<Navigate to="/admin-home" replace />} />
      </Routes>
      {!hideChrome && <Footer />}
    </>
  );
}

// Main application shell defining routes and providers
function App() {
  return (
    <ProductProvider>
      <CartProvider>
        <OrderProvider>
          <PaymentProvider>
            <NotificationProvider>
              <UserProvider>
                <DeliveryProvider>
                  <ContactProvider>
                    <BrowserRouter>
                      <AppShell />
                    </BrowserRouter>
                  </ContactProvider>
                </DeliveryProvider>
              </UserProvider>
            </NotificationProvider>
          </PaymentProvider>
        </OrderProvider>
      </CartProvider>
    </ProductProvider>
  );
}

export default App;
