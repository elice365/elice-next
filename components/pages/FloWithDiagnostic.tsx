'use client';

import React from 'react';
import Flo from './Flo';
import ErrorDiagnostic from '@/components/features/flo/ErrorDiagnostic';

interface FloWithDiagnosticProps {
  initialType: string;
  serverData: Record<string, any>;
}

const FloWithDiagnostic: React.FC<FloWithDiagnosticProps> = ({ initialType, serverData }) => {
  return (
    <>
      <Flo initialType={initialType} serverData={serverData} />
      <ErrorDiagnostic />
    </>
  );
};

export default FloWithDiagnostic;