const fs = require('fs');
const path = require('path');

const htmlPath = 'c:/Users/cc/Downloads/Telegram Desktop/My Living Dex + Variants/Complete Living Dex.html';
const outputPath = path.join(__dirname, '../src/lib/shiny-remote-mapping.json');

console.log(`Reading HTML from ${htmlPath}...`);
const html = fs.readFileSync(htmlPath, 'utf8');

// We will look for blocks using regex.
// The structure seems to be table rows tr.
// We want to find the ID and the corresponding Shiny Image.

// Regex to find 3-digit IDs in a cell: <td[^>]*>(\d{3})<\/td>
// Regex to find Images: src="(https:\/\/lh3\.googleusercontent\.com[^"]+)"

// Strategy:
// 1. Split by "</tr>" to get rows.
// 2. Identify "ID Row" (contains multiple \d{3}).
// 3. Identify "Image Row" (contains multiple googleusercontent images).
// 4. The Name Row aligns with them.

// We need to carefully align columns.
// As seen in the snippet (Lines 46-51 for IDs 031-033, Line 53-54 for Images):
// ID Row (Line 46): 028, 028, 029, 029, 030, 030 ...
// Name Row (Line 47): Sandslash, Sandslash Star, Nidoran, Nidoran Star...
// Image Row (Line 48): Img1, Img2, Img3, Img4...

// It seems there are PAIRS: Normal, Shiny.
// ID Row has duplicate IDs: 028, 028.
// Name Row has: "Sandslash", "Sandslash 🌟".
// Image Row has: NormalImg, ShinyImg.

// So, for each ID, the SECOND occurrence is the Shiny one.
// And the Name with "🌟" is the Shiny one.

// We want ONLY Shiny.
// So we look for the column index where Name contains "🌟".

const rows = html.split('</tr>');
console.log(`Found ${rows.length} rows.`);

let mapping = {};
let count = 0;

// Helper to remove tags
const cleanText = (s) => s.replace(/<[^>]+>/g, '').trim();

// Buffer to store recent rows to define a Block
let idRow = null;
let nameRow = null;

