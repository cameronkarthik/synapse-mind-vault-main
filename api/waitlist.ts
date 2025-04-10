import { kv } from '@vercel/kv';
import { NextApiRequest, NextApiResponse } from 'next'; // Using Next.js types for compatibility

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Generate a unique key for storage (using timestamp + email)
    const timestamp = Date.now();
    const key = `waitlist:${timestamp}:${email}`;

    // Store the email in Vercel KV
    // The value '1' is just a placeholder; we only care about the key existing
    await kv.set(key, 1);

    console.log(`Email added to waitlist: ${email} (Key: ${key})`);

    return res.status(200).json({ message: 'Successfully added to waitlist' });

  } catch (error) {
    console.error('Error adding email to waitlist:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ error: 'Internal Server Error', details: errorMessage });
  }
} 