"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import AppData from "@data/app.json";
import { ADMIN_NAV_ITEMS } from "@library/admin/constants";

const AdminSidebar = ({ userEmail }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);

    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      router.push(data.redirect || "/admin");
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  return (
    <aside className="tst-admin-sidebar">
      <div className="tst-admin-sidebar__brand">
        <Image
          src={AppData.header.logo.image}
          alt={AppData.header.logo.alt}
          width={140}
          height={56}
          className="tst-admin-sidebar__logo"
          priority
        />
        <span className="tst-admin-sidebar__badge">Administration</span>
      </div>

      <nav className="tst-admin-sidebar__nav" aria-label="Navigation admin">
        <ul>
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`tst-admin-sidebar__link${isActive ? " is-active" : ""}`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <i className={`fas ${item.icon}`} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="tst-admin-sidebar__footer">
        {userEmail && (
          <p className="tst-admin-sidebar__user" title={userEmail}>
            {userEmail}
          </p>
        )}
        <button
          type="button"
          className="tst-admin-sidebar__logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <i className="fas fa-sign-out-alt" aria-hidden="true" />
          {loggingOut ? "Déconnexion…" : "Logout"}
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
