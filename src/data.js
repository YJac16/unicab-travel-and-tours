// Progressive pricing structure for tours
import { getPriceForGroupSize } from './lib/pricing';

const getPriceForPax = (pricing, pax) => getPriceForGroupSize(pricing, pax);

/**
 * priceFrom strings are retained for an upcoming pricing sync only.
 * Public UI must use getPublicPriceLabel() — do not display priceFrom until confirmed.
 */
export const tours = [
  {
    id: "ct-city-table-mountain",
    name: "Cape Town & Table Mountain City Tour",
    duration: "Full Day (8–9 hours)",
    priceFrom: "From R750",
    promotion: null,
    image: "/bokaap.jpg",
    pricing: {
      1: 4500,
      2: 2500,
      3: 1900,
      4: 1600,
      "5-6": 1350,
      "7-10": 1100,
      "11-14": 950,
      "15-18": 850,
      "19-22": 750
    },
    getPrice: (pax) => getPriceForPax({
      1: 4500, 2: 2500, 3: 1900, 4: 1600, "5-6": 1350, "7-10": 1100, "11-14": 950, "15-18": 850, "19-22": 750
    }, pax),
    highlights: [
      "Ride the cableway up Table Mountain for sweeping city and ocean views (weather permitting)",
      "Guided drive through the City Bowl, Company's Garden, and historic landmarks",
      "Stroll through Bo-Kaap and capture its iconic colourful houses",
      "Visit the V&A Waterfront with optional harbour cruise or shopping time"
    ],
    description:
      "An essential introduction to Cape Town, this privately guided city tour blends world-famous viewpoints with hidden local stories. Ideal for first-time visitors and cruise passengers seeking a comprehensive overview in a single, curated day."
  },
  {
    id: "cape-peninsula",
    name: "Cape Peninsula Tour with Boulders Beach Penguins",
    duration: "Full Day (8–9 hours)",
    priceFrom: "From R1,200",
    promotion: null,
    image: "/boulders-beach.jpg",
    pricing: {
      1: 5500,
      2: 3200,
      3: 2500,
      4: 2100,
      "5-6": 1850,
      "7-10": 1600,
      "11-14": 1450,
      "15-18": 1300,
      "19-22": 1200
    },
    getPrice: (pax) => getPriceForPax({
      1: 5500, 2: 3200, 3: 2500, 4: 2100, "5-6": 1850, "7-10": 1600, "11-14": 1450, "15-18": 1300, "19-22": 1200
    }, pax),
    highlights: [
      "Scenic Chapman's Peak Drive (weather and road permitting)",
      "Cape Point and the Cape of Good Hope Nature Reserve",
      "Visit Boulders Beach to view the African penguin colony",
      "Explore Kalk Bay, Simon's Town or Hout Bay fishing harbours"
    ],
    description:
      "Trace one of the world's most beautiful coastlines on a private peninsula tour. From dramatic sea cliffs to charming fishing villages and the famous Boulders Beach penguin colony, this route showcases the very best of the Cape Peninsula at your own pace."
  },
  {
    id: "garden-route-short",
    name: "Garden Route Tour (3 Days / 2 Nights)",
    duration: "3 Days / 2 Nights",
    priceFrom: "From R8,300",
    promotion: null,
    image: "/garden-route.jpg",
    pricing: {
      2: 13500,
      "3-4": 11800,
      "5-6": 10900,
      "7-10": 9800,
      "11-14": 9200,
      "15-18": 8700,
      "19-22": 8300
    },
    getPrice: (pax) => {
      if (pax === 2) return 13500;
      if (pax >= 3 && pax <= 4) return 11800;
      if (pax >= 5 && pax <= 6) return 10900;
      if (pax >= 7 && pax <= 10) return 9800;
      if (pax >= 11 && pax <= 14) return 9200;
      if (pax >= 15 && pax <= 18) return 8700;
      if (pax >= 19 && pax <= 22) return 8300;
      return 8300;
    },
    highlights: [
      "Overnight in key Garden Route towns such as Knysna or Wilderness",
      "Visit ancient forests, lagoons, and pristine beaches",
      "Optional activities: elephant encounters, boat cruises, or canopy tours",
      "Flexible routing tailored to your travel schedule"
    ],
    description:
      "Designed for travellers with limited time, this private multi-day journey captures the essence of the Garden Route. Enjoy comfortable driving stages, handpicked stops, and curated experiences that can be adapted to families, couples, or small groups.",
    notes: "Includes guide, transport & accommodation (mid-range, sharing)."
  },
  {
    id: "garden-route-extended",
    name: "Garden Route Extended Tour (5 Days / 4 Nights)",
    duration: "5 Days / 4 Nights",
    priceFrom: "From R14,200",
    promotion: null,
    image: "/garden-route.jpg",
    pricing: {
      2: 22500,
      "3-4": 19800,
      "5-6": 18200,
      "7-10": 16900,
      "11-14": 15900,
      "15-18": 14900,
      "19-22": 14200
    },
    getPrice: (pax) => {
      if (pax === 2) return 22500;
      if (pax >= 3 && pax <= 4) return 19800;
      if (pax >= 5 && pax <= 6) return 18200;
      if (pax >= 7 && pax <= 10) return 16900;
      if (pax >= 11 && pax <= 14) return 15900;
      if (pax >= 15 && pax <= 18) return 14900;
      if (pax >= 19 && pax <= 22) return 14200;
      return 14200;
    },
    highlights: [
      "Deeper exploration of towns like Knysna, Plettenberg Bay, and Oudtshoorn",
      "Time for wine tasting, artisanal markets, and coastal walks",
      "Optional add-ons: game drives, adventure sports, or spa days",
      "Ideal for slow travel, families, and honeymooners"
    ],
    description:
      "For guests who prefer to settle into a gentler rhythm, this extended Garden Route itinerary allows for unhurried exploration, added experiences, and more downtime at boutique guest houses along the way."
  },
  {
    id: "wine-tour",
    name: "Franschhoek Wine Tram & Winelands Tour",
    duration: "Full Day (8–9 hours)",
    priceFrom: "From R750",
    promotion: null,
    image: "/wine-tour.jpg",
    pricing: {
      1: 4200,
      2: 2400,
      3: 1850,
      4: 1550,
      "5-6": 1300,
      "7-10": 1100,
      "11-14": 950,
      "15-18": 850,
      "19-22": 750
    },
    getPrice: (pax) => getPriceForPax({
      1: 4200, 2: 2400, 3: 1850, 4: 1550, "5-6": 1300, "7-10": 1100, "11-14": 950, "15-18": 850, "19-22": 750
    }, pax),
    highlights: [
      "Experience the iconic Franschhoek Wine Tram through scenic vineyards",
      "Visit wine estates for tastings",
      "Explore charming Franschhoek village with its French heritage",
      "Optional lunch at a wine estate restaurant"
    ],
    description:
      "Journey through the heart of the Cape Winelands on this exclusive private tour. Ride the Franschhoek Wine Tram, sample regional wines, and discover the landscapes of South Africa's premier wine region.",
    notes: "Tastings excluded unless specified."
  },
  {
    id: "aquila-safari",
    name: "Aquila Private Game Reserve Safari",
    duration: "Full Day (8–9 hours)",
    priceFrom: "From R2,800",
    promotion: null,
    image: "/safari.jpg",
    pricing: {
      1: 5900,
      2: 4500,
      3: 4000,
      4: 3700,
      "5-6": 3400,
      "7-10": 3200,
      "11-14": 3000,
      "15-18": 2900,
      "19-22": 2800
    },
    getPrice: (pax) => getPriceForPax({
      1: 5900, 2: 4500, 3: 4000, 4: 3700, "5-6": 3400, "7-10": 3200, "11-14": 3000, "15-18": 2900, "19-22": 2800
    }, pax),
    highlights: [
      "Access to Aquila Private Game Reserve",
      "Game drive with opportunities to see Big 5 wildlife",
      "Ranger-guided safari experience",
      "Optional lunch at the reserve restaurant"
    ],
    description:
      "Experience a day safari within easy reach of Cape Town. Travel with UNICAB to Aquila Private Game Reserve for a guided wildlife experience in a malaria-free setting — suited to families and first-time safari guests.",
    notes: "Includes transport, lunch & shared game drive."
  },
  {
    id: "west-coast",
    name: "West Coast Coastal & Wildflower Tour",
    duration: "Full Day (8–9 hours)",
    priceFrom: "From R1,100",
    promotion: null,
    image: "/westcoast.jpg",
    pricing: {
      1: 5000,
      2: 2900,
      3: 2300,
      4: 1950,
      "5-6": 1700,
      "7-10": 1450,
      "11-14": 1300,
      "15-18": 1200,
      "19-22": 1100
    },
    getPrice: (pax) => getPriceForPax({
      1: 5000, 2: 2900, 3: 2300, 4: 1950, "5-6": 1700, "7-10": 1450, "11-14": 1300, "15-18": 1200, "19-22": 1100
    }, pax),
    highlights: [
      "Explore fishing villages along the West Coast",
      "Seasonal wildflower displays (typically Aug–Sep, weather dependent)",
      "Visit nature reserves, lagoons, and quiet coastal viewpoints",
      "Optional seafood lunches at local favourites"
    ],
    description:
      "A quieter journey celebrating the rugged beauty of the Cape West Coast. In flower season, the region can burst into colour — creating strong photographic opportunities."
  },
  {
    id: "overland-custom",
    name: "Overland Custom Multiday Tour (7–14 Days)",
    duration: "7–14 Days (Fully Bespoke)",
    priceFrom: "From R25,000",
    promotion: null,
    image: "/overland.jpg",
    pricing: {
      2: 45000,
      "3-4": 39000,
      "5-6": 35000,
      "7-10": 31000,
      "11-14": 28500,
      "15-18": 26500,
      "19-22": 25000
    },
    getPrice: (pax) => {
      if (pax === 2) return 45000;
      if (pax >= 3 && pax <= 4) return 39000;
      if (pax >= 5 && pax <= 6) return 35000;
      if (pax >= 7 && pax <= 10) return 31000;
      if (pax >= 11 && pax <= 14) return 28500;
      if (pax >= 15 && pax <= 18) return 26500;
      if (pax >= 19 && pax <= 22) return 25000;
      return 25000;
    },
    highlights: [
      "Design your own route across the Western Cape and beyond",
      "Combine wine regions, coastal towns, game reserves, and landmarks",
      "Suited to incentive groups, families, and special occasions",
      "Dedicated travel planning support from our team"
    ],
    description:
      "When you'd like a journey shaped around your interests, our team collaborates with you to build a custom overland itinerary — from executive roadshows to family adventures.",
    notes: "Fully custom routes across South Africa. Accommodation level adjustable."
  }
];

