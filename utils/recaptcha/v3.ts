// reCAPTCHA v3 Solver with TypeScript and Domain Configuration

import { ReCaptchaVersionDetector } from './version';
import { randomBytes, randomInt } from 'crypto';

/**
 * Proxy configuration interface
 */
interface ProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
}

/**
 * Domain-specific configuration
 */
interface DomainConfig {
  name: string;
  baseUrl: string;
  siteKey?: string;
  version?: string;
  referer?: string;
  origin?: string;
}

/**
 * reCAPTCHA solver configuration
 */
interface ReCaptchaConfig {
  timeout?: number;
  proxy?: ProxyConfig;
  userAgent?: string;
  domain: string;
  siteKey?: string;
  version?: string;
  debug?: boolean;
}

/**
 * Parsed anchor URL parameters
 */
interface AnchorParams {
  k: string;
  co: string;
  v: string;
  size: string;
  cb: string;
  hl: string;
}

/**
 * reCAPTCHA response interface
 */
interface ReCaptchaResponse {
  token: string;
  success: boolean;
  timestamp: number;
  domain: string;
  siteKey: string;
}

/**
 * Domain configuration generator
 */
class DomainConfigGenerator {
  static fromUrl(urlString: string, siteKey?: string, version?: string): DomainConfig {
    try {
      let normalizedUrl = urlString;
      if (!urlString.includes('://')) {
        normalizedUrl = `https://${urlString}`;
      }
      
      const url = new URL(normalizedUrl);
      const baseUrl = `${url.protocol}//${url.hostname}`;
      
      return {
        name: this.generateFriendlyName(url.hostname),
        baseUrl,
        siteKey,
        version: version || 'xds0rzGrktR88uEZ2JUvdgOY',
        referer: `${baseUrl}/`,
        origin: baseUrl
      };
    } catch {
      throw new Error(`Invalid domain URL: ${urlString}`);
    }
  }

  private static generateFriendlyName(hostname: string): string {
    const cleanHostname = hostname.replace(/^www\./, '');
    const mainPart = cleanHostname.split('.')[0];
    
    const nameMap: Record<string, string> = {
      'music-flo': 'FLO Music',
      'flo': 'FLO Music',
      'melon': 'Melon',
      'genie': 'Genie Music',
      'bugs': 'Bugs Music',
      'vibe': 'Vibe'
    };
    
    return nameMap[mainPart.toLowerCase()] || mainPart.charAt(0).toUpperCase() + mainPart.slice(1);
  }

