import React, { useEffect } from 'react';

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white min-h-screen py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-2">Cancellation & Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-8 border-b pb-4">Last updated on 10-04-2026 21:34:56</p>
        
        <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
          <p>
            TAXI HOUSE BENGALURU believes in helping its customers as far as possible, and has therefore a
            liberal cancellation policy. Under this policy:
          </p>

          <ul className="list-disc pl-5 space-y-4">
            <li>
              Cancellations will be considered only if the request is made immediately after placing the order.
              However, the cancellation request may not be entertained if the orders have been communicated to the
              vendors/merchants and they have initiated the process of shipping them.
            </li>
            
            <li>
              TAXI HOUSE BENGALURU does not accept cancellation requests for perishable items like flowers,
              eatables etc. However, refund/replacement can be made if the customer establishes that the quality of
              product delivered is not good.
            </li>
            
            <li>
              In case of receipt of damaged or defective items please report the same to our Customer Service team.
              The request will, however, be entertained once the merchant has checked and determined the same at his
              own end. This should be reported within 2 Days days of receipt of the products. In case you feel that the
              product received is not as shown on the site or as per your expectations, you must bring it to the notice of
              our customer service within 2 Days days of receiving the product. The Customer Service Team after
              looking into your complaint will take an appropriate decision.
            </li>
            
            <li>
              In case of complaints regarding products that come with a warranty from manufacturers, please refer
              the issue to them. In case of any Refunds approved by the TAXI HOUSE BENGALURU, it’ll take 1-2
              Days days for the refund to be processed to the end customer.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
