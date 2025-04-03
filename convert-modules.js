// Script to convert all element files from ES modules to global variables
const fs = require('fs');
const path = require('path');

const elementsDir = path.join(__dirname, 'scripts', 'elements');
const fileNames = fs.readdirSync(elementsDir).filter(file => file.endsWith('.js'));

console.log(`Found ${fileNames.length} element files to convert.`);

fileNames.forEach(fileName => {
    const filePath = path.join(elementsDir, fileName);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Extract the element name from the file name
    const elementName = fileName.replace('.js', '');
    const camelCaseName = elementName.split('-')
        .map((part, index) => index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    const pascalCaseName = camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);
    
    // Convert the export statement to a global variable
    content = content.replace(
        new RegExp(`export\\s+const\\s+${pascalCaseName}Element\\s*=\\s*\\{`), 
        `window.${pascalCaseName}Element = {`
    );
    
    // Make sure updateOnCreate returns the particle
    if (content.includes('updateOnCreate') && !content.includes('return particle')) {
        content = content.replace(
            /updateOnCreate\s*\(\s*particle\s*\)\s*\{(?:[^}]*)\}/s,
            (match) => {
                if (!match.includes('return particle')) {
                    return match.replace(/(\s*)\}$/, '$1    return particle;\n$1}');
                }
                return match;
            }
        );
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Converted ${fileName}`);
});

console.log('All element files converted successfully.'); 