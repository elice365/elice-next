'use client';

import { useEffect } from 'react';

export default function FloLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Add class to body when FLO page is mounted
    document.body.classList.add('flo-page-active');
    
    // Remove class when component unmounts
    return () => {
      document.body.classList.remove('flo-page-active');
    };
  }, []);

  return (
    <>
      {children}
    </>
  );
}