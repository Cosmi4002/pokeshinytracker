const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const logos = {
    'gold': 'https://archives.bulbagarden.net/media/upload/a/a2/Pok%C3%A9mon_Gold_EN_logo.png',
    'silver': 'https://archives.bulbagarden.net/media/upload/3/30/Pok%C3%A9mon_Silver_EN_logo.png',
    'crystal': 'https://archives.bulbagarden.net/media/upload/5/5b/Pok%C3%A9mon_Crystal_EN_logo.png',
    'ruby': 'https://archives.bulbagarden.net/media/upload/f/f6/Pok%C3%A9mon_Ruby_EN_logo.png',
    'sapphire': 'https://archives.bulbagarden.net/media/upload/3/39/Pok%C3%A9mon_Sapphire_EN_logo.png',
    'emerald': 'https://archives.bulbagarden.net/media/upload/3/35/Pok%C3%A9mon_Emerald_EN_logo.png',
    'firered': 'https://archives.bulbagarden.net/media/upload/0/05/Pok%C3%A9mon_FireRed_EN_logo.png',
    'leafgreen': 'https://archives.bulbagarden.net/media/upload/f/f0/Pok%C3%A9mon_LeafGreen_EN_logo.png',
    'diamond': 'https://archives.bulbagarden.net/media/upload/e/e0/Pok%C3%A9mon_Diamond_EN_logo.png',
    'pearl': 'https://archives.bulbagarden.net/media/upload/1/18/Pok%C3%A9mon_Pearl_EN_logo.png',
    'platinum': 'https://archives.bulbagarden.net/media/upload/4/4e/Pok%C3%A9mon_Platinum_EN_logo.png',
    'heartgold': 'https://archives.bulbagarden.net/media/upload/0/05/Pok%C3%A9mon_HeartGold_EN_logo.png',
    'soulsilver': 'https://archives.bulbagarden.net/media/upload/d/d3/Pok%C3%A9mon_SoulSilver_EN_logo.png',
    'black': 'https://archives.bulbagarden.net/media/upload/5/5b/Pok%C3%A9mon_Black_EN_logo.png',
    'white': 'https://archives.bulbagarden.net/media/upload/4/48/Pok%C3%A9mon_White_EN_logo.png',
    'black2': 'https://archives.bulbagarden.net/media/upload/6/60/Pok%C3%A9mon_Black_2_EN_logo.png',
    'white2': 'https://archives.bulbagarden.net/media/upload/7/77/Pok%C3%A9mon_White_2_EN_logo.png',
    'x': 'https://archives.bulbagarden.net/media/upload/3/3d/Pok%C3%A9mon_X_EN_logo.png',
    'y': 'https://archives.bulbagarden.net/media/upload/9/97/Pok%C3%A9mon_Y_EN_logo.png',
    'omegaruby': 'https://archives.bulbagarden.net/media/upload/9/97/Pok%C3%A9mon_Omega_Ruby_EN_logo.png',
    'alphasapphire': 'https://archives.bulbagarden.net/media/upload/6/66/Pok%C3%A9mon_Alpha_Sapphire_EN_logo.png',
    'sun': 'https://archives.bulbagarden.net/media/upload/f/f4/Pok%C3%A9mon_Sun_EN_logo.png',
    'moon': 'https://archives.bulbagarden.net/media/upload/1/11/Pok%C3%A9mon_Moon_EN_logo.png',
    'ultrasun': 'https://archives.bulbagarden.net/media/upload/b/b7/Pok%C3%A9mon_Ultra_Sun_EN_logo.png',
    'ultramoon': 'https://archives.bulbagarden.net/media/upload/4/42/Pok%C3%A9mon_Ultra_Moon_EN_logo.png',
    'lgp': 'https://archives.bulbagarden.net/media/upload/c/c7/Pok%C3%A9mon_Let%27s_Go_Pikachu_EN_logo.png',
    'lge': 'https://archives.bulbagarden.net/media/upload/d/d4/Pok%C3%A9mon_Let%27s_Go_Eevee_EN_logo.png',
    'sword': 'https://archives.bulbagarden.net/media/upload/2/28/Pok%C3%A9mon_Sword_EN_logo.png',
    'shield': 'https://archives.bulbagarden.net/media/upload/5/52/Pok%C3%A9mon_Shield_EN_logo.png',
    'brilliantdiamond': 'https://archives.bulbagarden.net/media/upload/8/8e/Pok%C3%A9mon_Brilliant_Diamond_EN_logo.png',
    'shiningpearl': 'https://archives.bulbagarden.net/media/upload/6/66/Pok%C3%A9mon_Shining_Pearl_EN_logo.png',
    'pla': 'https://archives.bulbagarden.net/media/upload/5/5f/Pok%C3%A9mon_Legends_Arceus_EN_logo.png',
    'scarlet': 'https://archives.bulbagarden.net/media/upload/2/26/Pok%C3%A9mon_Scarlet_EN_logo.png',
    'violet': 'https://archives.bulbagarden.net/media/upload/d/d0/Pok%C3%A9mon_Violet_EN_logo.png'
};

const dir = path.join(__dirname, 'public', 'img', 'game-logos');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

for (const [id, url] of Object.entries(logos)) {
    const dest = path.join(dir, `${id}.png`);
    console.log(`Downloading ${url} to ${dest}...`);
    try {
        execSync(`curl.exe -s -A "Mozilla/5.0" -e "https://bulbapedia.bulbagarden.net/" -L "${url}" -o "${dest}"`, { stdio: 'inherit' });
    } catch (e) {
        console.error(`Failed to download ${id}`);
    }
}
