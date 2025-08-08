"use client";

import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    const get = async () => {
      try {
        const fp = await FingerprintJS.load();
        const { visitorId } = await fp.get();
        // Use Web Crypto API instead of Node.js crypto
        const encoder = new TextEncoder();
        const data = encoder.encode(visitorId);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setFingerprint(hash);
      } catch (error) {
        console.error('Error generating fingerprint:', error);
      }
    };
    get();
  }, []);

  return fingerprint;
};
