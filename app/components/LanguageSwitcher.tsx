// app/context/LanguageContext.tsx

'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'ru' | 'kz';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Record<string, string>> = {
  ru: {
    // ===== PROFILE =====
    profile: 'Профиль',
    back: 'Назад',
    avatar: 'Аватар',
    upload: 'Загрузить',
    name: 'Имя',
    phone: 'Телефон',
    email: 'Email',
    role: 'Роль',
    registered: 'Дата регистрации',
    active: 'Активен',
    inactive: 'Неактивен',
    becomeCourier: 'Стать курьером',
    logout: 'Выйти',
    home: 'На главную',
    callCenter: 'Колл-центр',
    callUs: 'Позвоните нам',
    workingHours: 'Ежедневно с 9:00 до 21:00',
    call: 'Позвонить',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',

    // ===== ERRORS & MESSAGES =====
    error: 'Ошибка',
    tryAgain: 'Попробовать снова',
    userNotFound: 'Пользователь не найден',
    login: 'Войти',
    confirmLogout: 'Вы уверены, что хотите выйти?',
    avatarUpdated: 'Аватар обновлен!',
    avatarError: 'Ошибка при загрузке аватара',
    selectImage: 'Пожалуйста, выберите изображение',
    loading: 'Загрузка...',

    // ===== ORDERS =====
    myOrders: 'Мои заказы',
    noOrders: 'Нет заказов',
    orderAmount: 'Сумма',
    orderDate: 'Дата',
    order: 'Заказ',
    supplier: 'Продавец',
    noAddress: 'Адрес не указан',
    orderStatus: 'Статус',
    noOrdersDesc: 'У вас пока нет заказов.',
    findSurprise: 'Найдите сюрприз-пакет и сделайте заказ!',
    findSurpriseBtn: 'Найти сюрпризы',
    refresh: 'Обновить',
    lastUpdate: 'Последнее обновление',
    nearbyOffers: 'Предложения рядом',
    nearbyShops: 'Ближайшие магазины и кафе',
    list: 'Список',
    map: 'Карта',
    search: 'Поиск',

    // ===== ORDER STATUS =====
    pending: 'Ожидается',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    readyForPickup: 'Готов к выдаче',
    outForDelivery: 'Доставляется',
    nearby: 'Курьер рядом',
    delivered: 'Доставлен',
    cancelled: 'Отменен',

    // ===== SIGNUP =====
    signup: 'Регистрация',
    createAccount: 'Создать аккаунт',
    fillData: 'Заполните данные для регистрации',
    firstName: 'Имя',
    lastName: 'Фамилия',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    register: 'Зарегистрироваться',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    signIn: 'Войти',

    // ===== LOGIN =====
    welcomeBack: 'Добро пожаловать',
    signInToAccount: 'Войдите в свой аккаунт',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    signUp: 'Зарегистрироваться',

    // ===== FORGOT PASSWORD =====
    resetPassword: 'Восстановление пароля',
    enterPhone: 'Введите номер телефона для восстановления',
    sendCode: 'Отправить код',
    rememberPassword: 'Вспомнили пароль?',

    // ===== VERIFICATION =====
    verification: 'Подтверждение',
    enterCode: 'Введите код, отправленный на ваш номер',
    waitingApproval: 'Ожидайте одобрения администратора. Код придет после подтверждения.',
    verify: 'Подтвердить',
    resendCode: 'Отправить код повторно',
    wait: 'Подождите',

    // ===== NEW PASSWORD =====
    newPassword: 'Новый пароль',
    enterNewPassword: 'Введите новый пароль',
    savePassword: 'Сохранить пароль',
    passwordChanged: 'Пароль успешно изменен',

    // ===== NAV =====
    main: 'Главная',
    orders: 'Заказы',
    cart: 'Корзина',

    // ===== COURIER =====
    becomeCourierTitle: 'Стать курьером',
    courierRegistration: 'Регистрация курьера',
    courierInfo: 'Заполните данные для регистрации в качестве курьера',
    carModel: 'Модель автомобиля',
    carNumber: 'Госномер',
    courierType: 'Тип курьера',
    pedestrian: 'Пеший',
    driver: 'На автомобиле',
    submitApplication: 'Отправить заявку',
    applicationSent: 'Заявка отправлена на рассмотрение',
    waitApproval: 'Дождитесь одобрения администратора',
    alreadyCourier: 'Вы уже зарегистрированы как курьер',
    courierTitle: 'Станьте курьером и зарабатывайте',
    courierSubtitle: 'Гибкий график • Высокий доход • Бонусы',
    courier: 'Курьер',
    pedestrianRadius: 'Радиус 3 км',
    driverRadius: 'Радиус 15 км',
    carModelRequired: 'Укажите модель автомобиля',
    dashboard: 'В панель курьера',
    flexibleSchedule: 'Гибкий график',
    highEarnings: 'Высокий доход',
    bonuses: 'Бонусы и поощрения',
    continue: 'Продолжить',
    chooseSurprise: 'Выберите свой сюрприз-пакет',
    noBags: 'Все пакеты временно забронированы',
    soldOut: 'Распродано',
    addToCart: 'В корзину',
    adding: 'Добавление...',
    addedToCart: 'добавлен в корзину! У вас 15 минут на оплату.',
    addError: 'Ошибка при добавлении',
    connectionError: 'Ошибка соединения с сервером',

    // ===== TRACKING =====
    trackOrder: 'Отслеживание заказа',
    orderNumber: 'Номер заказа',
    supplierAddress: 'Адрес ресторана',
    deliveryAddress: 'Адрес доставки',
    estimatedTime: 'Примерное время',
    minutes: 'мин',
    km: 'км',
    inProgress: 'В процессе',
    orderNotFound: 'Заказ не найден',
    backToOrders: 'Вернуться к заказам',
    orderDetails: 'Детали заказа',
    product: 'Товар',
    deliveryTypeLabel: 'Способ получения',
    delivery: 'Доставка',
    address: 'Адрес',
    confirmDelivery: 'Подтвердить получение',
    confirming: 'Подтверждение...',
    deliveryConfirmed: 'Заказ успешно подтвержден! Спасибо!',
    confirmError: 'Ошибка при подтверждении заказа',
    networkError: 'Ошибка сети. Попробуйте позже.',
    confirmCancel: 'Вы уверены, что хотите отменить заказ?',
    orderCancelled: 'Заказ успешно отменен!',
    cancelError: 'Ошибка при отмене заказа',
    cancelOrder: 'Отменить заказ',
    unknown: 'Не указан',

    // ===== FAVORITES =====
    noFavorites: 'Нет избранных сюрпризов',
    addFavoritesHint: 'Добавляйте сюрпризы в избранное, нажимая на сердечко',
    goToOffers: 'Перейти к сюрпризам',
    available: 'Доступно',
    pcs: 'шт.',
    outOfStock: 'Нет в наличии',
    pleaseLogin: 'Пожалуйста, войдите в аккаунт',

    // ===== SURPRISE =====
    surpriseBags: 'Сюрпризы',
    addBag: 'Добавить сюрприз',
    editBag: 'Редактировать сюрприз',
    bagName: 'Название сюрприза',
    bagDescription: 'Описание',
    originalPrice: 'Оригинальная цена',
    discountedPrice: 'Цена со скидкой',
    discount: 'Скидка',
    availableQuantity: 'Доступное количество',
    bagType: 'Тип сюрприза',
    openType: 'Открытый',
    hiddenType: 'Скрытый',
    toggleStatus: 'Изменить статус',
    deleteBag: 'Удалить сюрприз',
    confirmDelete: 'Вы уверены, что хотите удалить этот сюрприз?',

    // ===== CATEGORIES =====
    categories: 'Категории',
    addCategory: 'Добавить категорию',
    categoryName: 'Название категории',
    categoryIcon: 'Иконка',
    deleteCategory: 'Удалить категорию',
    confirmDeleteCategory: 'Вы уверены, что хотите удалить эту категорию?',

    // ===== PRODUCTS =====
    products: 'Товары',
    addProduct: 'Добавить товар',
    productName: 'Название товара',
    productPrice: 'Цена',
    productCategory: 'Категория',
    prepTime: 'Время приготовления',
    
    unavailable: 'Недоступен',
    deleteProduct: 'Удалить товар',
    confirmDeleteProduct: 'Вы уверены, что хотите удалить этот товар?',

    // ===== BOTTOM NAV =====
    offers: 'Сюрприз',
    favorites: 'Избранное',
    
    // ===== CART =====
    emptyCart: 'Корзина пуста',
    addItems: 'Добавьте товары, чтобы оформить заказ',
    shop: 'В магазин',
    deliveryType: 'Способ доставки',
    pickup: 'Самовывоз',
  
    enterAddress: 'Введите адрес доставки',
    pickupAddress: 'Адрес самовывоза: Ресторан по адресу, указанному при оформлении',
    timeLeft: 'Осталось времени',
    payBefore: 'Оплатите до окончания времени',
    orElse: 'Иначе бронь снимется',
   
    deliveryFee: 'Доставка',
    totalAmount: 'Итого к оплате',
    items: 'товаров',
    timeExpired: 'Время истекло',
    checkout: 'Оформить заказ',
    amount: 'Сумма',
    timeRemaining: 'Осталось времени',
    processing: 'Обработка...',
    pay: 'Оплатить',
   
    bookingExpired: 'Время бронирования истекло!',
  },
  
  kz: {
    // ===== PROFILE =====
    profile: 'Профиль',
    back: 'Артқа',
    avatar: 'Аватар',
    upload: 'Жүктеу',
    name: 'Аты',
    phone: 'Телефон',
    email: 'Email',
    role: 'Рөл',
    registered: 'Тіркелген күні',
    active: 'Белсенді',
    inactive: 'Белсенді емес',
    becomeCourier: 'Курьер болу',
    logout: 'Шығу',
    home: 'Басты бетке',
    callCenter: 'Колл-орталық',
    callUs: 'Бізге қоңырау шалыңыз',
    workingHours: 'Күнделікті 9:00-ден 21:00-ге дейін',
    call: 'Қоңырау шалу',
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',

    // ===== ERRORS & MESSAGES =====
    error: 'Қате',
    tryAgain: 'Қайталап көріңіз',
    userNotFound: 'Пайдаланушы табылмады',
    login: 'Кіру',
    confirmLogout: 'Шығуға сенімдісіз бе?',
    avatarUpdated: 'Аватар жаңартылды!',
    avatarError: 'Аватарды жүктеу кезінде қате',
    selectImage: 'Суретті таңдаңыз',
    loading: 'Жүктелуде...',

    // ===== ORDERS =====
    myOrders: 'Менің тапсырыстарым',
    noOrders: 'Тапсырыстар жоқ',
    orderAmount: 'Сомасы',
    orderDate: 'Күні',
    order: 'Тапсырыс',
    supplier: 'Сатушы',
    noAddress: 'Мекенжай көрсетілмеген',
    orderStatus: 'Күйі',
    noOrdersDesc: 'Сізде әлі тапсырыс жоқ.',
    findSurprise: 'Сюрприз-пакетті тауып, тапсырыс беріңіз!',
    findSurpriseBtn: 'Сюрприздерді табу',
    refresh: 'Жаңарту',
    lastUpdate: 'Соңғы жаңарту',
    nearbyOffers: 'Жақын маңдағы ұсыныстар',
    nearbyShops: 'Жақын маңдағы дүкендер мен кафелер',
    list: 'Тізім',
    map: 'Карта',
    search: 'Іздеу',

    // ===== ORDER STATUS =====
    pending: 'Күтілуде',
    confirmed: 'Расталды',
    preparing: 'Дайындалуда',
    readyForPickup: 'Дайын',
    outForDelivery: 'Жеткізілуде',
    nearby: 'Курьер жақын жерде',
    delivered: 'Жеткізілді',
    cancelled: 'Бас тартылды',

    // ===== SIGNUP =====
    signup: 'Тіркелу',
    createAccount: 'Аккаунт құру',
    fillData: 'Тіркеу үшін деректерді толтырыңыз',
    firstName: 'Аты',
    lastName: 'Тегі',
    password: 'Құпия сөз',
    confirmPassword: 'Құпия сөзді растаңыз',
    register: 'Тіркелу',
    alreadyHaveAccount: 'Аккаунтыңыз бар ма?',
    signIn: 'Кіру',

    // ===== LOGIN =====
    welcomeBack: 'Қайта келдіңіз!',
    signInToAccount: 'Аккаунтыңызға кіріңіз',
    forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
    noAccount: 'Аккаунтыңыз жоқ па?',
    signUp: 'Тіркелу',

    // ===== FORGOT PASSWORD =====
    resetPassword: 'Құпия сөзді қалпына келтіру',
    enterPhone: 'Қалпына келтіру үшін телефон нөмірін енгізіңіз',
    sendCode: 'Код жіберу',
    rememberPassword: 'Құпия сөзді есіңізге түсірдіңіз бе?',

    // ===== VERIFICATION =====
    verification: 'Растау',
    enterCode: 'Нөміріңізге жіберілген кодты енгізіңіз',
    waitingApproval: 'Әкімшінің рұқсатын күтіңіз. Код расталғаннан кейін келеді.',
    verify: 'Растау',
    resendCode: 'Кодты қайта жіберу',
    wait: 'Күтіңіз',

    // ===== NEW PASSWORD =====
    newPassword: 'Жаңа құпия сөз',
    enterNewPassword: 'Жаңа құпия сөзді енгізіңіз',
    savePassword: 'Құпия сөзді сақтау',
    passwordChanged: 'Құпия сөз сәтті өзгертілді',

    // ===== NAV =====
    main: 'Басты бет',
    orders: 'Тапсырыстар',
    cart: 'Себет',

    // ===== COURIER =====
    becomeCourierTitle: 'Курьер болу',
    courierRegistration: 'Курьерді тіркеу',
    courierInfo: 'Курьер ретінде тіркелу үшін деректерді толтырыңыз',
    carModel: 'Көлік моделі',
    carNumber: 'Мемлекеттік нөмір',
    courierType: 'Курьер түрі',
    pedestrian: 'Жаяу',
    driver: 'Көлікте',
    submitApplication: 'Өтінім жіберу',
    applicationSent: 'Өтінім қарауға жіберілді',
    waitApproval: 'Әкімшінің рұқсатын күтіңіз',
    alreadyCourier: 'Сіз қазірдің өзінде курьер ретінде тіркелгенсіз',
    courierTitle: 'Курьер болып, табыс табыңыз',
    courierSubtitle: 'Икемді кесте • Жоғары табыс • Бонустар',
    courier: 'Курьер',
    pedestrianRadius: 'Радиус 3 км',
    driverRadius: 'Радиус 15 км',
    carModelRequired: 'Көлік моделін көрсетіңіз',
    dashboard: 'Курьер панеліне',
    flexibleSchedule: 'Икемді кесте',
    highEarnings: 'Жоғары табыс',
    bonuses: 'Бонустар мен сыйлықтар',
    continue: 'Жалғастыру',
    chooseSurprise: 'Сюрприз-пакетіңізді таңдаңыз',
    noBags: 'Барлық пакеттер уақытша броньдалған',
    soldOut: 'Сатылып кетті',
    addToCart: 'Себетке',
    adding: 'Қосу...',
    addedToCart: 'себетке қосылды! Төлеуге 15 минут.',
    addError: 'Қосу кезінде қате',
    connectionError: 'Сервермен байланыс қатесі',

    // ===== TRACKING =====
    trackOrder: 'Тапсырысты бақылау',
    orderNumber: 'Тапсырыс нөмірі',
    supplierAddress: 'Мейрамхана мекенжайы',
    deliveryAddress: 'Жеткізу мекенжайы',
    estimatedTime: 'Болжамды уақыт',
    minutes: 'мин',
    km: 'км',
    inProgress: 'Жүріп жатыр',
    orderNotFound: 'Тапсырыс табылмады',
    backToOrders: 'Тапсырыстарға оралу',
    orderDetails: 'Тапсырыс мәліметтері',
    product: 'Тауар',
    deliveryTypeLabel: 'Алу тәсілі',
    delivery: 'Жеткізу',
    address: 'Мекенжай',
    confirmDelivery: 'Алуды растау',
    confirming: 'Растау...',
    deliveryConfirmed: 'Тапсырыс сәтті расталды! Рахмет!',
    confirmError: 'Тапсырысты растау кезінде қате',
    networkError: 'Желі қатесі. Кейін қайталап көріңіз.',
    confirmCancel: 'Тапсырысты болдырмауға сенімдісіз бе?',
    orderCancelled: 'Тапсырыс сәтті болдырмалды!',
    cancelError: 'Тапсырысты болдырмау кезінде қате',
    cancelOrder: 'Тапсырысты болдырмау',
    unknown: 'Көрсетілмеген',

    // ===== FAVORITES =====
    noFavorites: 'Таңдаулы сюрприздер жоқ',
    addFavoritesHint: 'Жүрекшеге басып, сюрприздерді таңдаулыға қосыңыз',
    goToOffers: 'Сюрприздерге өту',
    available: 'Қолжетімді',
    pcs: 'дана',
    outOfStock: 'Жоқ',
    pleaseLogin: 'Аккаунтқа кіріңіз',

    // ===== SURPRISE =====
    surpriseBags: 'Сюрприздер',
    addBag: 'Сюрприз қосу',
    editBag: 'Сюрпризді өңдеу',
    bagName: 'Сюрприз атауы',
    bagDescription: 'Сипаттама',
    originalPrice: 'Бастапқы баға',
    discountedPrice: 'Жеңілдікпен баға',
    discount: 'Жеңілдік',
    availableQuantity: 'Қолжетімді саны',
    bagType: 'Сюрприз түрі',
    openType: 'Ашық',
    hiddenType: 'Жасырын',
    toggleStatus: 'Күйін өзгерту',
    deleteBag: 'Сюрпризді жою',
    confirmDelete: 'Бұл сюрпризді жойғыңыз келетініне сенімдісіз бе?',

    // ===== CATEGORIES =====
    categories: 'Санаттар',
    addCategory: 'Санат қосу',
    categoryName: 'Санат атауы',
    categoryIcon: 'Белгіше',
    deleteCategory: 'Санатты жою',
    confirmDeleteCategory: 'Бұл санатты жойғыңыз келетініне сенімдісіз бе?',

    // ===== PRODUCTS =====
    products: 'Тауарлар',
    addProduct: 'Тауар қосу',
    productName: 'Тауар атауы',
    productPrice: 'Бағасы',
    productCategory: 'Санат',
    prepTime: 'Дайындау уақыты',
    productDescription: 'Сипаттама',
  
    unavailable: 'Қолжетімсіз',
    deleteProduct: 'Тауарды жою',
    confirmDeleteProduct: 'Бұл тауарды жойғыңыз келетініне сенімдісіз бе?',

    // ===== BOTTOM NAV =====
    offers: 'Сюрприз',
    favorites: 'Таңдаулы',
    
    // ===== CART =====
    emptyCart: 'Себет бос',
    addItems: 'Тапсырыс беру үшін тауарларды қосыңыз',
    shop: 'Дүкенге',
    deliveryType: 'Жеткізу тәсілі',
    pickup: 'Өзің алу',
  
    enterAddress: 'Жеткізу мекенжайын енгізіңіз',
    pickupAddress: 'Өзің алу мекенжайы: Мейрамхана мекенжайы бойынша',
    timeLeft: 'Уақыт қалды',
    payBefore: 'Уақыт біткенше төлеңіз',
    orElse: 'Әйтпесе бронь жойылады',
    
    deliveryFee: 'Жеткізу',
    totalAmount: 'Барлығы',
    items: 'тауарлар',
    timeExpired: 'Уақыт бітті',
    checkout: 'Тапсырыс беру',
    amount: 'Сома',
    timeRemaining: 'Уақыт қалды',
    processing: 'Өңдеу...',
    pay: 'Төлеу',
   
    bookingExpired: 'Бронь уақыты аяқталды!',
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('ru');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'ru' || savedLang === 'kz')) {
      setLang(savedLang);
    }
  }, []);

  const setLanguage = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('app_lang', newLang);
  };

  const t = (key: string): string => {
    const langTranslations = translations[lang];
    return langTranslations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}