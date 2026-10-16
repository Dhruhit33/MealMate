import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Navigation, Search, CheckCircle2, AlertCircle, Loader2, X, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="width:38px;height:38px;border-radius:50%;background:#C0401E;
    border:3px solid white;box-shadow:0 6px 18px rgba(0,0,0,0.35);
    display:flex;align-items:center;justify-content:center;font-size:18px;
    animation:pulse 2s infinite">📍</div>`,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

// Gujarat key cities & localities quick chips
const POPULAR_LOCATIONS = [
  { name: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { name: "Gandhinagar", lat: 23.2156, lng: 72.6369 },
  { name: "Vadodara", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot", lat: 22.3039, lng: 70.8022 },
];

// Curated Gujarat & Adalaj/Gandhinagar/Ahmedabad Local Landmarks Directory
const CURATED_LOCATIONS = [
  // User's Local Zone: Adalaj, Balapir, Annapurnadham
  {
    name: "Balapir (Balapir Char Rasta / Dargah)",
    area: "Adalaj, Gandhinagar - 382421, Gujarat",
    lat: 23.1645,
    lng: 72.5811,
    city: "Adalaj",
    pincode: "382421",
    keywords: ["balapir", "bala pir", "balapir char rasta", "balapir chokdi", "balapir chowkdi", "balapir dargah", "balapir road", "balapir tekro", "adalaj balapir"],
  },
  {
    name: "Annapurnadham, Adalaj",
    area: "Near Adalaj, Gandhinagar - 382421, Gujarat",
    lat: 23.1644,
    lng: 72.5855,
    city: "Adalaj",
    pincode: "382421",
    keywords: ["annapurnadham", "annapurna dham", "annapurna", "adalaj hostel", "ashram"],
  },
  {
    name: "Adalaj Stepwell (Adalaj Ni Vav)",
    area: "Adalaj, Gandhinagar - 382421, Gujarat",
    lat: 23.1671,
    lng: 72.5801,
    city: "Adalaj",
    pincode: "382421",
    keywords: ["adalaj ni vav", "stepwell", "rudabai", "vav", "heritage", "adalaj stepwell"],
  },
  {
    name: "Adalaj Circle / Cross Road",
    area: "Sarkhej-Gandhinagar Highway, Adalaj - 382421",
    lat: 23.1683,
    lng: 72.5867,
    city: "Adalaj",
    pincode: "382421",
    keywords: ["adalaj circle", "cross road", "char rasta", "highway junction", "adalaj cross road"],
  },
  {
    name: "Adalaj Gram Panchayat / Village",
    area: "Adalaj Old Village, Gandhinagar - 382421",
    lat: 23.1661,
    lng: 72.5808,
    city: "Adalaj",
    pincode: "382421",
    keywords: ["adalaj gram panchayat", "adalaj gam", "village"],
  },
  {
    name: "Adalaj Lake (Talav)",
    area: "Adalaj, Gandhinagar - 382421",
    lat: 23.1688,
    lng: 72.5807,
    city: "Adalaj",
    pincode: "382421",
    keywords: ["adalaj lake", "talav", "pond"],
  },
  {
    name: "Zundal Circle / Zundal",
    area: "SP Ring Road, Gandhinagar / Ahmedabad - 382421",
    lat: 23.1480,
    lng: 72.5890,
    city: "Zundal",
    pincode: "382421",
    keywords: ["zundal circle", "zundal", "sp ring road", "zundal char rasta"],
  },
  {
    name: "Vaishnodevi Circle",
    area: "SG Highway, Ahmedabad / Gandhinagar - 382421",
    lat: 23.1340,
    lng: 72.5450,
    city: "Ahmedabad",
    pincode: "382421",
    keywords: ["vaishnodevi circle", "sg highway", "vaishnodevi temple", "nirma university"],
  },
  {
    name: "Koba Circle / Koba",
    area: "Airport Road, Gandhinagar - 382007",
    lat: 23.1765,
    lng: 72.6355,
    city: "Gandhinagar",
    pincode: "382007",
    keywords: ["koba circle", "koba", "mahavir jain aradhana kendra", "airport road"],
  },
  {
    name: "Karnavati University / Uvarsad",
    area: "Uvarsad, Gandhinagar - 382422",
    lat: 23.1850,
    lng: 72.5650,
    city: "Gandhinagar",
    pincode: "382422",
    keywords: ["karnavati university", "uvarsad", "unitedworld", "college"],
  },

  // Gandhinagar Key Areas
  {
    name: "Infocity Gandhinagar",
    area: "GH 0 Road, Gandhinagar - 382007",
    lat: 23.1930,
    lng: 72.6300,
    city: "Gandhinagar",
    pincode: "382007",
    keywords: ["infocity", "infocity it park", "supermall", "gh0", "it tower", "infocity gandhinagar"],
  },
  {
    name: "Kudasan, Gandhinagar",
    area: "Bhaijipura - Kudasan Road, Gandhinagar - 382421",
    lat: 23.1880,
    lng: 72.6360,
    city: "Gandhinagar",
    pincode: "382421",
    keywords: ["kudasan", "reliance cross road", "pdpu road"],
  },
  {
    name: "Sargasan Cross Road, Gandhinagar",
    area: "SG Highway, Gandhinagar - 382421",
    lat: 23.1950,
    lng: 72.6100,
    city: "Gandhinagar",
    pincode: "382421",
    keywords: ["sargasan", "sargasan cross road", "swagat holiday", "sg highway gandhinagar"],
  },
  {
    name: "Raysan / PDEU (PDPU), Gandhinagar",
    area: "Knowledge Corridor, Gandhinagar - 382007",
    lat: 23.1620,
    lng: 72.6580,
    city: "Gandhinagar",
    pincode: "382007",
    keywords: ["raysan", "pdpu", "pdeu", "gnlu", "germi", "nift"],
  },
  {
    name: "Gift City (IFSC)",
    area: "Gandhinagar - 382355",
    lat: 23.1600,
    lng: 72.6840,
    city: "Gandhinagar",
    pincode: "382355",
    keywords: ["gift city", "ifsc", "gift tower", "finance city"],
  },
  {
    name: "Sector 11 (Sachivalaya / Central Gandhinagar)",
    area: "Sector 11, Gandhinagar - 382011",
    lat: 23.2156,
    lng: 72.6369,
    city: "Gandhinagar",
    pincode: "382011",
    keywords: ["sector 11", "vidhansabha", "sachivalaya", "swarnim sankul", "gandhinagar capital"],
  },
  {
    name: "Sector 21 Market, Gandhinagar",
    area: "Sector 21, Gandhinagar - 382021",
    lat: 23.2320,
    lng: 72.6480,
    city: "Gandhinagar",
    pincode: "382021",
    keywords: ["sector 21", "sector 21 market", "shopping centre gandhinagar"],
  },
  {
    name: "Akshardham Temple, Gandhinagar",
    area: "Sector 20, Gandhinagar - 382020",
    lat: 23.2300,
    lng: 72.6730,
    city: "Gandhinagar",
    pincode: "382020",
    keywords: ["akshardham", "akshardham mandir", "sector 20 swaminarayan"],
  },
  {
    name: "Bhat Circle / Apollo Hospital",
    area: "Ahmedabad Airport Road, Gandhinagar - 382428",
    lat: 23.1190,
    lng: 72.6180,
    city: "Gandhinagar",
    pincode: "382428",
    keywords: ["bhat circle", "apollo hospital", "indira bridge"],
  },

  // Ahmedabad Key Areas
  {
    name: "Chandkheda, Ahmedabad",
    area: "IOC Road / Visat, Ahmedabad - 382424",
    lat: 23.1110,
    lng: 72.5840,
    city: "Ahmedabad",
    pincode: "382424",
    keywords: ["chandkheda", "visat circle", "ioc road", "dmart chandkheda"],
  },
  {
    name: "Motera / Narendra Modi Stadium",
    area: "Motera, Ahmedabad - 380005",
    lat: 23.0910,
    lng: 72.5970,
    city: "Ahmedabad",
    pincode: "380005",
    keywords: ["motera", "narendra modi stadium", "motera stadium", "cricket stadium", "metro station"],
  },
  {
    name: "Sabarmati Ashram / RTO",
    area: "Ashram Road, Ahmedabad - 380027",
    lat: 23.0600,
    lng: 72.5800,
    city: "Ahmedabad",
    pincode: "380027",
    keywords: ["sabarmati", "sabarmati ashram", "rto circle", "subhash bridge"],
  },
  {
    name: "Gota / Vandematram",
    area: "SG Highway / Vandematram, Ahmedabad - 382481",
    lat: 23.1150,
    lng: 72.5350,
    city: "Ahmedabad",
    pincode: "382481",
    keywords: ["gota", "gota chokdi", "vandematram", "silver oak university"],
  },
  {
    name: "Science City, Ahmedabad",
    area: "Science City Road, Ahmedabad - 380060",
    lat: 23.0780,
    lng: 72.5020,
    city: "Ahmedabad",
    pincode: "380060",
    keywords: ["science city", "science park", "bhadaj circle"],
  },
  {
    name: "Thaltej / Hebatpur Road",
    area: "SG Highway, Ahmedabad - 380059",
    lat: 23.0500,
    lng: 72.5180,
    city: "Ahmedabad",
    pincode: "380059",
    keywords: ["thaltej", "thaltej cross road", "hebatpur", "thaltej metro"],
  },
  {
    name: "Bopal / South Bopal",
    area: "SP Ring Road, Ahmedabad - 380058",
    lat: 23.0330,
    lng: 72.4640,
    city: "Ahmedabad",
    pincode: "380058",
    keywords: ["bopal", "south bopal", "bopal cross road", "trb circle"],
  },
  {
    name: "Iskcon Cross Road / Satellite",
    area: "SG Highway, Ahmedabad - 380015",
    lat: 23.0270,
    lng: 72.5060,
    city: "Ahmedabad",
    pincode: "380015",
    keywords: ["iscon", "iskcon cross road", "satellite", "iskcon mandir", "ramdevnagar"],
  },
  {
    name: "Vastrapur / Vastrapur Lake",
    area: "Near Alpha One Mall, Ahmedabad - 380015",
    lat: 23.0360,
    lng: 72.5290,
    city: "Ahmedabad",
    pincode: "380015",
    keywords: ["vastrapur", "vastrapur lake", "alpha one", "nexus ahmedabad one", "iim ahmedabad"],
  },
  {
    name: "Shivranjani Cross Road",
    area: "Satellite Road, Ahmedabad - 380015",
    lat: 23.0230,
    lng: 72.5320,
    city: "Ahmedabad",
    pincode: "380015",
    keywords: ["shivranjani", "shivranjani cross road", "jhansi ki rani"],
  },
  {
    name: "Navrangpura / CG Road",
    area: "Ahmedabad - 380009",
    lat: 23.0370,
    lng: 72.5530,
    city: "Ahmedabad",
    pincode: "380009",
    keywords: ["navrangpura", "cg road", "c g road", "gujarat university", "stadium"],
  },
  {
    name: "Prahlad Nagar, Ahmedabad",
    area: "SG Highway, Ahmedabad - 380015",
    lat: 23.0120,
    lng: 72.5080,
    city: "Ahmedabad",
    pincode: "380015",
    keywords: ["prahlad nagar", "prahladnagar garden", "corporate road"],
  },
  {
    name: "Paldi / Ellisbridge",
    area: "Paldi, Ahmedabad - 380007",
    lat: 23.0130,
    lng: 72.5640,
    city: "Ahmedabad",
    pincode: "380007",
    keywords: ["paldi", "ellisbridge", "nid", "mahalaxmi cross road"],
  },
  {
    name: "Maninagar / Kankaria Lake",
    area: "Maninagar, Ahmedabad - 380008",
    lat: 22.9970,
    lng: 72.6020,
    city: "Ahmedabad",
    pincode: "380008",
    keywords: ["maninagar", "kankaria lake", "kankaria zoo", "nagina wadi"],
  },
  {
    name: "Nikol / Naroda",
    area: "East Ahmedabad - 382350",
    lat: 23.0450,
    lng: 72.6680,
    city: "Ahmedabad",
    pincode: "382350",
    keywords: ["nikol", "naroda", "nikol cross road", "naroda pataiya"],
  },

  // Gujarat Cities
  {
    name: "Surat",
    area: "Surat Central, Gujarat - 395003",
    lat: 21.1702,
    lng: 72.8311,
    city: "Surat",
    pincode: "395003",
    keywords: ["surat", "athwa lines", "vesu", "adajan", "varachha", "surat city"],
  },
  {
    name: "Vadodara (Baroda)",
    area: "Sayajibaug / Alkapuri, Vadodara - 390001",
    lat: 22.3072,
    lng: 73.1812,
    city: "Vadodara",
    pincode: "390001",
    keywords: ["vadodara", "baroda", "alkapuri", "sayajibaug", "race course"],
  },
  {
    name: "Rajkot",
    area: "Kalawad Road / Yagnik Road, Rajkot - 360001",
    lat: 22.3039,
    lng: 70.8022,
    city: "Rajkot",
    pincode: "360001",
    keywords: ["rajkot", "yagnik road", "kalawad road", "madhapar"],
  },
  {
    name: "Bhavnagar",
    area: "Bhavnagar City, Gujarat - 364001",
    lat: 21.7645,
    lng: 72.1519,
    city: "Bhavnagar",
    pincode: "364001",
    keywords: ["bhavnagar", "takhteshwar", "nilambag"],
  },
  {
    name: "Jamnagar",
    area: "Jamnagar City, Gujarat - 361001",
    lat: 22.4707,
    lng: 70.0577,
    city: "Jamnagar",
    pincode: "361001",
    keywords: ["jamnagar", "lakhota lake", "reliance refinery"],
  },
  {
    name: "Junagadh",
    area: "Junagadh City, Gujarat - 362001",
    lat: 21.5222,
    lng: 70.4579,
    city: "Junagadh",
    pincode: "362001",
    keywords: ["junagadh", "girnar", "uparkot"],
  },
  {
    name: "Anand",
    area: "Anand, Gujarat - 388001",
    lat: 22.5645,
    lng: 72.9289,
    city: "Anand",
    pincode: "388001",
    keywords: ["anand", "amul", "vv nagar", "milk city"],
  },
  {
    name: "Nadiad",
    area: "Nadiad, Gujarat - 387001",
    lat: 22.6916,
    lng: 72.8634,
    city: "Nadiad",
    pincode: "387001",
    keywords: ["nadiad", "santram mandir"],
  },
  {
    name: "Mehsana",
    area: "Mehsana, Gujarat - 384001",
    lat: 23.5880,
    lng: 72.3693,
    city: "Mehsana",
    pincode: "384001",
    keywords: ["mehsana", "modhera", "mehsana city"],
  },
];

function MapController({ center, zoom = 15 }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { animate: true, duration: 0.9 });
    }
  }, [center?.[0], center?.[1], zoom, map]);
  return null;
}

function MapEventsHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapLocationPicker({
  initialLat,
  initialLng,
  initialAddress = "",
  onConfirmLocation,
  isCompulsory = true,
  title = "Pin Exact Location on Map (Compulsory)",
}) {
  // Default to Adalaj / Ahmedabad area
  const defaultPos = [23.1644, 72.5855];

  const parsedLat = parseFloat(initialLat);
  const parsedLng = parseFloat(initialLng);
  const hasInitial = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0;

  const [position, setPosition] = useState(hasInitial ? [parsedLat, parsedLng] : defaultPos);
  const [mapCenter, setMapCenter] = useState(hasInitial ? [parsedLat, parsedLng] : defaultPos);
  const [mapZoom, setMapZoom] = useState(15);
  const [addressDetails, setAddressDetails] = useState({
    street: "",
    city: hasInitial ? "Adalaj" : "",
    state: "Gujarat",
    pincode: "",
    formatted: initialAddress || "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(hasInitial);

  // Suggestions state & dropdown
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  // Reverse geocode lat/lng to readable address
  const fetchAddress = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        const a = data.address || {};
        const road = [a.road, a.suburb, a.neighbourhood].filter(Boolean).join(", ");
        const city =
          a.city ||
          a.town ||
          a.village ||
          a.county ||
          (lat > 23.12 && lat < 23.3 ? "Adalaj / Gandhinagar" : "Ahmedabad");
        const formatted =
          data.display_name || [road, city, a.state, a.postcode].filter(Boolean).join(", ");

        setAddressDetails({
          street: road || "",
          city: city || "",
          state: a.state || "Gujarat",
          pincode: a.postcode || "",
          formatted: formatted || "",
        });
        return { road, city, state: a.state, pincode: a.postcode, formatted };
      }
    } catch (e) {
      console.warn("Reverse geocode fallback:", e);
    }
    return null;
  };

  // Handle marker reposition
  const handlePositionChange = async (lat, lng) => {
    const newPos = [lat, lng];
    setPosition(newPos);
    setMapCenter(newPos);
    setIsConfirmed(false); // require re-confirmation on new coordinates
    await fetchAddress(lat, lng);
  };

  // Trigger user's REAL device GPS coordinates (NO fake Ahmedabad IP fallback)
  const handleUseCurrentLocation = async () => {
    setDetecting(true);

    const applyLocation = async (lat, lng) => {
      const newPos = [lat, lng];
      setPosition(newPos);
      setMapCenter(newPos);
      setMapZoom(16);
      setIsConfirmed(false);
      setDetecting(false);
      toast.success("✓ Your original location detected! Tap 'Confirm Location' to lock it.");
      await fetchAddress(lat, lng);
    };

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setDetecting(false);
      toast.error("Geolocation is not supported by your browser. Please search your place name below or click on the map.");
      return;
    }

    const getHtml5Pos = (highAccuracy, timeoutMs) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: highAccuracy,
          timeout: timeoutMs,
          maximumAge: 0,
        });
      });

    try {
      // 1. High accuracy GPS (satellites + Wi-Fi) with 15s timeout
      let pos;
      try {
        pos = await getHtml5Pos(true, 15000);
      } catch (err) {
        // If high accuracy timed out or failed, try standard accuracy
        if (err?.code === 1) {
          // Permission denied / insecure origin: rethrow immediately
          throw err;
        }
        pos = await getHtml5Pos(false, 10000);
      }

      if (pos && pos.coords) {
        const { latitude, longitude } = pos.coords;
        if (!isNaN(latitude) && !isNaN(longitude)) {
          await applyLocation(latitude, longitude);
          return;
        }
      }
    } catch (err) {
      console.warn("GPS detection failed:", err);
      setDetecting(false);
      if (err?.code === 1) {
        toast.error("⚠️ Location access was blocked. Please click the icon in your browser address bar and set Location to 'Allow'.", { duration: 7000 });
      } else if (err?.code === 2 || err?.code === 3) {
        toast.error("⚠️ Device GPS timed out or unavailable. Please enable device Location in settings, or type your locality in the search bar below.", { duration: 7000 });
      } else {
        toast.error("Could not get your GPS location. Please turn on device GPS or search your place name below.", { duration: 6000 });
      }
      return;
    }

    setDetecting(false);
    toast.error("Could not determine your GPS location. Please search your place name below or click on the map.");
  };

  // Autocomplete search input change: instant curated match + online Photon geocoding
  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    const cleanVal = val.trim().toLowerCase();
    const compactVal = cleanVal.replace(/[^a-z0-9]/g, "");

    if (!cleanVal) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    // 1. Instant local search from CURATED_LOCATIONS
    const localMatches = CURATED_LOCATIONS.filter((loc) => {
      const matchName = loc.name.toLowerCase().includes(cleanVal);
      const matchArea = loc.area.toLowerCase().includes(cleanVal);
      const matchKeyword = loc.keywords?.some((k) => {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          k.toLowerCase().includes(cleanVal) ||
          cleanVal.includes(k.toLowerCase()) ||
          (compactVal.length >= 3 && (normK.includes(compactVal) || compactVal.includes(normK)))
        );
      });
      return matchName || matchArea || matchKeyword;
    }).map((loc) => ({
      ...loc,
      source: "curated",
    }));

    setSuggestions(localMatches);
    setShowDropdown(true);

    // 2. Debounced online geocoding via Photon with regional bias
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (cleanVal.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&lat=23.16&lon=72.58&limit=6`;
          const res = await fetch(photonUrl);
          if (res.ok) {
            const data = await res.json();
            const onlineResults = (data.features || [])
              .map((feat) => {
                const p = feat.properties || {};
                const coords = feat.geometry?.coordinates;
                if (!coords || coords.length < 2) return null;
                const lng = coords[0];
                const lat = coords[1];
                const title = p.name || p.street || "Location";
                const areaParts = [p.street, p.city || p.county, p.state, p.postcode].filter(
                  (x) => Boolean(x) && x !== title
                );
                const area = areaParts.join(", ") || `${p.state || "Gujarat"}, India`;

                // Avoid duplicate coords with localMatches
                const isDup = localMatches.some(
                  (m) => Math.abs(m.lat - lat) < 0.005 && Math.abs(m.lng - lng) < 0.005
                );
                if (isDup) return null;

                return {
                  name: title,
                  area: area,
                  lat,
                  lng,
                  city: p.city || p.county || "Adalaj",
                  pincode: p.postcode || "",
                  source: "online",
                };
              })
              .filter(Boolean);

            setSuggestions((prev) => {
              const combined = [...localMatches, ...onlineResults];
              return combined.slice(0, 8);
            });
          }
        } catch (err) {
          console.warn("Online geocode suggestions error:", err);
        }
      }, 250);
    }
  };

  // Select a suggestion from the dropdown
  const handleSelectSuggestion = async (item) => {
    const lat = item.lat;
    const lng = item.lng;
    setPosition([lat, lng]);
    setMapCenter([lat, lng]);
    setMapZoom(16);
    setSearchQuery(item.name);
    setShowDropdown(false);
    setIsConfirmed(false);

    // Instant local address population
    setAddressDetails({
      street: item.name,
      city: item.city || "Adalaj",
      state: "Gujarat",
      pincode: item.pincode || "382421",
      formatted: `${item.name}, ${item.area}`,
    });

    toast.success(`📍 Selected: ${item.name}`);

    // Refine reverse geocoding in background
    await fetchAddress(lat, lng);
  };

  // Search locality / city form submit
  const handleSearch = async (e) => {
    e?.preventDefault();
    const cleanVal = searchQuery.trim().toLowerCase();
    const compactVal = cleanVal.replace(/[^a-z0-9]/g, "");
    if (!cleanVal) return;

    setShowDropdown(false);
    setSearching(true);

    // 1. Direct check in CURATED_LOCATIONS
    const localMatch = CURATED_LOCATIONS.find((loc) => {
      const matchName = loc.name.toLowerCase().includes(cleanVal);
      const matchArea = loc.area.toLowerCase().includes(cleanVal);
      const matchKeyword = loc.keywords?.some((k) => {
        const normK = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          k.toLowerCase().includes(cleanVal) ||
          cleanVal.includes(k.toLowerCase()) ||
          (compactVal.length >= 3 && (normK.includes(compactVal) || compactVal.includes(normK)))
        );
      });
      return matchName || matchArea || matchKeyword;
    });

    if (localMatch) {
      await handleSelectSuggestion(localMatch);
      setSearching(false);
      return;
    }

    // 2. Query Photon with Gujarat lat/lon bias
    try {
      const photonRes = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchQuery.trim())}&lat=23.16&lon=72.58&limit=1`
      );
      if (photonRes.ok) {
        const pData = await photonRes.json();
        if (pData.features && pData.features.length > 0) {
          const feat = pData.features[0];
          const lat = feat.geometry.coordinates[1];
          const lng = feat.geometry.coordinates[0];
          const p = feat.properties || {};
          const title = p.name || searchQuery.trim();
          const area = [p.street, p.city || p.county, p.state].filter(Boolean).join(", ");
          await handleSelectSuggestion({
            name: title,
            area: area || "Gujarat",
            lat,
            lng,
            city: p.city || "Adalaj",
            pincode: p.postcode || "",
            source: "online",
          });
          setSearching(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Photon search error:", e);
    }

    // 3. Fallback to Nominatim
    try {
      const nomQuery = `${searchQuery.trim()}, Gujarat, India`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(nomQuery)}&countrycodes=in&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          setPosition([lat, lng]);
          setMapCenter([lat, lng]);
          setMapZoom(16);
          setIsConfirmed(false);
          toast.success(`Found location: ${data[0].display_name.split(",")[0]}`);
          await fetchAddress(lat, lng);
          setSearching(false);
          return;
        }
      }
    } catch {
      console.warn("Nominatim search error");
    }

    toast.error("Location not found. Try Balapir, Adalaj, Gandhinagar, or Ahmedabad.");
    setSearching(false);
  };

  // Quick city chip select
  const handleSelectQuickLocation = async (loc) => {
    setPosition([loc.lat, loc.lng]);
    setMapCenter([loc.lat, loc.lng]);
    setMapZoom(16);
    setSearchQuery(loc.name);
    setShowDropdown(false);
    setIsConfirmed(false);
    toast.success(`Centered on ${loc.name}`);
    await fetchAddress(loc.lat, loc.lng);
  };

  // Confirm button handler
  const handleConfirm = () => {
    if (!position || !position[0] || !position[1]) {
      toast.error("Please click on map to choose location first!");
      return;
    }
    setIsConfirmed(true);
    toast.success("✓ Location confirmed on map!", { icon: "📍" });

    if (onConfirmLocation) {
      onConfirmLocation({
        latitude: position[0],
        longitude: position[1],
        address: addressDetails.formatted,
        street: addressDetails.street,
        city: addressDetails.city || "Adalaj",
        state: addressDetails.state || "Gujarat",
        pincode: addressDetails.pincode || "",
        confirmed: true,
      });
    }
  };

  return (
    <div style={{
      background: "#FFF", borderRadius: 18, border: isConfirmed ? "2px solid #16A34A" : "1.5px solid #F87171",
      padding: 18, marginBottom: 18, boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
      transition: "all 0.3s ease"
    }}>
      {/* Header & Compulsory Notice */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={18} color={isConfirmed ? "#16A34A" : "#C0401E"} />
          <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#1C1208" }}>
            {title}
          </span>
          {isCompulsory && (
            <span style={{
              fontSize: "0.68rem", fontWeight: 800, background: isConfirmed ? "#DCFCE7" : "#FEE2E2",
              color: isConfirmed ? "#166534" : "#DC2626", padding: "2px 8px", borderRadius: 999,
              textTransform: "uppercase", letterSpacing: "0.08em"
            }}>
              {isConfirmed ? "✓ Locked" : "Required"}
            </span>
          )}
        </div>

        {/* Current GPS Button */}
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={detecting}
          style={{
            padding: "6px 12px", borderRadius: 999, border: "1px solid #C0401E",
            background: "#FFF5F2", color: "#C0401E", fontSize: "0.76rem", fontWeight: 700,
            cursor: detecting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.2s"
          }}
        >
          {detecting ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Navigation size={12} />}
          Use Current GPS
        </button>
      </div>

      {/* Quick City / Region Selectors */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: "0.7rem", color: "rgba(28,18,8,0.5)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Choose City / Region:
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {POPULAR_LOCATIONS.map((loc) => {
            const isMatch = Math.abs(position[0] - loc.lat) < 0.01 && Math.abs(position[1] - loc.lng) < 0.01;
            return (
              <button
                key={loc.name}
                type="button"
                onClick={() => handleSelectQuickLocation(loc)}
                style={{
                  padding: "5px 10px", borderRadius: 8, fontSize: "0.74rem", fontWeight: 700,
                  border: isMatch ? "1.5px solid #C0401E" : "1px solid rgba(28,18,8,0.12)",
                  background: isMatch ? "#FFF5F2" : "#F9FAFB",
                  color: isMatch ? "#C0401E" : "#374151",
                  cursor: "pointer", transition: "all 0.15s"
                }}
              >
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Landmark / Address Search Bar with Live Suggestions Dropdown */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div ref={dropdownRef} style={{ position: "relative", flex: 1 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(28,18,8,0.4)", zIndex: 2 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              if (searchQuery.trim().length >= 1 && suggestions.length > 0) {
                setShowDropdown(true);
              }
            }}
            placeholder="Type place name (e.g. Balapir, Annapurnadham, Adalaj, Infocity)..."
            style={{
              width: "100%", padding: "9px 34px 9px 34px", borderRadius: 10,
              border: "1.5px solid rgba(28,18,8,0.18)", fontSize: "0.82rem",
              outline: "none", boxSizing: "border-box", transition: "border 0.2s",
              background: "#FAFAFA"
            }}
            onFocusCapture={(e) => (e.target.style.borderColor = "#2563EB")}
            onBlurCapture={(e) => (e.target.style.borderColor = "rgba(28,18,8,0.18)")}
          />

          {/* Clear button if text entered */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSuggestions([]);
                setShowDropdown(false);
              }}
              style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                background: "transparent", border: "none", cursor: "pointer", padding: 2,
                color: "rgba(28,18,8,0.4)", display: "flex", alignItems: "center"
              }}
            >
              <X size={14} />
            </button>
          )}

          {/* Live Autocomplete Suggestions Dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 5px)",
                left: 0,
                right: 0,
                background: "#FFFFFF",
                borderRadius: 14,
                boxShadow: "0 14px 38px rgba(0,0,0,0.18), 0 3px 8px rgba(0,0,0,0.06)",
                border: "1.5px solid rgba(28,18,8,0.12)",
                zIndex: 2500,
                maxHeight: 280,
                overflowY: "auto",
                padding: "6px 0",
              }}
            >
              <div style={{
                padding: "6px 14px 4px",
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "rgba(28,18,8,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(28,18,8,0.06)"
              }}>
                <span>Found {suggestions.length} Matching Area{suggestions.length > 1 ? "s" : ""}:</span>
                <span style={{ fontSize: "0.65rem", color: "#2563EB", fontWeight: 700 }}>Tap to Pin on Map</span>
              </div>

              {suggestions.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    cursor: "pointer",
                    borderBottom: idx < suggestions.length - 1 ? "1px solid rgba(28,18,8,0.05)" : "none",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF5F2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: item.source === "curated" ? "#FEE2E2" : "#EFF6FF",
                    color: item.source === "curated" ? "#C0401E" : "#2563EB",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginTop: 2
                  }}>
                    {item.source === "curated" ? <Sparkles size={14} /> : <MapPin size={14} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1C1208" }}>
                        {item.name}
                      </span>
                      {item.source === "curated" && (
                        <span style={{
                          fontSize: "0.62rem", fontWeight: 800, background: "#FEF3C7",
                          color: "#92400E", padding: "1px 6px", borderRadius: 4
                        }}>
                          Verified
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(28,18,8,0.6)", marginTop: 2 }}>
                      {item.area}
                    </div>
                  </div>

                  <span style={{
                    fontSize: "0.68rem", fontWeight: 700, color: "#2563EB",
                    background: "#EFF6FF", padding: "4px 8px", borderRadius: 6,
                    alignSelf: "center", flexShrink: 0
                  }}>
                    Select ➔
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={searching}
          style={{
            padding: "8px 16px", borderRadius: 10, border: "none",
            background: "#2563EB", color: "#FFF", fontSize: "0.8rem", fontWeight: 700,
            cursor: searching ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6
          }}
        >
          {searching ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : null}
          {searching ? "Finding..." : "Search"}
        </button>
      </form>

      {/* Interactive Map */}
      <div style={{
        height: 220, borderRadius: 14, overflow: "hidden",
        border: "1.5px solid rgba(28,18,8,0.1)", position: "relative", marginBottom: 12
      }}>
        <MapContainer center={mapCenter} zoom={15} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <MapController center={mapCenter} />
          <MapEventsHandler onSelect={handlePositionChange} />

          <Marker
            position={position}
            icon={pinIcon}
            draggable={true}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target;
                const latlng = marker.getLatLng();
                handlePositionChange(latlng.lat, latlng.lng);
              },
            }}
          >
            <Popup>
              <b>📍 Selected Location</b><br />
              {addressDetails.formatted || `${position[0].toFixed(4)}, ${position[1].toFixed(4)}`}
            </Popup>
          </Marker>
        </MapContainer>

        {/* Instruction overlay badge */}
        <div style={{
          position: "absolute", bottom: 8, left: 8, zIndex: 1000,
          background: "rgba(17, 24, 39, 0.85)", backdropFilter: "blur(6px)",
          color: "#FFF", padding: "4px 10px", borderRadius: 8, fontSize: "0.7rem", fontWeight: 600
        }}>
          💡 Click or drag pin to fine-tune exact door location
        </div>
      </div>

      {/* Selected Location Details Card */}
      <div style={{
        background: isConfirmed ? "#F0FDF4" : "#FFFBEB",
        border: `1px solid ${isConfirmed ? "#BBF7D0" : "#FDE68A"}`,
        borderRadius: 12, padding: "10px 14px", marginBottom: 12
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isConfirmed ? (
              <CheckCircle2 size={16} color="#16A34A" />
            ) : (
              <AlertCircle size={16} color="#D97706" />
            )}
            <span style={{ fontSize: "0.78rem", fontWeight: 800, color: isConfirmed ? "#166534" : "#92400E" }}>
              {isConfirmed ? "Location Confirmed" : "Location Selected (Confirmation Required)"}
            </span>
          </div>
          <span style={{ fontSize: "0.72rem", color: "rgba(28,18,8,0.5)", fontWeight: 700 }}>
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </span>
        </div>

        <div style={{ fontSize: "0.76rem", color: "#374151", lineHeight: 1.4 }}>
          {addressDetails.formatted || "Click on the map to set your location coordinates"}
        </div>
      </div>

      {/* Confirm Button (Compulsory requirement) */}
      <button
        type="button"
        onClick={handleConfirm}
        style={{
          width: "100%", padding: "12px", borderRadius: 12, border: "none",
          background: isConfirmed
            ? "linear-gradient(135deg, #16A34A 0%, #15803D 100%)"
            : "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
          color: "#FFF", fontSize: "0.88rem", fontWeight: 800,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: isConfirmed ? "0 4px 16px rgba(22,163,74,0.3)" : "0 4px 16px rgba(37,99,235,0.3)",
          transition: "all 0.2s"
        }}
      >
        <CheckCircle2 size={18} />
        {isConfirmed ? "✓ Location Confirmed (Click to Re-confirm)" : "Confirm & Set Location on Map (Compulsory)"}
      </button>

      {!isConfirmed && isCompulsory && (
        <p style={{ textAlign: "center", fontSize: "0.7rem", color: "#DC2626", fontWeight: 700, marginTop: 6 }}>
          ⚠️ You must click the blue button above to confirm location before saving
        </p>
      )}
    </div>
  );
}
