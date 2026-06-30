import "./admin-root.css";
import AppData from "@data/app.json";

export const metadata = {
  title: {
    default: "Administration",
    template: "%s | Administration — " + AppData.settings.siteName,
  },
  robots: {
    index: false,
    follow: false,
  },
};

const AdminLayout = ({ children }) => {
  return (
    <div className="tst-admin-root" data-admin-layout>
      {children}
    </div>
  );
};

export default AdminLayout;
