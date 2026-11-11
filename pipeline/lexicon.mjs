// Bilingual (English / Arabic) keyword lexicon used by the offline auto-director.
// Keys are prop names from remotion/story/Props.tsx. Arabic words are matched after
// normalisation + light stemming (see norm()), English words by stem/prefix.

export const PROP_WORDS = {
  police_car: ["police car", "patrol car", "سيارة شرطة"],
  cupboard: ["cupboard", "wardrobe", "closet", "خزانة"],
  table: ["table", "طاولة"],
  flower_pot: ["flower pot", "plant pot", "اصيص", "أصيص"],
  open_window: ["window", "نافذة", "شباك"],
  door: ["door", "باب"],
  stairs: ["stairs", "steps", "درج", "سلم"],
  nail: ["nail", "مسمار"],
  loot_bag: ["stolen bag", "sack", "كيس"],
  tool_bag: ["tools", "toolbox", "tool bag", "ادوات", "أدوات"],
  alarm_light: ["alarm", "siren", "انذار", "إنذار"],
  school_bus: ["school bus", "bus", "حافلة"],
  hay_bale: ["hay", "قش"],
  monster: ["monster", "creature", "وحش"],
  gun: ["gun", "pistol", "handgun", "مسدس"],
  visa_card: ["visa card", "visa", "بطاقة فيزا", "فيزا"],
  amphora: ["amphora", "ancient vase", "امفورا"],
  ancient_column: ["ancient column", "stone column", "عمود اثري"],
  chariot: ["chariot", "عربة حربية"],
  ancient_helmet: ["ancient helmet", "bronze helmet", "خوذة برونزية"],
  sundial: ["sundial", "مزولة", "ساعة شمسية"],
  horse: ["horse", "horses", "pony", "حصان", "خيول"],
  cart: ["cart", "wagon", "عربة"],
  tractor: ["tractor", "جرار"],
  pigeon: ["pigeon", "حمامة", "حمام زاجل"],
  bat: ["bat", "bats", "خفاش", "خفافيش"],
  clay_pot: ["clay pot", "terracotta", "فخار", "جرة"],
  pot_cutaway: ["pot cutaway", "مقطع جرة"],
  soil_roots: ["roots", "root system", "جذور"],
  soil_bare: ["soil layers", "bare soil", "طبقات التربة", "تربة عارية"],
  water_low: ["low water", "ماء قليل"],
  water_half: ["water level", "مستوى الماء"],
  water_full: ["full container", "وعاء ممتلئ"],
  thermometer_cold: ["thermometer", "ميزان حرارة"],
  thermometer_hot: ["high temperature", "حرارة مرتفعة"],
  heat_arrows: ["heat flow", "evaporation", "تبخر", "تدفق الحرارة"],
  wind_arrows: ["air flow", "تدفق الهواء"],
  birthday_cake: ["birthday cake", "cake", "birthday", "كعكة", "كيكة", "عيد ميلاد"],
  juice: ["juice", "orange juice", "عصير", "عصير برتقال"],
  medicine_bottle: ["medicine bottle","medication bottle","medicament","زجاجة دواء"],
  firstaid: ["first aid","medical kit","اسعافات اولية"],
  taxi: ["taxi","cab","تاكسي","سيارة اجرة"],
  ambulance: ["ambulance","سيارة اسعاف"],
  suitcase: ["suitcase","luggage","حقيبة سفر"],
  passport: ["passport","جواز سفر"],
  office_chair: ["office chair","desk chair","كرسي مكتب"],
  clipboard: ["clipboard","checklist","قائمة مهام"],
  love_letter: ["love letter","love note","valentine","رسالة حب"],
  anger: ["angry","anger","غضب","غاضب"],
  new_idea: ["new idea","inspiration","فكرة جديدة","الهام"],
  briefcase: ["briefcase","business","حقيبة عمل","اعمال"],
  wallet: ["wallet","purse","محفظة"],
  cash_stack: ["cash stack","banknotes","cash bundle","اوراق نقدية"],
  credit_card: ["credit card","bank card","بطاقة مصرفية","بطاقة ائتمان"],
  storefront: ["shop","store","متجر","دكان"],
  egg: ["egg","eggs","بيض","بيضة"],
  meat: ["meat","steak","لحم"],
  chicken: ["chicken","hen","دجاج","دجاجة"],
  flower: ["flower","flowers","blossom","زهرة","زهور","وردة"],
  lamp: ["table lamp","lamp","مصباح","اباجورة"],
  joystick: ["joystick","arcade stick","عصا تحكم"],
  goldbar: ["gold bar","gold ingot","سبيكة ذهب"],
  sand: ["sand","sandpile","رمل","رمال"],
  seedling: ["seedling","sprout","شتلة","نبتة"],
  leaf: ["leaf","leaves","ورقة شجر"],
  mushroom: ["mushroom","فطر"],
  bread: ["bread","loaf","خبز"],
  wrench: ["wrench","spanner","مفتاح ربط"],
  hammer: ["hammer","مطرقة"],
  scissors: ["scissors","مقص"],
  backpack: ["backpack","schoolbag","حقيبة ظهر"],
  sun: ["sun", "solar", "sunlight", "sunshine", "شمس", "شمسي", "اشعه الشمس"],
  moon: ["moon", "lunar", "قمر", "هلال"],
  earth: ["earth", "planet earth", "world", "globe", "ارض", "الكره الارضيه", "عالم", "كوكبنا"],
  planet: ["planet", "planets", "saturn", "jupiter", "mars", "venus", "كوكب", "كواكب", "زحل", "المشتري", "المريخ", "الزهره"],
  star: ["star", "stars", "نجم", "نجوم", "نجمه"],
  blackhole: ["black hole", "blackhole", "black holes", "ثقب اسود", "ثقوب سوداء", "الثقب"],
  galaxy: ["galaxy", "galaxies", "milky way", "universe", "cosmos", "مجره", "مجرات", "درب التبانه", "الكون"],
  rocket: ["rocket", "launch", "spaceship", "space travel", "صاروخ", "اطلاق", "مركبه فضائيه"],
  meteor: ["meteor", "meteorite", "asteroid", "comet", "نيزك", "نيازك", "كويكب", "مذنب"],
  atom: ["atom", "atoms", "particle", "particles", "electron", "proton", "nuclear", "radioactive", "uranium", "ذره", "ذرات", "جسيم", "جسيمات", "الكترون", "بروتون", "نووي", "مشع", "يورانيوم", "اشعاع"],
  dna: ["dna", "gene", "genes", "genetic", "evolution", "جين", "جينات", "وراثه", "تطور"],
  flask: ["chemistry", "chemical", "experiment", "lab", "laboratory", "acid", "potion", "كيمياء", "تجربه", "تجارب", "مختبر", "حمض", "مركب"],
  magnifier: ["search", "investigate", "discover", "clue", "detective", "examine", "بحث", "يبحث", "اكتشاف", "اكتشف", "تحقيق", "دليل", "فحص"],
  microscope: ["microscope", "microscopic", "مجهر", "ميكروسكوب"],
  lightbulb: ["idea", "ideas", "invent", "invention", "think of", "فكره", "افكار", "اختراع", "اخترع", "ابتكار"],
  brain: ["brain", "mind", "think", "thinking", "memory", "intelligence", "smart", "دماغ", "عقل", "تفكير", "يفكر", "ذاكره", "ذكاء", "ذكي"],
  heart: ["heart", "love", "loves", "feelings", "قلب", "حب", "يحب", "مشاعر"],
  book: ["book", "books", "read", "reading", "study", "learn", "story", "novel", "history", "كتاب", "كتب", "قراءه", "يقرا", "دراسه", "تعلم", "قصه", "روايه", "ملحمه", "تاريخ"],
  scroll: ["scroll", "manuscript", "ancient text", "parchment", "مخطوطه", "مخطوط", "لفافه", "وثيقه"],
  tablet: ["tablet", "clay", "cuneiform", "inscription", "لوح", "الواح", "طين", "مسماري", "نقش"],
  letter: ["letter", "message", "mail", "envelope", "send", "رساله", "رسائل", "بريد", "ارسل"],
  newspaper: ["news", "newspaper", "headline", "journal", "report", "خبر", "اخبار", "جريده", "صحيفه"],
  coin: ["coin", "coins", "penny", "cent", "gold", "dinar", "dirham", "عمله", "عملات", "قطعه نقديه", "ذهب", "دينار", "درهم"],
  money: ["money", "cash", "dollar", "dollars", "price", "cost", "pay", "salary", "budget", "مال", "اموال", "فلوس", "نقود", "دولار", "سعر", "تكلفه", "راتب", "ميزانيه"],
  moneybag: ["rich", "wealth", "profit", "earn", "income", "fortune", "treasure", "business", "ثروه", "غني", "اغنياء", "ربح", "ارباح", "دخل", "كنز", "تجاره"],
  chart: ["chart", "graph", "growth", "grow", "increase", "statistics", "data", "percent", "rate", "رسم بياني", "نمو", "زياده", "احصاء", "احصائيات", "بيانات", "نسبه", "معدل"],
  chart_down: ["decline", "drop", "crash", "loss", "decrease", "fell", "انخفاض", "هبوط", "خساره", "تراجع", "انهيار"],
  clock: ["time", "clock", "hour", "hours", "minute", "minutes", "seconds", "late", "وقت", "زمن", "ساعه", "ساعات", "دقيقه", "دقائق", "ثواني"],
  hourglass: ["wait", "waiting", "age", "ages", "millions of years", "billion years", "ancient times", "انتظار", "عمر", "عصور", "ملايين السنين", "مليار سنه"],
  calendar: ["year", "years", "date", "day", "days", "month", "century", "سنه", "سنوات", "عام", "اعوام", "تاريخ", "يوم", "ايام", "شهر", "قرن"],
  phone: ["phone", "smartphone", "mobile", "app", "apps", "call", "هاتف", "جوال", "موبايل", "تطبيق", "اتصال"],
  laptop: ["computer", "laptop", "internet", "website", "كمبيوتر", "حاسوب", "انترنت", "موقع"],
  gamepad: ["game", "games", "gaming", "play", "player", "controller", "لعبه", "العاب", "يلعب", "لاعب"],
  robot: ["robot", "robots", "ai", "artificial intelligence", "machine", "chatgpt", "claude", "روبوت", "ذكاء اصطناعي", "اله", "الات"],
  gear: ["machine", "engine", "mechanism", "industry", "technology", "build", "tool", "محرك", "اليه", "صناعه", "تقنيه", "تكنولوجيا", "يبني", "اداه"],
  key: ["key", "solution", "secret", "unlock", "answer", "مفتاح", "حل", "سر", "اسرار", "جواب"],
  lock: ["lock", "encrypt", "encryption", "cipher", "password", "secure", "security", "قفل", "تشفير", "شيفره", "كلمه السر", "امان", "حمايه"],
  crown: ["king", "queen", "crown", "kingdom", "royal", "empire", "emperor", "ruler", "throne", "ملك", "ملكه", "تاج", "مملكه", "امبراطوريه", "امبراطور", "حاكم", "عرش"],
  sword: ["sword", "fight", "battle", "weapon", "warrior", "kill", "سيف", "معركه", "قتال", "سلاح", "محارب", "قتل"],
  sword_crossed: ["war", "wars", "army", "armies", "conflict", "invasion", "حرب", "حروب", "جيش", "جيوش", "صراع", "غزو"],
  shield: ["protect", "protection", "defense", "safe", "shield", "حمايه", "دفاع", "يحمي", "درع", "امن"],
  flag: ["country", "countries", "nation", "flag", "state", "independence", "دوله", "دول", "بلد", "وطن", "علم", "استقلال"],
  trophy: ["win", "winner", "won", "victory", "success", "champion", "award", "best", "فوز", "فاز", "انتصار", "نجاح", "بطل", "جائزه", "افضل"],
  gift: ["gift", "reward", "bonus", "free", "surprise", "هديه", "مكافاه", "مجاني", "مفاجاه"],
  house: ["house", "home", "building", "live", "family", "بيت", "منزل", "مبنى", "يعيش", "عائله"],
  castle: ["castle", "palace", "fortress", "قلعه", "قصر", "حصن"],
  pyramid: ["pyramid", "pyramids", "egypt", "pharaoh", "هرم", "اهرام", "مصر", "فرعون", "الفراعنه"],
  ziggurat: ["sumer", "sumerian", "babylon", "mesopotamia", "uruk", "temple", "ziggurat", "سومر", "سومري", "بابل", "العراق القديم", "بلاد الرافدين", "اوروك", "معبد", "زقوره"],
  tree: ["tree", "trees", "forest", "plant", "plants", "nature", "شجره", "اشجار", "غابه", "نبات", "نباتات", "طبيعه"],
  palm: ["palm", "oasis", "dates", "نخله", "نخيل", "واحه", "تمر"],
  mountain: ["mountain", "mountains", "hill", "climb", "جبل", "جبال", "تل", "تسلق"],
  volcano: ["volcano", "volcanoes", "lava", "magma", "eruption", "بركان", "براكين", "حمم", "صهاره", "ثوران"],
  cloud: ["cloud", "clouds", "sky", "air", "سحاب", "سحابه", "غيوم", "سماء", "هواء"],
  rain: ["rain", "storm", "weather", "flood", "مطر", "امطار", "عاصفه", "طقس", "فيضان", "طوفان"],
  lightning: ["electricity", "electric", "energy", "power", "lightning", "voltage", "كهرباء", "طاقه", "قوه", "برق"],
  fire: ["fire", "flame", "hot", "heat", "burn", "burning", "temperature", "نار", "لهب", "حار", "حراره", "يحترق", "درجه الحراره"],
  water: ["water", "drop", "liquid", "drink", "ماء", "مياه", "قطره", "سائل", "يشرب"],
  wave: ["sea", "ocean", "oceans", "wave", "waves", "بحر", "بحار", "محيط", "محيطات", "موج", "امواج"],
  snowflake: ["cold", "ice", "snow", "freeze", "frozen", "winter", "برد", "بارد", "جليد", "ثلج", "شتاء", "متجمد"],
  rock: ["rock", "rocks", "stone", "stones", "crust", "layer", "layers", "lead", "metal", "iron", "رصاص", "معدن", "حديد", "صخر", "صخره", "صخور", "حجر", "حجاره", "قشره", "طبقات"],
  gem: ["diamond", "diamonds", "gem", "jewel", "crystal", "precious", "الماس", "جوهره", "جواهر", "بلور", "ثمين"],
  camera: ["camera", "photo", "picture", "video", "film", "movie", "كاميرا", "صوره", "صور", "فيديو", "فيلم"],
  music: ["music", "song", "sing", "sound", "melody", "موسيقى", "اغنيه", "يغني", "صوت", "لحن"],
  check: ["yes", "correct", "right", "true", "done", "نعم", "صحيح", "صح", "تم"],
  cross: ["wrong", "false", "mistake", "never", "خطا", "غلط", "خاطئ"],
  warning: ["danger", "dangerous", "risk", "warning", "careful", "threat", "خطر", "خطير", "مخاطر", "تحذير", "انتبه", "تهديد"],
  globe: ["geography", "travel", "continent", "continents", "map of the world", "سفر", "قاره", "قارات", "جغرافيا"],
  map: ["map", "maps", "route", "journey", "trip", "path", "خريطه", "خرائط", "طريق", "رحله", "مسار"],
  compass: ["direction", "north", "south", "explore", "explorer", "navigate", "اتجاه", "شمال", "جنوب", "استكشاف", "مستكشف"],
  apple: ["food", "eat", "apple", "fruit", "hungry", "طعام", "اكل", "ياكل", "تفاحه", "فاكهه", "جائع"],
  bomb: ["bomb", "explode", "explosive", "قنبله", "انفجار", "متفجر"],
  explosion: ["explosion", "boom", "bang", "crash", "impact", "انفجار", "اصطدام", "دوي"],
  magnet: ["magnet", "magnetic", "gravity", "attract", "pull", "مغناطيس", "مغناطيسي", "جاذبيه", "يجذب", "جذب"],
  battery: ["battery", "charge", "بطاريه", "شحن"],
  car: ["car", "cars", "drive", "vehicle", "road", "traffic", "سياره", "سيارات", "يقود", "شارع"],
  ship: ["ship", "boat", "sail", "navy", "port", "سفينه", "سفن", "قارب", "اسطول", "ميناء"],
  plane: ["plane", "airplane", "fly", "flight", "airport", "طائره", "طيران", "يطير", "مطار"],
  skull: ["death", "dead", "die", "died", "poison", "deadly", "موت", "ميت", "مات", "يموت", "سم", "قاتل"],
  ghost: ["ghost", "spirit", "soul", "afterlife", "immortal", "immortality", "شبح", "روح", "ارواح", "خلود", "خالد"],
  cat: ["cat", "cats", "قطه", "قطط"],
  dog: ["dog", "dogs", "كلب", "كلاب"],
  fish: ["fish", "fishing", "سمك", "سمكه", "اسماك"],
  bird: ["bird", "birds", "fly away", "طائر", "طيور", "عصفور"],
  bug: ["bug", "bugs", "glitch", "glitches", "debug", "debugging", "insect", "beetle", "خطا برمجي", "اخطاء", "حشره", "حشرات"],
  palette: ["graphics", "art", "artwork", "paint", "painting", "design", "colors", "colours", "artist", "رسم", "رسومات", "الوان", "تصميم", "فنان"],
  level_map: ["level", "levels", "مستوى", "مستويات", "stage", "stages", "roadmap", "journey", "مرحله", "مراحل", "خريطه الطريق", "رحله"],
  puzzle: ["puzzle", "piece", "pieces", "solve", "fits", "jigsaw", "لغز", "قطعه", "يحل"],
  target: ["target", "goal", "goals", "aim", "objective", "bullseye", "هدف", "اهداف", "غايه"],
  megaphone: ["announce", "announcement", "marketing", "promote", "advertise", "advertising", "megaphone", "اعلان", "تسويق", "يروج", "دعايه"],
  code_window: ["code", "coding", "program", "programming", "script", "software", "developer", "كود", "برمجه", "برنامج", "مبرمج"],
  bacteria: ["virus", "viruses", "bacteria", "germ", "germs", "disease", "infection", "cell", "cells", "فيروس", "فيروسات", "بكتيريا", "جرثومه", "مرض", "امراض", "عدوى", "خليه", "خلايا"],
  pill: ["medicine", "drug", "pill", "doctor", "hospital", "health", "cure", "دواء", "ادويه", "طبيب", "مستشفى", "صحه", "علاج"],
  oil: ["oil", "petrol", "fuel", "gas", "نفط", "بترول", "وقود", "غاز"],
  factory: ["factory", "factories", "pollution", "produce", "production", "مصنع", "مصانع", "تلوث", "انتاج", "ينتج"],
  speech: ["conversation", "chat", "dialogue", "محادثه", "حوار", "دردشه"],
  eye: ["see", "look", "watch", "eye", "eyes", "vision", "observe", "يرى", "شاف", "انظر", "عين", "عيون", "رؤيه", "يراقب"],
  arrow_up: ["more", "higher", "rise", "rising", "up", "اكثر", "اعلى", "ارتفاع", "يرتفع"],
  arrow_down: ["less", "lower", "fall", "falling", "down", "اقل", "ادنى", "ينخفض", "سقوط"],
  telescope: ["telescope", "astronomy", "astronomer", "observatory", "تلسكوب", "فلك", "فلكي", "مرصد"],
  satellite: ["satellite", "orbit", "nasa", "space station", "قمر صناعي", "مدار", "ناسا", "محطه فضائيه"],
  well: ["well", "spring", "zamzam", "groundwater", "بئر", "ابار", "زمزم", "نبع", "مياه جوفيه"],
  camel: ["camel", "camels", "caravan", "جمل", "جمال", "ابل", "قافله"],
  person_icon: ["person", "user", "customer", "شخص", "مستخدم", "زبون"],
  question: ["why", "how", "what", "question", "mystery", "لماذا", "ليش", "كيف", "ماذا", "سؤال", "لغز"],
};

