import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRouteGuard } from "./components/AdminRouteGuard";
import { DriverRouteGuard } from "./components/DriverRouteGuard";
import Home from "./pages/Home";
import Tours from "./pages/Tours";
import TourDetail from "./pages/TourDetail";
import TourBooking from "./pages/TourBooking";
import DriverSelection from "./pages/DriverSelection";
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
import PrivacyPolicy from "./pages/PrivacyPolicy";
import CookiePolicy from "./pages/CookiePolicy";
import TermsOfService from "./pages/TermsOfService";
import CancellationPolicy from "./pages/CancellationPolicy";
import AuthCallback from "./pages/AuthCallback";
import Unauthorized from "./pages/Unauthorized";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentFailed from "./pages/PaymentFailed";
import BookingConfirmation from "./pages/BookingConfirmation";
import Book from "./pages/Book";
import Packages from "./pages/Packages";
import NotFound from "./pages/NotFound";
import CookieConsent from "./components/CookieConsent";
import ContactFab from "./components/ContactFab";
import "./styles.css";

const MemberDashboard = lazy(() => import("./pages/MemberDashboard"));
const MemberSubscriptions = lazy(() => import("./pages/MemberSubscriptions"));
const MemberBookingDetail = lazy(() => import("./pages/MemberBookingDetail"));
const MemberProfile = lazy(() => import("./pages/MemberProfile"));
const DriverDashboard = lazy(() => import("./pages/DriverDashboard"));
const DriverTrip = lazy(() => import("./pages/DriverTrip"));
const DriverProfile = lazy(() => import("./pages/DriverProfile"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminTours = lazy(() => import("./pages/AdminTours"));
const AdminFleet = lazy(() => import("./pages/AdminFleet"));
const AdminInvoices = lazy(() => import("./pages/AdminInvoices"));
const AdminTracking = lazy(() => import("./pages/AdminTracking"));
const AdminProfile = lazy(() => import("./pages/AdminProfile"));
const AdminReviewModeration = lazy(() => import("./pages/AdminReviewModeration"));
const AdminLeads = lazy(() => import("./pages/AdminLeads"));

function HubFallback() {
  return (
    <div className="page" style={{ padding: "3rem 1.5rem", textAlign: "center" }} role="status">
      Loading…
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<HubFallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contact" element={<Navigate to={{ pathname: "/", hash: "contact" }} replace />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/:id" element={<TourDetail />} />
          <Route path="/tours/:id/booking" element={<TourBooking />} />
          <Route path="/tours/:id/drivers" element={<DriverSelection />} />
          <Route path="/tours/:id/transaction" element={<LegacyTransactionRedirect />} />
          <Route path="/tours/:id/checkout" element={<TourCheckout />} />
          <Route path="/tours/:id/confirmation" element={<TourConfirmation />} />
          <Route path="/book" element={<Book />} />
          <Route path="/packages" element={<Packages />} />
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
          <Route path="/member/subscriptions" element={<ProtectedRoute requiredRole="member"><MemberSubscriptions /></ProtectedRoute>} />
          <Route path="/member/bookings/:id" element={<ProtectedRoute requiredRole="member"><MemberBookingDetail /></ProtectedRoute>} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/membership/comparison" element={<MembershipComparison />} />
          <Route path="/membership/transaction/:planId" element={<MembershipTransaction />} />
          <Route path="/membership/success" element={<MembershipSuccess />} />
          <Route path="/admin/profile" element={<AdminRouteGuard><AdminProfile /></AdminRouteGuard>} />
          <Route path="/driver/profile" element={<DriverRouteGuard><DriverProfile /></DriverRouteGuard>} />
          <Route path="/member/profile" element={<ProtectedRoute requiredRole="member"><MemberProfile /></ProtectedRoute>} />
          <Route path="/driver/dashboard" element={<DriverRouteGuard><DriverDashboard /></DriverRouteGuard>} />
          <Route path="/driver/trips/:id" element={<DriverRouteGuard><DriverTrip /></DriverRouteGuard>} />
          <Route path="/admin/dashboard" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
          <Route path="/admin" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
          <Route path="/admin/tours" element={<AdminRouteGuard><AdminTours /></AdminRouteGuard>} />
          <Route path="/admin/fleet" element={<AdminRouteGuard><AdminFleet /></AdminRouteGuard>} />
          <Route path="/admin/invoices" element={<AdminRouteGuard><AdminInvoices /></AdminRouteGuard>} />
          <Route path="/admin/tracking" element={<AdminRouteGuard><AdminTracking /></AdminRouteGuard>} />
          <Route path="/admin/reviews" element={<AdminRouteGuard><AdminReviewModeration /></AdminRouteGuard>} />
          <Route path="/admin/leads" element={<AdminRouteGuard><AdminLeads /></AdminRouteGuard>} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/cancellation" element={<CancellationPolicy />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <CookieConsent />
      <ContactFab />
    </BrowserRouter>
  );
}

function LegacyTransactionRedirect() {
  const { id } = useParams();
  return <Navigate to={`/tours/${id}/checkout`} replace />;
}

export default App;