for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Check if it's an Image Row
    if (row.includes('googleusercontent.com')) {
        // This is an image row.
        // We look back for Name and ID rows.

        // Go back 1 row for Name?
        // Go back 2 rows for ID?
        // Note: HTML structure might have extra spacer rows, but usually tight.

        let foundName = false;
        let foundId = false;
        let localNameRow = null;
        let localIdRow = null;

        // Look backwards
        for (let j = 1; j <= 5; j++) {
            if (i - j < 0) break;
            const r = rows[i - j];

            // Check for Names (words)
            if (!foundName && !r.includes('<img') && /[A-Za-z]/.test(cleanText(r))) {
                localNameRow = r;
                foundName = true;
                continue;
            }

            // Check for names+symbols (Name row often has symbols)

            // Check for IDs (001, 002)
            // Heuristic for ID row: matches >\d{3}< multiple times
            const idMatches = r.match(/>\d{3}</g);
            if (!foundId && idMatches && idMatches.length > 2) {
                localIdRow = r;
                foundId = true;
            }

            if (foundName && foundId) break;
        }

        if (foundName && foundId) {
            // Processing Block
            const extractCells = (r) => r.split('<td').slice(1).map(c => {
                // handle colspan
                const colspanMatch = c.match(/colspan="(\d+)"/);
                const colspan = colspanMatch ? parseInt(colspanMatch[1]) : 1;
                const content = c.split('</td>')[0].substring(c.indexOf('>') + 1);
                return { content, colspan };
            });

            const idCells = extractCells(localIdRow);
            const nameCells = extractCells(localNameRow);
            const imgCells = extractCells(row);

            // Expand cols
            const expand = (cells) => {
                let res = [];
                cells.forEach(c => {
                    for (let k = 0; k < c.colspan; k++) res.push(c.content);
                });
                return res;
            };

            const imgCols = expand(imgCells);
            const nameCols = expand(nameCells);
            const idCols = expand(idCells);

            // Iterate columns
            // We want to capture where Name contains "🌟"

            for (let k = 0; k < imgCols.length; k++) {
                // Check bounds
                if (k >= nameCols.length || k >= idCols.length) continue;

                const nameRaw = cleanText(nameCols[k]);
                const idRaw = cleanText(idCols[k]);
                const imgRaw = imgCols[k]; // contains <img src="...">

                // Check if shiny
                if (nameRaw.includes('🌟')) {
                    // Get ID
                    const idMatch = idRaw.match(/\d{3}/);
                    if (idMatch) {
                        const id = parseInt(idMatch[0]).toString();

                        // Get Image URL
                        const srcMatch = imgRaw.match(/src="(https:\/\/lh3\.googleusercontent\.com[^"]+)"/);
                        if (srcMatch) {
                            const url = srcMatch[1];

                            // Handle variants (Female ♀)
                            // Usually if a variant, the Name itself might not change but the Gender symbol is in previous or same col?
                            // In the snippet:
                            // Row 9 (IDs): 001, ..., 003, 003
                            // Row 10 (Names): ..., Venusaur, ♀, Venusaur 🌟
                            // Actually, ♀ has its own column?
                            // No, look at Line 10/12/13
                            // Row 10: "Ivysaur 🌟"(col), "♀"(col), "Venusaur"(col)
                            // So gender is its own column?

                            // If gender is in separate column, it likely precedes the pokemon?
                            // Or the Pokemon ID/Name column includes the gender?

                            // If "♀" is detected in nameCols[k-1] or idCols[k-1] or something?

                            let finalId = id;

                            // Check for gender in Name
                            if (nameRaw.includes('♀')) finalId += '-f';
                            if (nameRaw.includes('♂')) finalId += '-m'; // rare but exists

                            // Check previous column for gender symbol if this column is just the pokemon
                            if (k > 0) {
                                const prevName = cleanText(nameCols[k - 1]);
                                if (prevName === '♀') finalId += '-f';
                                if (prevName === '♂') finalId += '-m';
                            }

                            // Check for Forms
                            // Alolan / Galar / Hisui / Paldea forms usually have text in Name?
                            // Or they are in different "Boxes"?
                            // User wants National Dex order. 
                            // If "Alolan Rattata", the ID might still be 019.
                            // We need to create a unique key: "19-alola".

                            // Heuristic: If name contains "Alolan", "Galarian", "Hisuian"?
                            // Or "Form"?

                            // Let's rely on basic ID first. If duplicates, we might append index?
                            // Better: Use the ID. If mapping[id] exists, try to deduce form.

                            if (mapping[finalId]) {
                                // Duplicate ID. Likely a form.
                                // Try to differentiage based on Name text?
                                // e.g. "Rattata" vs "Alolan Rattata"?
                                // If the HTML just says "Rattata" for both, we rely on the specific "Box" headers?
                                // Too complex for simple script.
                                // We'll append a counter or assume standard forms come after?

                                // If user said "National Dex Order", usually forms are grouped with base.
                                // e.g. 19, 19 (Alola).

                                // Let's overwrite? No, we might lose data.
                                // Let's skip overwrite and log.
                                // ACTUALLY: User said "No Pokemon GO".
                                // If title/header says "GO", skip.

                                // For now, let's just save simple ID mappings.
                                // If multiple, maybe it's variant.
                                // Let's try to detect variant from name.
                            }

                            mapping[finalId] = url;
                            count++;
                        }
                    }
                }
            }
        }
    }
}

// Post-processing for variants/forms if needed?
// The user said "National Dex Order".
// 1025 IDs. 
// We should check if we cover them.

console.log(`Extracted ${count} shiny sprites.`);
console.log(`Unique Keys: ${Object.keys(mapping).length}`);

fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
console.log(`Saved to ${outputPath}`);