  static isValidDomain(urlString: string): boolean {
    try {
      let normalizedUrl = urlString;
      if (!urlString.includes('://')) {
        normalizedUrl = `https://${urlString}`;
      }
      new URL(normalizedUrl);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * TypeScript reCAPTCHA v3 Solver
 */
export class ReCaptchaV3Solver {
  private readonly config: Required<Omit<ReCaptchaConfig, 'proxy' | 'siteKey' | 'version'>> & { 
    proxy: ProxyConfig | null;
    siteKey?: string;
    version?: string;
  };
  private readonly domainConfig: DomainConfig;
  private readonly axiosInstance: any;

  constructor(config: ReCaptchaConfig) {
    if (!config.domain) {
      throw new Error('Domain is required');
    }

    if (!DomainConfigGenerator.isValidDomain(config.domain)) {
      throw new Error(`Invalid domain: ${config.domain}`);
    }

    this.config = {
      timeout: config.timeout || 20000,
      proxy: config.proxy || null,
      userAgent: config.userAgent || 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      domain: config.domain,
      siteKey: config.siteKey,
      version: config.version,
      debug: config.debug || false
    };

    this.domainConfig = DomainConfigGenerator.fromUrl(
      this.config.domain,
      this.config.siteKey,
      this.config.version
    );
    
    this.axiosInstance = this.createAxiosInstance();
    
    if (this.config.debug) {
      console.log('🔧 ReCaptcha Solver initialized:', this.domainConfig.name);
    }
  }

  public setSiteKey(siteKey: string): void {
    this.domainConfig.siteKey = siteKey;
  }

  public setVersion(version: string): void {
    this.domainConfig.version = version;
  }

  private createAxiosInstance(): any {
    const axios = require('axios');
    const https = require('https');

    const config: any = {
      timeout: this.config.timeout,
      validateStatus: () => true,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    };

    if (this.config.proxy) {
      config.proxy = this.config.proxy;
    }

    return axios.create(config);
  }

  private generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // 암호학적으로 안전한 난수 생성
    const randomValues = randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }
    return result;
  }

  private parseAnchorUrl(anchorUrl: string): AnchorParams {
    const url = new URL(anchorUrl);
    return {
      k: url.searchParams.get('k') || '',
      co: url.searchParams.get('co') || '',
      v: url.searchParams.get('v') || this.domainConfig.version || 'xds0rzGrktR88uEZ2JUvdgOY',
      size: url.searchParams.get('size') || 'invisible',
      cb: url.searchParams.get('cb') || this.generateRandomString(12),
      hl: url.searchParams.get('hl') || 'ko'
    };
  }

  private buildAnchorUrl(siteKey: string): string {
    const encodedDomain = Buffer.from(this.domainConfig.baseUrl + ':443').toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/={0,2}$/, ''); // 보안: Base64 패딩은 최대 2개로 한정 (S5852 대응)

    const params = new URLSearchParams({
      ar: '1',
      k: siteKey,
      co: `aHR0cHM6Ly8${encodedDomain}`,
      hl: 'ko',
      v: this.domainConfig.version || 'xds0rzGrktR88uEZ2JUvdgOY',
      size: 'invisible',
      cb: this.generateRandomString(12)
    });

    return `https://www.google.com/recaptcha/api2/anchor?${params.toString()}`;
  }

