// lib/i18n.ts
export type Language = 'kz' | 'ru'

export const translations = {
  kz: {
    // Navigation
    home: 'Басты',
    discover: 'Іздеу',
    favorites: 'Таңдамалар',
    cart: 'Себет',
    profile: 'Профиль',
    
    // Common
    appName: 'Sarqyn Food',
    saveFood: 'Тағамды құтқар',
    reserve: 'Сатып алу',
    soldOut: 'Сатылып кетті',
    km: 'км',
    min: 'мин',
    discount: 'жеңілдік',
    pickupTime: 'Алу уақыты',
    total: 'Барлығы',
    checkout: 'Тапсырыс беру',
    cartEmpty: 'Себет бос',
    noOrders: 'Тапсырыстар жоқ',
    noFavorites: 'Таңдамалар жоқ',
    myOrders: 'Менің тапсырыстарым',
    language: 'Тіл',
    logout: 'Шығу',
    login: 'Кіру',
    register: 'Тіркелу',
    
    // Home
    welcome: 'Қош келдіңіз!',
    nearbySurprises: 'Жақын маңдағы тосын сыйлар',
    noBags: 'Жақын маңда тосын сыйлар жоқ',
    locationRequired: 'Орналасқан жеріңізді анықтаңыз',
    locateMe: 'Менің орнымды анықтау',
    guest: 'Қонақ',
    subtitle: 'Бүгін не құтқарасыз?',
    search: 'Мейрамхана немесе тағам іздеу...',
    preferences: 'Қалауларыңыз',
    filter: 'Фильтр',
    iLike: 'Маған ұнайды',
    
    // Order statuses
    statusPending: 'Күтілуде',
    statusConfirmed: 'Расталды',
    statusPreparing: 'Дайындалуда',
    statusReadyForPickup: 'Дайын',
    statusOutForDelivery: 'Жолда',
    statusNearby: 'Жақын жерде',
    statusDelivered: 'Жеткізілді',
    statusCancelled: 'Бас тартылды',
    
    // Tracking
    tracking: 'Тапсырысты бақылау',
    remainingDistance: 'Қалған қашықтық',
    estimatedTime: 'Болжамды уақыт',
    progress: 'Прогресс',
    startDelivery: 'Жеткізуді бастау',
    deliveryCompleted: 'Жеткізілді!',
    
    // Auth
    email: 'Электрондық пошта',
    password: 'Құпия сөз',
    confirmPassword: 'Құпия сөзді растау',
    fullName: 'Толық аты-жөні',
    phone: 'Телефон нөмірі',
    forgotPassword: 'Құпия сөзді ұмыттыңыз ба?',
    noAccount: 'Аккаунтыңыз жоқ па?',
    haveAccount: 'Аккаунтыңыз бар ма?',
    
    // Cart
    continueShopping: 'Сатып алуды жалғастыру',
    delivery: 'Жеткізу',
    subtotal: 'Тағамдар сомасы',
    
    // Profile
    editProfile: 'Профильді өңдеу',
    settings: 'Баптаулар',
    support: 'Қолдау',
    about: 'Біз туралы',
    version: 'Нұсқа',
    
    // Actions
    save: 'Сақтау',
    cancel: 'Болдырмау',
    confirm: 'Растау',
    delete: 'Жою',
    edit: 'Өңдеу',
    add: 'Қосу',
    remove: 'Алып тастау',
  },
  
  ru: {
    // Navigation
    home: 'Главная',
    discover: 'Поиск',
    favorites: 'Избранное',
    cart: 'Корзина',
    profile: 'Профиль',
    
    // Common
    appName: 'Sarqyn Food',
    saveFood: 'Спасай еду',
    reserve: 'Купить',
    soldOut: 'Продано',
    km: 'км',
    min: 'мин',
    discount: 'скидка',
    pickupTime: 'Время получения',
    total: 'Итого',
    checkout: 'Оформить заказ',
    cartEmpty: 'Корзина пуста',
    noOrders: 'Нет заказов',
    noFavorites: 'Нет избранного',
    myOrders: 'Мои заказы',
    language: 'Язык',
    logout: 'Выйти',
    login: 'Войти',
    register: 'Регистрация',
    
    // Home
    welcome: 'Добро пожаловать!',
    nearbySurprises: 'Сюрпризы рядом с вами',
    noBags: 'Рядом нет сюрпризов',
    locationRequired: 'Определите ваше местоположение',
    locateMe: 'Определить моё местоположение',
    guest: 'Гость',
    subtitle: 'Что спасете сегодня?',
    search: 'Поиск ресторана или блюда...',
    preferences: 'Предпочтения',
    filter: 'Фильтр',
    iLike: 'Мне нравится',
    
    // Order statuses
    statusPending: 'Ожидает',
    statusConfirmed: 'Подтвержден',
    statusPreparing: 'Готовится',
    statusReadyForPickup: 'Готов к выдаче',
    statusOutForDelivery: 'В пути',
    statusNearby: 'Рядом',
    statusDelivered: 'Доставлен',
    statusCancelled: 'Отменен',
    
    // Tracking
    tracking: 'Отслеживание заказа',
    remainingDistance: 'Осталось км',
    estimatedTime: 'Расчетное время',
    progress: 'Прогресс',
    startDelivery: 'Начать доставку',
    deliveryCompleted: 'Доставлено!',
    
    // Auth
    email: 'Электронная почта',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    fullName: 'Полное имя',
    phone: 'Номер телефона',
    forgotPassword: 'Забыли пароль?',
    noAccount: 'Нет аккаунта?',
    haveAccount: 'Уже есть аккаунт?',
    
    // Cart
    continueShopping: 'Продолжить покупки',
    delivery: 'Доставка',
    subtotal: 'Сумма блюд',
    
    // Profile
    editProfile: 'Редактировать профиль',
    settings: 'Настройки',
    support: 'Поддержка',
    about: 'О нас',
    version: 'Версия',
    
    // Actions
    save: 'Сохранить',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    delete: 'Удалить',
    edit: 'Редактировать',
    add: 'Добавить',
    remove: 'Удалить',
  },
}

export function getTranslation(lang: Language) {
  return translations[lang]
}