import { useState, useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const sampleEvents = [
  {
    id: 1,
    name: "Pulse Club",
    time: "10:30 PM",
    trail: "Neon Nights",
    coordinates: [41.891, -87.624],
    location: "123 Main St",
    artists: ["DJ Neon", "Bassline Benny"]
  },
  {
    id: 2,
    name: "Orbit Lounge",
    time: "11:00 PM",
    trail: "Neon Nights",
    coordinates: [41.892, -87.628],
    location: "456 Cosmic Ave",
    artists: ["Luna Loop", "Echo Mike"]
  },
  {
    id: 3,
    name: "Terminal X",
    time: "11:45 PM",
    trail: "Neon Nights",
    coordinates: [41.894, -87.63],
    location: "789 Terminal Rd",
    artists: ["Terminal Tom", "Jetset Jenna"]
  }
];

const LOADING_GIF = "https://upload.wikimedia.org/wikipedia/commons/b/b1/Loading_icon.gif";
const IMAGE_API = "https://prod-44.westus.logic.azure.com:443/workflows/bae271e6ed5b4cd39b21011746a58ab1/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=jVCUiSPAD3i7Ub1Z6KPf5TjW5PJXFWlz8EFn8lltEHg";

function InlineMap({ pins, focus }) {
  const mapRef = useRef(null);
  const mapContainer = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = L.map(mapContainer.current).setView(focus?.coordinates || [41.889, -87.623], 16);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(map);

    pins.forEach(p => {
      L.marker(p.coordinates, {
        icon: L.icon({
          iconUrl: focus && focus.id === p.id ? "https://maps.gstatic.com/mapfiles/ms2/micons/yellow-dot.png" : "https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png",
          iconSize: [30, 30]
        })
      }).addTo(map);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [pins, focus]);

  return <div ref={mapContainer} className="w-full h-[180px] rounded-xl overflow-hidden border border-[#00FFE0]" />;
}

export default function TempoScapeMobile() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageSrc, setImageSrc] = useState(LOADING_GIF);
  const [isLoading, setIsLoading] = useState(true);
  const focusEvent = sampleEvents[currentIndex];

  useEffect(() => {
    let ignore = false;
    async function fetchImage() {
      setIsLoading(true);
      setImageSrc(LOADING_GIF);
      try {
        const res = await fetch(IMAGE_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ id: focusEvent.id })
        });
        if (!res.ok) throw new Error("API failed: " + res.status);
        const data = await res.text();
        if (!ignore && data.startsWith("http")) {
          setImageSrc(data);
        } else {
          setImageSrc(LOADING_GIF);
        }
      } catch (e) {
        if (!ignore) setImageSrc(LOADING_GIF);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    if (focusEvent && focusEvent.id) fetchImage();
    return () => { ignore = true; };
  }, [focusEvent]);

  const handleSwipe = (direction) => {
    setCurrentIndex(prev => {
      let newIndex = direction === "left" ? prev + 1 : prev - 1;
      if (newIndex < 0) newIndex = sampleEvents.length - 1;
      if (newIndex >= sampleEvents.length) newIndex = 0;
      return newIndex;
    });
  };

  return (
    <div className="bg-[#0C0C0C] min-h-screen text-white font-sans flex flex-col items-center p-4 space-y-4">
      <div className="text-2xl font-bold text-[#00FFE0]">TEMPO TRAILS</div>

      <div className="flex w-full gap-4">
        <div className="flex flex-col gap-4 w-1/2">
          <div className="border border-[#00FFE0] rounded-xl p-4 text-left">
            <div className="text-[#00FFE0] font-medium text-sm">Location</div>
            <div className="text-white text-xl font-bold leading-tight">{focusEvent?.location}</div>
          </div>
          <div className="border border-[#00FFE0] rounded-xl p-4 text-left">
            <div className="text-[#00FFE0] font-medium text-sm">ARTISTS</div>
            <ul className="list-disc ml-4 text-base">
              {focusEvent?.artists?.map((artist, idx) => (
                <li key={idx}>{artist}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="w-1/2">
          <InlineMap pins={sampleEvents} focus={focusEvent} />
        </div>
      </div>

      <div className="relative w-full h-[240px] border border-[#00FFE0] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-[#00FFE0]">
            <img src={LOADING_GIF} className="w-12 h-12" alt="Loading..." />
          </div>
        ) : (
          <img key={imageSrc} src={imageSrc} alt="Event Poster" className="object-cover w-full h-full" />
        )}
        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 w-full flex justify-between px-4">
          <button onClick={() => handleSwipe("right")} className="text-4xl text-white">←</button>
          <button onClick={() => handleSwipe("left")} className="text-4xl text-white">→</button>
        </div>
      </div>

      <div className="text-center text-xl font-semibold">{focusEvent?.name}</div>
      <div className="text-center text-[#00FFE0] text-lg">{focusEvent?.time}</div>
    </div>
  );
}