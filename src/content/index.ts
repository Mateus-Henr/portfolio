import real from './portfolio.json';
import type { Portfolio } from './schema';

/** Everything the page says. Edit src/content/portfolio.json. */
export const portfolio = real as Portfolio;

export type {
  Portfolio,
  Profile,
  Social,
  SocialKind,
  CareerStep,
  CareerType,
  Project,
  ProjectCategory,
  Certificate,
  CertificateKind,
} from './schema';
