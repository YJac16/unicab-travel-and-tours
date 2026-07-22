import { supabase, isSupabaseConfigured, isSupabaseNetworkError } from './supabase';
import { calculateTourPrice, getPriceForGroupSize, formatTourPrice } from './pricing';

export { calculateTourPrice, getPriceForGroupSize, formatTourPrice };

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));

const LOCAL_TOUR_REVIEWS_KEY = 'unicab_local_tour_reviews';
const LOCAL_DRIVER_REVIEWS_KEY = 'unicab_local_driver_reviews';

const readLocalStorageJson = (key) => {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const writeLocalStorageJson = (key, value) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
};

const getLocalDriversFallback = async () => {
  const { drivers } = await import('../data');
  return (drivers || []).map((driver, index) => ({
    ...driver,
    id: driver.id || `local-${index}-${driver.name}`,
    active: true,
  }));
};

const getStaticTourReviews = async (tourId) => {
  const { reviews } = await import('../data');
  const staticReviews = (reviews || [])
    .filter((review) => review.tourId === tourId)
    .map((review, index) => ({
      id: `static-${tourId}-${index}`,
      tour_id: tourId,
      rating: Math.round(review.rating || 5),
      comment: review.text,
      reviewer_name: review.name,
      approved: true,
      created_at: null,
    }));
  const stored = readLocalStorageJson(LOCAL_TOUR_REVIEWS_KEY).filter(
    (review) => review.tour_id === tourId && review.approved !== false
  );
  return [...stored, ...staticReviews];
};

const getStaticDriverReviews = async (driverKey) => {
  const key = String(driverKey || '');
  const stored = readLocalStorageJson(LOCAL_DRIVER_REVIEWS_KEY).filter(
    (review) =>
      (review.driver_key === key || review.driver_id === key) && review.approved !== false
  );
  return stored;
};

// API Base URL - use backend Express server
// In development, Vite proxy handles /api routes, so we use relative URLs
// In production, use VITE_API_URL if set, otherwise use relative URLs
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // In development (localhost), always use relative URLs to use Vite proxy
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || 
                        hostname === '127.0.0.1' ||
                        hostname.includes('localhost') ||
                        hostname.includes('127.0.0.1');
    
    if (isLocalhost) {
      // Force relative URLs in development to use Vite proxy
      console.log('[API] Development mode detected, using relative URLs for Vite proxy');
      return '';
    }
  }
  
  // In production, use VITE_API_URL if set
  if (envUrl) {
    // Remove trailing slash to avoid double slashes
    const cleanUrl = envUrl.replace(/\/+$/, '');
    console.log('[API] Using production API URL:', cleanUrl);
    return cleanUrl;
  }
  
  // Default to relative URLs
  console.log('[API] No API URL set, using relative URLs');
  return '';
};

const API_BASE_URL = getApiBaseUrl();

// Helper function to call backend API
const apiCall = async (endpoint, options = {}) => {
  try {
    // Ensure endpoint starts with / and base URL doesn't end with /
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = API_BASE_URL ? `${API_BASE_URL}${cleanEndpoint}` : cleanEndpoint;
    
    // Debug logging in development
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.log('[API] Calling:', url, 'from', window.location.origin);
    }
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Check if response has content
    const contentType = response.headers.get('content-type');
    const hasJsonContent = contentType && contentType.includes('application/json');
    
    // Get response text first to check if it's empty
    const text = await response.text();
    
    // If response is empty, handle gracefully
    if (!text || text.trim() === '') {
      if (!response.ok) {
        return { 
          data: null, 
          error: { 
            message: `Server returned ${response.status} ${response.statusText} with no content`,
            status: response.status 
          } 
        };
      }
      return { data: null, error: { message: 'Empty response from server' } };
    }

    // Try to parse as JSON if content type suggests JSON or if we expect JSON
    let result;
    if (hasJsonContent || text.trim().startsWith('{') || text.trim().startsWith('[')) {
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error(`Failed to parse JSON response from ${endpoint}:`, parseError);
        return { 
          data: null, 
          error: { 
            message: 'Invalid JSON response from server',
            details: text.substring(0, 100)
          } 
        };
      }
    } else {
      // Not JSON - might be HTML error page or plain text
      return { 
        data: null, 
        error: { 
          message: response.ok 
            ? 'Unexpected response format from server' 
            : `Server error: ${response.status} ${response.statusText}`,
          details: text.substring(0, 200)
        } 
      };
    }
    
    if (!response.ok) {
      return { data: null, error: result.error || result || { message: `Request failed with status ${response.status}` } };
    }

    return { data: result.data || result, error: null };
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    
    // Check if it's a network error
    if (error.message.includes('fetch')) {
      return { 
        data: null, 
        error: { 
          message: 'Network error: Could not connect to server. Make sure the backend server is running.',
          details: error.message
        } 
      };
    }
    
    return { data: null, error: { message: error.message } };
  }
};

