import { MetroLabel } from "@/components/metro-label";
import { SchoolLandingVideo } from "@/components/school-landing-video";
import type { SchoolCampusLocation } from "@/lib/school-landing-media";
import { cn } from "@/lib/utils";

type Props = {
  schoolShortName: string;
  schoolFullName: string;
  campusLocations: SchoolCampusLocation[];
  videoFileUrl?: string;
  videoPosterUrl?: string;
  className?: string;
};

export function SchoolAgendaHero({
  schoolShortName,
  schoolFullName,
  campusLocations,
  videoFileUrl,
  videoPosterUrl,
  className,
}: Props) {
  const videoTitle = `Видео о сменах BrainMaster · ${schoolShortName}`;
  const showShortInEyebrow = schoolShortName !== schoolFullName;

  return (
    <header className={cn("mb-8 space-y-6 sm:mb-10", className)}>
      <SchoolLandingVideo
        videoFileUrl={videoFileUrl}
        posterUrl={videoPosterUrl}
        title={videoTitle}
      />

      <div className="space-y-3">
        <p className="text-[11px] text-cyan-200/90 uppercase tracking-[0.22em] sm:text-xs">
          {showShortInEyebrow ? (
            <>
              <span>{schoolShortName}</span>
              <span aria-hidden className="mx-1.5 text-cyan-200/50">
                ·
              </span>
            </>
          ) : null}
          BrainMaster · расписание площадки
        </p>
        <h1 className="font-heading max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {schoolFullName}
        </h1>
        <div className="max-w-2xl space-y-2 text-sm text-muted-foreground sm:text-base">
          {campusLocations.length > 1 ? (
            <ul className="space-y-1.5 leading-relaxed text-foreground">
              {campusLocations.map((location, index) => (
                <li
                  key={`${location.headline}-${index}`}
                  className="leading-relaxed text-foreground"
                >
                  <span>{location.headline}</span>
                  {location.metro ? (
                    <>
                      <span aria-hidden> · </span>
                      <MetroLabel metro={location.metro} />
                    </>
                  ) : null}
                  {location.district ? (
                    <>
                      <span aria-hidden> · </span>
                      <span>{location.district}</span>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : campusLocations.length === 1 ? (
            <p className="leading-relaxed text-foreground">
              {campusLocations[0]?.headline ? (
                <span>{campusLocations[0].headline}</span>
              ) : null}
              {campusLocations[0]?.metro ? (
                <>
                  {campusLocations[0]?.headline ? <span aria-hidden> · </span> : null}
                  <MetroLabel metro={campusLocations[0].metro} />
                </>
              ) : null}
              {campusLocations[0]?.district ? (
                <>
                  {(campusLocations[0]?.headline || campusLocations[0]?.metro) ? (
                    <span aria-hidden> · </span>
                  ) : null}
                  <span>{campusLocations[0].district}</span>
                </>
              ) : null}
            </p>
          ) : null}
          <p className="leading-7">
            Выберите смену и запишитесь на mos.ru — или оставьте предварительную заявку,
            если набор ещё открывается.
          </p>
        </div>
      </div>
    </header>
  );
}
