import AppData from "@data/app.json";

function getPhoneNumber() {
  const item = AppData.footer?.contact?.items?.find(
    (entry) => entry.label?.toLowerCase() === "téléphone"
  );
  return item?.value || "01 88 93 76 72";
}

const FloatingCallButton = () => {
  const phoneDisplay = getPhoneNumber();
  const phoneHref = phoneDisplay.replace(/[^\d+]/g, "");

  return (
    <a
      href={`tel:${phoneHref}`}
      className="tst-floating-call"
      aria-label={`Appeler La Table Marine au ${phoneDisplay}`}
      title={`Appeler ${phoneDisplay}`}
    >
      <i className="fas fa-phone" aria-hidden="true" />
    </a>
  );
};

export default FloatingCallButton;
