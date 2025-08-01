export const registerEmail = (
  url: string,
): Promise<{ subject: string; html: string }> => {
  return new Promise((resolve) => {
    const subject = '[Alice] 이메일 인증을 완료해 주세요';
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #ff6b35; margin: 0;">Alice</h1>
      </div>
      
      <h2 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 10px;">이메일 인증</h2>
      
      <p style="line-height: 1.6;">안녕하세요,</p>
      
      <p style="line-height: 1.6;">
        Alice에 가입해 주셔서 감사합니다. 
        회원가입을 완료하려면 아래 버튼을 클릭하여 이메일 주소를 인증해 주세요.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}" 
           style="display: inline-block; background-color: #ff6b35; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold; font-size: 16px;">
          이메일 인증하기
        </a>
      </div>
      
      <p style="line-height: 1.6; font-size: 14px; color: #666;">
        또는 아래 링크를 브라우저에 복사하여 붙여넣으세요:<br>
        <a href="${url}" style="color: #ff6b35; word-break: break-all;">${url}</a>
      </p>
      
      <div style="background-color: #f8f9fa; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #666;">
          <strong>중요:</strong> 이 링크는 10분 후에 만료됩니다. 
          만료된 경우 다시 회원가입을 진행해 주세요.
        </p>
      </div>
      
      <p style="line-height: 1.6; font-size: 14px; color: #666;">
        만약 이 이메일을 요청하지 않으셨다면 무시하셔도 됩니다.
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        질문이나 문제가 있으시면 언제든지 문의해 주세요.<br>
        <strong>Alice는 절대 사용자의 비밀번호나 개인정보를 묻는 이메일을 보내지 않습니다.</strong>
      </p>
      
      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #999; margin: 0;">
          이 메시지는 Alice에서 발송되었습니다.
        </p>
      </div>
    </div>
  `;

    resolve({ subject, html });
  });
};