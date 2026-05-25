import { SchoolLandingVideo } from "@/components/school-landing-video";
import { cn } from "@/lib/utils";

type Props = {
  schoolName: string;
  locationSummary: string;
  videoFileUrl?: string;
  videoPosterUrl?: string;
  className?: string;
};

export function SchoolAgendaHero({
  schoolName,
  locationSummary,
  videoFileUrl,
  videoPosterUrl,
  className,
}: Props) {
  const videoTitle = `Видео о сменах BrainMaster · ${schoolName}`;

  return (
    <header className={cn("mb-8 space-y-6 sm:mb-10", className)}>
      <SchoolLandingVideo
        videoFileUrl={videoFileUrl}
        posterUrl={videoPosterUrl}
        title={videoTitle}
      />

      <div className="space-y-3">
        <p className="text-[11px] text-cyan-200/90 uppercase tracking-[0.22em] sm:text-xs">
          BrainMaster · расписание площадки
        </p>
        <h1 className="font-heading max-w-3xl text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Расписание BrainMaster · {schoolName}
        </h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          {locationSummary ? (
            <>
              <span className="text-foreground">{locationSummary}</span>
              {" · "}
            </>
          ) : null}
          Выберите смену и запишитесь на mos.ru — или оставьте предварительную заявку,
          если набор ещё открывается.
        </p>
      </div>
    </header>
  );
}
