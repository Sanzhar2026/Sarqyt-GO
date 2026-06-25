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

const translations = {
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
    
    // ===== TRACKING =====
    trackOrder: 'Отслеживание заказа',
    orderStatus: 'Статус заказа',
    orderNumber: 'Номер заказа',
    supplierAddress: 'Адрес ресторана',
    deliveryAddress: 'Адрес доставки',
    estimatedTime: 'Примерное время',
    minutes: 'мин',
    km: 'км',
    inProgress: 'В процессе',
    delivered: 'Доставлен',
    cancelled: 'Отменен',
    pending: 'Ожидает',
    confirmed: 'Подтвержден',
    preparing: 'Готовится',
    readyForPickup: 'Готов к выдаче',
    outForDelivery: 'В пути',
    nearby: 'Рядом',
    
    // ===== ORDERS =====
    myOrders: 'Мои заказы',
    noOrders: 'У вас нет заказов',
    orderAmount: 'Сумма',
    orderDate: 'Дата',
    emptyCart: 'Корзина пуста',
    total: 'Итого',
    checkout: 'Оформить заказ',
    remove: 'Удалить',
    quantity: 'Кол-во',
    
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
    productDescription: 'Описание',
    available: 'Доступен',
    unavailable: 'Недоступен',
    deleteProduct: 'Удалить товар',
    confirmDeleteProduct: 'Вы уверены, что хотите удалить этот товар?'
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
    
    // ===== TRACKING =====
    trackOrder: 'Тапсырысты бақылау',
    orderStatus: 'Тапсырыс күйі',
    orderNumber: 'Тапсырыс нөмірі',
    supplierAddress: 'Мейрамхана мекенжайы',
    deliveryAddress: 'Жеткізу мекенжайы',
    estimatedTime: 'Болжамды уақыт',
    minutes: 'мин',
    km: 'км',
    inProgress: 'Жүріп жатыр',
    delivered: 'Жеткізілді',
    cancelled: 'Бас тартылды',
    pending: 'Күтілуде',
    confirmed: 'Расталды',
    preparing: 'Дайындалуда',
    readyForPickup: 'Дайын',
    outForDelivery: 'Жолда',
    nearby: 'Жақын жерде',
    
    // ===== ORDERS =====
    myOrders: 'Менің тапсырыстарым',
    noOrders: 'Тапсырыстарыңыз жоқ',
    orderAmount: 'Сомасы',
    orderDate: 'Күні',
    emptyCart: 'Себет бос',
    total: 'Барлығы',
    checkout: 'Тапсырыс беру',
    remove: 'Жою',
    quantity: 'Саны',
    
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
    available: 'Қолжетімді',
    unavailable: 'Қолжетімсіз',
    deleteProduct: 'Тауарды жою',
    confirmDeleteProduct: 'Бұл тауарды жойғыңыз келетініне сенімдісіз бе?'
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
    return translations[lang][key as keyof typeof translations.ru] || key;
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