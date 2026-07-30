import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getRedirectPath } from '../lib/authRedirects';

const OPTIONS = [
  { role: 'admin', label: 'Admin' },
  { role: 'driver', label: 'Driver' },
  { role: 'customer', label: 'Member' },
];

/**
 * Owner-only hub inspector: switch Admin / Driver / Member without changing DB role.
 */
export default function HubSwitcher() {
  const { isOwner, activeViewRole, setActiveViewRole } = useAuth();
  const navigate = useNavigate();

  if (!isOwner) return null;

  const current = activeViewRole === 'member' ? 'customer' : activeViewRole;

  const onChange = (role) => {
    setActiveViewRole(role);
    navigate(getRedirectPath(role));
  };

  return (
    <div className="hub-switcher" role="group" aria-label="Inspect hub">
      {OPTIONS.map((opt) => (
        <button
          key={opt.role}
          type="button"
          className={
            current === opt.role
              ? 'hub-switcher-btn hub-switcher-btn-active'
              : 'hub-switcher-btn'
          }
          onClick={() => onChange(opt.role)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