export const vehicles = [
  {
    name: "Executive Sedan",
    tag: "Ideal for solo & couples",
    capacity: "1–3 passengers",
    luggage: "2 large + 2 carry-on",
    image: "/luxury-sedan-mercedes.jpg",
    features: [
      "Leather seating & dual-zone climate control",
      "Bottled water and onboard USB charging",
      "Discreet exterior finish for executive transfers"
    ]
  },
  {
    name: "Luxury SUV",
    tag: "Comfort with extra space",
    capacity: "1–4 passengers",
    luggage: "3 large + 3 carry-on",
    image: "/luxury-suv.jpg",
    features: [
      "Elevated seating for improved sightseeing",
      "Enhanced luggage capacity and legroom",
      "Ideal for Winelands and Peninsula touring"
    ]
  },
  {
    name: "Premium Minivan",
    tag: "Perfect for families",
    capacity: "3–7 passengers",
    luggage: "5 large + 5 carry-on",
    image: "/premium-minivan.jpg",
    features: [
      "Individual seating configurations",
      "Sliding doors for easy hotel and airport access",
      "Child seats available on request (pre-booking required)"
    ]
  },
  {
    name: "Mini Coach / Group Shuttle",
    tag: "Groups & incentive travel",
    capacity: "8–22 passengers",
    luggage: "Trailer or underfloor storage on request",
    image: "/mini-coach-22-seater.jpg",
    features: [
      "Ideal for conference shuttles and group tours",
      "Microphone and PA system on selected vehicles",
      "Professional group-handling and luggage coordination"
    ]
  }
];

