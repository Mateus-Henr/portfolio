import { createContext, useContext } from 'react';
import { portfolio, type Portfolio } from '../content';

/**
 * The content a page shows. Versions 11-20 share src/content/portfolio.json;
 * a version can bring its own file through `config.content` (version 21 does).
 */
const ContentContext = createContext<Portfolio>(portfolio);

export const ContentProvider = ContentContext.Provider;

export const usePortfolio = () => useContext(ContentContext);
