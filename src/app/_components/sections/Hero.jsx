"use client";

import Data from "@data/sections/hero.json";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { ScrollAnimation } from "@common/scrollAnims";

const Hero = ( { bgType } ) => {
    const videoRef = useRef(null);

    useEffect(() => {
        ScrollAnimation();
    }, []);

    useEffect(() => {
        if (bgType !== "video" || !videoRef.current) return;

        const video = videoRef.current;

        const startPlayback = () => {
            video.muted = true;
            video.play().catch(() => {});
        };

        if ("IntersectionObserver" in window) {
            const observer = new IntersectionObserver(
                (entries) => {
                    if (entries.some((entry) => entry.isIntersecting)) {
                        startPlayback();
                        observer.disconnect();
                    }
                },
                { threshold: 0.1 }
            );

            observer.observe(video);
            return () => observer.disconnect();
        }

        startPlayback();
    }, [bgType]);

    return (
        <>
            {/* banner */}
            <div className={`tst-banner${bgType === "video" ? " tst-banner--video" : ""}`}>
                <div className="tst-cover-frame">
                    {bgType == 'video' ? (
                    <video
                        ref={videoRef}
                        className="tst-cover"
                        width={Data.video.width}
                        height={Data.video.height}
                        poster={Data.video.poster}
                        muted
                        playsInline
                        autoPlay
                        loop
                        preload="none"
                        aria-hidden="true"
                    >
                        <source src={Data.video.url} type="video/mp4" />
                        {Data.video.alt}
                    </video>
                    ) : (
                    <img src={Data.image.url} alt={Data.image.alt} className="tst-cover tst-parallax" />
                    )}
                    <div className="tst-overlay"></div>
                </div>
                <div className="tst-banner-content-frame">
                    <div className="container">
                        <div className="tst-main-title-frame">
                        <div className="tst-main-title">
                            <div className="tst-suptitle tst-suptitle-mobile-center tst-text-shadow tst-white-2 tst-mb-15">{Data.subtitle}</div>
                            <h1 className="tst-white-2 tst-text-shadow tst-mb-30" dangerouslySetInnerHTML={{__html : Data.title}} />
                            <div className="tst-text tst-text-shadow tst-text-lg tst-white-2 tst-mb-30" dangerouslySetInnerHTML={{__html : Data.description}} />
                            <div className="tst-hero-actions">
                                {Data.button1.blank ? (
                                <a href={Data.button1.link} className="tst-btn tst-btn-lg tst-btn-shadow tst-res-btn tst-hero-actions__primary" target="_blank" rel="noopener noreferrer">{Data.button1.label}</a>
                                ) : (
                                <Link href={Data.button1.link} className="tst-btn tst-btn-lg tst-btn-shadow tst-res-btn tst-hero-actions__primary">{Data.button1.label}</Link>
                                )}
                                {Data.button2.blank ? (
                                <a href={Data.button2.link} className="tst-btn tst-btn-lg tst-btn-shadow tst-res-btn tst-hero-actions__desktop tst-mr-30" target="_blank" rel="noopener noreferrer">{Data.button2.label}</a>
                                ) : (
                                <Link href={Data.button2.link} className="tst-btn tst-btn-lg tst-btn-shadow tst-res-btn tst-hero-actions__desktop tst-mr-30">{Data.button2.label}</Link>
                                )}
                                {Data.button3.blank ? (
                                <a href={Data.button3.link} className="tst-label tst-white-2 tst-hero-actions__desktop" target="_blank" rel="noopener noreferrer">{Data.button3.label}</a>
                                ) : (
                                <Link href={Data.button3.link} className="tst-label tst-white-2 tst-hero-actions__desktop">{Data.button3.label}</Link>
                                )}
                                <div className="tst-hero-actions__secondary">
                                    {Data.button2.blank ? (
                                    <a href={Data.button2.link} className="tst-hero-actions__secondary-btn" target="_blank" rel="noopener noreferrer">{Data.button2.mobileLabel || Data.button2.label}</a>
                                    ) : (
                                    <Link href={Data.button2.link} className="tst-hero-actions__secondary-btn">{Data.button2.mobileLabel || Data.button2.label}</Link>
                                    )}
                                    {Data.button3.blank ? (
                                    <a href={Data.button3.link} className="tst-hero-actions__secondary-btn" target="_blank" rel="noopener noreferrer">{Data.button3.mobileLabel || Data.button3.label}</a>
                                    ) : (
                                    <Link href={Data.button3.link} className="tst-hero-actions__secondary-btn">{Data.button3.mobileLabel || Data.button3.label}</Link>
                                    )}
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* banner end */}
        </>
    );
}
export default Hero;