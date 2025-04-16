/** @type {import('tailwindcss').Config} */
import { createThemes } from 'tw-colors'

export const mode = 'jit'
export const content = ["./templates/**/*.{html,htm}"]
export const theme = {
  extend: {
    fontFamily: {
      headings: ['Inter', 'system-ui', 'sans-serif'],
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
    },
    spacing: {
      'nav': '4rem',
    },
    backgroundImage: {
      'dot-grid': "radial-gradient(circle at center, rgba(128, 128, 128, 0.3) 1px, transparent 1px)"
    },
    backgroundSize: {
      'dot-grid': '20px 20px'
    }
  },
}
export const plugins = [
  require('tailwind-scrollbar'),
  require('@tailwindcss/typography'),
  "prettier-plugin-tailwindcss",
  createThemes({
    default: {
      'primary': '#2563eb',
      'secondary': '#1e293b',
      'background': '#f8fafc',
      'text': '#f8fafc',
      'nav': "#0f172a",
      'button': '#3b82f6'
    }
  }),
  function ({ addUtilities }) {
    addUtilities({
      ".pixelated": {
        "image-rendering": "pixelated"
      }
    })
  }
]

