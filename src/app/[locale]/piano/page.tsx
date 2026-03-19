"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PIANO_ROOM_BOX_STYLE = {
  width: "max(100vw, calc(100vh * 1.5))",
  height: "max(100vh, calc(100vw / 1.5))",
  transform: "translate(-50%, -50%)",
} as const;

const GLASS_CARD_STYLE = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  borderColor: "rgba(217,192,161,0.22)",
  boxShadow: "0 18px 42px rgba(0,0,0,0.30)",
} as const;

const TEXT_HIGHLIGHT_STYLE = {
  background: "rgba(43,25,18,0.48)",
  padding: "0.06rem 0.32rem",
  borderRadius: "0.35rem",
  boxDecorationBreak: "clone",
  WebkitBoxDecorationBreak: "clone",
} as const;

const FRAME_CONTROLS = [
  {
    id: "martha-argerich",
    label: "Martha Argerich frame controls",
    artist: "Martha Argerich",
    frameClassName: "left-[18.6%] top-[17.8%] h-[21.8%] w-[9.6%]",
    type: "audio",
    audioKey: "martha",
  },
  {
    id: "ludwig-van-beethoven",
    label: "Ludwig van Beethoven frame controls",
    artist: "Ludwig van Beethoven",
    frameClassName: "left-[18.9%] top-[38.1%] h-[20.8%] w-[9.2%]",
    type: "audio",
    audioKey: "beethoven",
  },
  {
    id: "frederic-chopin",
    label: "Frederic Chopin frame controls",
    artist: "Frederic Chopin",
    frameClassName: "left-[20.2%] top-[58.6%] h-[17.4%] w-[8.4%]",
    type: "audio",
    audioKey: "chopin",
  },
  {
    id: "sir-stephen-hough",
    label: "Sir Stephen Hough frame controls",
    artist: "Sir Stephen Hough",
    frameClassName: "left-[36.4%] top-[21.8%] h-[12.6%] w-[6.8%]",
    type: "audio",
    audioKey: "hough",
  },
] as const;

