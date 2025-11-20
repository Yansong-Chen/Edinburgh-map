import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 🚨 base 路径必须与 GitHub 仓库名 EXACT MATCH（区分大小写）
// 你的仓库名是 Edinburgh-map
export default defineConfig({
  base: '/Edinburgh-map/',
  plugins: [react()],
})
