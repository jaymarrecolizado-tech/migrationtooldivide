const fs=require('fs');
let html=fs.readFileSync('index.html','utf8');
html = html.replace("amount: { rule: 'Required, non-negative number', fix: 'Enter the fee amount as a number >= 0. Non-numeric characters will be stripped.' },", "amount: { rule: 'Required, non-negative number (AMOUNT, not percentage)', fix: 'Enter the fee amount as a raw number. DO NOT use percentages. Non-numeric characters will be stripped.' },");
html = html.replace("discount: { rule: 'Required, non-negative number', fix: 'Enter the discount as a number >= 0. Default is 0 if none.' },", "discount: { rule: 'Required, non-negative number (AMOUNT, not percentage)', fix: 'Enter the discount AMOUNT as a number >= 0. DO NOT use percentages.' },");
html = html.replace("Interest: { rule: 'Required, non-negative number', fix: 'Enter the interest as a number >= 0. Default is 0 if none.' },", "Interest: { rule: 'Required, non-negative number (AMOUNT, not percentage)', fix: 'Enter the interest AMOUNT as a number >= 0. DO NOT use percentages.' },");
html = html.replace("Surcharge: { rule: 'Required, non-negative number', fix: 'Enter the surcharge as a number >= 0. Default is 0 if none.' },", "Surcharge: { rule: 'Required, non-negative number (AMOUNT, not percentage)', fix: 'Enter the surcharge AMOUNT as a number >= 0. DO NOT use percentages.' },");
fs.writeFileSync('index.html', html, 'utf8');
console.log('Replaced');
