"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Grid2X2,
  LocateFixed,
  Maximize2,
  Minimize2,
  Minus,
  Navigation,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  TransformComponent,
  TransformWrapper,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

import { buttonVariants } from "@/components/ui/button";
import {
  positionSitesOnMap,
  siteHasMapLocation,
  type PositionedSiteOnMap,
} from "@/lib/sites/map-projection";
import { PREFERRED_SCHOOL_STORAGE_KEY } from "@/lib/preferred-school";
import type { SiteScopeCard } from "@/lib/sites/scope-card";
import { cn } from "@/lib/utils";

type Props = {
  sites: SiteScopeCard[];
  filterSlot?: ReactNode;
};

type SetTransform = ReactZoomPanPinchRef["setTransform"];

type TransformState = {
  scale: number;
  positionX: number;
  positionY: number;
};

type DisplayPositionedSite = PositionedSiteOnMap & {
  screenX: number;
  screenY: number;
  clusterIndex: number;
  clusterSize: number;
};

const IDENTITY_TRANSFORM: TransformState = {
  scale: 1,
  positionX: 0,
  positionY: 0,
};

const CLUSTER_DISTANCE = 36;

function primaryMetro(site: SiteScopeCard): string | undefined {
  return site.campuses.find((campus) => campus.metro && campus.metro !== "—")?.metro;
}

function primaryAddress(site: SiteScopeCard): string {
  return site.campuses[0]?.address ?? site.locationLabel;
}

function rememberSite(site: SiteScopeCard) {
  localStorage.setItem(
    PREFERRED_SCHOOL_STORAGE_KEY,
    JSON.stringify({ slug: site.slug, name: site.name }),
  );
}

function buildDisplayPositions(params: {
  positionedSites: PositionedSiteOnMap[];
  frameSize: { width: number; height: number };
  transform: TransformState;
}): DisplayPositionedSite[] {
  const { positionedSites, frameSize, transform } = params;
  const basePositions = positionedSites.map((positioned) => ({
    ...positioned,
    screenX: transform.positionX + (positioned.x / 100) * frameSize.width * transform.scale,
    screenY: transform.positionY + (positioned.y / 100) * frameSize.height * transform.scale,
    clusterIndex: 0,
    clusterSize: 1,
  }));
  const visited = new Set<string>();

  for (const positioned of basePositions) {
    if (visited.has(positioned.site.slug)) continue;

    const cluster = basePositions.filter((candidate) => {
      if (visited.has(candidate.site.slug)) return false;
      return (
        Math.hypot(positioned.screenX - candidate.screenX, positioned.screenY - candidate.screenY) <=
        CLUSTER_DISTANCE
      );
    });

    for (const item of cluster) visited.add(item.site.slug);
    if (cluster.length <= 1) continue;

    const radius = Math.min(24, 12 + cluster.length * 3);
    cluster.forEach((item, index) => {
      const angle = (index / cluster.length) * Math.PI * 2 - Math.PI / 2;
      item.screenX += Math.cos(angle) * radius;
      item.screenY += Math.sin(angle) * radius;
      item.clusterIndex = index;
      item.clusterSize = cluster.length;
    });
  }

  return basePositions;
}

