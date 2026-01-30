import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminLoginPage from "./pages/AdminLoginPage";
import OrderSuccess from "./pages/OrderSuccess";
import UserProfile from "./pages/UserProfile";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ProtectedRoute from "./components/ProtectedRoute";
import { CartProvider } from "./context/CartContext";
import { ProductProvider } from "./context/ProductContext";
import { OrderProvider } from "./context/OrderContext";
import { PaymentProvider } from "./context/PaymentContext";
import { UserProvider } from "./context/UserContext";
import { DeliveryProvider } from "./context/DeliveryContext";
import OrderHistory from "./pages/OrderHistory";

// Handles routing while conditionally hiding global chrome on admin pages
function AppShell() {
  const location = useLocation();
  const hideChrome = location.pathname.startsWith("/admin");

  return (
    <>
      {!hideChrome && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/order-history" element={<OrderHistory />} />
        <Route path="/profile" element={<UserProfile />} />
        {/* Admin Routes - Dedicated admin login page */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-analytics"
          element={
            <ProtectedRoute>
              <AdminAnalytics />
            </ProtectedRoute>
          }
        />
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
            <UserProvider>
              <DeliveryProvider>
                <BrowserRouter>
                  <AppShell />
                </BrowserRouter>
              </DeliveryProvider>
            </UserProvider>
          </PaymentProvider>
        </OrderProvider>
      </CartProvider>
    </ProductProvider>
  );
}

export default App;
