export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    container: { center: true, padding: '1.5rem', screens: { '2xl': '1280px' } },
    extend: {
      colors: {
        border: 'hsl(var(--border))', input: 'hsl(var(--input))', ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))', foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        navy: { DEFAULT: 'hsl(var(--navy))', light: 'hsl(var(--navy-light))' },
        teal: 'hsl(var(--teal))', blue: 'hsl(var(--blue))', clinic: 'hsl(var(--clinic))',
        success: 'hsl(var(--success))', warning: 'hsl(var(--warning))', error: 'hsl(var(--error))',
      },
      spacing: {
        '0.5': 'var(--space-0-5)', '1': 'var(--space-1)', '1.5': 'var(--space-1-5)',
        '2': 'var(--space-2)', '2.5': 'var(--space-2-5)', '3': 'var(--space-3)',
        '4': 'var(--space-4)', '5': 'var(--space-5)', '6': 'var(--space-6)',
        '8': 'var(--space-8)', '10': 'var(--space-10)', '12': 'var(--space-12)',
        '16': 'var(--space-16)', '20': 'var(--space-20)', '24': 'var(--space-24)',
        'page-x': 'var(--space-page-x)', 'section-y': 'var(--space-section-y)',
      },
      fontSize: {
        display: ['var(--type-display)', { lineHeight: '1.08', letterSpacing: '-0.035em' }],
        title: ['var(--type-title)', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        heading: ['var(--type-heading)', { lineHeight: '1.4' }],
        body: ['var(--type-body)', { lineHeight: '1.6' }],
        caption: ['var(--type-caption)', { lineHeight: '1.4' }],
      },
      borderRadius: {
        lg: 'var(--radius)', md: 'calc(var(--radius) - 2px)', sm: 'calc(var(--radius) - 4px)',
        control: 'var(--radius-control)', card: 'var(--radius-card)', pill: 'var(--radius-pill)',
      },
      boxShadow: { soft: '0 8px 28px rgba(16,42,67,0.07)' },
      fontFamily: { sans: ['var(--font-family-sans)'], display: ['var(--font-family-display)'] },
    },
  },
  plugins: [],
}
