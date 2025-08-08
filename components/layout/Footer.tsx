"use client";

import { Icon } from "@/components/ui/Icon";
import { WindowLink } from "@/components/ui/WindowLink";
import { Translated } from "@/components/i18n/Translated";
export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-footer text-[var(--text-color)] text-sm">
      <div className="max-w-7xl mx-auto px-5 gap-12 py-12 flex flex-col sm:flex-row justify-evenly">
        <div className="flex gap-12 flex-col">
          <div className="border-l-3 px-3 flex flex-col gap-3  py-1">
            <div className="font-bold text-[var(--text-color)] text-xl">
              {Translated("footer", "company")}
            </div>
            <pre className="text-[var(--text-color)] text-sm whitespace-pre-wrap">
              {Translated("footer", "commitment")}
            </pre>
            <div className="flex space-x-3">
              <a
                href="https://facebook.com/elice365"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Page Redirect"
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
              >
                <Icon name="Facebook" size={18} className="opacity-60 hover:text-hover" fill="white" />
              </a>
              <a
                href="https://instagram.com/elice365"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram Page Redirect"
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded p-1"
              >
                <Icon name="Instagram" size={18} className="opacity-60 hover:text-hover" />
              </a>
            </div>
          </div>
          <div className="border-l-3 px-5 flex flex-col justify-between py-1">
            <h2 className="text-[var(--text-color)] font-semibold mb-2">MENU</h2>
            <ul className="space-y-1">
              <li><a href="/notice" className="hover:underline">{Translated("router", "notice")}</a></li>
              <li><a href="/blog" className="hover:underline">{Translated("router", "blog")}</a></li>
              <li><a href="/product" className="hover:underline">{Translated("router", "product")}</a></li>
            </ul>
          </div>
        </div>
        <div className="flex gap-10 flex-col">
          <div className="border-l-3 px-5 flex flex-col justify-between py-1">
            <h2 className="text-[var(--text-color)] font-semibold mb-2">COMPANY INFO</h2>
            <div className="space-y-1 text-sm opacity-60">
              <p>{Translated("footer", "company")}</p>
              <p>{Translated("footer", "representative")}:{Translated("footer", "owner")}</p>
              <p> {Translated("footer", "address")}</p>
              <p suppressHydrationWarning={true}>
                <span>{Translated("footer", "business")}:</span>
                <span
                  data-auto-link="false"
                  style={{
                    WebkitTouchCallout: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none'
                  }}
                >
                  {Translated("footer", "businessNumber")}
                </span>
                &nbsp;
                [ <WindowLink
                  link="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=7190703250"
                  type="popup" size={{ width: 450, height: 600 }}
                  className="text-blue-500 underline hover:text-blue-400 cursor-pointer">
                  {Translated("footer", "businessCheck")}
                </WindowLink> ]
              </p>
              <p>{Translated("footer", "businessOrder")}:{Translated("footer", "businessOrderNumber")}</p>
            </div>
          </div>
          <div>
            <div className="border-l-3 px-5 flex flex-col justify-between py-1">
              <h2 className="text-[var(--text-color)] font-semibold mb-2">CONTACT</h2>
              <div className="space-y-1 text-sm opacity-60">
                <p suppressHydrationWarning={true}>
                  Tel:{' '}
                  <span
                    data-auto-link="false"
                    style={{
                      WebkitTouchCallout: 'none',
                      WebkitUserSelect: 'none',
                      userSelect: 'none'
                    }}
                  >
                    010-1234-5678
                  </span>
                </p>
                <p>Email: {Translated("footer", "mail")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--border-color)]  py-2 bg-footer text-[var(--text-color)] text-xs text-center">
        <p>
          ⓒ {currentYear}. {Translated("footer", "company")} Co. All
          rights reserved.
        </p>
        <p className="mt-1">
          Hosting by Vercel{' '}
          <span className="mx-2 text-gray-400">|</span>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Terms and Conditions
          </a>
          <span className="mx-2 text-gray-400">|</span>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </footer>
  );
};
