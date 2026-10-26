"use client";

import Data from "@data/sections/schedule.json";
import Link from "next/link";

const GROUP_ICONS = {
  week: "fa-calendar-alt",
  weekend: "fa-glass-cheers",
};

function getActiveGroupId() {
  const day = new Date().getDay();
  return day === 5 || day === 6 ? "weekend" : "week";
}

const ScheduleSection = () => {
  const activeGroupId = getActiveGroupId();

  return (
    <>
      <div className="tst-banner-sm">
        <div className="tst-cover-frame">
          <img src={Data.image.url} alt={Data.image.alt} className="tst-cover" />
          <div className="tst-overlay" />
        </div>

        <div className="row align-items-center">
          <div className="col-lg-8">
            <div className="tst-text-frame">
              <div className="tst-suptitle tst-suptitle-mobile-center tst-white-2 tst-mb-15">
                {Data.subtitle}
              </div>
              <h2
                className="tst-white-2 tst-mb-30"
                dangerouslySetInnerHTML={{ __html: Data.title }}
              />
              <p
                className="tst-text tst-white-2 tst-mb-30"
                dangerouslySetInnerHTML={{ __html: Data.description }}
              />

              <div className="tst-btn-mobile">
                <Link
                  href={Data.button1.link}
                  className="tst-btn tst-res-btn tst-mr-30"
                >
                  {Data.button1.label}
                </Link>
                <Link href={Data.button2.link} className="tst-label tst-white-2">
                  {Data.button2.label}
                </Link>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="tst-wh-frame tst-schedule-card">
              <div className="tst-schedule-card__head">
                <span className="tst-schedule-card__head-icon" aria-hidden="true">
                  <i className="fas fa-clock" />
                </span>
                <span className="tst-schedule-card__head-text">Ouvert 7j/7</span>
              </div>

              {Data.groups.map((group) => (
                <div
                  key={group.id}
                  className={`tst-schedule-card__block${
                    group.id === activeGroupId ? " is-active" : ""
                  }`}
                >
                  <div className="tst-schedule-card__block-title">
                    <i
                      className={`fas ${GROUP_ICONS[group.id] || "fa-calendar-alt"}`}
                      aria-hidden="true"
                    />
                    <span>{group.label}</span>
                  </div>

                  <div className="tst-schedule-card__slots">
                    <div className="tst-schedule-card__slot tst-schedule-card__slot--lunch">
                      <span className="tst-schedule-card__slot-icon" aria-hidden="true">
                        <i className="fas fa-sun" />
                      </span>
                      <span className="tst-schedule-card__slot-body">
                        <small>Midi</small>
                        <strong>{group.lunch}</strong>
                      </span>
                    </div>

                    <div className="tst-schedule-card__slot tst-schedule-card__slot--dinner">
                      <span className="tst-schedule-card__slot-icon" aria-hidden="true">
                        <i className="fas fa-moon" />
                      </span>
                      <span className="tst-schedule-card__slot-body">
                        <small>Soir</small>
                        <strong>{group.dinner}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ScheduleSection;
