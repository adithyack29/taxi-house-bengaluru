import React, { useEffect } from 'react';

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-white min-h-screen py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-secondary mb-2">Cancellation & Refund Policy</h1>
        <p className="text-sm text-gray-500 mb-8 border-b pb-4">Last updated on 10-04-2026</p>
        
        <div className="prose prose-blue max-w-none text-gray-700 space-y-6">
          <p>
            TAXI HOUSE BENGALURU believes in providing flexibility and support to its customers. Our
            cancellation and refund policy is designed accordingly:
          </p>

          <ul className="list-disc pl-5 space-y-4">
            <li>
              <strong>Cancellation Requests</strong><br />
              Cancellations will be considered only if the request is made well in advance before the scheduled
              pickup time. Once the booking is confirmed and the vehicle has been assigned or the trip has
              started, cancellation may not be entertained.
            </li>

            <li>
              <strong>Advance Payment Refund</strong><br />
              If a booking is cancelled prior to vehicle assignment, a 100% refund of the advance amount will be
              processed.
            </li>

            <li>
              <strong>Last-Minute Cancellations</strong><br />
              For cancellations made close to the pickup time or after driver/vehicle allocation, a cancellation
              charge may apply.
            </li>

            <li>
              <strong>No-Show Policy</strong><br />
              If the customer fails to be present at the pickup location at the scheduled time without prior
              intimation, the booking will be treated as a no-show, and no refund will be issued.
            </li>

            <li>
              <strong>Service Issues</strong><br />
              In case of any service-related concerns (delay, vehicle condition, driver behavior), customers are
              requested to report immediately to our support team. We will review the issue and take appropriate
              action, including partial refunds if applicable.
            </li>

            <li>
              <strong>Refund Processing</strong><br />
              Approved refunds will be processed within 1–2 working days to the original payment method.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