function MapPinMarker({
  positioned,
  active,
  preview,
  dimmed,
  onActivate,
  onDeactivate,
  onSelect,
}: {
  positioned: DisplayPositionedSite;
  active: boolean;
  preview: boolean;
  dimmed: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onSelect: () => void;
}) {
  const { site, screenX, screenY, clusterSize } = positioned;
  const metro = primaryMetro(site);

  return (
    <div
      className={cn("pointer-events-none absolute z-10", active && "z-20")}
      style={{ left: screenX, top: screenY }}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
    >
      <button
        type="button"
        className={cn(
          "pointer-events-auto -translate-x-1/2 -translate-y-1/2 relative flex size-5 cursor-pointer items-center justify-center rounded-full border-2 border-black bg-orange-500 transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          active || preview
            ? "scale-125 shadow-[0_0_0_8px_rgba(234,88,12,0.18),0_0_34px_rgba(234,88,12,0.88)]"
            : "shadow-[0_0_0_6px_rgba(234,88,12,0.1),0_0_18px_rgba(234,88,12,0.55)] hover:scale-110",
          dimmed && "opacity-45 saturate-50",
        )}
        aria-label={`${active ? "Открыть расписание площадки" : "Выбрать площадку"} ${site.name}${metro ? `, метро ${metro}` : ""}`}
        aria-pressed={active}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onClick={onSelect}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 rounded-full bg-orange-500 opacity-70 motion-safe:animate-ping",
            active || preview ? "scale-125" : "",
          )}
          aria-hidden
        />
        <span className="pointer-events-none relative size-2 rounded-full bg-orange-100" aria-hidden />
        {clusterSize > 1 ? (
          <span className="pointer-events-none absolute -top-3 -right-3 flex size-5 items-center justify-center rounded-full border border-black bg-cyan-300 font-semibold text-[10px] text-slate-950 shadow-lg">
            {clusterSize}
          </span>
        ) : null}
      </button>
    </div>
  );
}

