const { Cashfree, CFEnvironment } = require('cashfree-pg');
require('dotenv').config();

const cashfree = new Cashfree(
    process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION' ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX,
    process.env.CASHFREE_APP_ID,
    process.env.CASHFREE_SECRET_KEY
);

async function testFetch() {
    try {
        const orderId = "order_1776004402658"; // The one from the user's screenshot
        console.log(`Testing fetch for ${orderId}...`);
        const response = await cashfree.PGOrderFetch("2023-08-01", orderId);
        console.log("Success:", response.data);
    } catch (err) {
        console.error("Diagnostic Failed!");
        console.error("Error Message:", err.message);
        if (err.response) {
            console.error("Response Data:", JSON.stringify(err.response.data, null, 2));
        }
    }
}

testFetch();
