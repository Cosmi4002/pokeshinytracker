const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const games = {
    'gold': 'Pokémon_Gold_logo.png',
    'silver': 'Pokémon_Silver_logo.png',
    'crystal': 'Pokémon_Crystal_logo.png',
    'ruby': 'Pokémon_Ruby_EN_logo.png',
    'sapphire': 'Pokémon_Sapphire_EN_logo.png',
    'emerald': 'Pokémon_Emerald_EN_logo.png',
    'firered': 'Pokémon_FireRed_EN_logo.png',
    'leafgreen': 'Pokémon_LeafGreen_EN_logo.png',
    'diamond': 'Pokémon_Diamond_logo.png',
    'pearl': 'Pokémon_Pearl_logo.png',
    'platinum': 'Pokémon_Platinum_logo.png',
    'heartgold': 'Pokémon_HeartGold_logo.png',
    'soulsilver': 'Pokémon_SoulSilver_logo.png',
    'black': 'Pokémon_Black_EN_logo.png',
    'white': 'Pokémon_White_EN_logo.png',
    'black2': 'Pokémon_Black_2_EN_logo.png',
    'white2': 'Pokémon_White_2_EN_logo.png',
    'x': 'Pokémon_X_EN_logo.png',
    'y': 'Pokémon_Y_EN_logo.png',
    'omegaruby': 'Pokémon_Omega_Ruby_EN_logo.png',
    'alphasapphire': 'Pokémon_Alpha_Sapphire_EN_logo.png',
    'sun': 'Pokémon_Sun_EN_logo.png',
    'moon': 'Pokémon_Moon_EN_logo.png',
    'ultrasun': 'Pokémon_Ultra_Sun_EN_logo.png',
    'ultramoon': 'Pokémon_Ultra_Moon_EN_logo.png',
    'lgp': "Pokémon_Let's_Go_Pikachu_EN_logo.png",
    'lge': "Pokémon_Let's_Go_Eevee_EN_logo.png",
    'sword': 'Pokémon_Sword_EN_logo.png',
    'shield': 'Pokémon_Shield_EN_logo.png',
    'brilliantdiamond': 'Pokémon_Brilliant_Diamond_EN_logo.png',
    'shiningpearl': 'Pokémon_Shining_Pearl_EN_logo.png',
    'pla': 'Pokémon_Legends_Arceus_EN_logo.png',
    'scarlet': 'Pokémon_Scarlet_EN_logo.png',
    'violet': 'Pokémon_Violet_EN_logo.png'
};

const dir = path.join(__dirname, 'public', 'img', 'game-logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function getHashPath(filename) {
    const hash = crypto.createHash('md5').update(filename).digest('hex');
    return `${hash[0]}/${hash.substring(0, 2)}/${encodeURIComponent(filename)}`;
}

for (const [id, filename] of Object.entries(games)) {
    const hashPath = getHashPath(filename);
    const url = `https://archives.bulbagarden.net/media/upload/${hashPath}`;
    const dest = path.join(dir, `${id}.png`);
    console.log(`Downloading ${url} to ${dest}...`);
    try {
        execSync(`curl.exe -s -A "Mozilla/5.0" -e "https://bulbapedia.bulbagarden.net/" -L "${url}" -o "${dest}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to download ${id}`);
    }
}