// Cast hints: words that bring a specific character into a scene.
export const CAST_WORDS = {
  policeman: ["policeman", "police", "police officer", "شرطي", "شرطة"],
  scientist: ["scientist", "scientists", "researcher", "researchers", "professor", "physicist", "chemist", "doctor", "عالم", "علماء", "باحث", "باحثين", "باحثون", "بروفيسور", "فيزيائي", "دكتور"],
  king: ["king", "emperor", "ruler", "sultan", "ملك", "امبراطور", "سلطان", "حاكم", "خليفه"],
  soldier: ["soldier", "soldiers", "army", "troops", "جندي", "جنود", "جيش", "عسكر"],
  kid: ["child", "children", "kid", "kids", "boy", "طفل", "اطفال", "ولد", "صغير"],
  girl: ["girl", "daughter", "بنت", "فتاه"],
  woman: ["woman", "women", "mother", "wife", "queen", "امراه", "نساء", "ام", "زوجه", "ملكه"],
  worker: ["worker", "workers", "engineer", "builder", "عامل", "عمال", "مهندس", "بناء"],
  boss: ["boss", "ceo", "company", "manager", "businessman", "investor", "مدير", "شركه", "رجل اعمال", "مستثمر"],
  explorer: ["explorer", "expedition", "adventurer", "traveler", "مستكشف", "رحاله", "مغامر", "بعثه"],
  pharaoh: ["pharaoh", "فرعون"],
  bedouin: ["arab", "arabs", "bedouin", "tribe", "عرب", "العرب", "بدوي", "قبيله"],
  sage: ["sage", "philosopher", "scholar", "wise", "حكيم", "فيلسوف", "عالم دين", "شيخ"],
  wizard: ["wizard", "magic", "magician", "sorcerer", "ساحر", "سحر"],
  chef: ["chef", "cook", "kitchen", "طباخ", "طبخ", "مطبخ"],
  grandpa: ["grandfather", "old man", "elder", "جد", "عجوز", "شيخ كبير"],
  student: ["student", "students", "pupil", "طالب", "طلاب", "تلميذ"],
  adventurer: ["hiker", "camping", "explorer girl", "girl scout", "رحله تخييم", "مخيم", "مستكشفه", "مغامره"],
  bookworm: ["nerd", "geek", "bookworm", "reader", "programmer", "smart guy", "دافور", "قارئ", "مبرمج", "ذكي"],
  buddy: ["friend", "buddy", "brother", "صديق", "صاحب", "اخ"],
  berry: ["berry", "بيري"],
  ponytail_girl: ["sister", "little girl", "her friend", "اخت", "صديقتها"],
};

