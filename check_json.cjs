const fs = require('fs');
const path = 'c:\\Users\\cc\\Downloads\\Telegram Desktop\\shinytrack-complete\\shinytrack-complete\\src\\lib\\pokedex.json';

const content = fs.readFileSync(path);
const text = content.toString('utf8');
const lines = text.split('\n');

console.log('Total lines:', lines.length);
const start = 6500;
const end = 6520;
for (let i = start; i < end; i++) {
    if (i < lines.length) {
        console.log(`${i + 1}: ${lines[i].replace(/\r/g, '\\r')}`);
    }
}
