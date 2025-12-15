"use strict";
const mainText = "This is a test.¹ With a footnote.² And a [Link](url).";
const parts = mainText.split(/([\u2070-\u2079\u00B9\u00B2\u00B3]+)|(\[.*?\]\(.*?\))/g).filter(part => part !== undefined && part !== '');
console.log("Parts:", parts);
parts.forEach((part, index) => {
    if (/^[\u2070-\u2079\u00B9\u00B2\u00B3]+$/.test(part)) {
        console.log(`Part ${index}: Superscript`);
    }
    else if (/^\[(.*?)\]\((.*?)\)$/.test(part)) {
        console.log(`Part ${index}: Link`);
    }
    else {
        console.log(`Part ${index}: Text`);
    }
});