export const BG_WORDS = {
  village: ["village", "قرية"],
  ruins: ["ruins", "rubble", "انقاض", "اطلال"],
  hilltop: ["hilltop", "hill", "قمة تل", "تلة"],
  farm: ["farm", "farmland", "مزرعة", "مزارع"],
  office: ["office","workplace","مكتب","مكان العمل"],
  airport: ["airport","terminal","مطار"],
  forest: ["forest","woods","غابة"],
  garden: ["garden","حديقة","بستان"],
  kitchen: ["kitchen","مطبخ"],
  workshop: ["workshop","ورشة"],
  space: ["space", "universe", "galaxy", "star", "stars", "planet", "planets", "orbit", "black hole", "astronaut", "nasa", "فضاء", "الكون", "مجره", "نجم", "نجوم", "كوكب", "كواكب", "مدار", "ثقب اسود", "رائد فضاء"],
  sea: ["sea", "ocean", "beach", "island", "بحر", "محيط", "شاطئ", "جزيره"],
  desert: ["desert", "sand", "dune", "oasis", "صحراء", "رمل", "رمال", "كثبان", "واحه"],
  city: ["city", "cities", "town", "street", "مدينه", "مدن", "شارع"],
  night: ["night", "dark", "darkness", "ليل", "ليله", "ظلام"],
  underground: ["underground", "beneath", "below the surface", "deep inside", "core", "mantle", "crust", "تحت الارض", "باطن", "اعماق", "اللب", "الوشاح", "القشره"],
  lab: ["lab", "laboratory", "experiment", "مختبر", "تجربه", "معمل"],
  classroom: ["school", "class", "lesson", "teacher", "مدرسه", "صف", "درس", "معلم", "استاذ"],
  room: ["home", "room", "house", "بيت", "غرفه", "منزل"],
  sky: ["sky", "weather", "cloud", "fly", "سماء", "طقس", "غيوم", "يطير"],
};