  private async getAnchorToken(anchorUrl: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(anchorUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': this.domainConfig.referer
        }
      });

      if (response.status !== 200) {
        throw new Error(`Anchor request failed with status ${response.status}`);
      }

      const tokenMatch = response.data.match(/\brecaptcha-token\b[^>]{0,200}\bvalue="([^"]{1,2048})"/);
      if (!tokenMatch) {
        const altMatch = response.data.match(/\bid="recaptcha-token"\s+value="([^"]{1,2048})"/);
        if (!altMatch) {
          throw new Error('Could not find recaptcha-token');
        }
        return altMatch[1];
      }
      
      return tokenMatch[1];
    } catch (error) {
      throw new Error(`Anchor token error: ${(error as Error).message}`);
    }
  }

  private generateBackgroundData(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '!1';
    
    // 암호학적으로 안전한 난수 생성
    const randomValues = randomBytes(200);
    for (let i = 0; i < 200; i++) {
      result += chars.charAt(randomValues[i] % chars.length);
    }
    return result;
  }

  private async getReloadToken(params: AnchorParams, anchorToken: string): Promise<string> {
    try {
      const reloadUrl = `https://www.google.com/recaptcha/api2/reload?k=${params.k}`;
      
      const postData = new URLSearchParams({
        'v': params.v,
        'reason': 'q',
        'c': anchorToken,
        'k': params.k,
        'co': params.co,
        'hl': params.hl,
        'size': params.size,
        'chr': '[' + [89, 64, 27].join(',') + ']',
        'vh': randomInt(0, 1000000000).toString(), // 암호학적으로 안전한 난수
        'bg': this.generateBackgroundData()
      });

      const response = await this.axiosInstance.post(reloadUrl, postData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': 'https://www.google.com',
          'Referer': `https://www.google.com/recaptcha/api2/anchor?${new URLSearchParams(params as any).toString()}`,
          'Accept': '*/*'
        }
      });

      if (response.status !== 200) {
        throw new Error(`Reload request failed with status ${response.status}`);
      }

      const rrespMatch = response.data.match(/\["rresp","([^"]{10,4096})"/);
      if (!rrespMatch) {
        const altMatch = response.data.match(/,\["([^"]{10,4096})"/);
        if (altMatch && altMatch[1].length > 100) {
          return altMatch[1];
        }
        throw new Error('Could not extract rresp token');
      }
      
      return rrespMatch[1];
    } catch (error) {
      throw new Error(`Reload token error: ${(error as Error).message}`);
    }
  }

  public async updateVersion(siteKey?: string): Promise<string> {
    try {
      const resolvedSiteKey = siteKey || this.domainConfig.siteKey;
      if (!resolvedSiteKey) {
        throw new Error('Site key is required for version detection');
      }

      const result = await ReCaptchaVersionDetector.autoDetect(resolvedSiteKey, this.domainConfig.baseUrl);

      if (result.version && ReCaptchaVersionDetector.isValidVersion(result.version)) {
        this.domainConfig.version = result.version;
        
        if (this.config.debug) {
          console.log(`🔄 Updated version: ${result.version} (${result.confidence})`);
        }
        
        return result.version;
      }

      throw new Error('Failed to detect valid version');
    } catch (error) {
      if (this.config.debug) {
        console.warn('Version detection failed:', (error as Error).message);
      }
      return this.domainConfig.version || 'xds0rzGrktR88uEZ2JUvdgOY';
    }
  }

  public async solveFromUrl(anchorUrl: string): Promise<ReCaptchaResponse> {
    try {
      if (this.config.debug) {
        console.log('🎯 Starting reCAPTCHA solve for:', this.domainConfig.name);
      }
      
      const params = this.parseAnchorUrl(anchorUrl);
      
      const anchorToken = await this.getAnchorToken(anchorUrl);
      if (this.config.debug) {
        console.log('✅ Got anchor token');
      }
      
      const finalToken = await this.getReloadToken(params, anchorToken);
      
      if (this.config.debug) {
        console.log('🎉 reCAPTCHA solved successfully!');
      }
      
      return {
        token: finalToken,
        success: true,
        timestamp: Date.now(),
        domain: this.domainConfig.name,
        siteKey: params.k
      };
      
    } catch (error) {
      throw new Error(`reCAPTCHA solve failed: ${(error as Error).message}`);
    }
  }

  public async solve(siteKey?: string, _action: string = 'submit'): Promise<ReCaptchaResponse> {
    try {
      const resolvedSiteKey = siteKey || this.domainConfig.siteKey;
      
      if (!resolvedSiteKey) {
        throw new Error('Site key is required');
      }

      if (this.config.debug) {
        console.log('🚀 Direct solve for domain:', this.domainConfig.name);
      }
      
      const anchorUrl = this.buildAnchorUrl(resolvedSiteKey);
      return await this.solveFromUrl(anchorUrl);
      
    } catch (error) {
      throw new Error(`Direct solve failed: ${(error as Error).message}`);
    }
  }

  public static isValidDomain(domain: string): boolean {
    return DomainConfigGenerator.isValidDomain(domain);
  }

  public static forDomain(domainUrl: string, options: Omit<ReCaptchaConfig, 'domain'> = {}): ReCaptchaV3Solver {
    return new ReCaptchaV3Solver({
      ...options,
      domain: domainUrl
    });
  }

  public static withSiteKey(domainUrl: string, siteKey: string, options: Omit<ReCaptchaConfig, 'domain' | 'siteKey'> = {}): ReCaptchaV3Solver {
    return new ReCaptchaV3Solver({
      ...options,
      domain: domainUrl,
      siteKey
    });
  }
}

// Export types
export type {
  ReCaptchaConfig,
  DomainConfig,
  ReCaptchaResponse,
  ProxyConfig,
  AnchorParams
};

// Export domain configuration generator
export { DomainConfigGenerator };

// Default export
export default ReCaptchaV3Solver;
