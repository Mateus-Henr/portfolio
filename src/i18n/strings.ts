// Every text the page shows outside src/content/portfolio*.json, in English and
// Brazilian Portuguese. Add a key to `en` and TypeScript asks for it in `pt`.

const en = {
  meta: {
    htmlLang: 'en',
    title: 'Matt · Software Engineer',
  },
  lang: {
    /** Name of the group of flags that switches the language. */
    label: 'Language',
  },
  nav: {
    sections: 'Sections',
    backToTop: (name: string) => `${name}, back to top`,
  },
  hero: {
    now: 'Now',
    basedIn: 'Based in',
    remote: 'Remote-friendly · English & Portuguese',
  },
  sections: {
    about: { eyebrow: 'About', title: 'A little about me', nav: 'About' },
    career: {
      eyebrow: 'Career path',
      title: 'How I got here',
      nav: 'Career',
      intro: 'Follow the path from my first lines of code to today. Open any step to read more.',
    },
    projects: { eyebrow: 'Projects', title: 'Things I have built', nav: 'Projects', intro: 'Pick an area to see the projects in it.' },
    certificates: { eyebrow: 'Certificates', title: 'Courses and awards', nav: 'Certificates' },
    contact: { eyebrow: 'Contact', title: 'Get in touch', nav: 'Contact' },
  },
  about: {
    storyFile: 'about-me.md',
    factsFile: 'quick-facts',
    skillsFile: 'skills.md',
  },
  dates: {
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    now: 'now',
  },
  career: {
    types: { study: 'Study', work: 'Work', research: 'Research', milestone: 'Milestone' },
    all: 'All',
    filterHide: 'Show only one kind of step',
    filterDim: 'Highlight one kind of step',
    today: 'Today',
    start: 'Start',
    began: 'Where it began',
    seeMore: 'See more',
    earlier: (n: number) => `${n} earlier steps`,
    later: (n: number) => `${n} later steps`,
    now: 'Now',
    viewCertificate: 'View certificate',
    openCertificate: 'Open certificate',
    nextStep: 'Next step',
  },
  projects: {
    all: 'All',
    filter: 'Filter projects by area',
    showingAll: 'Showing all projects',
    showingArea: (area: string) => `Showing ${area} projects`,
  },
  certificates: {
    intro: (hours: number) => `${hours}+ hours of online courses, plus language certificates and awards. Open any certificate to see it.`,
    kinds: { all: 'All', course: 'Courses', language: 'Languages', award: 'Awards & events' },
    filter: 'Filter certificates',
    view: 'View',
    open: 'Open',
    course: 'Course',
  },
  more: {
    seeMore: (n: number) => `See more (${n})`,
    seeLess: 'See less',
    tools: (n: number, list: string) => `${n} more: ${list}`,
  },
  contact: {
    copy: 'Copy email',
    copied: 'Copied',
    file: 'contact.txt',
    top: 'Back to top',
  },
  pdf: {
    certificate: 'Certificate',
    newTab: 'Open in a new tab',
    close: 'Close',
  },
  story: {
    play: 'Play animation',
    pause: 'Pause animation',
    replay: 'Replay animation',
    title: 'The Architecture Machine',
    logline: 'A city that is really a system in layers, from blueprint to finished platform.',
    label:
      "Animation: a blueprint of a small city draws itself, then the city is built from it with City Hall in the middle. The city separates into floating layers labelled interface, services and access, data and infrastructure, each with the tools Matt uses. A citizen's request travels down through the layers and back to City Hall, and the layers come back together into the finished city.",
    captions: {
      blueprint: 'Every system starts as a blueprint.',
      built: 'Then it’s built, block by block.',
      layers: 'Underneath, the city is a machine made of layers.',
      jobs: 'Interface, services, data, infrastructure: each layer has one job.',
      request: 'A citizen sends a request, and the layers pass it along.',
      works: 'From blueprint to a city that works.',
    },
    hall: 'CITY HALL',
    layers: {
      'label-city': { title: 'Interface', note: 'what citizens use' },
      'label-ground': { title: 'Services & API', note: 'rules and access (RBAC)' },
      'label-data': { title: 'Data', note: 'every request saved' },
      'label-infra': { title: 'Infrastructure', note: 'servers and network' },
    } as Record<string, { title: string; note: string }>,
  },
  /** Words drawn inside the project animations. */
  scenes: {
    requests: 'Requests',
    match: '+30% match',
    llms: '20 LLMs',
    parts: '6 parts measured',
    night: '3 a.m.',
    brandA: 'Brand A',
    brandB: 'Brand B',
    live: 'live',
    admin: 'Admin',
    editor: 'Editor',
    guest: 'Guest',
    healthy: 'Healthy',
    paid: 'Paid',
    amount: 'R$ 50.00',
  },
};

export type Strings = typeof en;