export const CUES = {
  question: ["why", "how", "what", "who", "where", "which", "did you know", "ever wondered", "هل", "لماذا", "ليش", "كيف", "ماذا", "شنو", "من هو", "اين", "وين", "ما هو", "ما هي"],
  surprise: ["actually", "but", "however", "imagine", "wow", "surprisingly", "in fact", "turns out", "believe it or not", "لكن", "بس", "تخيل", "تخيلوا", "المفاجاه", "في الحقيقه", "الغريب", "صدق او لا تصدق", "ومع ذلك"],
  negative: ["problem", "danger", "die", "died", "death", "war", "sad", "bad", "unfortunately", "lost", "fail", "failed", "kill", "destroy", "مشكله", "خطر", "مات", "موت", "حرب", "حزين", "سيء", "للاسف", "خسر", "فشل", "قتل", "دمار", "يدمر"],
  positive: ["great", "amazing", "awesome", "best", "love", "win", "success", "happy", "beautiful", "easy", "رائع", "مذهل", "جميل", "افضل", "نجاح", "سعيد", "سهل", "حلو", "عظيم"],
  compare: [" vs ", "versus", " or ", "than", "compared", "difference", "between", "بين", " او ", "مقارنه", "مقابل", "الفرق", "من ال", "اكبر من", "اصغر من"],
  transform: ["becomes", "become", "turns into", "turned into", "changes into", "into a", "converted", "يتحول", "تحول", "يصبح", "اصبح", "صار", "يصير"],
  steps: ["first", "second", "third", "then", "next", "finally", "step", "اولا", "ثانيا", "ثالثا", "ثم", "بعدها", "بعد ذلك", "اخيرا", "خطوه"],
  impact: ["boom", "explode", "explosion", "crash", "hit", "smash", "انفجار", "يصطدم", "اصطدام", "ضرب", "بووم"],
  greeting: ["hello", "hi everyone", "welcome", "مرحبا", "اهلا", "السلام عليكم", "هلا"],
  ending: ["subscribe", "see you", "thanks for watching", "bye", "اشترك", "نشوفكم", "شكرا للمشاهده", "الى اللقاء", "مع السلامه"],
};

