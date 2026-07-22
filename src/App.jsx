import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRouteGuard } from "./components/AdminRouteGuard";
import { DriverRouteGuard } from "./components/DriverRouteGuard";
import Home from "./pages/Home";
import Tours from "./pages/Tours";
import TourDetail from "./pages/TourDetail";
import TourBooking from "./pages/TourBooking";
import DriverSelection from "./pages/DriverSelection";
import TourTransaction from "./pages/TourTransaction";
import TourCheckout from "./pages/TourCheckout";
import TourConfirmation from "./pages/TourConfirmation";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Reviews from "./pages/Reviews";
import ReviewThankYou from "./pages/ReviewThankYou";
import Membership from "./pages/Membership";
import MembershipComparison from "./pages/MembershipComparison";
import MembershipTransaction from "./pages/MembershipTransaction";
import MembershipSuccess from "./pages/MembershipSuccess";
import Login from "./pages/Login";
import MemberLogin from "./pages/MemberLogin";
import MemberRegister from "./pages/MemberRegister";
import MemberDashboard from "./pages/MemberDashboard";
import DriverDashboard from "./pages/DriverDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProfile from "./pages/AdminProfile";
import DriverProfile from "./pages/DriverProfile";
import MemberProfile from "./pages/MemberProfile";
import AdminReviewModeration from "./pages/AdminReviewModeration";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import AuthCallback from "./pages/AuthCallback";
import Unauthorized from "./pages/Unauthorized";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import BookingConfirmation from "./pages/BookingConfirmation";
import CookieConsent from "./components/CookieConsent";
import "./styles.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tours" element={<Tours />} />
        <Route path="/tours/:id" element={<TourDetail />} />
        <Route path="/tours/:id/booking" element={<TourBooking />} />
        <Route path="/tours/:id/drivers" element={<DriverSelection />} />
        <Route path="/tours/:id/transaction" element={<TourTransaction />} />
        <Route path="/tours/:id/checkout" element={<TourCheckout />} />
        <Route path="/tours/:id/confirmation" element={<TourConfirmation />} />
        {/* Unified Book Now entry → custom Supabase booking via tours */}
        <Route path="/book" element={<Navigate to="/tours" replace />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path="/vehicles" element={<Vehicles />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/review/thank-you" element={<ReviewThankYou />} />
        <Route path="/login" element={<Login />} />
        <Route path="/member/login" element={<MemberLogin />} />
        <Route path="/member/register" element={<MemberRegister />} />
        <Route path="/member/dashboard" element={<ProtectedRoute requiredRole="member"><MemberDashboard /></ProtectedRoute>} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/membership/comparison" element={<MembershipComparison />} />
        <Route path="/membership/transaction/:planId" element={<MembershipTransaction />} />
        <Route path="/membership/success" element={<MembershipSuccess />} />
        <Route path="/admin/profile" element={<AdminRouteGuard><AdminProfile /></AdminRouteGuard>} />
        <Route path="/driver/profile" element={<DriverRouteGuard><DriverProfile /></DriverRouteGuard>} />
        <Route path="/member/profile" element={<ProtectedRoute requiredRole="member"><MemberProfile /></ProtectedRoute>} />
        <Route path="/driver/dashboard" element={<DriverRouteGuard><DriverDashboard /></DriverRouteGuard>} />
        <Route path="/admin/dashboard" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
        <Route path="/admin" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
        <Route path="/admin/reviews" element={<AdminRouteGuard><AdminReviewModeration /></AdminRouteGuard>} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/cookie-policy" element={<CookiePolicy />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
      <CookieConsent />
    </BrowserRouter>
  );
}

export default App;
