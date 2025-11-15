export function normalizeATSJob(raw: any, ats: string) {
  const company =
    raw.company ||
    raw.companyName ||
    raw.org ||
    raw.organization ||
    raw.hiringOrganization?.name ||
    raw.data?.company?.name ||
    raw.employer?.name ||
    "";

  const companyLogo =
    raw.companyLogo ||
    raw.logo ||
    raw.logoUrl ||
    raw.employer?.logo ||
    raw.company?.logo ||
    raw.data?.company?.logo_url ||
    null;

  const location =
    raw.location ||
    raw.locationName ||
    raw.city ||
    raw.state ||
    raw.locations?.join(", ") ||
    raw.data?.location?.name ||
    "";

  return {
    title: raw.title || "",
    company,
    companyLogo: companyLogo || null,
    location,
    description: raw.description || "",
    applyUrl: raw.applyUrl || raw.url || "",
    postedAt: raw.postedAt || raw.updatedAt || null,
    skills: raw.skills || [],
    externalId: raw.externalId || raw.id,
    ats,
  };
}




