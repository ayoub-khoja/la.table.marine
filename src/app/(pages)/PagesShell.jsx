"use client";

import Header from "@layouts/headers/Index";
import Footer from "@layouts/footers/Index";

const PagesShell = ({ children }) => {
  return (
    <>
      <Header layout="default" />
      {children}
      <Footer layout="default" />
    </>
  );
};

export default PagesShell;
