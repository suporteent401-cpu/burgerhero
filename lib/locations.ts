export interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const RESTAURANT_LOCATIONS: Restaurant[] = [
  {
    id: 'loc-1',
    name: 'BurgerHero - Asa Sul',
    address: 'CLS 405 Bloco B, Brasília - DF',
    lat: -15.8114,
    lng: -47.9019,
  },
  {
    id: 'loc-2',
    name: 'BurgerHero - Águas Claras',
    address: 'Av. das Araucárias, 1835, Águas Claras - DF',
    lat: -15.8351,
    lng: -48.0262,
  },
  {
    id: 'loc-3',
    name: 'BurgerHero - Asa Norte',
    address: 'CLN 206 Bloco A, Brasília - DF',
    lat: -15.7735,
    lng: -47.8825,
  },
  {
    id: 'loc-4',
    name: 'BurgerHero - Sudoeste',
    address: 'CLSW 301 Bloco C, Brasília - DF',
    lat: -15.7998,
    lng: -47.9223,
  },
  {
    id: 'loc-5',
    name: 'BurgerHero - Lago Sul',
    address: 'SHIS QI 11, Bloco O, Lago Sul - DF',
    lat: -15.8283,
    lng: -47.8799,
  },
];