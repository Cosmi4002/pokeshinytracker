// Evolution data for all Pokemon
// Based on https://pokemondb.net/evolution
// Format: pokemonId -> { prev: previous evolution(s), next: next evolution(s) }

export interface EvolutionData {
  prev: number[];    // Pokemon IDs that evolve into this Pokemon
  next: number[];   // Pokemon IDs this Pokemon evolves into
}

// Evolution chains for all Pokemon
// Key is the Pokemon ID (national dex number)
export const EVOLUTION_DATA: Record<number, EvolutionData> = {
  // Generation 1
  1: { prev: [], next: [2] },           // Bulbasaur -> Ivysaur
  2: { prev: [1], next: [3] },          // Ivysaur -> Venusaur
  3: { prev: [2], next: [] },           // Venusaur
  
  4: { prev: [], next: [5] },           // Charmander -> Charmeleon
  5: { prev: [4], next: [6] },         // Charmeleon -> Charizard
  6: { prev: [5], next: [] },           // Charizard
  
  7: { prev: [], next: [8] },           // Squirtle -> Wartortle
  8: { prev: [7], next: [9] },         // Wartortle -> Blastoise
  9: { prev: [8], next: [] },          // Blastoise
  
  10: { prev: [], next: [11] },         // Caterpie -> Metapod
  11: { prev: [10], next: [12] },      // Metapod -> Butterfree
  12: { prev: [11], next: [] },        // Butterfree
  
  13: { prev: [], next: [14] },         // Weedle -> Kakuna
  14: { prev: [13], next: [15] },      // Kakuna -> Beedrill
  15: { prev: [14], next: [] },        // Beedrill
  
  16: { prev: [], next: [17] },         // Pidgey -> Pidgeotto
  17: { prev: [16], next: [18] },      // Pidgeotto -> Pidgeot
  18: { prev: [17], next: [] },        // Pidgeot
  
  19: { prev: [], next: [20] },         // Rattata -> Raticate
  20: { prev: [19], next: [] },        // Raticate
  
  21: { prev: [], next: [22] },         // Spearow -> Fearow
  22: { prev: [21], next: [] },        // Fearow
  
  23: { prev: [], next: [24] },         // Ekans -> Arbok
  24: { prev: [23], next: [] },        // Arbok
  
  25: { prev: [], next: [26] },         // Pikachu -> Raichu
  26: { prev: [25], next: [] },        // Raichu
  
  27: { prev: [], next: [28] },         // Sandshrew -> Sandslash
  28: { prev: [27], next: [] },        // Sandslash
  
  29: { prev: [], next: [30] },         // Nidoran-F -> Nidorina
  30: { prev: [29], next: [31] },      // Nidorina -> Nidoqueen
  31: { prev: [30], next: [] },        // Nidoqueen
  
  32: { prev: [], next: [33] },         // Nidoran-M -> Nidorino
  33: { prev: [32], next: [34] },      // Nidorino -> Nidoking
  34: { prev: [33], next: [] },        // Nidoking
  
  35: { prev: [], next: [36] },         // Clefairy -> Clefable
  36: { prev: [35], next: [] },        // Clefable
  
  37: { prev: [], next: [38] },         // Vulpix -> Ninetales
  38: { prev: [37], next: [] },        // Ninetales
  
  39: { prev: [], next: [40] },         // Jigglypuff -> Wigglytuff
  40: { prev: [39], next: [] },        // Wigglytuff
  
  41: { prev: [], next: [42] },         // Zubat -> Golbat
  42: { prev: [41], next: [169] },     // Golbat -> Crobat
  43: { prev: [], next: [44] },         // Oddish -> Gloom
  44: { prev: [43], next: [45, 182] }, // Gloom -> Vileplume, Bellossom
  45: { prev: [44], next: [] },        // Vileplume
  46: { prev: [], next: [47] },         // Paras -> Parasect
  47: { prev: [46], next: [] },        // Parasect
  
  48: { prev: [], next: [49] },         // Venonat -> Venomoth
  49: { prev: [48], next: [] },        // Venomoth
  
  50: { prev: [], next: [51] },         // Diglett -> Dugtrio
  51: { prev: [50], next: [] },        // Dugtrio
  
  52: { prev: [], next: [53] },         // Meowth -> Persian
  53: { prev: [52], next: [] },        // Persian
  
  54: { prev: [], next: [55] },         // Psyduck -> Golduck
  55: { prev: [54], next: [] },        // Golduck
  
  56: { prev: [], next: [57] },         // Mankey -> Primeape
  57: { prev: [56], next: [] },        // Primeape
  
  58: { prev: [], next: [59] },         // Growlithe -> Arcanine
  59: { prev: [58], next: [] },        // Arcanine
  
  60: { prev: [], next: [61] },         // Poliwag -> Poliwhirl
  61: { prev: [60], next: [62, 117] },// Poliwhirl -> Poliwrath, Politoed
  62: { prev: [61], next: [] },        // Poliwrath
  
  63: { prev: [], next: [64] },         // Abra -> Kadabra
  64: { prev: [63], next: [65] },      // Kadabra -> Alakazam
  65: { prev: [64], next: [] },        // Alakazam
  
  66: { prev: [], next: [67] },         // Machop -> Machoke
  67: { prev: [66], next: [68] },      // Machoke -> Machamp
  68: { prev: [67], next: [] },        // Machamp
  
  69: { prev: [], next: [70] },         // Bellsprout -> Weepinbell
  70: { prev: [69], next: [71] },      // Weepinbell -> Victreebel
  71: { prev: [70], next: [] },        // Victreebel
  
  72: { prev: [], next: [73] },         // Tentacool -> Tentacruel
  73: { prev: [72], next: [] },        // Tentacruel
  
  74: { prev: [], next: [75] },         // Geodude -> Graveler
  75: { prev: [74], next: [76] },      // Graveler -> Golem
  76: { prev: [75], next: [] },        // Golem
  
  77: { prev: [], next: [78] },         // Ponyta -> Rapidash
  78: { prev: [77], next: [] },        // Rapidash
  
  79: { prev: [], next: [80, 199] },   // Slowpoke -> Slowbro, Slowking
  80: { prev: [79], next: [] },        // Slowbro
  81: { prev: [], next: [82] },        // Magnemite -> Magneton
  82: { prev: [81], next: [462] },     // Magneton -> Magnezone
  
  83: { prev: [], next: [] },           // Farfetch'd - doesn't evolve
  84: { prev: [], next: [85] },         // Doduo -> Dodrio
  85: { prev: [84], next: [] },        // Dodrio
  
  86: { prev: [], next: [87] },         // Seel -> Dewgong
  87: { prev: [86], next: [] },        // Dewgong
  
  88: { prev: [], next: [89] },         // Grimer -> Muk
  89: { prev: [88], next: [] },        // Muk
  
  90: { prev: [], next: [91] },         // Shellder -> Cloyster
  91: { prev: [90], next: [] },        // Cloyster
  
  92: { prev: [], next: [93] },         // Gastly -> Haunter
  93: { prev: [92], next: [94] },      // Haunter -> Gengar
  94: { prev: [93], next: [] },        // Gengar
  
  95: { prev: [], next: [208] },       // Onix -> Steelix
  96: { prev: [], next: [97] },        // Drowzee -> Hypno
  97: { prev: [96], next: [] },        // Hypno
  
  98: { prev: [], next: [99] },         // Krabby -> Kingler
  99: { prev: [98], next: [] },        // Kingler
  
  100: { prev: [], next: [101] },        // Voltorb -> Electrode
  101: { prev: [100], next: [] },      // Electrode
  
  102: { prev: [], next: [103] },       // Exeggcute -> Exeggutor
  103: { prev: [102], next: [] },      // Exeggutor
  
  104: { prev: [], next: [105] },       // Cubone -> Marowak
  105: { prev: [104], next: [] },      // Marowak
  
  106: { prev: [], next: [107] },       // Hitmonlee -> Hitmonchan
  107: { prev: [106], next: [] },      // Hitmonchan
  
  108: { prev: [], next: [463] },       // Lickitung -> Lickilicky
  109: { prev: [], next: [110] },       // Koffing -> Weezing
  110: { prev: [109], next: [] },      // Weezing
  
  111: { prev: [], next: [112] },       // Rhyhorn -> Rhydon
  112: { prev: [111], next: [464] },   // Rhydon -> Rhyperior
  113: { prev: [], next: [242] },       // Chansey -> Blissey
  114: { prev: [], next: [465] },       // Tangela -> Tangrowth
  
  115: { prev: [], next: [] },           // Kangaskhan - doesn't evolve
  116: { prev: [], next: [117] },       // Horsea -> Seadra
  117: { prev: [116, 61], next: [230] },// Seadra, Poliwhirl -> Kingdra
  118: { prev: [], next: [119] },       // Goldeen -> Seaking
  119: { prev: [118], next: [] },      // Seaking
  
  120: { prev: [], next: [121] },       // Staryu -> Starmie
  121: { prev: [120], next: [] },      // Starmie
  
  122: { prev: [], next: [476] },       // Mr. Mime -> Probopass
  123: { prev: [], next: [212] },       // Scyther -> Scizor
  124: { prev: [], next: [430] },       // Jynx -> Mismagius
  125: { prev: [], next: [466] },       // Electabuzz -> Electivire
  126: { prev: [], next: [467] },       // Magmar -> Magmortar
  127: { prev: [], next: [] },          // Pinsir - doesn't evolve
  128: { prev: [], next: [] },          // Tauros - doesn't evolve
  
  129: { prev: [], next: [130] },       // Magikarp -> Gyarados
  130: { prev: [129], next: [] },      // Gyarados
  131: { prev: [], next: [] },          // Lapras - doesn't evolve
  132: { prev: [], next: [] },          // Ditto - doesn't evolve
  133: { prev: [], next: [134, 135, 136, 196, 197, 470, 471, 700] }, // Eevee -> Vaporeon, Jolteon, Flareon, Espeon, Umbreon, Leafeon, Glaceon, Sylveon
  134: { prev: [133], next: [] },      // Vaporeon
  135: { prev: [133], next: [] },      // Jolteon
  136: { prev: [133], next: [] },      // Flareon
  
  137: { prev: [], next: [233] },       // Porygon -> Porygon2
  138: { prev: [], next: [139] },      // Omanyte -> Omastar
  139: { prev: [138], next: [] },      // Omastar
  140: { prev: [], next: [141] },      // Kabuto -> Kabutops
  141: { prev: [140], next: [] },      // Kabutops
  
  142: { prev: [], next: [] },         // Aerodactyl - doesn't evolve
  143: { prev: [], next: [] },         // Snorlax - doesn't evolve
  
  144: { prev: [], next: [] },         // Articuno - doesn't evolve
  145: { prev: [], next: [] },         // Zapdos - doesn't evolve
  146: { prev: [], next: [] },         // Moltres - doesn't evolve
  
  147: { prev: [], next: [148] },      // Dratini -> Dragonair
  148: { prev: [147], next: [149] },  // Dragonair -> Dragonite
  149: { prev: [148], next: [] },     // Dragonite
  
  150: { prev: [], next: [] },         // Mewtwo - doesn't evolve
  151: { prev: [], next: [] },         // Mew - doesn't evolve
  
  // Generation 2
  152: { prev: [], next: [153] },      // Chikorita -> Bayleef
  153: { prev: [152], next: [154] },  // Bayleef -> Meganium
  154: { prev: [153], next: [] },     // Meganium
  
  155: { prev: [], next: [156] },      // Cyndaquil -> Quilava
  156: { prev: [155], next: [157] },  // Quilava -> Typhlosion
  157: { prev: [156], next: [] },     // Typhlosion
  
  158: { prev: [], next: [159] },      // Totodile -> Croconaw
  159: { prev: [158], next: [160] },  // Croconaw -> Feraligatr
  160: { prev: [159], next: [] },     // Feraligatr
  
  161: { prev: [], next: [162] },      // Sentret -> Furret
  162: { prev: [161], next: [] },     // Furret
  
  163: { prev: [], next: [164] },      // Hoothoot -> Noctowl
  164: { prev: [163], next: [] },     // Noctowl
  
  165: { prev: [], next: [166] },      // Ledyba -> Ledian
  166: { prev: [165], next: [] },     // Ledian
  
  167: { prev: [], next: [168] },      // Spinarak -> Ariados
  168: { prev: [167], next: [169] },  // Ariados -> Crobat
  169: { prev: [168, 42], next: [] }, // Crobat
  
  170: { prev: [], next: [171] },      // Chinchou -> Lanturn
  171: { prev: [170], next: [] },     // Lanturn
  
  172: { prev: [], next: [26] },       // Pichu -> Pikachu
  173: { prev: [], next: [35] },       // Cleffa -> Clefairy
  174: { prev: [], next: [39] },       // Igglybuff -> Jigglypuff
  175: { prev: [], next: [176] },      // Togepi -> Togetic
  176: { prev: [175], next: [468] },  // Togetic -> Togekiss
  
  177: { prev: [], next: [178] },      // Natu -> Xatu
  178: { prev: [177], next: [] },     // Xatu
  
  179: { prev: [], next: [180] },      // Mareep -> Flaaffy
  180: { prev: [179], next: [181] },  // Flaaffy -> Ampharos
  181: { prev: [180], next: [] },     // Ampharos
  
  182: { prev: [44], next: [] },      // Bellossom
  183: { prev: [], next: [184] },      // Marill -> Azumarill
  184: { prev: [183], next: [] },     // Azumarill
  
  185: { prev: [], next: [438] },      // Sudowoodo
  186: { prev: [61], next: [] },      // Politoed
  187: { prev: [], next: [188] },      // Hoppip -> Skiploom
  188: { prev: [187], next: [189] },  // Skiploom -> Jumpluff
  189: { prev: [188], next: [] },     // Jumpluff
  
  190: { prev: [], next: [424] },      // Aipom -> Ambipom
  191: { prev: [], next: [192] },      // Sunkern -> Sunflora
  192: { prev: [191], next: [] },     // Sunflora
  
  193: { prev: [], next: [469] },      // Yanma -> Yanmega
  194: { prev: [], next: [195, 980] }, // Wooper -> Quagsire, Clodsire
  195: { prev: [194], next: [] },     // Quagsire
  
  196: { prev: [133], next: [] },      // Espeon
  197: { prev: [133], next: [] },      // Umbreon
  198: { prev: [], next: [430] },      // Murkrow -> Honchkrow
  199: { prev: [79], next: [] },      // Slowking
  
  200: { prev: [], next: [429] },      // Misdreavus -> Mismagius
  201: { prev: [], next: [] },         // Unown - doesn't evolve
  202: { prev: [], next: [360] },      // Wobbuffet -> Wynaut
  
  203: { prev: [], next: [] },         // Girafarig - doesn't evolve
  204: { prev: [], next: [205] },      // Pineco -> Forretress
  205: { prev: [204], next: [] },     // Forretress
  
  206: { prev: [], next: [] },         // Dunsparce - doesn't evolve
  207: { prev: [], next: [472] },      // Gligar -> Gliscor
  208: { prev: [95], next: [] },      // Steelix
  209: { prev: [], next: [210] },      // Snubbull -> Granbull
  210: { prev: [209], next: [] },     // Granbull
  
  211: { prev: [], next: [] },         // Qwilfish - doesn't evolve
  212: { prev: [123], next: [] },     // Scizor
  213: { prev: [], next: [] },         // Shuckle - doesn't evolve
  214: { prev: [], next: [] },         // Heracross - doesn't evolve
  215: { prev: [], next: [903] },      // Sneasel -> Sneasler
  
  216: { prev: [], next: [217] },      // Teddiursa -> Ursaring
  217: { prev: [216], next: [901] },   // Ursaring -> Ursaluna
  218: { prev: [], next: [219] },      // Slugma -> Magcargo
  219: { prev: [218], next: [] },     // Magcargo
  
  220: { prev: [], next: [221] },      // Swinub -> Piloswine
  221: { prev: [220], next: [473] },  // Piloswine -> Mamoswine
  222: { prev: [], next: [] },         // Corsola - doesn't evolve
  
  223: { prev: [], next: [224] },      // Remoraid -> Octillery
  224: { prev: [223], next: [] },     // Octillery
  225: { prev: [], next: [] },         // Delibird - doesn't evolve
  226: { prev: [], next: [] },         // Mantine - doesn't evolve
  227: { prev: [], next: [] },         // Skarmory - doesn't evolve
  
  228: { prev: [], next: [229] },      // Houndour -> Houndoom
  229: { prev: [228], next: [] },     // Houndoom
  230: { prev: [117], next: [] },     // Kingdra
  
  231: { prev: [], next: [232] },      // Phanpy -> Donphan
  232: { prev: [231], next: [] },     // Donphan
  233: { prev: [137], next: [474] },  // Porygon2 -> Porygon-Z
  
  234: { prev: [], next: [] },         // Stantler - doesn't evolve
  235: { prev: [], next: [] },         // Smeargle - doesn't evolve
  236: { prev: [], next: [106, 107, 237] }, // Tyrogue -> Hitmonlee, Hitmonchan, Hitmontop
  237: { prev: [236], next: [] },     // Hitmontop
  
  238: { prev: [], next: [124] },      // Smoochum -> Jynx
  239: { prev: [], next: [125] },      // Elekid -> Electabuzz
  240: { prev: [], next: [126] },      // Magby -> Magmar
  
  241: { prev: [], next: [] },         // Miltank - doesn't evolve
  242: { prev: [113], next: [] },      // Blissey
  
  // Generation 3
  252: { prev: [], next: [253] },      // Treecko -> Grovyle
  253: { prev: [252], next: [254] },   // Grovyle -> Sceptile
  254: { prev: [253], next: [] },     // Sceptile
  
  255: { prev: [], next: [256] },      // Torchic -> Combusken
  256: { prev: [255], next: [257] },   // Combusken -> Blaziken
  257: { prev: [256], next: [] },     // Blaziken
  
  258: { prev: [], next: [259] },      // Mudkip -> Marshtomp
  259: { prev: [258], next: [260] },   // Marshtomp -> Swampert
  260: { prev: [259], next: [] },     // Swampert
  
  261: { prev: [], next: [262] },      // Poochyena -> Mightyena
  262: { prev: [261], next: [] },     // Mightyena
  
  263: { prev: [], next: [264] },      // Zigzagoon -> Linoone
  264: { prev: [263], next: [] },     // Linoone
  
  265: { prev: [], next: [266, 268] }, // Wurmple -> Silcoon, Cascoon
  266: { prev: [265], next: [267] },  // Silcoon -> Beautifly
  267: { prev: [266], next: [] },     // Beautifly
  268: { prev: [265], next: [269] },  // Cascoon -> Dustox
  269: { prev: [268], next: [] },     // Dustox
  
  270: { prev: [], next: [271] },      // Lotad -> Lombre
  271: { prev: [270], next: [272] },  // Lombre -> Ludicolo
  272: { prev: [271], next: [] },     // Ludicolo
  
  273: { prev: [], next: [274] },      // Seedot -> Nuzleaf
  274: { prev: [273], next: [275] },  // Nuzleaf -> Shiftry
  275: { prev: [274], next: [] },     // Shiftry
  
  276: { prev: [], next: [277] },      // Taillow -> Swellow
  277: { prev: [276], next: [] },     // Swellow
  
  278: { prev: [], next: [279] },      // Wingull -> Pelipper
  279: { prev: [278], next: [] },     // Pelipper
  
  280: { prev: [], next: [281] },      // Ralts -> Kirlia
  281: { prev: [280], next: [282, 475] }, // Kirlia -> Gardevoir, Gallade
  282: { prev: [281], next: [] },     // Gardevoir
  
  283: { prev: [], next: [284] },      // Surskit -> Masquerain
  284: { prev: [283], next: [] },     // Masquerain
  
  285: { prev: [], next: [286] },      // Shroomish -> Breloom
  286: { prev: [285], next: [] },     // Breloom
  
  287: { prev: [], next: [288] },      // Slakoth -> Vigoroth
  288: { prev: [287], next: [289] },  // Vigoroth -> Slaking
  289: { prev: [288], next: [] },     // Slaking
  
  290: { prev: [], next: [291, 292] }, // Nincada -> Ninjask, Shedinja
  291: { prev: [290], next: [] },     // Ninjask
  292: { prev: [290], next: [] },     // Shedinja
  
  293: { prev: [], next: [294] },      // Whismur -> Loudred
  294: { prev: [293], next: [295] },  // Loudred -> Exploud
  295: { prev: [294], next: [] },     // Exploud
  
  296: { prev: [], next: [297] },      // Makuhita -> Hariyama
  297: { prev: [296], next: [] },     // Hariyama
  
  298: { prev: [], next: [183] },      // Azurill -> Marill
  299: { prev: [], next: [476] },      // Nosepass -> Probopass
  300: { prev: [], next: [301] },      // Skitty -> Delcatty
  301: { prev: [300], next: [] },     // Delcatty
  
  302: { prev: [], next: [] },         // Sableye - doesn't evolve
  303: { prev: [], next: [] },         // Mawile - doesn't evolve
  
  304: { prev: [], next: [305] },      // Aron -> Lairon
  305: { prev: [304], next: [306] },  // Lairon -> Aggron
  306: { prev: [305], next: [] },     // Aggron
  
  307: { prev: [], next: [308] },      // Meditite -> Medicham
  308: { prev: [307], next: [] },     // Medicham
  
  309: { prev: [], next: [310] },      // Electrike -> Manectric
  310: { prev: [309], next: [] },     // Manectric
  
  311: { prev: [], next: [] },         // Plusle - doesn't evolve
  312: { prev: [], next: [] },         // Minun - doesn't evolve
  313: { prev: [], next: [] },         // Volbeat - doesn't evolve
  314: { prev: [], next: [] },         // Illumise - doesn't evolve
  
  315: { prev: [], next: [407] },       // Roselia -> Roserade
  316: { prev: [], next: [317] },      // Gulpin -> Swalot
  317: { prev: [316], next: [] },     // Swalot
  
  318: { prev: [], next: [319] },      // Carvanha -> Sharpedo
  319: { prev: [318], next: [] },     // Sharpedo
  
  320: { prev: [], next: [321] },      // Wailmer -> Wailord
  321: { prev: [320], next: [] },     // Wailord
  
  322: { prev: [], next: [323] },      // Numel -> Camerupt
  323: { prev: [322], next: [] },     // Camerupt
  
  324: { prev: [], next: [] },         // Torkoal - doesn't evolve
  325: { prev: [], next: [326] },      // Spoink -> Grumpig
  326: { prev: [325], next: [] },     // Grumpig
  
  327: { prev: [], next: [] },         // Spinda - doesn't evolve
  328: { prev: [], next: [329] },      // Trapinch -> Vibrava
  329: { prev: [328], next: [330] },  // Vibrava -> Flygon
  330: { prev: [329], next: [] },     // Flygon
  
  331: { prev: [], next: [332] },      // Cacnea -> Cacturne
  332: { prev: [331], next: [] },     // Cacturne
  
  333: { prev: [], next: [334] },      // Swablu -> Altaria
  334: { prev: [333], next: [] },     // Altaria
  
  335: { prev: [], next: [] },         // Zangoose - doesn't evolve
  336: { prev: [], next: [] },         // Seviper - doesn't evolve
  337: { prev: [], next: [] },         // Lunatone - doesn't evolve
  338: { prev: [], next: [] },         // Solrock - doesn't evolve
  
  339: { prev: [], next: [340] },      // Barboach -> Whiscash
  340: { prev: [339], next: [] },     // Whiscash
  
  341: { prev: [], next: [342] },      // Corphish -> Crawdaunt
  342: { prev: [341], next: [] },     // Crawdaunt
  
  343: { prev: [], next: [344] },      // Baltoy -> Claydol
  344: { prev: [343], next: [] },     // Claydol
  
  345: { prev: [], next: [346] },      // Lileep -> Cradily
  346: { prev: [345], next: [] },     // Cradily
  
  347: { prev: [], next: [348] },      // Anorith -> Armaldo
  348: { prev: [347], next: [] },     // Armaldo
  
  349: { prev: [], next: [350] },      // Feebas -> Milotic
  350: { prev: [349], next: [] },     // Milotic
  
  351: { prev: [], next: [] },         // Castform - doesn't evolve
  352: { prev: [], next: [] },         // Kecleon - doesn't evolve
  
  353: { prev: [], next: [354] },      // Shuppet -> Banette
  354: { prev: [353], next: [] },     // Banette
  
  355: { prev: [], next: [356] },      // Duskull -> Dusclops
  356: { prev: [355], next: [477] },  // Dusclops -> Dusknoir
  357: { prev: [], next: [] },         // Tropius - doesn't evolve
  358: { prev: [], next: [] },         // Chimecho - doesn't evolve
  359: { prev: [], next: [] },         // Absol - doesn't evolve
  
  360: { prev: [202], next: [] },     // Wynaut
  361: { prev: [], next: [362, 478] }, // Snorunt -> Glalie, Froslass
  362: { prev: [361], next: [] },     // Glalie
  363: { prev: [], next: [364] },      // Spheal -> Sealeo
  364: { prev: [363], next: [365] },  // Sealeo -> Walrein
  365: { prev: [364], next: [] },     // Walrein
  
  366: { prev: [], next: [367, 368] }, // Clamperl -> Huntail, Gorebyss
  367: { prev: [366], next: [] },     // Huntail
  368: { prev: [366], next: [] },     // Gorebyss
  
  369: { prev: [], next: [] },         // Relicanth - doesn't evolve
  370: { prev: [], next: [] },         // Luvdisc - doesn't evolve
  
  371: { prev: [], next: [372] },      // Bagon -> Shelgon
  372: { prev: [371], next: [373] },  // Shelgon -> Salamence
  373: { prev: [372], next: [] },     // Salamence
  
  374: { prev: [], next: [375] },      // Beldum -> Metang
  375: { prev: [374], next: [376] },  // Metang -> Metagross
  376: { prev: [375], next: [] },     // Metagross
  
  // Generation 4
  387: { prev: [], next: [388] },      // Turtwig -> Grotle
  388: { prev: [387], next: [389] },  // Grotle -> Torterra
  389: { prev: [388], next: [] },     // Torterra
  
  390: { prev: [], next: [391] },      // Chimchar -> Monferno
  391: { prev: [390], next: [392] },  // Monferno -> Infernape
  392: { prev: [391], next: [] },     // Infernape
  
  393: { prev: [], next: [394] },      // Piplup -> Prinplup
  394: { prev: [393], next: [395] },  // Prinplup -> Empoleon
  395: { prev: [394], next: [] },     // Empoleon
  
  396: { prev: [], next: [397] },      // Starly -> Staravia
  397: { prev: [396], next: [398] },  // Staravia -> Staraptor
  398: { prev: [397], next: [] },     // Staraptor
  
  399: { prev: [], next: [400] },      // Bidoof -> Bibarel
  400: { prev: [399], next: [] },     // Bibarel
  
  401: { prev: [], next: [402] },      // Kricketot -> Kricketune
  402: { prev: [401], next: [] },     // Kricketune
  
  403: { prev: [], next: [404] },      // Shinx -> Luxio
  404: { prev: [403], next: [405] },  // Luxio -> Luxray
  405: { prev: [404], next: [] },     // Luxray
  
  406: { prev: [], next: [407] },      // Budew -> Roselia
  407: { prev: [406, 315], next: [] }, // Roserade
  
  408: { prev: [], next: [409] },      // Cranidos -> Rampardos
  409: { prev: [408], next: [] },     // Rampardos
  
  410: { prev: [], next: [411] },      // Shieldon -> Bastiodon
  411: { prev: [410], next: [] },     // Bastiodon
  
  412: { prev: [], next: [413, 414] }, // Burmy -> Wormadam, Mothim
  413: { prev: [412], next: [] },     // Wormadam
  414: { prev: [412], next: [] },     // Mothim
  
  415: { prev: [], next: [416] },      // Combee -> Vespiquen
  416: { prev: [415], next: [] },     // Vespiquen
  
  417: { prev: [], next: [] },         // Pachirisu - doesn't evolve
  418: { prev: [], next: [419] },      // Buizel -> Floatzel
  419: { prev: [418], next: [] },     // Floatzel
  
  420: { prev: [], next: [421] },      // Cherubi -> Cherrim
  421: { prev: [420], next: [] },     // Cherrim
  
  422: { prev: [], next: [423] },      // Shellos -> Gastrodon
  423: { prev: [422], next: [] },     // Gastrodon
  
  424: { prev: [190], next: [] },     // Ambipom
  425: { prev: [], next: [426] },      // Drifloon -> Drifblim
  426: { prev: [425], next: [] },     // Drifblim
  
  427: { prev: [], next: [428] },      // Buneary -> Lopunny
  428: { prev: [427], next: [] },     // Lopunny
  
  429: { prev: [200], next: [] },     // Mismagius
  430: { prev: [198, 124], next: [] }, // Honchkrow
  
  431: { prev: [], next: [432] },      // Glameow -> Purugly
  432: { prev: [431], next: [] },     // Purugly
  
  433: { prev: [], next: [439] },      // Chingling -> Mr. Mime
  434: { prev: [], next: [435] },      // Stunky -> Skuntank
  435: { prev: [434], next: [] },     // Skuntank
  
  436: { prev: [], next: [437] },      // Bronzor -> Bronzong
  437: { prev: [436], next: [] },     // Bronzong
  
  438: { prev: [185], next: [] },     // Sudowoodo
  439: { prev: [433], next: [] },     // Mr. Mime
  
  440: { prev: [], next: [113] },      // Happiny -> Chansey
  441: { prev: [], next: [] },         // Chatot - doesn't evolve
  442: { prev: [], next: [] },         // Spiritomb - doesn't evolve
  
  443: { prev: [], next: [444] },      // Gible -> Gabite
  444: { prev: [443], next: [445] },  // Gabite -> Garchomp
  445: { prev: [444], next: [] },     // Garchomp
  
  446: { prev: [], next: [143] },      // Munchlax -> Snorlax
  447: { prev: [], next: [448] },      // Riolu -> Lucario
  448: { prev: [447], next: [] },     // Lucario
  
  449: { prev: [], next: [450] },      // Hippopotas -> Hippowdon
  450: { prev: [449], next: [] },     // Hippowdon
  
  451: { prev: [], next: [452] },      // Skorupi -> Drapion
  452: { prev: [451], next: [] },     // Drapion
  
  453: { prev: [], next: [454] },      // Croagunk -> Toxicroak
  454: { prev: [453], next: [] },     // Toxicroak
  
  455: { prev: [], next: [] },         // Carnivine - doesn't evolve
  456: { prev: [], next: [457] },      // Finneon -> Lumineon
  457: { prev: [456], next: [] },     // Lumineon
  
  458: { prev: [], next: [226] },      // Mantyke -> Mantine
  459: { prev: [], next: [460] },      // Snover -> Abomasnow
  460: { prev: [459], next: [] },     // Abomasnow
  
  461: { prev: [], next: [] },         // Weavile - doesn't evolve
  462: { prev: [82], next: [] },      // Magnezone
  463: { prev: [108], next: [] },     // Lickilicky
  464: { prev: [112], next: [] },     // Rhyperior
  465: { prev: [114], next: [] },     // Tangrowth
  466: { prev: [125], next: [] },     // Electivire
  467: { prev: [126], next: [] },     // Magmortar
  468: { prev: [176], next: [] },     // Togekiss
  469: { prev: [193], next: [] },     // Yanmega
  470: { prev: [133], next: [] },     // Leafeon
  471: { prev: [133], next: [] },     // Glaceon
  472: { prev: [207], next: [] },     // Gliscor
  473: { prev: [221], next: [] },     // Mamoswine
  474: { prev: [233], next: [] },     // Porygon-Z
  475: { prev: [281], next: [] },     // Gallade
  476: { prev: [299, 122], next: [] }, // Probopass
  
  // Generation 5
  495: { prev: [], next: [496] },      // Snivy -> Servine
  496: { prev: [495], next: [497] },  // Servine -> Serperior
  497: { prev: [496], next: [] },     // Serperior
  
  498: { prev: [], next: [499] },      // Tepig -> Pignite
  499: { prev: [498], next: [500] },  // Pignite -> Emboar
  500: { prev: [499], next: [] },     // Emboar
  
  501: { prev: [], next: [502] },      // Oshawott -> Dewott
  502: { prev: [501], next: [503] },  // Dewott -> Samurott
  503: { prev: [502], next: [] },     // Samurott
  
  504: { prev: [], next: [505] },      // Patrat -> Watchog
  505: { prev: [504], next: [] },     // Watchog
  
  506: { prev: [], next: [507] },      // Lillipup -> Herdier
  507: { prev: [506], next: [508] },  // Herdier -> Stoutland
  508: { prev: [507], next: [] },     // Stoutland
  
  509: { prev: [], next: [510] },      // Purrloin -> Liepard
  510: { prev: [509], next: [] },     // Liepard
  
  511: { prev: [], next: [512] },      // Pansage -> Simisage
  512: { prev: [511], next: [] },     // Simisage
  513: { prev: [], next: [514] },      // Pansear -> Simisear
  514: { prev: [513], next: [] },     // Simisear
  515: { prev: [], next: [516] },      // Panpour -> Simipour
  516: { prev: [515], next: [] },     // Simipour
  
  517: { prev: [], next: [518] },      // Munna -> Musharna
  518: { prev: [517], next: [] },     // Musharna
  
  519: { prev: [], next: [520] },      // Pidove -> Tranquill
  520: { prev: [519], next: [521] },  // Tranquill -> Unfezant
  521: { prev: [520], next: [] },     // Unfezant
  
  522: { prev: [], next: [523] },      // Blitzle -> Zebstrika
  523: { prev: [522], next: [] },     // Zebstrika
  
  524: { prev: [], next: [525] },      // Roggenrola -> Boldore
  525: { prev: [524], next: [526] },  // Boldore -> Gigalith
  526: { prev: [525], next: [] },     // Gigalith
  
  527: { prev: [], next: [528] },      // Woobat -> Swoobat
  528: { prev: [527], next: [] },     // Swoobat
  
  529: { prev: [], next: [530] },      // Drilbur -> Excadrill
  530: { prev: [529], next: [] },     // Excadrill
  
  531: { prev: [], next: [] },         // Audino - doesn't evolve
  532: { prev: [], next: [533] },      // Timburr -> Gurdurr
  533: { prev: [532], next: [534] },  // Gurdurr -> Conkeldurr
  534: { prev: [533], next: [] },     // Conkeldurr
  
  535: { prev: [], next: [536] },      // Tympole -> Palpitoad
  536: { prev: [535], next: [537] },  // Palpitoad -> Seismitoad
  537: { prev: [536], next: [] },     // Seismitoad
  
  538: { prev: [], next: [539] },      // Throh -> Sawk
  539: { prev: [538], next: [] },     // Sawk
  
  540: { prev: [], next: [541] },      // Sewaddle -> Swadloon
  541: { prev: [540], next: [542] },  // Swadloon -> Leavanny
  542: { prev: [541], next: [] },     // Leavanny
  
  543: { prev: [], next: [544] },      // Venipede -> Whirlipede
  544: { prev: [543], next: [545] },  // Whirlipede -> Scolipede
  545: { prev: [544], next: [] },     // Scolipede
  
  546: { prev: [], next: [547] },      // Cottonee -> Whimsicott
  547: { prev: [546], next: [] },     // Whimsicott
  
  548: { prev: [], next: [549] },      // Petilil -> Lilligant
  549: { prev: [548], next: [] },     // Lilligant
  
  550: { prev: [], next: [] },         // Basculin - doesn't evolve
  551: { prev: [], next: [552] },      // Sandile -> Krokorok
  552: { prev: [551], next: [553] },  // Krokoroo -> Krookodile
  553: { prev: [552], next: [] },     // Krookodile
  
  554: { prev: [], next: [555] },      // Darumaka -> Darmanitan
  555: { prev: [554], next: [] },     // Darmanitan
  
  556: { prev: [], next: [] },         // Maractus - doesn't evolve
  557: { prev: [], next: [558] },      // Dwebble -> Crustle
  558: { prev: [557], next: [] },     // Crustle
  
  559: { prev: [], next: [560] },      // Scraggy -> Scrafty
  560: { prev: [559], next: [] },     // Scrafty
  
  561: { prev: [], next: [] },         // Sigilyph - doesn't evolve
  562: { prev: [], next: [563] },      // Yamask -> Cofagrigus
  563: { prev: [562], next: [] },     // Cofagrigus
  
  564: { prev: [], next: [565] },      // Tirtouga -> Carracosta
  565: { prev: [564], next: [] },     // Carracosta
  
  566: { prev: [], next: [567] },      // Archen -> Archeops
  567: { prev: [566], next: [] },     // Archeops
  
  568: { prev: [], next: [569] },      // Trubbish -> Garbodor
  569: { prev: [568], next: [] },     // Garbodor
  
  570: { prev: [], next: [571] },      // Zorua -> Zoroark
  571: { prev: [570], next: [] },     // Zoroark
  
  572: { prev: [], next: [573] },      // Minccino -> Cinccino
  573: { prev: [572], next: [] },     // Cinccino
  
  574: { prev: [], next: [575] },      // Gothita -> Gothorita
  575: { prev: [574], next: [576] },  // Gothorita -> Gothitelle
  576: { prev: [575], next: [] },     // Gothitelle
  
  577: { prev: [], next: [578] },      // Solosis -> Duosion
  578: { prev: [577], next: [579] },  // Duosion -> Reuniclus
  579: { prev: [578], next: [] },     // Reuniclus
  
  580: { prev: [], next: [581] },      // Ducklett -> Swanna
  581: { prev: [580], next: [] },     // Swanna
  
  582: { prev: [], next: [583] },      // Vanillite -> Vanillish
  583: { prev: [582], next: [584] },  // Vanillish -> Vanilluxe
  584: { prev: [583], next: [] },     // Vanilluxe
  
  585: { prev: [], next: [586] },      // Deerling -> Sawsbuck
  586: { prev: [585], next: [] },     // Sawsbuck
  
  587: { prev: [], next: [] },         // Emolga - doesn't evolve
  588: { prev: [], next: [589] },      // Karrablast -> Escavalier
  589: { prev: [588], next: [] },     // Escavalier
  
  590: { prev: [], next: [591] },      // Foongus -> Amoonguss
  591: { prev: [590], next: [] },     // Amoonguss
  
  592: { prev: [], next: [593] },      // Frillish -> Jellicent
  593: { prev: [592], next: [] },     // Jellicent
  
  594: { prev: [], next: [] },         // Alomomola - doesn't evolve
  595: { prev: [], next: [596] },      // Joltik -> Galvantula
  596: { prev: [595], next: [] },     // Galvantula
  
  597: { prev: [], next: [598] },      // Ferroseed -> Ferrothorn
  598: { prev: [597], next: [] },     // Ferrothorn
  
  599: { prev: [], next: [600] },      // Klink -> Klang
  600: { prev: [599], next: [601] },  // Klang -> Klinklang
  601: { prev: [600], next: [] },     // Klinklang
  
  602: { prev: [], next: [603] },      // Tynamo -> Eelektrik
  603: { prev: [602], next: [604] },  // Eelektrik -> Eelektross
  604: { prev: [603], next: [] },     // Eelektross
  
  605: { prev: [], next: [606] },      // Elgyem -> Beheeyem
  606: { prev: [605], next: [] },     // Beheeyem
  
  607: { prev: [], next: [608] },      // Litwick -> Lampent
  608: { prev: [607], next: [609] },  // Lampent -> Chandelure
  609: { prev: [608], next: [] },     // Chandelure
  
  610: { prev: [], next: [611] },      // Axew -> Fraxure
  611: { prev: [610], next: [612] },  // Fraxure -> Haxorus
  612: { prev: [611], next: [] },     // Haxorus
  
  613: { prev: [], next: [614] },      // Cubchoo -> Beartic
  614: { prev: [613], next: [] },     // Beartic
  
  615: { prev: [], next: [] },         // Cryogonal - doesn't evolve
  616: { prev: [], next: [617] },      // Shelmet -> Accelgor
  617: { prev: [616], next: [] },     // Accelgor
  
  618: { prev: [], next: [] },         // Stunfisk - doesn't evolve
  619: { prev: [], next: [620] },      // Mienfoo -> Mienshao
  620: { prev: [619], next: [] },     // Mienshao
  
  621: { prev: [], next: [] },         // Druddigon - doesn't evolve
  622: { prev: [], next: [623] },      // Golett -> Golurk
  623: { prev: [622], next: [] },     // Golurk
  
  624: { prev: [], next: [625] },      // Pawniard -> Bisharp
  625: { prev: [624], next: [] },     // Bisharp
  
  626: { prev: [], next: [] },         // Bouffalant - doesn't evolve
  627: { prev: [], next: [628] },      // Rufflet -> Braviary
  628: { prev: [627], next: [] },     // Braviary
  
  629: { prev: [], next: [630] },      // Vullaby -> Mandibuzz
  630: { prev: [629], next: [] },     // Mandibuzz
  
  631: { prev: [], next: [] },         // Heatmor - doesn't evolve
  632: { prev: [], next: [] },         // Durant - doesn't evolve
  
  633: { prev: [], next: [634] },      // Deino -> Zweilous
  634: { prev: [633], next: [635] },  // Zweilous -> Hydreigon
  635: { prev: [634], next: [] },     // Hydreigon
  
  636: { prev: [], next: [637] },      // Larvesta -> Volcarona
  637: { prev: [636], next: [] },     // Volcarona
  
  // Generation 6
  650: { prev: [], next: [651] },      // Chespin -> Quilladin
  651: { prev: [650], next: [652] },  // Quilladin -> Chesnaught
  652: { prev: [651], next: [] },     // Chesnaught
  
  653: { prev: [], next: [654] },      // Fennekin -> Braixen
  654: { prev: [653], next: [655] },  // Braixen -> Delphox
  655: { prev: [654], next: [] },     // Delphox
  
  656: { prev: [], next: [657] },      // Froakie -> Frogadier
  657: { prev: [656], next: [658] },  // Frogadier -> Greninja
  658: { prev: [657], next: [] },     // Greninja
  
  659: { prev: [], next: [660] },      // Bunnelby -> Diggersby
  660: { prev: [659], next: [] },     // Diggersby
  
  661: { prev: [], next: [662] },      // Fletchling -> Fletchinder
  662: { prev: [661], next: [663] },  // Fletchinder -> Talonflame
  663: { prev: [662], next: [] },     // Talonflame
  
  664: { prev: [], next: [665] },      // Scatterbug -> Spewpa
  665: { prev: [664], next: [666] },  // Spewpa -> Vivillon
  666: { prev: [665], next: [] },     // Vivillon
  
  667: { prev: [], next: [668] },      // Litleo -> Pyroar
  668: { prev: [667], next: [] },     // Pyroar
  
  669: { prev: [], next: [670] },      // Flabebe -> Floette
  670: { prev: [669], next: [671] },  // Floette -> Florges
  671: { prev: [670], next: [] },     // Florges
  
  672: { prev: [], next: [673] },      // Skiddo -> Gogoat
  673: { prev: [672], next: [] },     // Gogoat
  
  674: { prev: [], next: [675] },      // Pancham -> Pangoro
  675: { prev: [674], next: [] },     // Pangoro
  
  676: { prev: [], next: [] },         // Furfrou - doesn't evolve
  677: { prev: [], next: [678] },      // Espurr -> Meowstic
  678: { prev: [677], next: [] },     // Meowstic
  
  679: { prev: [], next: [680] },      // Honedge -> Doublade
  680: { prev: [679], next: [681] },  // Doublade -> Aegislash
  681: { prev: [680], next: [] },     // Aegislash
  
  682: { prev: [], next: [683] },      // Spritzee -> Aromatisse
  683: { prev: [682], next: [] },     // Aromatisse
  
  684: { prev: [], next: [685] },      // Swirlix -> Slurpuff
  685: { prev: [684], next: [] },     // Slurpuff
  
  686: { prev: [], next: [687] },      // Inkay -> Malamar
  687: { prev: [686], next: [] },     // Malamar
  
  688: { prev: [], next: [689] },      // Binacle -> Barbaracle
  689: { prev: [688], next: [] },     // Barbaracle
  
  690: { prev: [], next: [691] },      // Skrelp -> Dragalge
  691: { prev: [690], next: [] },     // Dragalge
  
  692: { prev: [], next: [693] },      // Clauncher -> Clawitzer
  693: { prev: [692], next: [] },     // Clawitzer
  
  694: { prev: [], next: [695] },      // Helioptile -> Heliolisk
  695: { prev: [694], next: [] },     // Heliolisk
  
  696: { prev: [], next: [697] },      // Tyrunt -> Tyrantrum
  697: { prev: [696], next: [] },     // Tyrantrum
  
  698: { prev: [], next: [699] },      // Amaura -> Aurorus
  699: { prev: [698], next: [] },     // Aurorus
  
  700: { prev: [133], next: [] },     // Sylveon
  
  701: { prev: [], next: [] },         // Hawlucha - doesn't evolve
  702: { prev: [], next: [] },         // Dedenne - doesn't evolve
  703: { prev: [], next: [] },         // Carbink - doesn't evolve
  
  704: { prev: [], next: [705] },      // Goomy -> Sliggoo
  705: { prev: [704], next: [706] },  // Sliggoo -> Goodra
  706: { prev: [705], next: [] },     // Goodra
  
  707: { prev: [], next: [] },         // Klefki - doesn't evolve
  708: { prev: [], next: [709] },      // Phantump -> Trevenant
  709: { prev: [708], next: [] },     // Trevenant
  
  710: { prev: [], next: [711] },      // Pumpkaboo -> Gourgeist
  711: { prev: [710], next: [] },     // Gourgeist
  
  712: { prev: [], next: [713] },      // Bergmite -> Avalugg
  713: { prev: [712], next: [] },     // Avalugg
  
  714: { prev: [], next: [715] },      // Noibat -> Noivern
  715: { prev: [714], next: [] },     // Noivern
  
  // Generation 7
  722: { prev: [], next: [723] },      // Rowlet -> Dartrix
  723: { prev: [722], next: [724] },  // Dartrix -> Decidueye
  724: { prev: [723], next: [] },     // Decidueye
  
  725: { prev: [], next: [726] },      // Litten -> Torracat
  726: { prev: [725], next: [727] },  // Torracat -> Incineroar
  727: { prev: [726], next: [] },     // Incineroar
  
  728: { prev: [], next: [729] },      // Popplio -> Brionne
  729: { prev: [728], next: [730] },  // Brionne -> Primarina
  730: { prev: [729], next: [] },     // Primarina
  
  731: { prev: [], next: [732] },      // Pikipek -> Trumbeak
  732: { prev: [731], next: [733] },  // Trumbeak -> Toucannon
  733: { prev: [732], next: [] },     // Toucannon
  
  734: { prev: [], next: [735] },      // Yungoos -> Gumshoos
  735: { prev: [734], next: [] },     // Gumshoos
  
  736: { prev: [], next: [737] },      // Grubbin -> Charjabug
  737: { prev: [736], next: [738] },  // Charjabug -> Vikavolt
  738: { prev: [737], next: [] },     // Vikavolt
  
  739: { prev: [], next: [740] },      // Crabrawler -> Crabominable
  740: { prev: [739], next: [] },     // Crabominable
  
  741: { prev: [], next: [] },         // Oricorio - doesn't evolve
  742: { prev: [], next: [743] },      // Cutiefly -> Ribombee
  743: { prev: [742], next: [] },     // Ribombee
  
  744: { prev: [], next: [745] },      // Rockruff -> Lycanroc
  745: { prev: [744], next: [] },     // Lycanroc
  
  746: { prev: [], next: [] },         // Wishiwashi - doesn't evolve
  747: { prev: [], next: [748] },      // Mareanie -> Toxapex
  748: { prev: [747], next: [] },     // Toxapex
  
  749: { prev: [], next: [750] },      // Mudbray -> Mudsdale
  750: { prev: [749], next: [] },     // Mudsdale
  
  751: { prev: [], next: [752] },      // Dewpider -> Araquanid
  752: { prev: [751], next: [] },     // Araquanid
  
  753: { prev: [], next: [754] },      // Fomantis -> Lurantis
  754: { prev: [753], next: [] },     // Lurantis
  
  755: { prev: [], next: [756] },      // Morelull -> Shiinotic
  756: { prev: [755], next: [] },     // Shiinotic
  
  757: { prev: [], next: [758] },      // Salandit -> Salazzle
  758: { prev: [757], next: [] },     // Salazzle
  
  759: { prev: [], next: [760] },      // Stufful -> Bewear
  760: { prev: [759], next: [] },     // Bewear
  
  761: { prev: [], next: [762] },      // Bounsweet -> Steenee
  762: { prev: [761], next: [763] },  // Steenee -> Tsareena
  763: { prev: [762], next: [] },     // Tsareena
  
  764: { prev: [], next: [] },         // Comfey - doesn't evolve
  765: { prev: [], next: [] },         // Oranguru - doesn't evolve
  766: { prev: [], next: [] },         // Passimian - doesn't evolve
  
  767: { prev: [], next: [768] },      // Wimpod -> Golisopod
  768: { prev: [767], next: [] },     // Golisopod
  
  769: { prev: [], next: [770] },      // Sandygast -> Palossand
  770: { prev: [769], next: [] },     // Palossand
  
  771: { prev: [], next: [] },         // Pyukumuku - doesn't evolve
  772: { prev: [], next: [773] },      // Type: Null -> Silvally
  773: { prev: [772], next: [] },     // Silvally
  
  774: { prev: [], next: [] },         // Minior - doesn't evolve
  775: { prev: [], next: [] },         // Komala - doesn't evolve
  776: { prev: [], next: [] },         // Turtonator - doesn't evolve
  777: { prev: [], next: [] },         // Togedemaru - doesn't evolve
  778: { prev: [], next: [] },         // Mimikyu - doesn't evolve
  779: { prev: [], next: [] },         // Bruxish - doesn't evolve
  780: { prev: [], next: [] },         // Drampa - doesn't evolve
  781: { prev: [], next: [] },         // Dhelmise - doesn't evolve
  
  782: { prev: [], next: [783] },      // Jangmo-o -> Hakamo-o
  783: { prev: [782], next: [784] },  // Hakamo-o -> Kommo-o
  784: { prev: [783], next: [] },     // Kommo-o
  
  // Generation 8
  810: { prev: [], next: [811] },      // Grookey -> Thwackey
  811: { prev: [810], next: [812] },  // Thwackey -> Rillaboom
  812: { prev: [811], next: [] },     // Rillaboom
  
  813: { prev: [], next: [814] },      // Scorbunny -> Raboot
  814: { prev: [813], next: [815] },  // Raboot -> Cinderace
  815: { prev: [814], next: [] },     // Cinderace
  
  816: { prev: [], next: [817] },      // Sobble -> Drizzile
  817: { prev: [816], next: [818] },  // Drizzile -> Inteleon
  818: { prev: [817], next: [] },     // Inteleon
  
  819: { prev: [], next: [820] },      // Skwovet -> Greedent
  820: { prev: [819], next: [] },     // Greedent
  
  821: { prev: [], next: [822] },      // Rookidee -> Corvisquire
  822: { prev: [821], next: [823] },  // Corvisquire -> Corviknight
  823: { prev: [822], next: [] },     // Corviknight
  
  824: { prev: [], next: [825] },      // Blipbug -> Dottler
  825: { prev: [824], next: [826] },  // Dottler -> Orbeetle
  826: { prev: [825], next: [] },     // Orbeetle
  
  827: { prev: [], next: [828] },      // Nickit -> Thievul
  828: { prev: [827], next: [] },     // Thievul
  
  829: { prev: [], next: [830] },      // Gossifleur -> Eldegoss
  830: { prev: [829], next: [] },     // Eldegoss
  
  831: { prev: [], next: [832] },      // Wooloo -> Dubwool
  832: { prev: [831], next: [] },     // Dubwool
  
  833: { prev: [], next: [834] },      // Chewtle -> Drednaw
  834: { prev: [833], next: [] },     // Drednaw
  
  835: { prev: [], next: [836] },      // Yamper -> Boltund
  836: { prev: [835], next: [] },     // Boltund
  
  837: { prev: [], next: [838] },      // Rolycoly -> Carkol
  838: { prev: [837], next: [839] },  // Carkol -> Coalossal
  839: { prev: [838], next: [] },     // Coalossal
  
  840: { prev: [], next: [841, 842] }, // Applin -> Flapple, Appletun
  841: { prev: [840], next: [] },     // Flapple
  842: { prev: [840], next: [] },     // Appletun
  
  843: { prev: [], next: [844] },      // Silicobra -> Sandaconda
  844: { prev: [843], next: [] },     // Sandaconda
  
  845: { prev: [], next: [] },         // Cramorant - doesn't evolve
  846: { prev: [], next: [847] },      // Arrokuda -> Barraskewda
  847: { prev: [846], next: [] },     // Barraskewda
  
  848: { prev: [], next: [849] },      // Toxel -> Toxtricity
  849: { prev: [848], next: [] },     // Toxtricity
  
  850: { prev: [], next: [851] },      // Sizzlipede -> Centiskorch
  851: { prev: [850], next: [] },     // Centiskorch
  
  852: { prev: [], next: [853] },      // Clobbopus -> Grapploct
  853: { prev: [852], next: [] },     // Grapploct
  
  854: { prev: [], next: [855] },      // Sinistea -> Polteageist
  855: { prev: [854], next: [] },     // Polteageist
  
  856: { prev: [], next: [857] },      // Hatenna -> Hattrem
  857: { prev: [856], next: [858] },  // Hattrem -> Hatterene
  858: { prev: [857], next: [] },     // Hatterene
  
  859: { prev: [], next: [860] },      // Impidimp -> Morgrem
  860: { prev: [859], next: [861] },  // Morgrem -> Grimmsnarl
  861: { prev: [860], next: [] },     // Grimmsnarl
  
  862: { prev: [], next: [] },         // Obstagoon - doesn't evolve
  863: { prev: [], next: [] },         // Perrserker - doesn't evolve
  864: { prev: [], next: [] },         // Cursola - doesn't evolve
  865: { prev: [], next: [] },         // Sirfetch'd - doesn't evolve
  866: { prev: [], next: [] },         // Mr. Rime - doesn't evolve
  867: { prev: [], next: [] },         // Runerigus - doesn't evolve
  
  868: { prev: [], next: [869] },      // Milcery -> Alcremie
  869: { prev: [868], next: [] },     // Alcremie
  
  870: { prev: [], next: [] },         // Falinks - doesn't evolve
  871: { prev: [], next: [] },         // Pincurchin - doesn't evolve
  872: { prev: [], next: [873] },      // Snom -> Frosmoth
  873: { prev: [872], next: [] },     // Frosmoth
  
  874: { prev: [], next: [] },         // Stonjourner - doesn't evolve
  875: { prev: [], next: [] },         // Eiscue - doesn't evolve
  876: { prev: [], next: [] },         // Indeedee - doesn't evolve
  877: { prev: [], next: [] },         // Morpeko - doesn't evolve
  
  878: { prev: [], next: [879] },      // Cufant -> Copperajah
  879: { prev: [878], next: [] },     // Copperajah
  
  880: { prev: [], next: [] },         // Dracozolt - doesn't evolve
  881: { prev: [], next: [] },         // Arctozolt - doesn't evolve
  882: { prev: [], next: [] },         // Dracovish - doesn't evolve
  883: { prev: [], next: [] },         // Arctovish - doesn't evolve
  
  884: { prev: [], next: [] },         // Duraludon - doesn't evolve
  885: { prev: [], next: [886] },      // Dreepy -> Drakloak
  886: { prev: [885], next: [887] },  // Drakloak -> Dragapult
  887: { prev: [886], next: [] },     // Dragapult
  
  888: { prev: [], next: [] },         // Zacian - doesn't evolve
  889: { prev: [], next: [] },         // Zamazenta - doesn't evolve
  890: { prev: [], next: [] },         // Eternatus - doesn't evolve
  891: { prev: [], next: [892] },      // Kubfu -> Urshifu
  892: { prev: [891], next: [] },     // Urshifu
  
  893: { prev: [], next: [] },         // Zarude - doesn't evolve
  894: { prev: [], next: [] },         // Regieleki - doesn't evolve
  895: { prev: [], next: [] },         // Regidrago - doesn't evolve
  896: { prev: [], next: [] },         // Glastrier - doesn't evolve
  897: { prev: [], next: [] },         // Spectrier - doesn't evolve
  898: { prev: [], next: [] },         // Calyrex - doesn't evolve
  
  899: { prev: [], next: [900] },      // Wyrdeer -> Kleavor
  900: { prev: [899], next: [901] },  // Kleavor -> Ursaluna
  901: { prev: [900, 217], next: [] }, // Ursaluna
  
  902: { prev: [], next: [984] },      // Basculegion -> Fling
  903: { prev: [215], next: [] },     // Sneasler
  904: { prev: [], next: [] },         // Overqwil - doesn't evolve
  905: { prev: [], next: [] },         // Enamorus - doesn't evolve
  
  // Generation 9
  906: { prev: [], next: [907] },      // Sprigatito -> Floragato
  907: { prev: [906], next: [908] },  // Floragato -> Meowscarada
  908: { prev: [907], next: [] },     // Meowscarada
  
  909: { prev: [], next: [910] },      // Fuecoco -> Crocalor
  910: { prev: [909], next: [911] },  // Crocalor -> Skeledirge
  911: { prev: [910], next: [] },     // Skeledirge
  
  912: { prev: [], next: [913] },      // Quaxly -> Quaxwell
  913: { prev: [912], next: [914] },  // Quaxwell -> Quaquaval
  914: { prev: [913], next: [] },     // Quaquaval
  
  915: { prev: [], next: [916] },      // Lechonk -> Oinkologne
  916: { prev: [915], next: [] },     // Oinkologne
  
  917: { prev: [], next: [918] },      // Tarountula -> Spidops
  918: { prev: [917], next: [] },     // Spidops
  
  919: { prev: [], next: [920] },      // Nymble -> Lokix
  920: { prev: [919], next: [] },     // Lokix
  
  921: { prev: [], next: [922] },      // Pawmi -> Pawmo
  922: { prev: [921], next: [923] },  // Pawmo -> Pawmot
  923: { prev: [922], next: [] },     // Pawmot
  
  924: { prev: [], next: [925] },      // Tandemaus -> Maushold
  925: { prev: [924], next: [] },     // Maushold
  
  926: { prev: [], next: [927] },      // Fidough -> Dachsbun
  927: { prev: [926], next: [] },     // Dachsbun
  
  928: { prev: [], next: [929] },      // Smoliv -> Dolliv
  929: { prev: [928], next: [930] },  // Dolliv -> Arboliva
  930: { prev: [929], next: [] },     // Arboliva
  
  931: { prev: [], next: [] },         // Squawkabilly - doesn't evolve
  932: { prev: [], next: [933] },      // Nacli -> Naclstack
  933: { prev: [932], next: [934] },  // Naclstack -> Garganacl
  934: { prev: [933], next: [] },     // Garganacl
  
  935: { prev: [], next: [936, 937] }, // Charcadet -> Armarouge, Ceruledge
  936: { prev: [935], next: [] },     // Armarouge
  937: { prev: [935], next: [] },     // Ceruledge
  
  938: { prev: [], next: [939] },      // Tadbulb -> Bellibolt
  939: { prev: [938], next: [] },     // Bellibolt
  
  940: { prev: [], next: [941] },      // Wattrel -> Kilowattrel
  941: { prev: [940], next: [] },     // Kilowattrel
  
  942: { prev: [], next: [943] },      // Maschiff -> Mabosstiff
  943: { prev: [942], next: [] },     // Mabosstiff
  
  944: { prev: [], next: [945] },      // Shroodle -> Grafaiai
  945: { prev: [944], next: [] },     // Grafaiai
  
  946: { prev: [], next: [947] },      // Bramblin -> Brambleghast
  947: { prev: [946], next: [] },     // Brambleghast
  
  948: { prev: [], next: [949] },      // Toedscool -> Toedscruel
  949: { prev: [948], next: [] },     // Toedscruel
  
  950: { prev: [], next: [] },         // Klawf - doesn't evolve
  951: { prev: [], next: [952] },      // Capsakid -> Scovillain
  952: { prev: [951], next: [] },     // Scovillain
  
  953: { prev: [], next: [954] },      // Rellor -> Rabsca
  954: { prev: [953], next: [] },     // Rabsca
  
  955: { prev: [], next: [956] },      // Flittle -> Espathra
  956: { prev: [955], next: [] },     // Espathra
  
  957: { prev: [], next: [958] },      // Tinkatink -> Tinkatuff
  958: { prev: [957], next: [959] },  // Tinkatuff -> Tinkaton
  959: { prev: [958], next: [] },     // Tinkaton
  
  960: { prev: [], next: [961] },      // Wiglett -> Wugtrio
  961: { prev: [960], next: [] },     // Wugtrio
  
  962: { prev: [], next: [] },         // Bombirdier - doesn't evolve
  963: { prev: [], next: [964] },      // Finizen -> Palafin
  964: { prev: [963], next: [] },     // Palafin
  
  965: { prev: [], next: [966] },      // Vroom -> Revavroom
  966: { prev: [965], next: [] },     // Revavroom
  
  967: { prev: [], next: [] },         // Cyclizar - doesn't evolve
  968: { prev: [], next: [] },         // Orthworm - doesn't evolve
  969: { prev: [], next: [970] },      // Glimmet -> Glimmora
  970: { prev: [969], next: [] },     // Glimmora
  
  971: { prev: [], next: [972] },      // Greavard -> Houndstone
  972: { prev: [971], next: [] },     // Houndstone
  
  973: { prev: [], next: [] },         // Flamigo - doesn't evolve
  974: { prev: [], next: [975] },      // Cetoddle -> Cetitan
  975: { prev: [974], next: [] },     // Cetitan
  
  976: { prev: [], next: [977] },      // Veluza -> Dondozo
  977: { prev: [976], next: [] },     // Dondozo
  
  978: { prev: [], next: [] },         // Tatsugiri - doesn't evolve
  979: { prev: [], next: [980] },      // Annihilape -> 
  980: { prev: [979, 194], next: [] }, // Clodsire
  
  981: { prev: [], next: [] },         // Farigiraf - doesn't evolve
  982: { prev: [], next: [] },         // Dudunsparce - doesn't evolve
  983: { prev: [], next: [] },         // Kingambit - doesn't evolve
  
  // Paradox Pokemon (don't evolve)
  984: { prev: [], next: [] },
  985: { prev: [], next: [] },
  986: { prev: [], next: [] },
  987: { prev: [], next: [] },
  988: { prev: [], next: [] },
  989: { prev: [], next: [] },
  990: { prev: [], next: [] },
  991: { prev: [], next: [] },
  992: { prev: [], next: [] },
  993: { prev: [], next: [] },
  994: { prev: [], next: [] },
  995: { prev: [], next: [] },
  996: { prev: [], next: [997] },      // Frigibax -> Arctibax
  997: { prev: [996], next: [998] },  // Arctibax -> Baxcalibur
  998: { prev: [997], next: [] },     // Baxcalibur
  
  999: { prev: [], next: [1000] },     // Gimmighoul -> Gholdengo
  1000: { prev: [999], next: [] },    // Gholdengo
  
  // Hisui forms
  10091: { prev: [19], next: [10092] }, // Rattata-Alola -> Raticate-Alola
  10092: { prev: [10091], next: [] },
  10100: { prev: [25], next: [] },    // Pikachu -> Raichu-Alola
  10101: { prev: [27], next: [] },    // Sandshrew -> Sandslash-Alola
  10102: { prev: [28], next: [] },    // Sandslash -> Sandslash-Alola
  10103: { prev: [37], next: [] },    // Vulpix -> Vulpix-Alola
  10104: { prev: [38], next: [] },    // Ninetales -> Ninetales-Alola
  10105: { prev: [50], next: [] },    // Diglett -> Diglett-Alola
  10106: { prev: [51], next: [] },    // Dugtrio -> Dugtrio-Alola
  10107: { prev: [52], next: [] },    // Meowth -> Meowth-Alola
  10108: { prev: [53], next: [] },    // Persian -> Persian-Alola
  10109: { prev: [74], next: [] },    // Geodude -> Geodude-Alola
  10110: { prev: [75], next: [] },    // Graveler -> Graveler-Alola
  10111: { prev: [76], next: [] },    // Golem -> Golem-Alola
  10112: { prev: [88], next: [] },    // Grimer -> Grimer-Alola
  10113: { prev: [89], next: [] },    // Muk -> Muk-Alola
  10114: { prev: [103], next: [] },   // Exeggutor -> Exeggutor-Alola
  10115: { prev: [105], next: [] },   // Marowak -> Marowak-Alola
  10161: { prev: [52], next: [] },    // Meowth -> Meowth-Galar
  10162: { prev: [77], next: [] },    // Ponyta -> Ponyta-Galar
  10163: { prev: [78], next: [] },    // Rapidash -> Rapidash-Galar
  10164: { prev: [79], next: [] },    // Slowpoke -> Slowpoke-Galar
  10165: { prev: [80], next: [] },    // Slowbro -> Slowbro-Galar
  10166: { prev: [83], next: [] },    // Farfetch'd -> Farfetch'd-Galar
  10167: { prev: [110], next: [] },   // Weezing -> Weezing-Galar
  10168: { prev: [122], next: [] },   // Mr. Mime -> Mr. Mime-Galar
  10169: { prev: [144], next: [] },   // Articuno -> Articuno-Galar
  10170: { prev: [145], next: [] },   // Zapdos -> Zapdos-Galar
  10171: { prev: [146], next: [] },   // Moltres -> Moltres-Galar
  10172: { prev: [199], next: [] },   // Slowking -> Slowking-Galar
  10173: { prev: [222], next: [] },   // Corsola -> Corsola-Galar
  10174: { prev: [263], next: [] },   // Zigzagoon -> Zigzagoon-Galar
  10175: { prev: [264], next: [] },   // Linoone -> Linoone-Galar
  10176: { prev: [554], next: [] },   // Darumaka -> Darumaka-Galar
  10177: { prev: [555], next: [] },   // Darmanitan -> Darmanitan-Galar
  10179: { prev: [562], next: [] },   // Yamask -> Yamask-Galar
  10180: { prev: [618], next: [] },   // Stunfisk -> Stunfisk-Galar
  
  // Hisui evolution
  10229: { prev: [58], next: [] },    // Growlithe -> Growlithe-Hisui
  10230: { prev: [59], next: [] },    // Arcanine -> Arcanine-Hisui
  10231: { prev: [100], next: [] },   // Voltorb -> Voltorb-Hisui
  10232: { prev: [101], next: [] },   // Electrode -> Electrode-Hisui
  10233: { prev: [157], next: [] },   // Typhlosion -> Typhlosion-Hisui
  10234: { prev: [211], next: [] },   // Qwilfish -> Qwilfish-Hisui
  10235: { prev: [215], next: [] },   // Sneasel -> Sneasel-Hisui
  10236: { prev: [503], next: [] },   // Samurott -> Samurott-Hisui
  10237: { prev: [549], next: [] },   // Lilligant -> Lilligant-Hisui
  10238: { prev: [570], next: [] },   // Zorua -> Zorua-Hisui
  10239: { prev: [571], next: [] },   // Zoroark -> Zoroark-Hisui
  10240: { prev: [628], next: [] },   // Braviary -> Braviary-Hisui
  10241: { prev: [705], next: [] },   // Sliggoo -> Sliggoo-Hisui
  10242: { prev: [706], next: [] },   // Goodra -> Goodra-Hisui
  10243: { prev: [713], next: [] },   // Avalugg -> Avalugg-Hisui
  10244: { prev: [724], next: [] },   // Decidueye -> Decidueye-Hisui
  10250: { prev: [128], next: [] },   // Tauros -> Tauros-Paldea
  10251: { prev: [128], next: [] },
  10252: { prev: [128], next: [] },
  10253: { prev: [194], next: [] },   // Wooper -> Wooper-Paldea
  
  // Special forms that don't evolve further
  10245: { prev: [], next: [] },      // Castform-Sunny
  10246: { prev: [], next: [] },      // Castform-Rainy
  10247: { prev: [], next: [] },      // Castform-Snowy
};

