/** @type {import('tailwindcss').Config} */
import { createThemes } from 'tw-colors'

export const mode = 'jit'
export const content = ["./templates/**/*.{html,htm}"]
export const theme = {
  extend: {},
}
export const plugins = [
  require('tailwind-scrollbar'),
  require('@tailwindcss/typography'),
  "prettier-plugin-tailwindcss",
  createThemes({
    default: {
      'primary': '#1d2d44',
      'secondary': '#0d1321',
      'background': '#f1faee',
      'text': '#fffafa'
    }
  })
]

