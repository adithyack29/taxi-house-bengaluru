const { Cashfree, CFEnvironment } = require('cashfree-pg');

const cashfree = new Cashfree(
    CFEnvironment.SANDBOX,
    "test",
    "test"
);

console.log("Cashfree instance methods:");
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(cashfree)));
console.log("\nCashfree static methods/properties:");
console.log(Object.getOwnPropertyNames(Cashfree));
