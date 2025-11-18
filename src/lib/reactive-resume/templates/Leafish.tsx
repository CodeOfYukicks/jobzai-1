import get from "lodash/get";
import { Fragment } from "react";

import { cn } from "@/lib/utils";

import { BrandIcon } from "../components/BrandIcon";
import { Picture } from "../components/Picture";
import { useReactiveResumeStore } from "../store";
import type {
  CertificationItem,
  CustomSectionGroup,
  CustomSectionItem,
  ExperienceItem,
  EducationItem,
  InterestItem,
  LanguageItem,
  ProfileItem,
  SectionKey,
  SectionWithItem,
  SkillItem,
  UrlValue,
} from "../types";
import {
  isEmptyRichText,
  isValidUrl,
  sanitizeHtmlContent,
} from "../utils";
import type { TemplateProps } from "./types";

const Header = () => {
  const basics = useReactiveResumeStore((state) => state.resume?.basics);
  const profiles = useReactiveResumeStore((state) => state.resume?.sections.profiles);

  if (!basics) return null;

  return (
    <div className="flex items-center justify-between space-x-4 border-b border-primary pb-5">
      <Picture />

      <div className="flex-1 space-y-2">
        <div>
          <div className="text-2xl font-bold">{basics.name}</div>
          <div className="text-base">{basics.headline}</div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
          {basics.location && (
            <div className="flex items-center gap-x-1.5">
              <i className="ph ph-bold ph-map-pin text-primary" />
              <div>{basics.location}</div>
            </div>
          )}
          {basics.phone && (
            <div className="flex items-center gap-x-1.5">
              <i className="ph ph-bold ph-phone text-primary" />
              <a href={`tel:${basics.phone}`} target="_blank" rel="noreferrer">
                {basics.phone}
              </a>
            </div>
          )}
          {basics.email && (
            <div className="flex items-center gap-x-1.5">
              <i className="ph ph-bold ph-at text-primary" />
              <a href={`mailto:${basics.email}`} target="_blank" rel="noreferrer">
                {basics.email}
              </a>
            </div>
          )}
          <Link url={basics.url} />
          {basics.customFields.map((item) => (
            <div key={item.id} className="flex items-center gap-x-1.5">
              <i className={cn(`ph ph-bold ph-${item.icon}`, "text-primary")} />
              {isValidUrl(item.value) ? (
                <a href={item.value} target="_blank" rel="noreferrer noopener nofollow">
                  {item.name || item.value}
                </a>
              ) : (
                <span>{[item.name, item.value].filter(Boolean).join(": ")}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {profiles && profiles.visible && profiles.items.length > 0 && (
        <div
          className="grid gap-x-4 gap-y-1 text-right"
          style={{ gridTemplateColumns: `repeat(${profiles.columns}, auto)` }}
        >
          {profiles.items
            .filter((item) => item.visible)
            .map((item) => (
              <div key={item.id} className="flex items-center gap-x-2">
                <Link
                  url={item.url}
                  label={item.username}
                  className="text-sm"
                  icon={<BrandIcon slug={item.icon} />}
                />
              </div>
            ))}
        </div>
      )}
    </div>
  );
};

const Summary = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.summary);
  if (!section || !section.visible || isEmptyRichText(section.content)) return null;

  return (
    <section id={section.id}>
      <h4 className="font-bold text-primary">{section.name}</h4>
      <div
        dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(section.content) }}
        style={{ columns: section.columns }}
        className="wysiwyg"
      />
    </section>
  );
};

const Rating = ({ level }: { level: number }) => (
  <div className="flex items-center gap-x-1.5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className={cn("size-3 rounded border-2 border-primary", level > index && "bg-primary")}
      />
    ))}
  </div>
);

type LinkProps = {
  url: UrlValue;
  icon?: React.ReactNode;
  iconOnRight?: boolean;
  label?: string;
  className?: string;
};

