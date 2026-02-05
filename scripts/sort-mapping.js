const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '..', 'src', 'lib', 'sprite-mapping.json');
const mapping = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const parseId = (id) => {
    const parts = id.split('-');
    const num = parseInt(parts[0]);
    const form = parts.slice(1).join('-');
    return { num, form };
};

const sortedKeys = Object.keys(mapping).sort((a, b) => {
    const idA = parseId(a);
    const idB = parseId(b);

    if (idA.num !== idB.num) {
        return idA.num - idB.num;
    }
    return idA.form.localeCompare(idB.form);
});

const sortedMapping = {};
sortedKeys.forEach(key => {
    sortedMapping[key] = mapping[key];
});

fs.writeFileSync(filePath, JSON.stringify(sortedMapping, null, 2));
console.log('Successfully sorted sprite-mapping.json');
