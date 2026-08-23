import requests
from bs4 import BeautifulSoup

# Pokémon Gen 7 (Alola)
gen7_pokemon = [
    "rowlet","dartrix","decidueye",
    "litten","torracat","incineroar",
    "popplio","brionne","primarina",
    "pikipek","trumbeak","toucannon",
    "yungoos","gumshoos",
    "grubbin","charjabug","vikavolt",
    "crabrawler","crabominable",
    "oricorio",
    "cutiefly","ribombee",
    "rockruff","lycanroc",
    "mareanie","toxapex",
    "mudbray","mudsdale",
    "dewpider","araquanid",
    "fomantis","lurantis",
    "morelull","shiinotic",
    "salandit","salazzle",
    "stufful","bewear",
    "bounsweet","steenee","tsareena",
    "comfey",
    "oranguru","passimian",
    "wimpod","golisopod",
    "sandygast","palossand",
    "pyukumuku",
    "typenull","silvally",
    "minior",
    "komala",
    "turtonator",
    "togedemaru",
    "mimikyu",
    "bruxish",
    "drampa",
    "dhelmise",
    "jangmo-o","hakamo-o","kommo-o",
    "tapu-koko","tapu-lele","tapu-bulu","tapu-fini",
    "cosmog","cosmoem","solgaleo","lunala",
    "nihilego","buzzwole","pheromosa","xurkitree",
    "celesteela","kartana","guzzlord",
    "necrozma",
    "magearna",
    "marshadow",
    "poipole","naganadel",
    "stakataka","blacephalon",
    "zeraora",
    "meltan","melmetal"
]

base_url = "https://pokemondb.net/sprites/"
shiny_links = []

silvally_types = {
    "bug":"Bug","dark":"Dark","dragon":"Dragon","electric":"Electric",
    "fairy":"Fairy","fighting":"Fighting","fire":"Fire","flying":"Flying",
    "ghost":"Ghost","grass":"Grass","ground":"Ground","ice":"Ice",
    "normal":"Normal","poison":"Poison","psychic":"Psychic","rock":"Rock",
    "steel":"Steel","water":"Water"
}

minior_colors = {
    "red":"Red","orange":"Orange","yellow":"Yellow",
    "green":"Green","blue":"Blue","indigo":"Indigo","violet":"Violet"
}

for pkmn in gen7_pokemon:

    if pkmn == "wishiwashi":
        continue

    url = base_url + pkmn
    try:
        r = requests.get(url, timeout=10)
        if r.status_code != 200:
            print(f"{pkmn}: pagina non trovata")
            continue

        soup = BeautifulSoup(r.text, "html.parser")
        imgs = soup.find_all("img")
        found = 0

        for img in imgs:
            src = img.get("src")
            title = img.get("title", "")

            if "Event" in title or "Totem" in title:
                continue

            if not src or "shiny" not in src or not src.startswith("https://img.pokemondb.net"):
                continue

            # 🎭 ORICORIO
            if pkmn == "oricorio":
                if "baile" in src:
                    name = "Baile Style"
                elif "pom-pom" in src or "pompom" in src:
                    name = "Pom-Pom Style"
                elif "pau" in src:
                    name = "Pa'u Style"
                elif "sensu" in src:
                    name = "Sensu Style"
                else:
                    continue
                shiny_links.append(f"oricorio ({name}): {src}")
                found += 1
                continue

            # 🐺 LYCANROC
            if pkmn == "lycanroc":
                if "midday" in src:
                    name = "Midday Form"
                elif "midnight" in src:
                    name = "Midnight Form"
                elif "dusk" in src:
                    name = "Dusk Form"
                else:
                    continue
                shiny_links.append(f"lycanroc ({name}): {src}")
                found += 1
                continue

            # 🌈 MINIOR
            if pkmn == "minior":
                for key, color in minior_colors.items():
                    if key in src:
                        shiny_links.append(f"minior ({color} Core): {src}")
                        found += 1
                        break
                continue

            # ⚙️ SILVALLY
            if pkmn == "silvally":
                for key, tname in silvally_types.items():
                    if key in src:
                        shiny_links.append(f"silvally ({tname} Type): {src}")
                        found += 1
                        break
                continue

            # 🧬 TYPE: NULL
            if pkmn == "typenull":
                shiny_links.append(f"Type: Null: {src}")
                found += 1
                break  # una sola forma

            # ✅ resto
            if title:
                shiny_links.append(f"{pkmn} ({title}): {src}")
            else:
                shiny_links.append(f"{pkmn}: {src}")
            found += 1

        print(f"{pkmn}: {found} shiny validi")

    except Exception as e:
        print(f"Errore con {pkmn}: {e}")

shiny_links = list(dict.fromkeys(shiny_links))

with open("gen7_shiny_links_COMPLETE_FINAL.txt", "w", encoding="utf-8") as f:
    for link in shiny_links:
        f.write(link + "\n")

print("\nFATTO ✅")
print(f"Totale shiny salvati: {len(shiny_links)}")
print("File: gen7_shiny_links_COMPLETE_FINAL.txt")
