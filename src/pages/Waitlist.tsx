import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' | 'info' | null }>({ text: '', type: null });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }
    
    setIsSubmitting(true);
    setMessage({ text: '', type: null });
    
    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage({ text: 'Success! You\'ve been added to the waitlist.', type: 'success' });
        setEmail('');
      } else {
        setMessage({ text: data.error || 'An error occurred. Please try again.', type: 'error' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setMessage({ text: 'Failed to connect. Please check your network and try again.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // For dev/admin purposes - will be hidden in production
  const handleBypass = () => {
    localStorage.setItem('syndicateAuth', 'true');
    navigate('/');
  };

  return (
    <div className="bg-black text-gray-100 flex items-center justify-center min-h-screen p-4">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-xl max-w-md w-full text-center border border-zinc-800">
        <img src="/logo.svg" alt="Syndicate Logo" className="h-12 w-auto mx-auto mb-6" />
        <h1 className="text-2xl font-bold mb-2 text-white">Join the Waitlist</h1>
        <p className="text-zinc-400 mb-6">
          Be the first to know when Syndicate Mind launches new features or has important updates.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email address"
              className="w-full px-4 py-2 rounded bg-zinc-800 border border-zinc-700 text-gray-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
          </button>
        </form>
        
        {message.text && (
          <div className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-400' : message.type === 'error' ? 'text-red-400' : 'text-zinc-400'}`}>
            {message.text}
          </div>
        )}
        
        <p className="text-xs text-zinc-500 mt-4">We respect your privacy. No spam, ever.</p>
        
        {/* This button is only for development and testing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-4 border-t border-zinc-800">
            <button 
              onClick={handleBypass} 
              className="text-xs text-zinc-600 hover:text-zinc-400"
            >
              Developer: Bypass Waitlist
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Waitlist; 