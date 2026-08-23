import * as cheerio from 'cheerio';
import * as fs from 'fs';

// Pokémon Gen 7 (Alola)
const gen7Pokemon = [
  "rowlet", "dartrix", "decidueye",
  "litten", "torracat", "incineroar",
  "popplio", "brionne", "primarina",
  "pikipek", "trumbeak", "toucannon",
  "yungoos", "gumshoos",
  "grubbin", "charjabug", "vikavolt",
  "crabrawler", "crabominable",
  "oricorio",
  "cutiefly", "ribombee",
  "rockruff", "lycanroc",
  "mareanie", "toxapex",
  "mudbray", "mudsdale",
  "dewpider", "araquanid",
  "fomantis", "lurantis",
  "morelull", "shiinotic",
  "salandit", "salazzle",
  "stufful", "bewear",
  "bounsweet", "steenee", "tsareena",
  "comfey",
  "oranguru", "passimian",
  "wimpod", "golisopod",
  "sandygast", "palossand",
  "pyukumuku",
  "typenull", "silvally",
  "minior",
  "komala",
  "turtonator",
  "togedemaru",
  "mimikyu",
  "bruxish",
  "drampa",
  "dhelmise",
  "jangmo-o", "hakamo-o", "kommo-o",
  "tapu-koko", "tapu-lele", "tapu-bulu", "tapu-fini",
  "cosmog", "cosmoem", "solgaleo", "lunala",
  "nihilego", "buzzwole", "pheromosa", "xurkitree",
  "celesteela", "kartana", "guzzlord",
  "necrozma",
  "magearna",
  "marshadow",
  "poipole", "naganadel",
  "stakataka", "blacephalon",
  "zeraora",
  "meltan", "melmetal"
];

const baseUrl = "https://pokemondb.net/sprites/";
const shinyLinksSet = new Set<string>();

const silvallyTypes: Record<string, string> = {
  "bug": "Bug", "dark": "Dark", "dragon": "Dragon", "electric": "Electric",
  "fairy": "Fairy", "fighting": "Fighting", "fire": "Fire", "flying": "Flying",
  "ghost": "Ghost", "grass": "Grass", "ground": "Ground", "ice": "Ice",
  "normal": "Normal", "poison": "Poison", "psychic": "Psychic", "rock": "Rock",
  "steel": "Steel", "water": "Water"
};

const miniorColors: Record<string, string> = {
  "red": "Red", "orange": "Orange", "yellow": "Yellow",
  "green": "Green", "blue": "Blue", "indigo": "Indigo", "violet": "Violet"
};

async function scrapeShinySprites() {
  for (const pkmn of gen7Pokemon) {
    if (pkmn === "wishiwashi") {
      continue;
    }

    const url = baseUrl + pkmn;
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`${pkmn}: pagina non trovata`);
        continue;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const imgs = $('img');
      let found = 0;

      imgs.each((_, img) => {
        const src = $(img).attr('src');
        const title = $(img).attr('title') || '';

        if (title.includes('Event') || title.includes('Totem')) {
          return;
        }

        if (!src || !src.includes('shiny') || !src.startsWith('https://img.pokemondb.net')) {
          return;
        }

        // 🎭 ORICORIO
        if (pkmn === 'oricorio') {
          let name = '';
          if (src.includes('baile')) {
            name = 'Baile Style';
          } else if (src.includes('pom-pom') || src.includes('pompom')) {
            name = 'Pom-Pom Style';
          } else if (src.includes('pau')) {
            name = "Pa'u Style";
          } else if (src.includes('sensu')) {
            name = 'Sensu Style';
          } else {
            return;
          }
          shinyLinksSet.add(`oricorio (${name}): ${src}`);
          found++;
          return;
        }

        // 🐺 LYCANROC
        if (pkmn === 'lycanroc') {
          let name = '';
          if (src.includes('midday')) {
            name = 'Midday Form';
          } else if (src.includes('midnight')) {
            name = 'Midnight Form';
          } else if (src.includes('dusk')) {
            name = 'Dusk Form';
          } else {
            return;
          }
          shinyLinksSet.add(`lycanroc (${name}): ${src}`);
          found++;
          return;
        }

        // 🌈 MINIOR
        if (pkmn === 'minior') {
          for (const [key, color] of Object.entries(miniorColors)) {
            if (src.includes(key)) {
              shinyLinksSet.add(`minior (${color} Core): ${src}`);
              found++;
              return;
            }
          }
          return;
        }

        // ⚙️ SILVALLY
        if (pkmn === 'silvally') {
          for (const [key, tname] of Object.entries(silvallyTypes)) {
            if (src.includes(key)) {
              shinyLinksSet.add(`silvally (${tname} Type): ${src}`);
              found++;
              return;
            }
          }
          return;
        }

        // 🧬 TYPE: NULL
        if (pkmn === 'typenull') {
          shinyLinksSet.add(`Type: Null: ${src}`);
          found++;
          return;
        }

        // ✅ resto
        if (title) {
          shinyLinksSet.add(`${pkmn} (${title}): ${src}`);
        } else {
          shinyLinksSet.add(`${pkmn}: ${src}`);
        }
        found++;
      });

      console.log(`${pkmn}: ${found} shiny validi`);

    } catch (error) {
      console.log(`Errore con ${pkmn}:`, error);
    }
  }

  const shinyLinks = Array.from(shinyLinksSet);
  
  fs.writeFileSync('gen7_shiny_links_COMPLETE_FINAL.txt', shinyLinks.join('\n'), 'utf-8');

  console.log('\nFATTO ✅');
  console.log(`Totale shiny salvati: ${shinyLinks.length}`);
  console.log('File: gen7_shiny_links_COMPLETE_FINAL.txt');
}

scrapeShinySprites();
