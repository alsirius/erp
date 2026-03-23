export interface AppConfig {
  app: {
    name: string;
    title: string;
    description: string;
    tagline: string;
    logo: {
      icon: string;
      alt: string;
    };
  };
  header: {
    title: string;
    navigation: {
      signIn: string;
      signUp: string;
      
    };
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    cta: {
      getStarted: string;
      signIn: string;
    };
  };
  features: {
    title: string;
    subtitle: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  documentation: {
    title: string;
    button: string;
    sections: {
      overview: string;
      architecture: string;
      features: string;
      gettingStarted: string;
      patterns: string;
      technology: string;
      perfectFor: string;
    };
  };
  footer: {
    copyright: string;
  };
}

export const appConfig: AppConfig = {
  app: {
    name: 'Siriux SaaS WebApp',
    title: 'Siriux Starter Kit',
    description: 'A comprehensive, production-ready web application SaaS starter kit',
    tagline: 'Enterprise-grade architecture for modern web applications and SaaS platforms',
    logo: {
      icon: '⚡',
      alt: 'WebApp Starter Kit Logo'
    }
  },
  header: {
    title: 'Siriux Starter',
    navigation: {
      signIn: 'Sign In',
      signUp: 'Sign Up'
    }
  },
  hero: {
    title: 'Your Next Siriux Application',
    subtitle: 'Build Faster, Scale Better, Well Architectured',
    description: 'A comprehensive, production-ready starter kit for building modern web applications. Enterprise-grade architecture with authentication, user management, and scalable patterns.',
    cta: {
      getStarted: 'Get Started',
      signIn: 'Sign In'
    }
  },
  features: {
    title: 'Why Choose This Premium Starter?',
    subtitle: 'Enterprise-grade features and patterns to accelerate your web application and SaaS platform development',
    items: [
      {
        icon: '👥',
        title: 'Enterprise Architecture',
        description: 'Production-ready patterns with PostgreSQL, generic DAO, service layers, rest api, logging, and comprehensive error handling'
      },
      {
        icon: '🔐',
        title: 'Advanced Authentication',
        description: 'JWT with refresh tokens, role-based access control, and secure session management'
      },
      {
        icon: '📊',
        title: 'Developer Experience',
        description: 'Hot reload, comprehensive documentation, TypeScript throughout, and one-command setup'
      }
    ]
  },
  documentation: {
    title: 'Premium WebApp Starter Kit',
    button: 'Documentation',
    sections: {
      overview: 'Quick Overview',
      architecture: 'Architecture',
      features: 'Key Features',
      gettingStarted: 'Getting Started',
      patterns: 'Generic Patterns',
      technology: 'Technology Stack',
      perfectFor: 'Perfect For Building'
    }
  },
  footer: {
    copyright: '© 2026 Siriux WebApp SaaS Starter Kit, built with ❤️ by developers at Alsirius Ltd.'
  }
};
