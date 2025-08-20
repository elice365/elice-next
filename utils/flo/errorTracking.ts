// FLO 에러 트래킹 시스템
// Love Is Like (Explicit Ver.) 등 특정 트랙의 반복적인 오류를 추적하고 보고

import { logger } from '@/utils/logger';

interface ErrorRecord {
  trackId: string;
  trackName: string;
  artist?: string;
  errorType: string;
  errorMessage: string;
  timestamp: Date;
  context?: any;
}

interface ErrorSummary {
  trackId: string;
  trackName: string;
  artist?: string;
  totalErrors: number;
  errorTypes: Map<string, number>;
  firstOccurrence: Date;
  lastOccurrence: Date;
  isCritical: boolean; // 13개 이상의 오류
}

class FloErrorTracker {
  private errors: Map<string, ErrorRecord[]> = new Map();
  private readonly CRITICAL_ERROR_THRESHOLD = 13;

  // 오류 기록
  recordError(
    trackId: string,
    trackName: string,
    errorType: string,
    errorMessage: string,
    context?: any
  ): void {
    const errorRecord: ErrorRecord = {
      trackId,
      trackName,
      artist: context?.artist,
      errorType,
      errorMessage,
      timestamp: new Date(),
      context
    };

    const trackErrors = this.errors.get(trackId) || [];
    trackErrors.push(errorRecord);
    this.errors.set(trackId, trackErrors);

    // 13개 오류 도달 시 경고
    if (trackErrors.length === this.CRITICAL_ERROR_THRESHOLD) {
      this.reportCriticalErrors(trackId);
    }

    // 콘솔에 오류 로그
    logger.flo.error(`[${errorType}] ${trackName}: ${errorMessage}`, {
      trackId,
      errorCount: trackErrors.length,
      ...context
    });
  }

  // 특정 트랙의 오류 요약
  getErrorSummary(trackId: string): ErrorSummary | null {
    const trackErrors = this.errors.get(trackId);
    if (!trackErrors || trackErrors.length === 0) return null;

    const errorTypes = new Map<string, number>();
    trackErrors.forEach(error => {
      const count = errorTypes.get(error.errorType) || 0;
      errorTypes.set(error.errorType, count + 1);
    });

    return {
      trackId,
      trackName: trackErrors[0].trackName,
      artist: trackErrors[0].artist,
      totalErrors: trackErrors.length,
      errorTypes,
      firstOccurrence: trackErrors[0].timestamp,
      lastOccurrence: trackErrors[trackErrors.length - 1].timestamp,
      isCritical: trackErrors.length >= this.CRITICAL_ERROR_THRESHOLD
    };
  }

  // 모든 오류 요약
  getAllErrorSummaries(): ErrorSummary[] {
    const summaries: ErrorSummary[] = [];
    this.errors.forEach((_, trackId) => {
      const summary = this.getErrorSummary(trackId);
      if (summary) summaries.push(summary);
    });
    return summaries.sort((a, b) => b.totalErrors - a.totalErrors);
  }

  // 치명적 오류 보고 (13개 이상)
  private reportCriticalErrors(trackId: string): void {
    const summary = this.getErrorSummary(trackId);
    if (!summary) return;

    console.error('🚨 CRITICAL ERROR THRESHOLD REACHED 🚨');
    console.error(`Track: ${summary.trackName}${summary.artist ? ` by ${summary.artist}` : ''}`);
    console.error(`Track ID: ${trackId}`);
    console.error(`Total Errors: ${summary.totalErrors}`);
    console.error('Error Breakdown:');
    
    summary.errorTypes.forEach((count, type) => {
      console.error(`  - ${type}: ${count} occurrences`);
    });

    console.error(`First Error: ${summary.firstOccurrence.toISOString()}`);
    console.error(`Last Error: ${summary.lastOccurrence.toISOString()}`);

    // 사용자에게 알림 (옵션)
    if (typeof window !== 'undefined') {
      const errorMessage = `⚠️ ${summary.trackName}${summary.artist ? ` by ${summary.artist}` : ''} has encountered ${summary.totalErrors} errors. This track may not play correctly.`;
      
      // 세션 스토리지에 저장
      sessionStorage.setItem(`flo_critical_error_${trackId}`, JSON.stringify({
        trackName: summary.trackName,
        artist: summary.artist,
        errorCount: summary.totalErrors,
        timestamp: new Date().toISOString()
      }));
    }
  }

