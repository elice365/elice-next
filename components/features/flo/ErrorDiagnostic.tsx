'use client';

import React, { useState, useEffect } from 'react';
import { floErrorTracker, getFloErrorReport, clearFloErrors } from '@/utils/flo/errorTracking';
import { logger } from '@/utils/logger';

interface ErrorDiagnosticProps {
  onClose?: () => void;
}

const ErrorDiagnostic: React.FC<ErrorDiagnosticProps> = ({ onClose }) => {
  const [errorReport, setErrorReport] = useState<string>('');
  const [isVisible, setIsVisible] = useState(false);
  const [criticalTrack, setCriticalTrack] = useState<any>(null);

  useEffect(() => {
    // 오류 리포트 업데이트
    const updateReport = () => {
      const report = getFloErrorReport();
      setErrorReport(report);
      
      // Love Is Like 트랙 체크
      const summaries = floErrorTracker.getAllErrorSummaries();
      const loveIsLike = summaries.find(s => 
        s.trackName.toLowerCase().includes('love is like') ||
        (s.artist && s.artist.toLowerCase().includes('maroon'))
      );
      
      if (loveIsLike && loveIsLike.totalErrors >= 13) {
        setCriticalTrack(loveIsLike);
        setIsVisible(true);
      }
    };

    updateReport();
    
    // 3초마다 업데이트
    const interval = setInterval(updateReport, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // 디버그 모드 활성화 체크
  useEffect(() => {
    const checkDebugMode = (e: KeyboardEvent) => {
      // Ctrl+Shift+D로 진단 패널 토글
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', checkDebugMode);
    return () => window.removeEventListener('keydown', checkDebugMode);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-background border border-border rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="bg-red-600 text-white p-3 flex items-center justify-between">
        <h3 className="font-bold text-sm">🚨 FLO Error Diagnostic</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
      
      {criticalTrack && (
        <div className="bg-red-100 border-b border-red-200 p-3">
          <div className="text-red-800 font-semibold text-sm mb-1">
            Critical Error Detected!
          </div>
          <div className="text-red-700 text-xs">
            <div>Track: {criticalTrack.trackName}</div>
            {criticalTrack.artist && <div>Artist: {criticalTrack.artist}</div>}
            <div>Errors: {criticalTrack.totalErrors} (≥13 threshold)</div>
            <div className="mt-2">
              Error Types:
              {Array.from(criticalTrack.errorTypes.entries()).map(([type, count]) => (
                <div key={type} className="ml-2">• {type}: {count}x</div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="p-3 max-h-96 overflow-y-auto">
        <pre className="text-xs font-mono whitespace-pre-wrap text-foreground/80">
          {errorReport || 'No errors recorded yet.'}
        </pre>
      </div>

      <div className="border-t border-border p-3 flex gap-2">
        <button
          onClick={() => {
            clearFloErrors();
            setErrorReport('Errors cleared.');
            setCriticalTrack(null);
          }}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear All Errors
        </button>
        <button
          onClick={() => {
            floErrorTracker.debug();
          }}
          className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Debug Console
        </button>
        <button
          onClick={() => {
            // Love Is Like 트랙 테스트
            logger.flo.info('Testing Love Is Like track...');
            const testSearch = async () => {
              try {
                const response = await fetch('/api/flo/search', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ query: 'Love Is Like Maroon 5' })
                });
                const data = await response.json();
                console.log('Search result:', data);
              } catch (error) {
                console.error('Search failed:', error);
              }
            };
            testSearch();
          }}
          className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          Test Track
        </button>
      </div>

      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 text-xs text-foreground/60">
        Press <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">Ctrl</kbd>+
        <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">Shift</kbd>+
        <kbd className="px-1 py-0.5 bg-white dark:bg-gray-700 rounded">D</kbd> to toggle
      </div>
    </div>
  );
};

export default ErrorDiagnostic;