// Helper function to get all evolutions for a Pokemon (both prev and next)
export function getEvolutionChain(pokemonId: number): number[] {
  const data = EVOLUTION_DATA[pokemonId];
  if (!data) return [];
  
  // Get all related Pokemon in the evolution chain
  const chain: number[] = [];
  
  // Add previous evolutions recursively
  const addPrev = (id: number) => {
    const d = EVOLUTION_DATA[id];
    if (d?.prev) {
      d.prev.forEach(prevId => {
        if (!chain.includes(prevId)) {
          chain.push(prevId);
          addPrev(prevId);
        }
      });
    }
  };
  
  // Add next evolutions recursively  
  const addNext = (id: number) => {
    const d = EVOLUTION_DATA[id];
    if (d?.next) {
      d.next.forEach(nextId => {
        if (!chain.includes(nextId)) {
          chain.push(nextId);
          addNext(nextId);
        }
      });
    }
  };
  
  addPrev(pokemonId);
  addNext(pokemonId);
  
  return chain;
}

// Check if a Pokemon can evolve (has next evolutions)
export function canEvolve(pokemonId: number): boolean {
  const data = EVOLUTION_DATA[pokemonId];
  return !!data && data.next.length > 0;
}

// Get the next evolution(s) for a Pokemon
export function getNextEvolutions(pokemonId: number): number[] {
  const data = EVOLUTION_DATA[pokemonId];
  return data?.next || [];
}

// Get the previous evolution(s) for a Pokemon  
export function getPrevEvolutions(pokemonId: number): number[] {
  const data = EVOLUTION_DATA[pokemonId];
  return data?.prev || [];
}