// Tours API
export const getTours = async () => {
  const { tours } = await import('../data');

  // Try backend API first
  try {
    const backendResult = await apiCall('/api/tours');
    if (backendResult.data && backendResult.data.length > 0) {
      return backendResult;
    }
  } catch {
    // continue to fallbacks
  }

  // Fallback to Supabase
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('active', true)
        .order('name');
      if (!error && !isSupabaseNetworkError(error) && data?.length) {
        return { data, error: null };
      }
    } catch {
      // use local data
    }
  }

  return { data: tours, error: null };
};

export const getTour = async (id) => {
  const { tours } = await import('../data');
  const localTour = tours.find((t) => t.id === id);

  if (!isSupabaseConfigured()) {
    return { data: localTour || null, error: localTour ? null : { message: 'Tour not found' } };
  }

  try {
    let { data, error } = await supabase
      .from('tours')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle();

    if (isSupabaseNetworkError(error)) {
      return { data: localTour || null, error: localTour ? null : error };
    }

    if (!data && !error) {
      ({ data, error } = await supabase
        .from('tours')
        .select('*')
        .eq('slug', id)
        .eq('active', true)
        .maybeSingle());
    }

    if (error || isSupabaseNetworkError(error)) {
      return { data: localTour || null, error: localTour ? null : error };
    }

    if (!data) {
      return { data: localTour || null, error: localTour ? null : { message: 'Tour not found' } };
    }

    if (localTour) {
      return {
        data: {
          ...localTour,
          ...data,
          id: localTour.id,
          name: data.name || localTour.name,
          description: data.description || localTour.description,
          duration: data.duration || localTour.duration,
          duration_hours: data.duration_hours ?? localTour.duration_hours,
          pricing: data.pricing || localTour.pricing,
          image: data.image_url || localTour.image,
          priceFrom: data.price_from || localTour.priceFrom,
          highlights: data.highlights || localTour.highlights,
          promotion: data.promotion ?? localTour.promotion,
          rating: localTour.rating,
        },
        error: null,
      };
    }

    return {
      data: {
        ...data,
        image: data.image_url,
        priceFrom: data.price_from,
      },
      error: null,
    };
  } catch (error) {
    return { data: localTour || null, error: localTour ? null : error };
  }
};

// Guides API (using backend Express routes)
export const getAvailableGuides = async (date) => {
  // Try backend API first
  const backendResult = await apiCall(`/api/guides/available?date=${date}`);
  if (backendResult.data) {
    return backendResult;
  }

  // Fallback to Supabase (drivers)
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.rpc('get_available_drivers', {
      p_date: date,
      p_group_size: 1, // Default group size
    });
    if (data) return { data, error };
  }

  // Final fallback to local data
  const { drivers } = await import('../data');
  return { data: drivers, error: null };
};

// Drivers API
// Note: getAvailableDrivers is defined below in the Supabase section (line 841)
// This old version has been removed to avoid duplicate declaration

