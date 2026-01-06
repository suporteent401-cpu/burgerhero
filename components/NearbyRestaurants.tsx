import React, { useState } from 'react';
import { Card, CardBody } from './ui/Card';
import { Button } from './ui/Button';
import { MapPin, Compass, Navigation, AlertTriangle, Loader2 } from 'lucide-react';
import { RESTAURANT_LOCATIONS, Restaurant } from '../lib/locations';
import { getHaversineDistance } from '../lib/geo';
import { motion, AnimatePresence } from 'framer-motion';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface LocationWithDistance extends Restaurant {
  distance: number;
}

const NearbyRestaurants: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [locations, setLocations] = useState<LocationWithDistance[]>([]);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  const findNearby = () => {
    setStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });

        const locationsWithDistance = RESTAURANT_LOCATIONS.map(loc => ({
          ...loc,
          distance: getHaversineDistance(latitude, longitude, loc.lat, loc.lng),
        })).sort((a, b) => a.distance - b.distance);

        setLocations(locationsWithDistance);
        setStatus('success');
      },
      (error) => {
        console.error("Geolocation error:", error);
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center text-center h-48">
            <Loader2 className="w-8 h-8 text-hero-primary animate-spin mb-4" />
            <p className="font-bold text-slate-700 dark:text-slate-200">Buscando sua localização...</p>
            <p className="text-xs text-slate-500">Por favor, autorize o acesso no seu navegador.</p>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center text-center h-48">
            <AlertTriangle className="w-8 h-8 text-amber-500 mb-4" />
            <p className="font-bold text-slate-700 dark:text-slate-200">Não foi possível buscar</p>
            <p className="text-xs text-slate-500 mb-4">Verifique as permissões de localização do seu navegador.</p>
            <a href="https://www.google.com/maps/search/BurgerHero" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <MapPin size={14} className="mr-2" /> Abrir busca no Maps
              </Button>
            </a>
          </div>
        );
      case 'success':
        return (
          <div className="space-y-3">
            {locations.map(loc => (
              <div key={loc.id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl flex items-center gap-4">
                <div className="w-10 h-10 bg-hero-primary/10 rounded-lg flex items-center justify-center text-hero-primary">
                  <Compass size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{loc.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{loc.address}</p>
                </div>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&origin=${userCoords?.lat},${userCoords?.lng}&destination=${loc.lat},${loc.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-center"
                >
                  <Button variant="secondary" size="sm" className="dark:bg-slate-700">
                    <Navigation size={14} className="mr-1.5" /> Rota
                  </Button>
                  <p className="text-[10px] font-bold text-slate-400 mt-1">{loc.distance.toFixed(1)} km</p>
                </a>
              </div>
            ))}
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center justify-center text-center h-48">
            <div className="w-16 h-16 bg-hero-primary/10 rounded-full flex items-center justify-center text-hero-primary mb-4">
              <MapPin size={32} />
            </div>
            <h3 className="font-black text-slate-800 dark:text-white">Restaurantes perto de mim</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mt-1 mb-4">
              Encontre a unidade BurgerHero mais próxima para resgatar seu benefício.
            </p>
            <Button onClick={findNearby}>Encontrar agora</Button>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardBody className="p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </CardBody>
    </Card>
  );
};

export default NearbyRestaurants;