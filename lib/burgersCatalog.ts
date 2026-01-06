export interface Burger {
  id: string;
  name: string;
  slogan: string;
  description: string;
  price: number;
  images: string[];
  isPopular?: boolean;
}

export const BURGERS_CATALOG: Burger[] = [
  {
    id: 'spiderman',
    name: 'Spider-Man Burger',
    slogan: 'O mais amado por todos!',
    description: 'Pão caseiro amanteigado, 180g de Steak Angus, queijo cheddar fatiado, bacon ao forno e cebola caramelizada.',
    price: 37.90,
    images: [
      'https://ik.imagekit.io/lflb43qwh/Heros/Homem%20aranha.png',
      'https://ik.imagekit.io/lflb43qwh/Heros/Homem%20aranha2.png'
    ],
    isPopular: true
  },
  {
    id: 'hulk',
    name: 'Hulk Burger',
    slogan: 'O Hulk simplesmente ESMAGAAAAA!!',
    description: 'Pão amanteigado, 2 Steak Angus 180g, muito bacon, muito queijo prato e maionese especial.',
    price: 58.90,
    images: ['https://ik.imagekit.io/lflb43qwh/Heros/Hulk.png']
  },
  {
    id: 'thor',
    name: 'Thor Burger',
    slogan: 'O próprio Deus do Trovão mandou esse delicioso hambúrguer!',
    description: 'Pão caseiro amanteigado, 180g Steak Angus, queijo cheddar fatiado, bacon ao forno e costela desfiada.',
    price: 39.90,
    images: ['https://ik.imagekit.io/lflb43qwh/Heros/Thor.png']
  },
  {
    id: 'tony',
    name: 'Tony Stark Burger',
    slogan: 'Hambúrguer do gênio, bilionário, playboy, e filantropo!',
    description: 'Pão amanteigado, Steak Angus 180g, molho Billy Jack e farofa de bacon.',
    price: 37.90,
    images: ['https://ik.imagekit.io/lflb43qwh/Heros/Tony%20Stark.png']
  }
];