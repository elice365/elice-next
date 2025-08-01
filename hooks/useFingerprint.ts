"use client";

import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { createHash } from 'crypto';

export const useFingerprint = () => {
  const [fingerprint, setFingerprint] = useState<string | null>(null);

  useEffect(() => {
    const get = async () => {
      try {
        const fp = await FingerprintJS.load();
        const { visitorId } = await fp.get();
        const hash = createHash('sha256').update(visitorId).digest('hex');
        setFingerprint(hash);
      } catch (error) {
        console.error('Error generating fingerprint:', error);
      }
    };
    get();
  }, []);

  return fingerprint;
};