  // 특정 트랙 오류 초기화
  clearTrackErrors(trackId: string): void {
    this.errors.delete(trackId);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(`flo_critical_error_${trackId}`);
    }
  }

  // 모든 오류 초기화
  clearAllErrors(): void {
    this.errors.clear();
    if (typeof window !== 'undefined') {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('flo_critical_error_')) {
          sessionStorage.removeItem(key);
        }
      });
    }
  }

  // 오류 보고서 생성
  generateErrorReport(): string {
    const summaries = this.getAllErrorSummaries();
    if (summaries.length === 0) return 'No errors recorded.';

    let report = '=== FLO Error Report ===\n\n';
    
    const criticalErrors = summaries.filter(s => s.isCritical);
    const normalErrors = summaries.filter(s => !s.isCritical);

    if (criticalErrors.length > 0) {
      report += '🚨 CRITICAL ERRORS (13+ occurrences):\n';
      criticalErrors.forEach(summary => {
        report += `\n📌 ${summary.trackName}${summary.artist ? ` - ${summary.artist}` : ''}\n`;
        report += `   Track ID: ${summary.trackId}\n`;
        report += `   Total Errors: ${summary.totalErrors}\n`;
        report += `   Error Types:\n`;
        summary.errorTypes.forEach((count, type) => {
          report += `     - ${type}: ${count}x\n`;
        });
      });
    }

    if (normalErrors.length > 0) {
      report += '\n⚠️ OTHER ERRORS:\n';
      normalErrors.forEach(summary => {
        report += `\n📌 ${summary.trackName}${summary.artist ? ` - ${summary.artist}` : ''}\n`;
        report += `   Total Errors: ${summary.totalErrors}\n`;
      });
    }

    report += '\n========================\n';
    return report;
  }

  // 디버그 정보 출력
  debug(): void {
    console.log('FLO Error Tracker Debug Info:');
    console.log('Total tracks with errors:', this.errors.size);
    this.getAllErrorSummaries().forEach(summary => {
      console.log(`- ${summary.trackName}: ${summary.totalErrors} errors${summary.isCritical ? ' (CRITICAL)' : ''}`);
    });
  }
}

// 싱글톤 인스턴스
export const floErrorTracker = new FloErrorTracker();

// 편의 함수들
export const recordFloError = (
  trackId: string,
  trackName: string,
  errorType: string,
  errorMessage: string,
  context?: any
) => floErrorTracker.recordError(trackId, trackName, errorType, errorMessage, context);

export const getFloErrorSummary = (trackId: string) => floErrorTracker.getErrorSummary(trackId);

export const getFloErrorReport = () => floErrorTracker.generateErrorReport();

export const clearFloErrors = (trackId?: string) => {
  if (trackId) {
    floErrorTracker.clearTrackErrors(trackId);
  } else {
    floErrorTracker.clearAllErrors();
  }
};

// 특정 트랙의 오류 모니터링 (Love Is Like 등)
export const monitorProblematicTrack = (trackName: string, artist?: string) => {
  const summaries = floErrorTracker.getAllErrorSummaries();
  const problematicTrack = summaries.find(s => 
    s.trackName.toLowerCase().includes(trackName.toLowerCase()) &&
    (!artist || s.artist?.toLowerCase().includes(artist.toLowerCase()))
  );
  
  if (problematicTrack) {
    console.warn(`⚠️ Monitoring: ${problematicTrack.trackName}`);
    console.warn(`Current errors: ${problematicTrack.totalErrors}`);
    if (problematicTrack.isCritical) {
      console.error('🚨 This track has reached critical error threshold!');
    }
    return problematicTrack;
  }
  
  return null;
};