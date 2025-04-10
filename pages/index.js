
import { useState } from 'react';

export default function Home() {
  const [amount, setAmount] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };
  
  const handlePayment = async () => {
    setIsLoading(true);
  
    const isScriptLoaded = await loadRazorpayScript();
    if (!isScriptLoaded) {
      alert('Failed to load Razorpay SDK. Please try again.');
      setIsLoading(false);
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
  
      const res = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/payment/createRazorpayOrder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shippingAddress }),
      });
  
      const data = await res.json();
      const orderId = data.razorpayOrderId;
  
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount * 100,
        currency: 'INR',
        name: 'My Store',
        description: 'Secure Payment',
        order_id: orderId,
        handler: async function (response) {
          const verifyRes = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/payment/verifyPayment`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              shippingAddress,
            }),
          });
  
          const result = await verifyRes.json();
          if (result.message === 'Payment verified successfully') {
            alert('Payment Success!');
          } else {
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: 'John Doe',
          email: 'john@example.com',
          contact: '9876543210',
        },
        theme: {
          color: '#3399cc',
        },
      };
  
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: 'auto' }}>
      <h2>🛒 Secure Checkout</h2>
      <input
        type="text"
        placeholder="Shipping Address"
        value={shippingAddress}
        onChange={(e) => setShippingAddress(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
      />
      <button onClick={handlePayment} disabled={isLoading} style={{
        width: '100%', padding: '0.75rem', backgroundColor: '#3399cc',
        color: '#fff', border: 'none', cursor: 'pointer', fontSize: '16px'
      }}>
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </div>
  );
}
