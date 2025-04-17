import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',        // ensures all asset URLs are relative
  plugins: [react()],
})