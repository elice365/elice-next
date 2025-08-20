// reCAPTCHA Version Detection Utility

interface VersionDetectionResult {
  version: string | null;
  source: 'page-source' | 'api-endpoint' | 'fallback';
  confidence: 'high' | 'medium' | 'low';
  timestamp: number;
}

/**
 * reCAPTCHA Version Detector
 */
export class ReCaptchaVersionDetector {
  private static readonly DEFAULT_VERSIONS = [
    'xds0rzGrktR88uEZ2JUvdgOY',
    'rKbTvxTxwcw5VqzrtN-ICwWt',
    'fEXvNLvpE_w_LqkUpAgVw8mm'
  ];

  private static readonly VERSION_PATTERNS = [
    /v=([a-zA-Z0-9_-]{20,})/g,
    /version['"]\s*:\s*['"]([a-zA-Z0-9_-]{20,})['"]/g,
    // Avoid super-linear backtracking by limiting the span between 'recaptcha' and 'v'
    /recaptcha[^\r\n]{0,512}?v[=:]([a-zA-Z0-9_-]{20,})/g
  ];

  /**
   * Detect version from page source
   */
  static async detectFromPageSource(url: string): Promise<VersionDetectionResult> {
    try {
      const axios = require('axios');
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const html = response.data;
      
      // Try patterns to find version
      for (const pattern of this.VERSION_PATTERNS) {
        const matches = [...html.matchAll(pattern)];
        if (matches.length > 0) {
          const version = matches[0][1];
          if (version && version.length >= 20) {
            return {
              version,
              source: 'page-source',
              confidence: 'high',
              timestamp: Date.now()
            };
          }
        }
      }

      // Look for reCAPTCHA script tags
      const scriptMatches = html.match(/<script[^>]*src[^>]*recaptcha[^>]*>/gi);
      if (scriptMatches) {
        for (const script of scriptMatches) {
          const versionMatch = script.match(/v=([a-zA-Z0-9_-]{20,})/);
          if (versionMatch) {
            return {
              version: versionMatch[1],
              source: 'page-source',
              confidence: 'high',
              timestamp: Date.now()
            };
          }
        }
      }

      return this.createResult(null, 'page-source', 'low');
    } catch {
      return this.createResult(null, 'page-source', 'low');
    }
  }

  /**
   * Test versions to find working one
   */
  static async detectByTesting(siteKey: string, domain: string = 'music-flo.com'): Promise<VersionDetectionResult> {
    try {
      const axios = require('axios');
      
      for (const version of this.DEFAULT_VERSIONS) {
        try {
          const testUrl = `https://www.google.com/recaptcha/api2/anchor?ar=1&k=${siteKey}&co=aHR0cHM6Ly93d3cubXVzaWMtZmxvLmNvbTo0NDM.&hl=ko&v=${version}&size=invisible`;
          
          const response = await axios.get(testUrl, {
            timeout: 5000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
              'Referer': `https://${domain}/`
            }
          });

          if (response.data.includes('recaptcha-token') && response.status === 200) {
            return this.createResult(version, 'fallback', 'medium');
          }
        } catch {
          continue;
        }
      }

      return this.createResult(this.DEFAULT_VERSIONS[0], 'fallback', 'low');
    } catch {
      return this.createResult(this.DEFAULT_VERSIONS[0], 'fallback', 'low');
    }
  }

  /**
   * Auto-detect version using multiple methods
   */
  static async autoDetect(siteKey: string, pageUrl: string): Promise<VersionDetectionResult> {
    // Try page source first
    const pageResult = await this.detectFromPageSource(pageUrl);
    if (pageResult.version && pageResult.confidence === 'high') {
      return pageResult;
    }

    // Fallback to testing
    try {
      const domain = new URL(pageUrl).hostname;
      return await this.detectByTesting(siteKey, domain);
    } catch {
      return this.createResult(this.DEFAULT_VERSIONS[0], 'fallback', 'low');
    }
  }

  /**
   * Helper to create result objects
   */
  private static createResult(version: string | null, source: VersionDetectionResult['source'], confidence: VersionDetectionResult['confidence']): VersionDetectionResult {
    return {
      version,
      source,
      confidence,
      timestamp: Date.now()
    };
  }

  /**
   * Get current known working versions
   */
  static getKnownVersions(): string[] {
    return [...this.DEFAULT_VERSIONS];
  }

  /**
   * Validate version format
   */
  static isValidVersion(version: string): boolean {
    return /^[a-zA-Z0-9_-]{20,}$/.test(version);
  }
}

// Export types
export type { VersionDetectionResult };

// Default export
export default ReCaptchaVersionDetector;
