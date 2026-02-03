const fs = require('fs');
const path = require('path');

async function scrape() {
    try {
        console.log('Fetching https://www.tiger-code.com/docs/comparisonTable...');
        const response = await fetch('https://www.tiger-code.com/docs/comparisonTable');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const html = await response.text();

        console.log('Parsing HTML...');
        
        // Find table body
        const tbodyMatch = html.match(/<tbody>(.*?)<\/tbody>/s);
        if (!tbodyMatch) {
            throw new Error('No tbody found');
        }
        
        const tbodyContent = tbodyMatch[1];
        
        // Split by tr
        // Note: tr might have attributes
        // We split by <tr to isolate rows. The first part might be empty or whitespace.
        const rows = tbodyContent.split('<tr');
        
        const results = [];
        
        // Start from 1 because split results[0] is everything before the first <tr
        for (let i = 1; i < rows.length; i++) {
            // Reconstruct the tag beginning just for consistency, though we match tds inside
            const rowContent = rows[i];
            
            // Find all tds using matchAll
            const tdMatches = [...rowContent.matchAll(/<td[^>]*>(.*?)<\/td>/gs)];
            
            if (tdMatches.length >= 4) {
                // Col 1: Main + Variant
                let char = tdMatches[0][1].trim();
                // Col 2: Code
                let code = tdMatches[1][1].trim();
                // Col 3: Pronunciation
                let pinyin = tdMatches[2][1].trim();
                // Col 4: Examples
                let examples = tdMatches[3][1].trim();
                
                // Clean HTML tags (e.g. spans, links)
                char = char.replace(/<[^>]+>/g, '');
                code = code.replace(/<[^>]+>/g, '');
                pinyin = pinyin.replace(/<[^>]+>/g, '');
                examples = examples.replace(/<[^>]+>/g, '');
                
                // Decode common HTML entities
                const decode = (str) => str.replace(/&nbsp;/g, ' ')
                           .replace(/&lt;/g, '<')
                           .replace(/&gt;/g, '>')
                           .replace(/&amp;/g, '&');

                char = decode(char);
                code = decode(code);
                pinyin = decode(pinyin);
                examples = decode(examples);

                // Normalize spaces
                char = char.replace(/\s+/g, ' ');
                code = code.trim();
                pinyin = pinyin.trim();
                examples = examples.replace(/\s+/g, ' ').trim();
                
                if (char && code) {
                    results.push({ char, code, pinyin, examples });
                }
            }
        }
        
        console.log(`Found ${results.length} rows.`);
        
        if (results.length === 0) {
            console.log('Warning: No rows found. Check HTML structure.');
            // console.log(tbodyContent); // Debug
        }
        
        // Write to file
        const outputPath = path.join(__dirname, 'data', 'zhmnwhei.txt');
        const outputContent = results.map(r => `${r.char}\t${r.code}\t${r.pinyin}\t${r.examples}`).join('\n');
        
        fs.writeFileSync(outputPath, outputContent, 'utf8');
        console.log(`Saved to ${outputPath}`);
        
    } catch (error) {
        console.error('Error:', error);
    }
}

scrape();