export const drivers = [
  {
    name: "Thabo M.",
    experience: "Professional chauffeur & guide",
    languages: ["English", "isiXhosa", "Afrikaans"],
    skills: ["City & Peninsula specialist", "Airport meet & greet", "Cruise passenger handling"],
    image: "/Thabo.jpg"
  },
  {
    name: "Leah K.",
    experience: "Professional chauffeur & guide",
    languages: ["English", "French"],
    skills: ["Winelands & culinary touring", "Corporate roadshows", "Concierge liaison"],
    image: "/Leah.jpg"
  },
  {
    name: "Andre V.",
    experience: "Professional chauffeur & guide",
    languages: ["English", "Afrikaans", "German (conversational)"],
    skills: ["Garden Route overlands", "Golf logistics", "Photographic stops"],
    image: "/Andre.jpg"
  },
  {
    name: "Zinhle P.",
    experience: "Professional chauffeur & guide",
    languages: ["English", "isiZulu"],
    skills: ["Events & shuttles", "VIP handling", "Night transfers"],
    image: "/Zinhle.jpg"
  },
  {
    name: "Ahmed S.",
    experience: "Professional chauffeur & guide",
    languages: ["English", "Arabic", "Afrikaans"],
    skills: ["Cultural tours", "City & Peninsula specialist", "Airport transfers"],
    image: "/Ahmed.jpg"
  }
];

/** Static marketing reviews removed — use live approved reviews only. */
export const reviews = [];

export const membershipPlans = [
  {
    id: "explorer",
    name: "Explorer",
    price: "Contact for rates",
    tagline: "For repeat leisure guests",
    shortDescription: "A flexible membership option for returning travellers, locals hosting guests, and light repeat users.",
    popular: false,
    benefits: [
      "Priority booking support during busy periods (subject to availability)",
      "Preferred handling for selected private day tours",
      "Complimentary bottled water and onboard Wi-Fi where available"
    ]
  },
  {
    id: "frequent",
    name: "Frequent Traveller",
    price: "Contact for rates",
    tagline: "For frequent visitors",
    shortDescription: "Suited to frequent visitors, families, and business travellers who value reliability and priority support.",
    popular: true,
    benefits: [
      "Preferred vehicle allocation for pre-booked dates",
      "Streamlined booking for transfers and full-day touring",
      "Dedicated point-of-contact for itinerary adjustments"
    ]
  },
  {
    id: "elite",
    name: "Elite Partner",
    price: "Contact for rates",
    tagline: "For corporate & hospitality partners",
    shortDescription: "Designed for hotels, concierge desks, corporate travel managers, and VIP service providers.",
    popular: false,
    benefits: [
      "Partnership rates discussed case by case",
      "Priority access to premium vehicles and senior drivers",
      "Consolidated monthly reporting and billing support",
      "Co-branded service options for VIP guests and delegations"
    ]
  }
];
