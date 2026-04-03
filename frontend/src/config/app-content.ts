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
    name: 'Smartify ERP Portal',
    title: 'Smartify Portal',
    description: 'Internal portal for managing and onboarding endpoints into the Smartify Snowflake system.',
    tagline: 'Enterprise-grade ERP system for Snowflake data validation and multi-platform sync.',
    logo: {
      icon: '📊',
      alt: 'Smartify Logo'
    }
  },
  header: {
    title: 'Smartify Portal',
    navigation: {
      signIn: 'Sign In',
      signUp: 'Sign Up'
    }
  },
  hero: {
    title: 'Smartify ERP System',
    subtitle: 'Automated Snowflake Sync & Validation',
    description: 'Use Snowflake for automated data validation and multi-platform sync. Ensure 100% accuracy with automated Snowflake schema checks.',
    cta: {
      getStarted: 'Get Started',
      signIn: 'Sign In'
    }
  },
  features: {
    title: 'Enterprise Features',
    subtitle: 'Automate your data workflow with Snowflake integration',
    items: [
      {
        icon: '🛡️',
        title: 'Data Validation',
        description: 'Ensure 100% accuracy with automated Snowflake schema checks.'
      },
      {
        icon: '🗄️',
        title: 'Snowflake Sync',
        description: 'Direct integration with Snowflake as the single source of truth.'
      },
      {
        icon: '⚡',
        title: 'Automated Workflow',
        description: 'One submission syncs to Vistar, Dropbox, and Hivestack.'
      }
    ]
  },
  documentation: {
    title: 'Smartify ERP Documentation',
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
    copyright: '© 2026 Alsirius Ltd. For internal use only.'
  }
};
