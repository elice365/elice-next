import https from 'https';
import zlib from 'zlib';
import type { ProductDetail } from '@/types/coupang';
import { parseinfo } from './parse/info';


export async function info(
    productId: string,
    itemId: string,
    vendorItemId: string
): Promise<ProductDetail> {
    const apiUrl = `https://cmapi.coupang.com/modular/v1/endpoints/2334/sdp/v2/platform/products/${productId}/items/${itemId}/vendor-items/${vendorItemId}`;
    
    return new Promise((resolve) => {
        const request = https.get(apiUrl, {
            headers: {
                'Host': 'cmapi.coupang.com',
                'User-Agent': 'Coupang_New/8.7.6 (iPhone; iOS 26.0; Scale/3.00)',
                'coupang-app': 'COUPANG|IOS|26.0|8.7.6|PcLdDEA5GbVe5dPuPSAimAncn-ppPzGmSR1RIS1o6m205Rx8Ath814ceY_eXwHB3J7RTavWM0Rw3pQRGVk2RhH5o3HnD_rSoO2k1KQtB1Xa8FDdy-McoJPpS|d49c907563bf79b74f655d1e99c93f2b884e6295f43b0d35764f8ad9730ff72b|0388ECC1-0463-4C13-9C88-2C843D39F416|Y|iPhone|412A4196-BBD2-427C-BBD8-89A02FD24020|00000000-0000-0000-0000-000000000000|IPHONE_3X|17049689286000817865793||0|112435219|cellular||ez6YOmid2w3KR0MZe1-YIWAZv-3j2D_1AVTbXPoEFAEWECqXAn1NkkkpjktnC-I8j31rzkoJpWCF1KLUeXYVs8NWk7pXVIOxGk4pfaRSqLfq|lunQGPjvVGi1SICQlvNiVjDK0uWGiB9EIjs7u4f9zFSsHXuUlHDg1LK7FZgXeOgbXCd7eTcUHSRx7TG80qnmtbM6YrCO9p76oxRGKHQTTdfcsdlTbR2wlK7I3t_2B6ZPg8r1Fz1l8JzjALhN0213qMGj9Hynb-cd-HVrPZM-sktlO0mcFTCpBX_eYiMdFAFHrmJd-I9hDe1V3kqm_gj7dFpk7sqmKLk56fx5kUHpoHuoxpwkojERPTE|Asia/Seoul|1bae1e6d1efa439d8214af6f583c276c933c9e58|35ed933fb91eb0306642a3a4169cdab7|1290|430||UICTContentSizeCategoryXS|true'
            }
        }, (response) => {
            let responseStream: any = response;
            const encoding = response.headers['content-encoding'];
            
            if (encoding === 'gzip') {
                responseStream = response.pipe(zlib.createGunzip());
            } else if (encoding === 'deflate') {
                responseStream = response.pipe(zlib.createInflate());
            } else if (encoding === 'br') {
                responseStream = response.pipe(zlib.createBrotliDecompress());
            }
            
            let data = '';
            responseStream.on('data', (chunk: Buffer) => {
                data += chunk.toString('utf8');
            });
            
            responseStream.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    const result = parseinfo(jsonData);
                    resolve(result);
                } catch (error) {
                    resolve({
                        success: false,
                        error: error instanceof Error ? error.message : String(error)
                    });
                }
            });
            
            responseStream.on('error', (error: Error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });
        });
        
        request.on('error', (error: Error) => {
            resolve({
                success: false,
                error: error.message
            });
        });
        
        request.setTimeout(10000, () => {
            request.destroy();
            resolve({
                success: false,
                error: 'Request timeout'
            });
        });
    });
}