function GlassControlButton({
  label,
  onClick,
  children,
  compact = false,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex items-center justify-center rounded-full border border-[#d9c0a1]/30 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_100%)] text-royal-cream shadow-[0_6px_14px_rgba(0,0,0,0.28)] backdrop-blur-md transition-transform duration-300 hover:scale-[1.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-royal-gold/70 ${
        compact ? "h-[12px] w-[12px]" : "h-[18px] w-[18px]"
      }`}
    >
      {children}
    </button>
  );
}

function WaveformIndicator({
  active,
  compact = false,
}: {
  active: boolean;
  compact?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      className={`flex items-end justify-center rounded-full border border-[#d9c0a1]/20 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_100%)] shadow-[0_6px_14px_rgba(0,0,0,0.18)] backdrop-blur-md ${
        compact ? "h-[12px] gap-[1px] px-[2px]" : "h-[18px] gap-[2px] px-[4px]"
      }`}
    >
      {[0, 1, 2, 3].map((index) => (
        <span
          key={index}
          className={`block rounded-full bg-royal-gold/90 ${
            compact ? "w-[1px]" : "w-[2px]"
          }`}
          style={{
            height: compact
              ? active
                ? `${4 + ((index + 1) % 3) * 1.5}px`
                : "2px"
              : active
                ? `${6 + ((index + 1) % 3) * 3}px`
                : "4px",
            animation: active
              ? `piano-wave 0.9s ${index * 0.12}s ease-in-out infinite`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function PianoPage() {
  const params = useParams<{ locale: string }>();
  const isArabic = params?.locale === "ar";
  const marthaAudioRef = useRef<HTMLAudioElement | null>(null);
  const beethovenAudioRef = useRef<HTMLAudioElement | null>(null);
  const chopinAudioRef = useRef<HTMLAudioElement | null>(null);
  const houghAudioRef = useRef<HTMLAudioElement | null>(null);
  const marthaPopupTimerRef = useRef<number | null>(null);
  const beethovenPopupTimerRef = useRef<number | null>(null);
  const chopinPopupTimerRef = useRef<number | null>(null);
  const houghPopupTimerRef = useRef<number | null>(null);
  const [playingTrack, setPlayingTrack] = useState<
    "martha" | "beethoven" | "chopin" | "hough" | null
  >(null);
  const [showMarthaPopup, setShowMarthaPopup] = useState(false);
  const [showBeethovenPopup, setShowBeethovenPopup] = useState(false);
  const [showChopinPopup, setShowChopinPopup] = useState(false);
  const [showHoughPopup, setShowHoughPopup] = useState(false);

  const content = isArabic
    ? {
        reserveHelper: "احجز تجربتك مع البيانو",
        reserveCta: "احجز الآن",
        paragraph:
          "اختُرع البيانو حوالي عام 1700 على يد صانع الآلات الموسيقية الإيطالي بارتولوميو كريستوفوري. وعلى خلاف آلات المفاتيح الأقدم مثل الهاربسيكورد والكلافيكورد، كان البيانو قادراً على إصدار الأصوات الهادئة والقوية معاً، ولهذا جاء اسمه الأصلي gravicembalo col piano e forte أي \"آلة مفاتيح ناعمة وقوية\". وخلال القرنين الثامن عشر والتاسع عشر، ساهم مؤلفون مثل لودفيغ فان بيتهوفن وفريدريك شوبان وفرانز ليست في جعل البيانو واحداً من أهم الآلات في الموسيقى الكلاسيكية!",
        marthaPopup:
          "تُعد مارثا أرجيريتش واحدة من أعظم عازفات البيانو الكلاسيكي في العالم، وقد وُلدت عام 1941 في بوينس آيرس بالأرجنتين. نالت شهرة عالمية بفضل تفسيراتها القوية لهذا اللون الموسيقي المرتبط بفريدريك شوبان. وفي عام 1965 فازت بالجائزة الأولى في مسابقة شوبان الدولية للبيانو، لتنطلق بعدها مسيرتها الأسطورية. 🎹",
        beethovenPopup:
          "وُلد لودفيغ فان بيتهوفن عام 1770 في بون بألمانيا، وأصبح واحداً من أكثر المؤلفين تأثيراً في تاريخ الموسيقى الكلاسيكية. وعلى الرغم من فقدانه السمع في مراحل لاحقة من حياته، فقد ألّف أعمالاً قوية أسهمت في الانتقال من العصر الكلاسيكي إلى العصر الرومانسي. وتُعد سوناتات البيانو الخاصة به من أعظم إنجازاته؛ فهي أعمال عميقة ومعبّرة وسّعت إمكانات آلة البيانو. 🎹",
        chopinPopup:
          "وُلد فريدريك شوبان عام 1810 في بولندا، ويُعد واحداً من أعظم المؤلفين الذين كتبوا للبيانو. اشتهر بموسيقاه العميقة والشاعرية والمعبّرة التي ساعدت في تعريف العصر الرومانسي. وتُعتبر مقطوعته نوكتورن في مي بيمول الكبير، مصنف 9 رقم 2، من أكثر أعماله المحبوبة، لما تتميز به من لحن جميل وأسلوب عاطفي وغنائي رقيق. 🎹",
        houghPopup:
          "وُلد ستيفن هوف عام 1961 في المملكة المتحدة، وهو واحد من أكثر عازفي البيانو الكلاسيكي احتراماً في عصرنا. اشتهر بأدائه اللامع على البيانو وتسجيلاته ومؤلفاته، كما نال جائزة ناومبورغ الدولية للبيانو في بدايات مسيرته. وفي عام 2022 مُنح لقب \"سير\" بعدما منحه تشارلز الثالث هذا التكريم تقديراً لخدماته للموسيقى. 🎹",
      }
    : {
        reserveHelper: "Reserve your piano experience",
        reserveCta: "Reserve Now",
        paragraph:
          'The piano was invented around 1700 by the Italian instrument maker Bartolomeo Cristofori. Unlike earlier keyboard instruments like the Harpsichord and the Clavichord, the piano could play both soft and loud sounds, which is why its original name was gravicembalo col piano e forte ("soft and loud keyboard"). During the 18th and 19th centuries, composers such as Ludwig van Beethoven, Frederic Chopin, and Franz Liszt helped make the piano one of the most important instruments in classical music!',
        marthaPopup:
          "is one of the world's greatest classical pianists, born in 1941 in Buenos Aires, Argentina. She gained international fame for her powerful interpretations of this music by Frederic Chopin. In 1965, she won first prize at the International Chopin Piano Competition, launching her legendary career. 🎹",
        beethovenPopup:
          "was born in 1770 in Bonn, Germany and became one of the most influential composers in classical music history. Despite losing his hearing later in life, he created powerful works that shaped the transition from the Classical to the Romantic era. His piano sonatas are among his greatest achievements-deep, expressive pieces that expanded the possibilities of the piano. 🎹",
        chopinPopup:
          "was born in 1810 in Poland and is considered one of the greatest composers for the piano. He is famous for his deeply expressive and poetic piano music that helped define the Romantic era. His Nocturne in E-flat major Op. 9 No. 2 is one of his most beloved works, admired for its beautiful melody and emotional, lyrical style. 🎹",
        houghPopup:
          'was born in 1961 in the United Kingdom and is one of the most respected classical pianists of today. He is famous for his brilliant piano performances, recordings, and compositions, and for winning the Naumburg International Piano Competition early in his career. He received the title "Sir" in 2022 when he was knighted by Charles III for his services to music. 🎹',
      };

  useEffect(() => {
    const martha = marthaAudioRef.current;
    const beethoven = beethovenAudioRef.current;
    const chopin = chopinAudioRef.current;
    const hough = houghAudioRef.current;
    if (!martha || !beethoven || !chopin || !hough) return;

    const onMarthaPlay = () => setPlayingTrack("martha");
    const onMarthaPause = () =>
      setPlayingTrack((current) => (current === "martha" ? null : current));
    const onBeethovenPlay = () => setPlayingTrack("beethoven");
    const onBeethovenPause = () =>
      setPlayingTrack((current) => (current === "beethoven" ? null : current));
    const onChopinPlay = () => setPlayingTrack("chopin");
    const onChopinPause = () =>
      setPlayingTrack((current) => (current === "chopin" ? null : current));
    const onHoughPlay = () => setPlayingTrack("hough");
    const onHoughPause = () =>
      setPlayingTrack((current) => (current === "hough" ? null : current));

    martha.addEventListener("play", onMarthaPlay);
    martha.addEventListener("pause", onMarthaPause);
    martha.addEventListener("ended", onMarthaPause);

    beethoven.addEventListener("play", onBeethovenPlay);
    beethoven.addEventListener("pause", onBeethovenPause);
    beethoven.addEventListener("ended", onBeethovenPause);

    chopin.addEventListener("play", onChopinPlay);
    chopin.addEventListener("pause", onChopinPause);
    chopin.addEventListener("ended", onChopinPause);

    hough.addEventListener("play", onHoughPlay);
    hough.addEventListener("pause", onHoughPause);
    hough.addEventListener("ended", onHoughPause);

    return () => {
      martha.removeEventListener("play", onMarthaPlay);
      martha.removeEventListener("pause", onMarthaPause);
      martha.removeEventListener("ended", onMarthaPause);

      beethoven.removeEventListener("play", onBeethovenPlay);
      beethoven.removeEventListener("pause", onBeethovenPause);
      beethoven.removeEventListener("ended", onBeethovenPause);

      chopin.removeEventListener("play", onChopinPlay);
      chopin.removeEventListener("pause", onChopinPause);
      chopin.removeEventListener("ended", onChopinPause);

      hough.removeEventListener("play", onHoughPlay);
      hough.removeEventListener("pause", onHoughPause);
      hough.removeEventListener("ended", onHoughPause);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (marthaPopupTimerRef.current !== null) {
        window.clearTimeout(marthaPopupTimerRef.current);
      }
      if (beethovenPopupTimerRef.current !== null) {
        window.clearTimeout(beethovenPopupTimerRef.current);
      }
      if (chopinPopupTimerRef.current !== null) {
        window.clearTimeout(chopinPopupTimerRef.current);
      }
      if (houghPopupTimerRef.current !== null) {
        window.clearTimeout(houghPopupTimerRef.current);
      }
    };
  }, []);

  const getAudioRef = (
    track: "martha" | "beethoven" | "chopin" | "hough",
  ) => {
    if (track === "martha") return marthaAudioRef.current;
    if (track === "beethoven") return beethovenAudioRef.current;
    if (track === "chopin") return chopinAudioRef.current;
    return houghAudioRef.current;
  };

  const playTrack = async (
    track: "martha" | "beethoven" | "chopin" | "hough",
  ) => {
    const target = getAudioRef(track);
    if (!target) return;
    setShowMarthaPopup(false);
    setShowBeethovenPopup(false);
    setShowChopinPopup(false);
    setShowHoughPopup(false);
    if (track === "martha") {
      setShowMarthaPopup(true);
      if (marthaPopupTimerRef.current !== null) {
        window.clearTimeout(marthaPopupTimerRef.current);
      }
      marthaPopupTimerRef.current = window.setTimeout(() => {
        setShowMarthaPopup(false);
      }, 15000);
    }
    if (track === "beethoven") {
      setShowBeethovenPopup(true);
      if (beethovenPopupTimerRef.current !== null) {
        window.clearTimeout(beethovenPopupTimerRef.current);
      }
      beethovenPopupTimerRef.current = window.setTimeout(() => {
        setShowBeethovenPopup(false);
      }, 15000);
    }
    if (track === "chopin") {
      setShowChopinPopup(true);
      if (chopinPopupTimerRef.current !== null) {
        window.clearTimeout(chopinPopupTimerRef.current);
      }
      chopinPopupTimerRef.current = window.setTimeout(() => {
        setShowChopinPopup(false);
      }, 15000);
    }
    if (track === "hough") {
      setShowHoughPopup(true);
      if (houghPopupTimerRef.current !== null) {
        window.clearTimeout(houghPopupTimerRef.current);
      }
      houghPopupTimerRef.current = window.setTimeout(() => {
        setShowHoughPopup(false);
      }, 15000);
    }
    (["martha", "beethoven", "chopin", "hough"] as const)
      .filter((key) => key !== track)
      .forEach((key) => getAudioRef(key)?.pause());
    await target.play();
  };

  const pauseTrack = (
    track: "martha" | "beethoven" | "chopin" | "hough",
  ) => {
    getAudioRef(track)?.pause();
  };

  const renderPopupContent = (
    track: "martha" | "beethoven" | "chopin" | "hough",
  ) => {
    if (track === "martha") {
      return isArabic ? (
        content.marthaPopup
      ) : (
        <>
          <strong>Martha Argerich</strong> {content.marthaPopup}
        </>
      );
    }
    if (track === "beethoven") {
      return isArabic ? (
        content.beethovenPopup
      ) : (
        <>
          <strong>Ludwig van Beethoven</strong> {content.beethovenPopup}
        </>
      );
    }
    if (track === "chopin") {
      return isArabic ? (
        content.chopinPopup
      ) : (
        <>
          <strong>Frederic Chopin</strong> {content.chopinPopup}
        </>
      );
    }
    return isArabic ? (
      content.houghPopup
    ) : (
      <>
        <strong>Stephen Hough</strong> {content.houghPopup}
      </>
    );
  };

  const renderPopup = (
    track: "martha" | "beethoven" | "chopin" | "hough",
    className: string,
  ) => {
    const isVisible =
      (track === "martha" && showMarthaPopup) ||
      (track === "beethoven" && showBeethovenPopup) ||
      (track === "chopin" && showChopinPopup) ||
      (track === "hough" && showHoughPopup);

    if (!isVisible) return null;

    return (
      <div className={className}>
        <div
          className="rounded-[1.35rem] border px-3 py-3 sm:px-4 sm:py-4"
          style={GLASS_CARD_STYLE}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <p className="text-[11px] leading-5 text-royal-cream/90 sm:text-[12px]">
            <span style={TEXT_HIGHLIGHT_STYLE}>{renderPopupContent(track)}</span>
          </p>
        </div>
      </div>
    );
  };

  const renderFrameLayer = (mobile = false) => (
    <>
      {FRAME_CONTROLS.map((frame) => (
        <div key={frame.id}>
          <div className={`absolute ${frame.frameClassName}`}>
            <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1">
              <>
                <GlassControlButton
                  label={`Play ${frame.artist} track`}
                  onClick={() => playTrack(frame.audioKey)}
                  compact={mobile}
                >
                  <Play
                    size={mobile ? 6 : 9}
                    className={playingTrack === frame.audioKey ? "text-royal-gold" : ""}
                  />
                </GlassControlButton>
                <WaveformIndicator
                  active={playingTrack === frame.audioKey}
                  compact={mobile}
                />
                <GlassControlButton
                  label={`Pause ${frame.artist} track`}
                  onClick={() => pauseTrack(frame.audioKey)}
                  compact={mobile}
                >
                  <Pause
                    size={mobile ? 6 : 9}
                    className={playingTrack !== frame.audioKey ? "text-royal-gold" : ""}
                  />
                </GlassControlButton>
              </>
            </div>
            {renderPopup(
              frame.audioKey,
              mobile
                ? "pointer-events-none absolute left-1/2 top-[112%] z-30 w-48 -translate-x-1/2 sm:w-56"
                : "pointer-events-none absolute left-[112%] top-1/2 z-30 w-56 -translate-y-1/2 sm:w-64",
            )}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#140c09]">
      <audio
        ref={marthaAudioRef}
        preload="metadata"
        src="/images/martha-argerich.mp3"
      />
      <audio
        ref={beethovenAudioRef}
        preload="metadata"
        src="/images/beethoven-sonata.mp3"
      />
      <audio
        ref={chopinAudioRef}
        preload="metadata"
        src="/images/frederic-chopin.mp3"
      />
      <audio
        ref={houghAudioRef}
        preload="metadata"
        src="/images/sir-stephen-hough.mp3"
      />

      <div
        className="absolute left-1/2 top-1/2 hidden lg:block"
        style={PIANO_ROOM_BOX_STYLE}
      >
        <Image
          src="/images/pianoroom.png"
          alt="Piano room"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      <div className="absolute inset-0 hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.24)_72%,rgba(0,0,0,0.42)_100%)] lg:block" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.30)_72%,rgba(0,0,0,0.55)_100%)] lg:hidden" />

      <section className="relative z-10 hidden min-h-screen lg:block">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,rgba(20,12,9,0)_0%,rgba(20,12,9,0.24)_24%,rgba(20,12,9,0.82)_100%)]" />

        <div
          className="absolute left-1/2 top-1/2"
          style={PIANO_ROOM_BOX_STYLE}
        >
          {renderFrameLayer()}
        </div>

        <div className="absolute right-6 top-24 z-20 w-[min(280px,26vw)] sm:right-8 md:right-10 md:top-28">
          <div
            className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
            style={GLASS_CARD_STYLE}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <p className="text-[12px] leading-6 text-royal-cream/90 sm:text-[13px]">
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
            </p>

            <div className="mt-4 flex flex-col items-start gap-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-royal-gold/65">
                {content.reserveHelper}
              </p>
              <Link
                href="/reservation"
                className="liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-royal-gold transition-transform duration-300 hover:scale-[1.03]"
              >
                {content.reserveCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-10 pt-24 sm:px-6 lg:hidden">
        <div className="mx-auto flex w-full max-w-[26rem] flex-col gap-6">
          <div
            className="relative aspect-[3/2] overflow-visible rounded-[1.8rem] border border-[#d9c0a1]/18 shadow-[0_22px_60px_rgba(0,0,0,0.32)]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <Image
              src="/images/pianoroom.png"
              alt="Piano room"
              fill
              priority
              sizes="(max-width: 1024px) 100vw"
              className="rounded-[1.8rem] object-cover"
            />
            <div className="absolute inset-0 rounded-[1.8rem] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.18)_72%,rgba(0,0,0,0.36)_100%)]" />
            <div className="absolute inset-0 overflow-visible">
              {renderFrameLayer(true)}
            </div>
          </div>

          <div
            className="rounded-[1.5rem] border px-4 py-4 sm:px-5 sm:py-5"
            style={GLASS_CARD_STYLE}
            dir={isArabic ? "rtl" : "ltr"}
          >
            <p className="text-[12px] leading-6 text-royal-cream/90 sm:text-[13px]">
              <span style={TEXT_HIGHLIGHT_STYLE}>{content.paragraph}</span>
            </p>

            <div className="mt-4 flex flex-col items-start gap-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-royal-gold/65">
                {content.reserveHelper}
              </p>
              <Link
                href="/reservation"
                className="liquid-glass-gold shimmer inline-flex items-center justify-center rounded-full px-4 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-royal-gold transition-transform duration-300 hover:scale-[1.03]"
              >
                {content.reserveCta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes piano-wave {
          0%,
          100% {
            transform: scaleY(0.45);
            opacity: 0.5;
          }
          50% {
            transform: scaleY(1.15);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
