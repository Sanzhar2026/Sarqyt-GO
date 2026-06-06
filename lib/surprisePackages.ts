// surprisePackages.ts

interface SurpriseItem {
  name: string;
  quantity: number;
  image: string;
}

interface SurprisePackage {
  id: number;
  name: string;
  description: string;
  image: string;
  items: SurpriseItem[];
  totalItems: number;
  originalPrice: number;
  discountedPrice: number;
  discount: number;
}

export const surprisePackages: SurprisePackage[] = [
  {
    id: 1,
    name: "🍕 Пицца-сет 'Итальянский ужин'",
    description: "Две большие пиццы для большой компании",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop",
    items: [
      { name: "Маргарита пицца", quantity: 1, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&h=150&fit=crop" },
      { name: "Пепперони пицца", quantity: 1, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=150&fit=crop" },
      { name: "Сырные палочки", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Кока-кола 0.5л", quantity: 2, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=150&fit=crop" }
    ],
    totalItems: 5,
    originalPrice: 8900,
    discountedPrice: 5900,
    discount: 34
  },
  {
    id: 2,
    name: "🍣 Суши-сет 'Самурай'",
    description: "Классический набор японской кухни",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
    items: [
      { name: "Филадельфия ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" },
      { name: "Калифорния ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034184-42c7c2e5d9b8?w=200&h=150&fit=crop" },
      { name: "Суши сет (24 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=200&h=150&fit=crop" },
      { name: "Имбирь/Васаби/Соевый соус", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" }
    ],
    totalItems: 41,
    originalPrice: 12500,
    discountedPrice: 8900,
    discount: 29
  },
  {
    id: 3,
    name: "🍔 Бургер-сет 'Американский'",
    description: "Три вида бургеров с картошкой и напитками",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    items: [
      { name: "Гамбургер", quantity: 1, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=150&fit=crop" },
      { name: "Чизбургер", quantity: 1, image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=200&h=150&fit=crop" },
      { name: "Чикен бургер", quantity: 1, image: "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=200&h=150&fit=crop" },
      { name: "Картошка фри", quantity: 2, image: "https://images.unsplash.com/photo-1630384060421-cf20c0e0e2a1?w=200&h=150&fit=crop" },
      { name: "Кока-кола 0.5л", quantity: 3, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=150&fit=crop" }
    ],
    totalItems: 8,
    originalPrice: 7500,
    discountedPrice: 4900,
    discount: 35
  },
  {
    id: 4,
    name: "🍰 Десерт-сет 'Сладкоежка'",
    description: "Для тех, кто любит сладкое",
    image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=400&h=300&fit=crop",
    items: [
      { name: "Чизкейк", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Тирамису", quantity: 1, image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=200&h=150&fit=crop" },
      { name: "Макаруны (6 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=200&h=150&fit=crop" },
      { name: "Лимонад", quantity: 2, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&h=150&fit=crop" }
    ],
    totalItems: 10,
    originalPrice: 5800,
    discountedPrice: 3900,
    discount: 33
  },
  {
    id: 5,
    name: "🥗 ЗОЖ-сет 'Фитнес'",
    description: "Полезный набор для здорового питания",
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
    items: [
      { name: "Греческий салат", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Цезарь салат", quantity: 1, image: "https://images.unsplash.com/photo-1550304943-4f24f54dd8c9?w=200&h=150&fit=crop" },
      { name: "Куриные крылья (4 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a3f58?w=200&h=150&fit=crop" },
      { name: "Лимонад", quantity: 2, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&h=150&fit=crop" }
    ],
    totalItems: 5,
    originalPrice: 6800,
    discountedPrice: 4500,
    discount: 34
  },
  {
    id: 6,
    name: "🍕🍣 Микс-сет 'Азия & Италия'",
    description: "Сочетание итальянской и японской кухни",
    image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop",
    items: [
      { name: "Маргарита пицца", quantity: 1, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&h=150&fit=crop" },
      { name: "Филадельфия ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" },
      { name: "Калифорния ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034184-42c7c2e5d9b8?w=200&h=150&fit=crop" },
      { name: "Картошка фри", quantity: 1, image: "https://images.unsplash.com/photo-1630384060421-cf20c0e0e2a1?w=200&h=150&fit=crop" }
    ],
    totalItems: 19,
    originalPrice: 11200,
    discountedPrice: 7900,
    discount: 29
  },
  {
    id: 7,
    name: "🍕 Бургер-сет 'Для компании'",
    description: "Большой набор для вечеринки",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
    items: [
      { name: "Маргарита пицца", quantity: 1, image: "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=200&h=150&fit=crop" },
      { name: "Пепперони пицца", quantity: 1, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=200&h=150&fit=crop" },
      { name: "Гамбургер", quantity: 2, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&h=150&fit=crop" },
      { name: "Чизбургер", quantity: 2, image: "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=200&h=150&fit=crop" },
      { name: "Картошка фри", quantity: 3, image: "https://images.unsplash.com/photo-1630384060421-cf20c0e0e2a1?w=200&h=150&fit=crop" },
      { name: "Куриные крылья (6 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a3f58?w=200&h=150&fit=crop" },
      { name: "Кока-кола 0.5л", quantity: 4, image: "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=200&h=150&fit=crop" }
    ],
    totalItems: 15,
    originalPrice: 15800,
    discountedPrice: 9900,
    discount: 37
  },
  {
    id: 8,
    name: "🍣🍰 Суши-десерт 'Азия & Сладкое'",
    description: "Суши + десерты для сладкоежек",
    image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop",
    items: [
      { name: "Филадельфия ролл (8 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd2c?w=200&h=150&fit=crop" },
      { name: "Чизкейк", quantity: 1, image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=150&fit=crop" },
      { name: "Тирамису", quantity: 1, image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=200&h=150&fit=crop" },
      { name: "Макаруны (4 шт)", quantity: 1, image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=200&h=150&fit=crop" },
      { name: "Лимонад", quantity: 2, image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=200&h=150&fit=crop" }
    ],
    totalItems: 14,
    originalPrice: 8900,
    discountedPrice: 5900,
    discount: 34
  }
];