const Link = ({ url, icon, iconOnRight, label, className }: LinkProps) => {
  if (!isValidUrl(url.href)) return null;

  return (
    <div className="flex items-center gap-x-1.5 break-all">
      {!iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
      <a
        href={url.href}
        target="_blank"
        rel="noreferrer noopener nofollow"
        className={cn("line-clamp-1 max-w-fit", className)}
      >
        {label ?? (url.label || url.href)}
      </a>
      {iconOnRight && (icon ?? <i className="ph ph-bold ph-link text-primary" />)}
    </div>
  );
};

const LinkedEntity = ({
  name,
  url,
  separateLinks,
  className,
}: {
  name: string;
  url: UrlValue;
  separateLinks: boolean;
  className?: string;
}) =>
  !separateLinks && isValidUrl(url.href) ? (
    <Link
      url={url}
      label={name}
      icon={<i className="ph ph-bold ph-globe text-primary" />}
      iconOnRight
      className={className}
    />
  ) : (
    <div className={className}>{name}</div>
  );

type SectionProps<T> = {
  section?: SectionWithItem<T> | CustomSectionGroup;
  children?: (item: T) => React.ReactNode;
  className?: string;
  urlKey?: keyof T;
  levelKey?: keyof T;
  summaryKey?: keyof T;
  keywordsKey?: keyof T;
};

const Section = <T extends { id: string; visible: boolean }>({
  section,
  children,
  className,
  urlKey,
  levelKey,
  summaryKey,
  keywordsKey,
}: SectionProps<T>) => {
  if (!section || !section.visible || section.items.filter((item) => item.visible).length === 0) {
    return null;
  }

  return (
    <section id={section.id} className="grid">
      <h4 className="font-bold text-primary">{section.name}</h4>

      <div
        className="grid gap-x-6 gap-y-3"
        style={{ gridTemplateColumns: `repeat(${section.columns}, 1fr)` }}
      >
        {section.items
          .filter((item) => item.visible)
          .map((item) => {
            const url = (urlKey && get(item, urlKey)) as UrlValue | undefined;
            const level = (levelKey && get(item, levelKey, 0)) as number | undefined;
            const summary = (summaryKey && get(item, summaryKey, "")) as string | undefined;
            const keywords = (keywordsKey && get(item, keywordsKey, [])) as string[] | undefined;

            return (
              <div key={item.id} className={cn("space-y-2", className)}>
                <div>
                  {children?.(item)}
                  {url && section.separateLinks && <Link url={url} />}
                </div>

                {summary && !isEmptyRichText(summary) && (
                  <div
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlContent(summary) }}
                    className="wysiwyg"
                  />
                )}

                {typeof level === "number" && level > 0 && <Rating level={level} />}

                {keywords && keywords.length > 0 && (
                  <p className="text-sm">{keywords.join(", ")}</p>
                )}
              </div>
            );
          })}
      </div>
    </section>
  );
};

const Experience = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.experience);

  return (
    <Section<ExperienceItem> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={item.company}
              url={item.url}
              separateLinks={Boolean(section?.separateLinks)}
              className="font-bold"
            />
            <div>{item.position}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold">{item.date}</div>
            <div>{item.location}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

const Education = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.education);

  return (
    <Section<EducationItem> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={item.institution}
              url={item.url}
              separateLinks={Boolean(section?.separateLinks)}
              className="font-bold"
            />
            <div>{item.area}</div>
            <div>{item.score}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold">{item.date}</div>
            <div>{item.studyType}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

const Certifications = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.certifications);

  return (
    <Section<CertificationItem> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <div className="font-bold">{item.name}</div>
            <LinkedEntity
              name={item.issuer}
              url={item.url}
              separateLinks={Boolean(section?.separateLinks)}
            />
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold">{item.date}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

const Skills = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.skills);

  return (
    <Section<SkillItem> section={section} levelKey="level" keywordsKey="keywords">
      {(item) => (
        <div>
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  );
};

const Interests = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.interests);

  return (
    <Section<InterestItem> section={section} keywordsKey="keywords" className="space-y-0.5">
      {(item) => <div className="font-bold">{item.name}</div>}
    </Section>
  );
};

const Languages = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.languages);

  return (
    <Section<LanguageItem> section={section} levelKey="level">
      {(item) => (
        <div className="space-y-0.5">
          <div className="font-bold">{item.name}</div>
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  );
};

const Projects = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.projects);

  return (
    <Section<CustomSectionItem> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div className="flex items-start justify-between">
          <div className="text-left">
            <LinkedEntity
              name={item.name}
              url={item.url}
              separateLinks={Boolean(section?.separateLinks)}
              className="font-bold"
            />
            <div>{item.description}</div>
          </div>

          <div className="shrink-0 text-right">
            <div className="font-bold">{item.date}</div>
          </div>
        </div>
      )}
    </Section>
  );
};

const References = () => {
  const section = useReactiveResumeStore((state) => state.resume?.sections.references);

  return (
    <Section<CustomSectionItem> section={section} urlKey="url" summaryKey="summary">
      {(item) => (
        <div>
          <LinkedEntity
            name={item.name}
            url={item.url}
            separateLinks={Boolean(section?.separateLinks)}
            className="font-bold"
          />
          <div>{item.description}</div>
        </div>
      )}
    </Section>
  );
};

const mapSectionToComponent = (section: SectionKey) => {
  switch (section) {
    case "summary":
      return <Summary />;
    case "experience":
      return <Experience />;
    case "education":
      return <Education />;
    case "certifications":
      return <Certifications />;
    case "skills":
      return <Skills />;
    case "interests":
      return <Interests />;
    case "languages":
      return <Languages />;
    case "projects":
      return <Projects />;
    case "references":
      return <References />;
    default:
      return null;
  }
};

export const OnyxTemplate = ({ columns, isFirstPage = false }: TemplateProps) => {
  const [main, sidebar] = columns;

  return (
    <div className="space-y-4 p-custom">
      {isFirstPage && <Header />}

      {main.map((section) => (
        <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
      ))}

      {sidebar.map((section) => (
        <Fragment key={section}>{mapSectionToComponent(section)}</Fragment>
      ))}
    </div>
  );
};

