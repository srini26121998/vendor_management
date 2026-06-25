const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'StockManagement', 'StockTransferAdvanced.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
    '#6366f1': '#16a34a', // violet/indigo 500 to green 600
    '#8b5cf6': '#22c55e', // violet to green 500
    '#eef2ff': '#f0fdf4', // light violet to light green
    '#c7d2fe': '#bbf7d0', // violet ring to green ring
    '#f5f3ff': '#f0fdf4', // light violet
    '#ddd6fe': '#bbf7d0', // violet ring
    '#a5b4fc': '#bbf7d0', // violet gradient
    '#c4b5fd': '#86efac', // violet gradient
};

for (const [oldColor, newColor] of Object.entries(replacements)) {
    content = content.split(oldColor).join(newColor);
}

// "secondary btn with text all need to change"
// We have secondary buttons with text "Close", "Back to Catalog", "Clear all"
// Change them to be outlined with green or have green text
content = content.replace(
    /color: '#64748b', fontSize: 13, fontWeight: 700, borderRadius: 12, cursor: 'pointer'/g, 
    "color: '#16a34a', fontSize: 13, fontWeight: 700, borderRadius: 12, cursor: 'pointer'"
);
content = content.replace(
    /background: '#fff', border: '2px solid #e2e8f0',/g, 
    "background: '#fff', border: '2px solid #bbf7d0',"
);

// Clear all button at line 714
content = content.replace(
    /background: '#fff8f8', border: '1.5px solid #fecaca', color: '#ef4444'/g,
    "background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#16a34a'"
);

// Back to Catalog button at line 846
content = content.replace(
    /border: '1.5px solid #e2e8f0',/g,
    "border: '1.5px solid #bbf7d0',"
);
content = content.replace(
    /color: '#64748b',([^]*?)cursor: step === 1 \? 'not-allowed' : 'pointer'/g,
    "color: '#16a34a',$1cursor: step === 1 ? 'not-allowed' : 'pointer'"
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
