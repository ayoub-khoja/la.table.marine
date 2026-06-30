import MessagesTable from "@components/admin/MessagesTable";

export const metadata = {
  title: "Message",
};

const MessagesPage = () => {
  return (
    <>
      <header className="tst-admin-panel__header">
        <h1>Message</h1>
        <p>Consultez et répondez aux messages des clients.</p>
      </header>
      <MessagesTable />
    </>
  );
};

export default MessagesPage;
