import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { siteConfig } from "../config";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Tours", to: "/tours" },
  { label: "Packages", to: "/packages" },
  { label: "Vehicles", to: "/vehicles" },
  { label: "Drivers", to: "/drivers" },
  { label: "Reviews", to: "/reviews" },
  { label: "Membership", to: "/membership" },
  { label: "About", hash: "about" },
  { label: "Contact", hash: "contact" },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
}

/** Floating menu + WhatsApp + call CTAs on public pages */
export default function ContactFab() {
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef(null);
  const sheetRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusable = sheetRef.current.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const onPointerDown = (event) => {
      if (barRef.current && !barRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    const firstLink = sheetRef.current?.querySelector("a, button");
    firstLink?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const goToHash = (hash) => {
    closeMenu();
    if (location.pathname === "/") {
      scrollToId(hash);
      return;
    }
    navigate(`/#${hash}`);
  };

  return (
    <>
      <button
        type="button"
        className={`contact-fab-sheet-backdrop${menuOpen ? " open" : ""}`}
        aria-label="Close menu"
        tabIndex={menuOpen ? 0 : -1}
        onClick={closeMenu}
      />
      <div className="contact-cta-bar" aria-label="Contact shortcuts" ref={barRef}>
        <div className="contact-fab-sheet-wrap">
          {menuOpen ? (
            <nav
              id="contact-fab-sheet"
              ref={sheetRef}
              className="contact-fab-sheet open"
              aria-label="Primary"
            >
              <ul>
                {NAV_LINKS.map((item) => (
                  <li key={item.label}>
                    {item.hash ? (
                      <button
                        type="button"
                        className="link-button"
                        onClick={() => goToHash(item.hash)}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <Link className="link-button" to={item.to} onClick={closeMenu}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
                <li>
                  <Link className="btn btn-primary" to="/book" onClick={closeMenu}>
                    Book Now
                  </Link>
                </li>
              </ul>
            </nav>
          ) : null}
          <button
            type="button"
            className="contact-cta-menu"
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            aria-controls="contact-fab-sheet"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="contact-cta-menu-bar" />
            <span className="contact-cta-menu-bar" />
            <span className="contact-cta-menu-bar" />
          </button>
        </div>
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
    </>
  );
}
