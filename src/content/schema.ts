// Shape of portfolio.json, the real content used by versions 11-20.
// Edit the JSON file, not the components: every text on the page comes from it.

export type SocialKind = 'github' | 'linkedin' | 'email' | 'phone' | 'website' | 'resume';

export interface Social {
  kind: SocialKind;
  label: string;
  url: string;
  /** Text shown where the full address is spelled out, e.g. in the contact section. */
  display?: string;
}

export interface Profile {
  name: string;
  greeting: string;
  role: string;
  tagline: string;
  location: string;
  summary: string[];
  facts: { label: string; value: string }[];
  stats: { value: string; label: string }[];
  skills: { group: string; items: string[] }[];
}

/** study, work and research steps are big nodes; milestones are small ones. */
export type CareerType = 'study' | 'work' | 'research' | 'milestone';

export interface CareerStep {
  id: string;
  type: CareerType;
  /** Plain-language title, e.g. "Learned to code". */
  headline: string;
  role: string;
  org: string;
  place: string;
  /** "YYYY-MM". */
  start: string;
  /** "YYYY-MM"; leave out for the current role. */
  end?: string;
  story: string;
  points: string[];
  tools: string[];
  link?: { label: string; url: string };
  /** Id of a certificate that proves this step. */
  certificate?: string;
}

export interface ProjectCategory {
  id: string;
  label: string;
}

export interface Project {
  id: string;
  title: string;
  /** Ids from projectCategories. The first one sets the card colour and icon. */
  categories: string[];
  context: string;
  year: string;
  summary: string;
  highlight?: string;
  stack: string[];
}

export type CertificateKind = 'course' | 'language' | 'award';

export interface Certificate {
  id: string;
  kind: CertificateKind;
  title: string;
  issuer: string;
  hours?: string;
  year?: string;
  /** Language or tool the course is about; picks its icon (e.g. "Java"). */
  tech?: string;
  /** Link to the certificate (Google Drive share links open inside the popup viewer). */
  file?: string;
  /** Link to the course page. */
  course?: string;
}

export interface Portfolio {
  profile: Profile;
  socials: Social[];
  career: CareerStep[];
  projectCategories: ProjectCategory[];
  projects: Project[];
  certificates: Certificate[];
  contact: { headline: string; text: string; email: string; phone?: string };
}
