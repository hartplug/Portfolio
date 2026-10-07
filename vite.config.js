import { defineConfig } from 'vite';

const base = process.env.GITHUB_PAGES === 'true' ? '/Portfolio/' : '/';
const rootPaths = ['favicon.svg','site.css','home-luxe.css','lab-editorial.css','js/app.js','js/shared.js','js/ai-status-orb.js','js/home-command-scene.js'];

export default defineConfig({
  appType: 'mpa',
  base,
  plugins: [{
    name: 'prefix-root-relative-html-assets',
    transformIndexHtml(html) {
      if (base === '/') return html;
      for (const path of rootPaths) html = html.replaceAll(`"/${path}"`, `"${base}${path}"`);
      html = html.replaceAll('"/assets/', `"${base}assets/`);
      return html;
    },
  }],
  build: {
    rollupOptions: {
      input: {
        index: 'index.html',
        work: 'work.html',
        project: 'project.html',
        lab: 'lab.html',
        contact: 'contact.html',
      },
    },
  },
});