export const getDrivers = async () => {
  const localDrivers = await getLocalDriversFallback();

  if (!isSupabaseConfigured()) {
    return { data: localDrivers, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        *,
        vehicles (*)
      `)
      .eq('active', true)
      .order('name');

    if (error || isSupabaseNetworkError(error) || !data?.length) {
      return { data: localDrivers, error: null };
    }

    return { data, error: null };
  } catch {
    return { data: localDrivers, error: null };
  }
};

// Bookings API
export const createBooking = async (bookingData) => {
  // Get auth token if member is logged in
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Transform bookingData to match backend API format
  const backendPayload = {
    tour_id: bookingData.tour_id || bookingData.tourId,
    guide_id: bookingData.guide_id || bookingData.guideId || bookingData.driver_id || bookingData.driverId,
    driver_id: bookingData.driver_id || bookingData.driverId || bookingData.guide_id || bookingData.guideId,
    booking_date: bookingData.date || bookingData.booking_date,
    booking_time: bookingData.time || bookingData.booking_time || null,
    group_size: bookingData.group_size || bookingData.pax,
    customer_name: bookingData.customer_name || bookingData.customerName || `${bookingData.firstName || ''} ${bookingData.lastName || ''}`.trim(),
    customer_email: bookingData.customer_email || bookingData.customerEmail || bookingData.email,
    customer_phone: bookingData.customer_phone || bookingData.customerPhone || bookingData.phone,
    special_requests: bookingData.special_requests || bookingData.specialRequests,
    price_per_person: bookingData.price_per_person || bookingData.pricePerPerson || 0,
    total_price: bookingData.total_price || bookingData.totalPrice || 0,
    status: bookingData.status || 'reserved',
    user_id: bookingData.user_id || null,
  };

  // Use apiCall with auth header if token exists
  const url = API_BASE_URL ? `${API_BASE_URL}/api/bookings` : '/api/bookings';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(backendPayload),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { data: null, error: result };
    }

    return { data: result.data || result, error: null };
  } catch (error) {
    console.error(`API call failed for /api/bookings:`, error);
    
    // Fallback to Supabase if backend fails
    if (isSupabaseConfigured()) {
      const { data, error: supabaseError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();
      if (data) return { data, error: null };
      return { data: null, error: supabaseError };
    }

    // Final fallback: store in localStorage
    const bookings = JSON.parse(localStorage.getItem('unicab_bookings') || '[]');
    const newBooking = {
      id: Date.now().toString(),
      ...bookingData,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    bookings.push(newBooking);
    localStorage.setItem('unicab_bookings', JSON.stringify(bookings));
    return { data: newBooking, error: null };
  }
};

export const getBookings = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    const bookings = JSON.parse(localStorage.getItem('unicab_bookings') || '[]');
    return { data: bookings, error: null };
  }

  let query = supabase
    .from('bookings')
    .select(`
      *,
      tours (*),
      drivers (*)
    `)
    .order('date', { ascending: true });

  if (filters.driver_id) {
    query = query.eq('driver_id', filters.driver_id);
  }

  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.date_from) {
    query = query.gte('date', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('date', filters.date_to);
  }

  const { data, error } = await query;

  return { data, error };
};

export const updateBooking = async (bookingId, updates) => {
  if (!isSupabaseConfigured()) {
    const bookings = JSON.parse(localStorage.getItem('unicab_bookings') || '[]');
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index !== -1) {
      bookings[index] = { ...bookings[index], ...updates };
      localStorage.setItem('unicab_bookings', JSON.stringify(bookings));
      return { data: bookings[index], error: null };
    }
    return { data: null, error: { message: 'Booking not found' } };
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(updates)
    .eq('id', bookingId)
    .select()
    .single();

  return { data, error };
};

// Driver Availability API
// Note: getDriverAvailability is defined below in the Supabase section (line 711)
// This old version has been removed to avoid duplicate declaration

export const blockDriverDate = async (driverIdOrDate, dateOrReason, reason = '') => {
  if (!isSupabaseConfigured()) {
    const date = typeof dateOrReason === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(driverIdOrDate)
      ? driverIdOrDate
      : dateOrReason;
    return { data: { id: Date.now(), date, reason: reason || dateOrReason }, error: null };
  }

  let driverId = driverIdOrDate;
  let date = dateOrReason;
  let blockReason = reason;

  // Support driver self-service: blockDriverDate(date, reason)
  if (typeof driverIdOrDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(driverIdOrDate)) {
    date = driverIdOrDate;
    blockReason = typeof dateOrReason === 'string' ? dateOrReason : '';
    driverId = null;
  }

  if (!driverId) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (driverError || !driverData) {
      return { data: null, error: { message: 'Driver record not found' } };
    }

    driverId = driverData.id;
  }

  const { data, error } = await supabase
    .from('driver_availability')
    .upsert({
      driver_id: driverId,
      date,
      available: false,
      reason: blockReason || null,
    }, {
      onConflict: 'driver_id,date',
    })
    .select()
    .single();

  return { data, error };
};

export const unblockDriverDate = async (availabilityIdOrDate, maybeDate) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: null };
  }

  // Support unblock by availability row id
  if (maybeDate === undefined && availabilityIdOrDate && !/^\d{4}-\d{2}-\d{2}$/.test(availabilityIdOrDate)) {
    const { error } = await supabase
      .from('driver_availability')
      .delete()
      .eq('id', availabilityIdOrDate);

    return { data: null, error };
  }

  const date = maybeDate || availabilityIdOrDate;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { data: null, error: { message: 'Not authenticated' } };
  }

  const { data: driverData, error: driverError } = await supabase
    .from('drivers')
    .select('id')
    .eq('user_id', userData.user.id)
    .single();

  if (driverError || !driverData) {
    return { data: null, error: { message: 'Driver record not found' } };
  }

  const { error } = await supabase
    .from('driver_availability')
    .delete()
    .eq('driver_id', driverData.id)
    .eq('date', date)
    .eq('available', false);

  return { data: null, error };
};

// Reviews API
export const createReview = async (reviewData) => {
  if (!isSupabaseConfigured()) {
    const reviews = JSON.parse(localStorage.getItem('unicab_reviews') || '[]');
    const newReview = {
      id: Date.now().toString(),
      ...reviewData,
      approved: false,
      created_at: new Date().toISOString(),
    };
    reviews.push(newReview);
    localStorage.setItem('unicab_reviews', JSON.stringify(reviews));
    return { data: newReview, error: null };
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert(reviewData)
    .select()
    .single();

  return { data, error };
};

export const getReviews = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    const reviews = JSON.parse(localStorage.getItem('unicab_reviews') || '[]');
    return { data: reviews.filter(r => r.approved !== false), error: null };
  }

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (filters.tour_id) {
    query = query.eq('tour_id', filters.tour_id);
  }

  if (filters.driver_id) {
    query = query.eq('driver_id', filters.driver_id);
  }

  const { data, error } = await query;

  return { data, error };
};

// YOCO payment only — redirects customer to Yoco hosted checkout
export const createYocoPayment = async (amount, bookingRef, options = {}) => {
  const result = await apiCall('/api/payments/create-payment', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      bookingRef,
      booking_id: bookingRef,
      description: options.description || undefined,
    }),
  });

  if (result.error) return result;

  const redirectUrl =
    result.data?.redirectUrl ||
    result.data?.data?.redirectUrl ||
    result.redirectUrl ||
    null;

  if (!redirectUrl) {
    return {
      data: null,
      error: { message: 'Payment gateway did not return a checkout URL' },
    };
  }

  return {
    data: {
      ...(typeof result.data === 'object' && result.data ? result.data : {}),
      redirectUrl,
      checkoutId: result.data?.checkoutId || result.data?.data?.checkoutId || null,
    },
    error: null,
  };
};

export const confirmYocoPayment = async (bookingRef) => {
  return apiCall('/api/payments/confirm', {
    method: 'POST',
    body: JSON.stringify({ bookingRef, booking_id: bookingRef }),
  });
};

// Authentication API
export const login = async (email, password) => {
  return apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

// Driver API (requires authentication token)
const driverApiCall = async (endpoint, options = {}) => {
  let token = null;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
    }
  } catch (error) {
    console.warn('Could not get Supabase session:', error);
  }

  if (!token) {
    token = localStorage.getItem('auth_token');
  }

  if (!token) {
    return {
      data: null,
      error: {
        message: 'Authentication required. Please log in.',
        status: 401
      }
    };
  }

  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const getDriverUnavailability = async () => {
  return driverApiCall('/api/driver/unavailability');
};

// Note: blockDriverDate and unblockDriverDate are already defined above (lines 257, 275)
// These duplicate definitions are removed to fix the build error

// Admin API (requires authentication token)
const adminApiCall = async (endpoint, options = {}) => {
  // Try to get Supabase session token first
  let token = null;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      token = session.access_token;
    }
  } catch (error) {
    console.warn('Could not get Supabase session:', error);
  }
  
  // Fallback to localStorage token (for legacy JWT support)
  if (!token) {
    token = localStorage.getItem('auth_token');
  }
  
  if (!token) {
    return {
      data: null,
      error: {
        message: 'Authentication required. Please log in.',
        status: 401
      }
    };
  }
  
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const getAdminBookings = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  return adminApiCall(`/api/admin/bookings${queryParams ? `?${queryParams}` : ''}`);
};

export const updateBookingStatus = async (bookingId, status) => {
  return adminApiCall(`/api/admin/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

export const getAdminDrivers = async () => {
  return adminApiCall('/api/admin/drivers');
};

// Create driver record - calls backend API which handles both new and existing users
export const createDriver = async (driverData) => {
  return adminApiCall('/api/admin/drivers', {
    method: 'POST',
    body: JSON.stringify(driverData),
  });
};

export const updateDriverStatus = async (driverId, active) => {
  return adminApiCall(`/api/admin/drivers/${driverId}`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  });
};

export const getDriverUnavailabilityAdmin = async (driverId) => {
  return adminApiCall(`/api/admin/drivers/${driverId}/unavailability`);
};

export const blockDriverDateAdmin = async (driverId, date, reason = '') => {
  return adminApiCall(`/api/admin/drivers/${driverId}/unavailability`, {
    method: 'POST',
    body: JSON.stringify({ date, reason }),
  });
};

export const unblockDriverDateAdmin = async (driverId, date) => {
  return adminApiCall(`/api/admin/drivers/${driverId}/unavailability/${date}`, {
    method: 'DELETE',
  });
};

// ============================================================
// BOOKINGS API (Customer, Driver, Admin)
// ============================================================

// Customer: Create booking
export const createBookingSupabase = async (bookingData) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        user_id: bookingData.user_id || null, // Will be set from auth if logged in
        tour_id: bookingData.tour_id,
        driver_id: bookingData.driver_id,
        booking_date: bookingData.booking_date || bookingData.date,
        group_size: bookingData.group_size || 1,
        status: 'pending',
        customer_name: bookingData.customer_name,
        customer_email: bookingData.customer_email,
        customer_phone: bookingData.customer_phone || null,
        special_requests: bookingData.special_requests || null,
        price_per_person: bookingData.price_per_person || 0,
        total_price: bookingData.total_price || 0
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Customer: Get own bookings
export const getCustomerBookings = async () => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        tour:tours(*),
        driver:drivers(*)
      `)
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .order('booking_date', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Driver: Get assigned bookings
export const getDriverBookings = async () => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    // First get driver_id from drivers table
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const { data: driverData } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (!driverData) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        tour:tours(*),
        customer:profiles!bookings_user_id_fkey(id, email, full_name)
      `)
      .eq('driver_id', driverData.id)
      .order('booking_date', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Driver: Update booking status
export const updateBookingStatusDriver = async (bookingId, status) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Admin: Get all bookings
export const getAdminBookingsSupabase = async (filters = {}) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        tour:tours(*),
        driver:drivers(*),
        customer:profiles!bookings_user_id_fkey(id, email, full_name)
      `);

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('booking_date', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('booking_date', filters.date_to);
    }
    if (filters.driver_id) {
      query = query.eq('driver_id', filters.driver_id);
    }

    const { data, error } = await query.order('booking_date', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Admin: Assign driver to booking
export const assignDriverToBooking = async (bookingId, driverId) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ driver_id: driverId })
      .eq('id', bookingId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Admin: Update booking status
export const updateBookingStatusAdmin = async (bookingId, status) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// ============================================================
// DRIVER AVAILABILITY API
// ============================================================

// Driver: Get own availability
export const getDriverAvailability = async (startDate, endDate) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const { data: driverData } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (!driverData) {
      return { data: [], error: null };
    }

    let query = supabase
      .from('driver_availability')
      .select('*')
      .eq('driver_id', driverData.id);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Driver: Set availability for a date
export const setDriverAvailability = async (date, available, reason = null) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return { data: null, error: { message: 'Not authenticated' } };
    }

    const { data: driverData } = await supabase
      .from('drivers')
      .select('id')
      .eq('user_id', userData.user.id)
      .single();

    if (!driverData) {
      return { data: null, error: { message: 'Driver record not found' } };
    }

    const { data, error } = await supabase
      .from('driver_availability')
      .upsert({
        driver_id: driverData.id,
        date,
        available,
        reason
      }, {
        onConflict: 'driver_id,date'
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Admin: Get all driver availability
export const getAdminDriverAvailability = async (driverId = null, startDate = null, endDate = null) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    let query = supabase
      .from('driver_availability')
      .select(`
        *,
        driver:drivers(id, name, email)
      `);

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query.order('date', { ascending: true });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Admin: Override driver availability
export const overrideDriverAvailability = async (driverId, date, available, reason = null) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }

  try {
    const { data, error } = await supabase
      .from('driver_availability')
      .upsert({
        driver_id: driverId,
        date,
        available,
        reason
      }, {
        onConflict: 'driver_id,date'
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get available drivers for a date
// Accepts optional groupSize parameter for backward compatibility (not currently used)
export const getAvailableDrivers = async (date, groupSize = null) => {
  const localDrivers = await getLocalDriversFallback();

  if (!isSupabaseConfigured()) {
    return { data: localDrivers, error: null };
  }

  try {
    const { data, error } = await supabase.rpc('get_available_drivers', {
      check_date: date
    });

    if (!error && Array.isArray(data)) {
      return { data, error: null };
    }

    if (isSupabaseNetworkError(error)) {
      return { data: localDrivers, error: null };
    }

    // Fallback: manual query if RPC doesn't exist / fails
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('active', true);

    if (driversError || isSupabaseNetworkError(driversError) || !drivers?.length) {
      return { data: localDrivers, error: null };
    }

    const availableDrivers = [];
    for (const driver of drivers) {
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('driver_id', driver.id)
        .eq('booking_date', date)
        .in('status', ['reserved', 'pending', 'confirmed'])
        .maybeSingle();

      if (isSupabaseNetworkError(bookingError)) {
        return { data: localDrivers, error: null };
      }
      if (booking) continue;

      const { data: availability, error: availabilityError } = await supabase
        .from('driver_availability')
        .select('available')
        .eq('driver_id', driver.id)
        .eq('date', date)
        .maybeSingle();

      if (isSupabaseNetworkError(availabilityError)) {
        return { data: localDrivers, error: null };
      }

      const isAvailable = availability ? availability.available : true;
      if (isAvailable) {
        availableDrivers.push(driver);
      }
    }

    return { data: availableDrivers.length ? availableDrivers : localDrivers, error: null };
  } catch {
    return { data: localDrivers, error: null };
  }
};

// Member API (requires authentication token)
const memberApiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  return apiCall(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
};

export const getMemberBookings = async () => {
  return memberApiCall('/api/member/bookings');
};

// Registration API (public)
export const register = async (userData) => {
  return apiCall('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

// Reviews API - Supabase review tables with local fallbacks
export const getTourReviews = async (tourId) => {
  const localReviews = await getStaticTourReviews(tourId);

  if (!isSupabaseConfigured()) {
    return { data: localReviews, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('tour_reviews')
      .select('*')
      .eq('tour_id', String(tourId))
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (error || isSupabaseNetworkError(error)) {
      return { data: localReviews, error: null };
    }

    return { data: [...(data || []), ...localReviews], error: null };
  } catch {
    return { data: localReviews, error: null };
  }
};

export const getDriverReviews = async (driverId) => {
  const localReviews = await getStaticDriverReviews(driverId);

  if (!isSupabaseConfigured()) {
    return { data: localReviews, error: null };
  }

  try {
    let query = supabase
      .from('driver_reviews')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (isUuid(driverId)) {
      query = query.eq('driver_id', driverId);
    } else {
      query = query.eq('driver_key', String(driverId));
    }

    const { data, error } = await query;

    if (error || isSupabaseNetworkError(error)) {
      return { data: localReviews, error: null };
    }

    return { data: [...(data || []), ...localReviews], error: null };
  } catch {
    return { data: localReviews, error: null };
  }
};

export const getTourReviewStats = async (tourId) => {
  const { data: reviews } = await getTourReviews(tourId);
  const count = reviews?.length || 0;
  const average = count > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count
    : 0;
  return { data: { average, count }, error: null };
};

export const getDriverReviewStats = async (driverId) => {
  const { data: reviews } = await getDriverReviews(driverId);
  const count = reviews?.length || 0;
  const average = count > 0
    ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / count
    : 0;
  return { data: { average, count }, error: null };
};

export const verifyCustomerBooking = async (bookingId, userId) => {
  if (!isSupabaseConfigured() || !bookingId || !userId) {
    return { data: { exists: false, completed: false }, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('id, status, payment_status, user_id')
      .eq('id', bookingId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || isSupabaseNetworkError(error)) {
      return { data: { exists: false, completed: false }, error: null };
    }

    const completed =
      data &&
      (data.status === 'confirmed' || data.status === 'completed' || data.payment_status === 'paid');

    return {
      data: {
        exists: !!data,
        completed: !!completed,
        booking: data || null
      },
      error: null
    };
  } catch {
    return { data: { exists: false, completed: false }, error: null };
  }
};

export const submitTourReview = async ({ tourId, bookingId, userId, rating, comment, reviewerName }) => {
  const payload = {
    tour_id: String(tourId),
    booking_id: bookingId || null,
    user_id: userId,
    rating,
    comment: comment.trim(),
    reviewer_name: reviewerName || null,
    approved: false
  };

  if (!isSupabaseConfigured()) {
    const localReview = {
      id: `local-${Date.now()}`,
      ...payload,
      approved: true,
      created_at: new Date().toISOString(),
    };
    const existing = readLocalStorageJson(LOCAL_TOUR_REVIEWS_KEY);
    writeLocalStorageJson(LOCAL_TOUR_REVIEWS_KEY, [localReview, ...existing]);
    return { data: localReview, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('tour_reviews')
      .insert(payload)
      .select()
      .single();

    if (error || isSupabaseNetworkError(error)) {
      const localReview = {
        id: `local-${Date.now()}`,
        ...payload,
        approved: true,
        created_at: new Date().toISOString(),
      };
      const existing = readLocalStorageJson(LOCAL_TOUR_REVIEWS_KEY);
      writeLocalStorageJson(LOCAL_TOUR_REVIEWS_KEY, [localReview, ...existing]);
      return { data: localReview, error: null };
    }

    return { data, error: null };
  } catch {
    const localReview = {
      id: `local-${Date.now()}`,
      ...payload,
      approved: true,
      created_at: new Date().toISOString(),
    };
    const existing = readLocalStorageJson(LOCAL_TOUR_REVIEWS_KEY);
    writeLocalStorageJson(LOCAL_TOUR_REVIEWS_KEY, [localReview, ...existing]);
    return { data: localReview, error: null };
  }
};

export const submitDriverReview = async ({ driverId, bookingId, userId, rating, comment, reviewerName }) => {
  const driverIsUuid = isUuid(driverId);
  const payload = {
    driver_id: driverIsUuid ? driverId : null,
    driver_key: driverIsUuid ? null : String(driverId),
    booking_id: bookingId || null,
    user_id: userId,
    rating,
    comment: comment.trim(),
    reviewer_name: reviewerName || null,
    approved: false
  };

  if (!isSupabaseConfigured()) {
    const localReview = {
      id: `local-${Date.now()}`,
      ...payload,
      driver_key: String(driverId),
      approved: true,
      created_at: new Date().toISOString(),
    };
    const existing = readLocalStorageJson(LOCAL_DRIVER_REVIEWS_KEY);
    writeLocalStorageJson(LOCAL_DRIVER_REVIEWS_KEY, [localReview, ...existing]);
    return { data: localReview, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('driver_reviews')
      .insert(payload)
      .select()
      .single();

    if (error || isSupabaseNetworkError(error)) {
      const localReview = {
        id: `local-${Date.now()}`,
        ...payload,
        driver_key: String(driverId),
        approved: true,
        created_at: new Date().toISOString(),
      };
      const existing = readLocalStorageJson(LOCAL_DRIVER_REVIEWS_KEY);
      writeLocalStorageJson(LOCAL_DRIVER_REVIEWS_KEY, [localReview, ...existing]);
      return { data: localReview, error: null };
    }

    return { data, error: null };
  } catch {
    const localReview = {
      id: `local-${Date.now()}`,
      ...payload,
      driver_key: String(driverId),
      approved: true,
      created_at: new Date().toISOString(),
    };
    const existing = readLocalStorageJson(LOCAL_DRIVER_REVIEWS_KEY);
    writeLocalStorageJson(LOCAL_DRIVER_REVIEWS_KEY, [localReview, ...existing]);
    return { data: localReview, error: null };
  }
};

// Admin Review Moderation API
export const getPendingReviews = async (filterType = null) => {
  if (!isSupabaseConfigured()) {
    return { data: [], error: null };
  }
  
  const { user } = await supabase.auth.getUser();
  if (!user) {
    return { data: [], error: { message: 'Not authenticated' } };
  }

  let query = supabase
    .from('tour_reviews')
    .select('*, tours(name), bookings(id, customer_name, customer_email, date)')
    .eq('approved', false)
    .order('created_at', { ascending: false });

  const { data: tourReviews, error: tourError } = await query;

  let driverQuery = supabase
    .from('driver_reviews')
    .select('*, drivers(name), bookings(id, customer_name, customer_email, date)')
    .eq('approved', false)
    .order('created_at', { ascending: false });

  const { data: driverReviews, error: driverError } = await driverQuery;

  if (tourError || driverError) {
    return { data: [], error: tourError || driverError };
  }

  const allReviews = [
    ...(tourReviews || []).map(r => ({ ...r, review_type: 'tour' })),
    ...(driverReviews || []).map(r => ({ ...r, review_type: 'driver' }))
  ];

  // Filter by type if specified
  const filtered = filterType 
    ? allReviews.filter(r => r.review_type === filterType)
    : allReviews;

  return { data: filtered, error: null };
};

export const approveReview = async (reviewId, reviewType) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  const table = reviewType === 'tour' ? 'tour_reviews' : 'driver_reviews';
  const { data, error } = await supabase
    .from(table)
    .update({ approved: true })
    .eq('id', reviewId)
    .select()
    .single();
  
  return { data, error };
};

export const rejectReview = async (reviewId, reviewType) => {
  if (!isSupabaseConfigured()) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  
  const table = reviewType === 'tour' ? 'tour_reviews' : 'driver_reviews';
  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq('id', reviewId);
  
  return { data, error };
};





