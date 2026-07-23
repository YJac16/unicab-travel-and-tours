import React from 'react';
import { siteConfig } from '../config';

/** Floating WhatsApp + call CTAs on public pages */
export default function ContactFab() {
  return (
    <div className="contact-cta-bar" aria-label="Contact shortcuts">
      <a
        className="contact-cta-tel"
        href={`tel:${siteConfig.phone.tel}`}
        aria-label={`Call ${siteConfig.phone.display}`}
      >
        Call
      </a>
      <a
        className="contact-cta-wa"
        href={siteConfig.whatsapp.linkWithMessage}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp UNICAB"
      >
        WhatsApp
      </a>
    </div>
  );
}