/* ---------------- normalisation & matching ---------------- */
const DIAC = /[ً-ٰٟـ]/g;
export function normAr(s) {
  return s
    .replace(DIAC, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي");
}
export function norm(s) {
  return normAr(String(s).toLowerCase())
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}
const AR_PREFIX = /^(وال|بال|فال|كال|لل|ال|و|ف|ب|ل|ك)(?=...)/;
const AR_SUFFIX = /(هما|كما|ات|ون|ين|ان|ها|هم|كم|نا|يه|ه|ي)$/;
export function stem(w) {
  if (/[؀-ۿ]/.test(w)) {
    let s = w;
    for (let i = 0; i < 2; i++) s = s.replace(AR_PREFIX, "");
    const t = s.replace(AR_SUFFIX, "");
    if (t.length >= 3) s = t;
    return s;
  }
  let s = w;
  if (s.length > 4 && s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.length > 4 && s.endsWith("es") && /(sh|ch|x|ss|o)es$/.test(s)) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  return s;
}

function compile(map) {
  const single = new Map(); // stem -> key
  const multi = []; // [tokens[], key]
  for (const [key, words] of Object.entries(map)) {
    for (const w of words) {
      const n = norm(w);
      if (!n) continue;
      const toks = n.split(" ");
      if (toks.length > 1) multi.push([toks.map(stem), key]);
      else if (!single.has(stem(n))) single.set(stem(n), key);
    }
  }
  multi.sort((a, b) => b[0].length - a[0].length);
  return { single, multi };
}
const C_PROPS = compile(PROP_WORDS);
const C_CAST = compile(CAST_WORDS);
const C_BG = compile(BG_WORDS);

/** Find lexicon hits in a list of word tokens. Returns [{key, index}] in order. */
function findHits(tokens, C) {
  const stems = tokens.map((t) => stem(norm(t)));
  const hits = [];
  const used = new Set();
  for (const [seq, key] of C.multi) {
    for (let i = 0; i + seq.length <= stems.length; i++) {
      if (seq.every((s, k) => stems[i + k] === s)) {
        hits.push({ key, index: i });
        for (let k = 0; k < seq.length; k++) used.add(i + k);
      }
    }
  }
  stems.forEach((s, i) => {
    if (used.has(i) || !s) return;
    let key = C.single.get(s);
    // English prefix match for long words (e.g. "volcanic" -> volcano)
    if (!key && /^[a-z]{6,}$/.test(s)) {
      for (const [k, v] of C.single) if (k.length >= 5 && s.startsWith(k.slice(0, Math.max(5, k.length - 1)))) { key = v; break; }
    }
    if (key) hits.push({ key, index: i });
  });
  return hits.sort((a, b) => a.index - b.index);
}

export const propHits = (tokens) => findHits(tokens, C_PROPS);
export const castHits = (tokens) => findHits(tokens, C_CAST);
export const bgHits = (tokens) => findHits(tokens, C_BG);

export function hasCue(text, cue) {
  const n = " " + norm(text) + " ";
  return CUES[cue].some((c) => {
    const k = norm(c);
    return k && (n.includes(" " + k + " ") || (c.startsWith(" ") && n.includes(c)));
  });
}
export function cueIndex(tokens, cue) {
  const ns = tokens.map((t) => norm(t));
  for (let i = 0; i < ns.length; i++) {
    for (const c of CUES[cue]) {
      const k = norm(c).split(" ");
      if (k.every((x, j) => ns[i + j] === x)) return i;
    }
  }
  return -1;
}

const STOP = new Set(norm("the a an and or but of to in on at for with is are was were be been it this that these those from by as we you they he she i our your their his her its has have had do does did not no so if then than there here what which who how why when where can will just very also more most some any all about into out up down over only like هذا هذه ذلك تلك هو هي هم نحن انت انتم في على من الى عن مع ثم او و لا لم لن ما ماذا كان كانت يكون تكون كل بعض قد لقد هل التي الذي الذين اللي هاي هذي شي يعني كذا عشان لان لكن بس جدا ايضا حتى عند").split(" "));
export const isStop = (w) => STOP.has(norm(w)) || norm(w).length < 3;