const pt: Strings = {
  meta: {
    htmlLang: 'pt-BR',
    title: 'Matt · Engenheiro de Software',
  },
  lang: {
    label: 'Idioma',
  },
  nav: {
    sections: 'Seções',
    backToTop: (name) => `${name}, voltar ao topo`,
  },
  hero: {
    now: 'Agora',
    basedIn: 'Localização',
    remote: 'Trabalho remoto · Português e inglês',
  },
  sections: {
    about: { eyebrow: 'Sobre', title: 'Um pouco sobre mim', nav: 'Sobre' },
    career: {
      eyebrow: 'Trajetória',
      title: 'Como cheguei aqui',
      nav: 'Trajetória',
      intro: 'Siga o caminho das minhas primeiras linhas de código até hoje. Abra qualquer etapa para ler mais.',
    },
    projects: { eyebrow: 'Projetos', title: 'Coisas que construí', nav: 'Projetos', intro: 'Escolha uma área para ver os projetos dela.' },
    certificates: { eyebrow: 'Certificados', title: 'Cursos e prêmios', nav: 'Certificados' },
    contact: { eyebrow: 'Contato', title: 'Fale comigo', nav: 'Contato' },
  },
  about: {
    storyFile: 'sobre-mim.md',
    factsFile: 'fatos-rapidos',
    skillsFile: 'habilidades.md',
  },
  dates: {
    months: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
    now: 'hoje',
  },
  career: {
    types: { study: 'Estudo', work: 'Trabalho', research: 'Pesquisa', milestone: 'Marco' },
    all: 'Todas',
    filterHide: 'Mostrar só um tipo de etapa',
    filterDim: 'Destacar um tipo de etapa',
    today: 'Hoje',
    start: 'Início',
    began: 'Onde tudo começou',
    seeMore: 'Ver mais',
    earlier: (n) => `${n} etapas anteriores`,
    later: (n) => `${n} etapas seguintes`,
    now: 'Agora',
    viewCertificate: 'Ver certificado',
    openCertificate: 'Abrir certificado',
    nextStep: 'Próxima etapa',
  },
  projects: {
    all: 'Todos',
    filter: 'Filtrar projetos por área',
    showingAll: 'Mostrando todos os projetos',
    showingArea: (area) => `Mostrando projetos de ${area}`,
  },
  certificates: {
    intro: (hours) => `${hours}+ horas de cursos online, além de certificados de idioma e prêmios. Abra qualquer certificado para vê-lo.`,
    kinds: { all: 'Todos', course: 'Cursos', language: 'Idiomas', award: 'Prêmios e eventos' },
    filter: 'Filtrar certificados',
    view: 'Ver',
    open: 'Abrir',
    course: 'Curso',
  },
  more: {
    seeMore: (n) => `Ver mais (${n})`,
    seeLess: 'Ver menos',
    tools: (n, list) => `Mais ${n}: ${list}`,
  },
  contact: {
    copy: 'Copiar e-mail',
    copied: 'Copiado',
    file: 'contato.txt',
    top: 'Voltar ao topo',
  },
  pdf: {
    certificate: 'Certificado',
    newTab: 'Abrir em uma nova aba',
    close: 'Fechar',
  },
  story: {
    play: 'Reproduzir animação',
    pause: 'Pausar animação',
    replay: 'Ver a animação de novo',
    title: 'A Máquina de Arquitetura',
    logline: 'Uma cidade que, na verdade, é um sistema em camadas, da planta à plataforma pronta.',
    label:
      'Animação: a planta de uma pequena cidade se desenha sozinha; depois, a cidade é construída a partir dela, com a prefeitura no centro. A cidade se separa em camadas flutuantes chamadas interface, serviços e acesso, dados e infraestrutura, cada uma com as ferramentas que o Matt usa. A solicitação de um cidadão desce pelas camadas e volta à prefeitura, e as camadas se juntam de novo na cidade pronta.',
    captions: {
      blueprint: 'Todo sistema começa como uma planta.',
      built: 'Depois, ele é construído, bloco por bloco.',
      layers: 'Por baixo, a cidade é uma máquina feita de camadas.',
      jobs: 'Interface, serviços, dados, infraestrutura: cada camada tem uma função.',
      request: 'Um cidadão faz uma solicitação, e as camadas a passam adiante.',
      works: 'Da planta a uma cidade que funciona.',
    },
    hall: 'PREFEITURA',
    layers: {
      'label-city': { title: 'Interface', note: 'o que o cidadão usa' },
      'label-ground': { title: 'Serviços e API', note: 'regras e acesso (RBAC)' },
      'label-data': { title: 'Dados', note: 'cada solicitação salva' },
      'label-infra': { title: 'Infraestrutura', note: 'servidores e rede' },
    },
  },
  scenes: {
    requests: 'Pedidos',
    match: '+30% acerto',
    llms: '20 LLMs',
    parts: '6 partes medidas',
    night: '3h',
    brandA: 'Marca A',
    brandB: 'Marca B',
    live: 'ao vivo',
    admin: 'Admin',
    editor: 'Editor',
    guest: 'Leitor',
    healthy: 'Saudável',
    paid: 'Pago',
    amount: 'R$ 50,00',
  },
};

export const STRINGS = { en, pt };
