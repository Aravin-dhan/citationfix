"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const converter_1 = require("./utils/converter");
const input = "This is a test.{{fn: Footnote 1}} With another.{{fn: Footnote 2}} And a [Link](url).";
const result = (0, converter_1.processText)(input);
console.log("Main Text:", result.mainText);
console.log("Footnotes:", result.footnotes);
console.log("Segments:", JSON.stringify(result.segments, null, 2));
// Verification logic
let passed = true;
if (result.segments.length !== 5) {
    console.error("FAILED: Expected 5 segments, got " + result.segments.length);
    passed = false;
}
if (result.segments[1].type !== 'footnote' || result.segments[1].number !== 1) {
    console.error("FAILED: Segment 1 should be footnote 1");
    passed = false;
}
if (result.segments[3].type !== 'footnote' || result.segments[3].number !== 2) {
    console.error("FAILED: Segment 3 should be footnote 2");
    passed = false;
}
if (passed) {
    console.log("VERIFICATION PASSED");
}
else {
    console.log("VERIFICATION FAILED");
    process.exit(1);
}
