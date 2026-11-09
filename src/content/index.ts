import real from './portfolio.json';
import realPt from './portfolio.pt-BR.json';
import type { Lang } from '../i18n';
import type { Portfolio } from './schema';

/** Everything the page says, in English. Edit src/content/portfolio.json. */
export const portfolio = real as Portfolio;

/** The same, in Brazilian Portuguese. Edit src/content/portfolio.pt-BR.json. */
export const portfolioPt = realPt as Portfolio;

export const contentFor = (lang: Lang) => (lang === 'pt' ? portfolioPt : portfolio);

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
