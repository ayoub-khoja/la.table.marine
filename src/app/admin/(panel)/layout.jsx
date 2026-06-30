import { redirect } from "next/navigation";
import { getSession } from "@library/admin/session";
import { ADMIN_LOGIN_PATH } from "@library/admin/constants";
import AdminSidebar from "@components/admin/AdminSidebar";

const PanelLayout = async ({ children }) => {
  const session = await getSession();

  if (!session) {
    redirect(ADMIN_LOGIN_PATH);
  }

  return (
    <div className="tst-admin-panel" data-admin-panel>
      <AdminSidebar userEmail={session.email} />
      <div className="tst-admin-panel__main">
        <main className="tst-admin-panel__content">{children}</main>
      </div>
    </div>
  );
};

export default PanelLayout;