export function SitesMapSchematic({ sites, filterSlot }: Props) {
  const router = useRouter();
  const [activeSiteSlug, setActiveSiteSlug] = useState<string | null>(null);
  const [previewSiteSlug, setPreviewSiteSlug] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transform, setTransformState] = useState<TransformState>(IDENTITY_TRANSFORM);
  const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });
  const mapFrameRef = useRef<HTMLDivElement>(null);
  const setTransformRef = useRef<SetTransform | null>(null);
  const mappedSites = sites.filter(siteHasMapLocation);
  const positionedSites = useMemo(() => positionSitesOnMap(mappedSites), [mappedSites]);
  const displaySites = useMemo(
    () =>
      buildDisplayPositions({
        positionedSites,
        frameSize,
        transform,
      }),
    [frameSize, positionedSites, transform],
  );
  const activePositioned = displaySites.find(
    (positioned) => positioned.site.slug === activeSiteSlug,
  );

  useEffect(() => {
    const frame = mapFrameRef.current;
    if (!frame) return;

    const updateSize = () => {
      const { width, height } = frame.getBoundingClientRect();
      setFrameSize({ width, height });
    };
    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [isFullscreen]);

  if (mappedSites.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-card/35 px-6 py-16 text-center">
        <p className="font-heading text-xl font-semibold text-foreground">
          Карта появится после добавления площадок
        </p>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground text-sm leading-relaxed">
          Добавьте адрес, метро или координаты, чтобы площадки появились на карте.
        </p>
      </div>
    );
  }

  function navigateToAgenda(site: SiteScopeCard) {
    rememberSite(site);
    router.push(`/sites/${site.slug}/agenda`);
  }

  function focusPositionedSite(
    positioned: PositionedSiteOnMap,
    setTransform: SetTransform,
  ) {
    const frame = mapFrameRef.current;
    if (!frame) return;

    const { width, height } = frame.getBoundingClientRect();
    const zoom = width < 640 ? 1.2 : 1.75;
    const positionX = width / 2 - (positioned.x / 100) * width * zoom;
    const positionY = height / 2 - (positioned.y / 100) * height * zoom;
    setTransform(positionX, positionY, zoom, 260, "easeOut");
  }

  return (
    <div
      className={cn(
        "relative grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 shadow-[0_24px_90px_rgba(2,6,23,0.48)] lg:grid-cols-[minmax(0,1fr)_24rem]",
        isFullscreen &&
          "fixed inset-0 z-[100] h-dvh grid-rows-[minmax(0,1fr)_minmax(16rem,42vh)] rounded-none border-0 p-3 lg:grid-cols-[minmax(0,1fr)_26rem] lg:grid-rows-none",
      )}
    >
      <div className={cn("relative min-h-[31rem] bg-[#0a0a0a]", isFullscreen && "min-h-0")}>
        <div
          ref={mapFrameRef}
          className={cn(
            "relative h-full min-h-[31rem] overflow-hidden bg-black",
            isFullscreen && "min-h-0",
            isFullscreen ? "rounded-2xl" : "lg:rounded-l-[1.75rem]",
          )}
        >
          <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={3}
            centerOnInit
            wheel={{ step: 0.14 }}
            doubleClick={{ mode: "zoomIn" }}
            panning={{ velocityDisabled: true }}
            onInit={(ref) =>
              setTransformState({
                scale: ref.state.scale,
                positionX: ref.state.positionX,
                positionY: ref.state.positionY,
              })
            }
            onTransform={(_, state) => setTransformState(state)}
          >
            {({ zoomIn, zoomOut, resetTransform, setTransform }) => {
              setTransformRef.current = setTransform;

              function selectPositioned(positioned: DisplayPositionedSite) {
                if (activeSiteSlug === positioned.site.slug) {
                  navigateToAgenda(positioned.site);
                  return;
                }

                setActiveSiteSlug(positioned.site.slug);
                focusPositionedSite(positioned, setTransform);
              }

              return (
                <>
                  <TransformComponent
                    wrapperClass="!h-full !w-full"
                    contentClass="!h-full !w-full"
                  >
                    <div className="relative size-full">
                      <MapBackground />
                    </div>
                  </TransformComponent>

                  <div className="pointer-events-none absolute inset-0 z-30">
                    {displaySites.map((positioned) => {
                      const active = activeSiteSlug === positioned.site.slug;
                      const preview = previewSiteSlug === positioned.site.slug;
                      const dimmed = Boolean(activeSiteSlug && !active && !preview);

                      return (
                        <MapPinMarker
                          key={positioned.site.slug}
                          positioned={positioned}
                          active={active}
                          preview={preview}
                          dimmed={dimmed}
                          onActivate={() => setPreviewSiteSlug(positioned.site.slug)}
                          onDeactivate={() => setPreviewSiteSlug(null)}
                          onSelect={() => selectPositioned(positioned)}
                        />
                      );
                    })}
                    <MapOverlay
                      positionedSites={displaySites}
                      activeSiteSlug={activeSiteSlug}
                      previewSiteSlug={previewSiteSlug}
                      frameSize={frameSize}
                      onOpenAgenda={navigateToAgenda}
                    />
                  </div>

                  <div className="absolute top-3 left-3 z-40 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1.5 text-cyan-100 text-xs shadow-xl backdrop-blur">
                    {mappedSites.length} точек
                  </div>

                  <div className="absolute top-3 right-3 z-40 flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/85 p-1 shadow-xl backdrop-blur">
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-cyan-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label="Приблизить карту"
                      onClick={() => zoomIn(0.35)}
                    >
                      <Plus className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-cyan-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label="Отдалить карту"
                      onClick={() => zoomOut(0.35)}
                    >
                      <Minus className="size-4" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-cyan-100 text-xs transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      onClick={() => resetTransform(220)}
                    >
                      <RotateCcw className="size-3.5" aria-hidden />
                      Сброс
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-cyan-100 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      aria-label={isFullscreen ? "Свернуть карту" : "Открыть карту на весь экран"}
                      onClick={() => setIsFullscreen((current) => !current)}
                    >
                      {isFullscreen ? (
                        <Minimize2 className="size-4" aria-hidden />
                      ) : (
                        <Maximize2 className="size-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </>
              );
            }}
          </TransformWrapper>
        </div>
      </div>

      <aside className="flex min-h-0 flex-col gap-4 border-white/10 border-t bg-card/80 p-4 backdrop-blur-xl lg:border-t-0 lg:border-l">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-heading font-semibold text-lg text-foreground">
              Площадки
            </h3>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {mappedSites.length} найдено на карте
            </p>
          </div>
          <span className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Navigation className="size-4" aria-hidden />
          </span>
        </div>

        {filterSlot ? <div>{filterSlot}</div> : null}

        <SelectedSiteCard site={activePositioned?.site} />

        <SiteList
          positionedSites={displaySites}
          activeSiteSlug={activeSiteSlug}
          previewSiteSlug={previewSiteSlug}
          onPreview={setPreviewSiteSlug}
          onSelect={(positioned) => {
            if (activeSiteSlug === positioned.site.slug) {
              navigateToAgenda(positioned.site);
              return;
            }
            setActiveSiteSlug(positioned.site.slug);
            if (setTransformRef.current) {
              focusPositionedSite(positioned, setTransformRef.current);
            }
          }}
        />
      </aside>
    </div>
  );
}

function MapBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl bg-black"
      role="img"
      aria-label="Кибер-карта Москвы с площадками BrainMaster"
    >
      <Image
        src="/sites/moscow-cyber-map.webp"
        alt=""
        fill
        className="object-cover object-center opacity-45 mix-blend-screen"
        sizes="(min-width: 1024px) 704px, calc(100vw - 2rem)"
      />
      <MapVignette />
    </div>
  );
}

function MapVignette() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(10,10,10,0.55)_100%)]"
    />
  );
}

function SiteList({
  positionedSites,
  activeSiteSlug,
  previewSiteSlug,
  onPreview,
  onSelect,
}: {
  positionedSites: DisplayPositionedSite[];
  activeSiteSlug: string | null;
  previewSiteSlug: string | null;
  onPreview: (slug: string | null) => void;
  onSelect: (positioned: DisplayPositionedSite) => void;
}) {
  return (
    <div
      className="grid min-h-32 max-h-[min(34rem,calc(100vh-18rem))] gap-3 overflow-y-auto pr-1"
      data-testid="sites-map-list-scroll"
    >
      {positionedSites.map((positioned) => {
        const { site } = positioned;
        const metro = primaryMetro(site);
        const active = activeSiteSlug === site.slug;
        const preview = previewSiteSlug === site.slug;

        return (
          <button
            key={site.slug}
            type="button"
            className={cn(
              "group cursor-pointer rounded-2xl border bg-black/15 p-3 text-left transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active || preview
                ? "border-orange-400/60 shadow-[0_0_28px_rgba(234,88,12,0.18)]"
                : "border-white/10 hover:border-orange-300/30",
            )}
            aria-pressed={active}
            onMouseEnter={() => onPreview(site.slug)}
            onMouseLeave={() => onPreview(null)}
            onFocus={() => onPreview(site.slug)}
            onBlur={() => onPreview(null)}
            onClick={() => onSelect(positioned)}
          >
            <span className="font-medium text-foreground">{site.name}</span>
            <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
              {metro ? `м. ${metro}` : site.locationSummary}
            </p>
            <span
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "mt-2 h-auto p-0 text-primary text-xs",
              )}
            >
              {active ? "Открыть расписание" : "Выбрать"}
              <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MapOverlay({
  positionedSites,
  activeSiteSlug,
  previewSiteSlug,
  frameSize,
  onOpenAgenda,
}: {
  positionedSites: DisplayPositionedSite[];
  activeSiteSlug: string | null;
  previewSiteSlug: string | null;
  frameSize: { width: number; height: number };
  onOpenAgenda: (site: SiteScopeCard) => void;
}) {
  const previewPositioned = positionedSites.find(
    (positioned) =>
      positioned.site.slug === previewSiteSlug && positioned.site.slug !== activeSiteSlug,
  );
  const activePositioned = positionedSites.find(
    (positioned) => positioned.site.slug === activeSiteSlug,
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {previewPositioned ? (
        <MapTooltip positioned={previewPositioned} selected={false} />
      ) : null}
      {activePositioned ? (
        <MapTooltip
          positioned={activePositioned}
          selected
          frameSize={frameSize}
          onOpenAgenda={() => onOpenAgenda(activePositioned.site)}
        />
      ) : null}
    </div>
  );
}

function MapTooltip({
  positioned,
  selected,
  frameSize,
  onOpenAgenda,
}: {
  positioned: DisplayPositionedSite;
  selected: boolean;
  frameSize?: { width: number; height: number };
  onOpenAgenda?: () => void;
}) {
  const metro = primaryMetro(positioned.site);
  const className = cn(
    "absolute w-max max-w-64 rounded-xl border border-orange-500/45 bg-slate-950/88 px-3 py-2 text-left shadow-[0_18px_70px_rgba(234,88,12,0.2)] backdrop-blur-xl",
    selected
      ? "-translate-x-1/2 max-sm:w-auto max-sm:max-w-none max-sm:translate-x-0"
      : "top-6 left-1/2 -translate-x-1/2",
    selected && "pointer-events-auto cursor-pointer border-cyan-300/50",
  );
  const style =
    selected && frameSize?.width && frameSize.width < 640
      ? { right: 12, bottom: 12, left: 12 }
      : {
          left:
            selected && frameSize?.width
              ? Math.min(frameSize.width - 132, Math.max(132, positioned.screenX))
              : positioned.screenX,
          top:
            selected && frameSize?.height
              ? Math.min(frameSize.height - 112, Math.max(40, positioned.screenY + 28))
              : positioned.screenY,
        };
  const content = (
    <>
      <p className="font-semibold text-sm text-white">{positioned.site.name}</p>
      <p className="mt-0.5 text-orange-300 text-xs leading-relaxed">
        {metro ? `м. ${metro}` : positioned.site.locationSummary}
      </p>
      {selected ? (
        <span
          className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-cyan-200/70 max-sm:hidden"
          aria-hidden
        />
      ) : null}
    </>
  );

  if (selected) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        aria-label={`Открыть расписание выбранной площадки ${positioned.site.name}`}
        onClick={onOpenAgenda}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
}

function SiteLogo({ site }: { site: SiteScopeCard }) {
  if (site.logoUrl?.startsWith("/")) {
    return (
      <Image
        src={site.logoUrl}
        alt=""
        width={56}
        height={56}
        className="size-full object-contain"
      />
    );
  }

  return <Navigation className="size-6 text-slate-950" aria-hidden />;
}

function SelectedSiteCard({ site }: { site?: SiteScopeCard }) {
  if (!site) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-black/15 p-4 text-muted-foreground text-sm leading-relaxed">
        Выберите площадку на карте или в списке.
      </div>
    );
  }

  const metro = primaryMetro(site);

  return (
    <article className="rounded-2xl border border-cyan-300/20 bg-slate-950/65 p-4 shadow-[0_18px_70px_rgba(8,145,178,0.16)]">
      <div className="flex items-start gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-white/40">
          <SiteLogo site={site} />
        </div>
        <div className="min-w-0">
          <h4 className="mt-1 font-heading font-semibold text-base text-foreground leading-tight">
            {site.name}
          </h4>
          <p className="mt-1 text-muted-foreground text-xs leading-relaxed">
            {metro ? `м. ${metro}` : site.locationSummary}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <p className="flex gap-2 rounded-xl border border-white/10 bg-black/15 p-3 text-foreground leading-relaxed">
          <LocateFixed className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>{primaryAddress(site)}</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
            <p className="font-heading text-xl font-semibold text-foreground">{site.courseCount}</p>
            <p className="text-muted-foreground text-xs">курсов</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/15 p-3 text-center">
            <p className="font-heading text-xl font-semibold text-foreground">{site.shiftCount}</p>
            <p className="text-muted-foreground text-xs">групп</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <Link
          href={`/sites/${site.slug}/agenda`}
          className={cn(buttonVariants({ variant: "default", size: "sm" }), "gap-2")}
          onClick={() => rememberSite(site)}
        >
          <CalendarDays className="size-4" aria-hidden />
          Посмотреть расписание площадки
        </Link>
        <Link
          href={`/sites/${site.slug}/catalog`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2 border-white/10 bg-transparent hover:bg-white/5",
          )}
          onClick={() => rememberSite(site)}
        >
          <Grid2X2 className="size-4" aria-hidden />
          Доступные курсы
        </Link>
      </div>
    </article>
  );
}
