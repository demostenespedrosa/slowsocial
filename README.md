# Slow Social 🌿✨

> Uma rede social calma, consciente e inspiradora projetada segundo os mais altos padrões de design nativo da Apple (iOS HIG) e psicologia de bem-estar digital.

---

## 📱 Destaques do Projeto

* **Design System Apple iOS HIG:**
  * Paleta Lilás Pastel primária (`#7C65C1` / `#A390E4`) equilibrada para tranquilidade cognitiva.
  * Suporte autêntico aos temas **Claro (Padrão)** e **Escuro (OLED)**.
  * Padrão *Inset Grouped* em cards e listas com divisores capilares finos (`divide-y divide-black/[0.04]`).
  * Barra de navegação inferior nativa Apple com efeito *Frosted Glass* (`backdrop-blur-2xl`) e safe areas.
* **Feed com Múltiplos Formatos de Conteúdo:**
  * Suporte a fotos e vídeos em proporções `1:1`, `3:4`, `9:16`, `16:9` e **Carrossel deslizante** (estilo Instagram).
  * Micro-reflexões curtas (estilo Twitter) e ensaios técnicos aprofundados (estilo LinkedIn).
  * Notas de voz / áudio com onda sonora (*waveform*) interativa e controle de velocidade `1x / 1.5x / 2x`.
* **Micro-Animações Vetoriais (Lottie Style):**
  * Popover de reações com círculos flutuantes animados (❤️ Curtir, 👏 Parabéns, 💡 Genial, 🤝 Apoiado, 🔥 Inspirador, 🤔 Reflexivo).
  * Transições fluidas nativas entre telas com `document.startViewTransition` e curva elástica Apple.
* **Tela de Notificações Minimalista:**
  * Fusão do padrão Instagram (micro-badges nos avatares e miniaturas de posts clicáveis) com LinkedIn (pílulas de filtro e ações rápidas de conexão).
  * Agrupamento cronológico (*Hoje*, *Esta semana*, *Anteriores*).
* **PWA Instalável no Smartphone:**
  * Ícone Apple Squircle personalizado em alta resolução (`192x192`, `512x512`, `apple-touch-icon.png`, `maskable`).
  * Modo de exibição `standalone` sem barras de navegação.
  * Service Worker com precache, estratégias offline e suporte resiliente.
  * Modal guiado para iOS Safari ("Adicionar à Tela de Início") e prompt em 1 toque no Android.
* **Otimizado para Deploy na Vercel:**
  * Configuração em `vercel.json` com reescrita SPA, cabeçalhos de segurança e cache otimizado.

---

## 🚀 Como Executar

### Pré-requisitos
* [Node.js](https://nodejs.org/) (versão 18 ou superior)
* npm

### Instalação
```bash
# Instalar dependências
npm install

# Gerar ícones PWA (opcional, já incluídos em public/)
npm run generate:icons

# Iniciar servidor de desenvolvimento local
npm run dev
```

### Build de Produção
```bash
# Compilar TypeScript e gerar pacote otimizado
npm run build

# Pré-visualizar build localmente
npm run preview
```

---

## 🛠️ Tecnologias Utilizadas

* **React 19**
* **TypeScript**
* **Vite 8**
* **Tailwind CSS v4**
* **Lucide React**
* **Sharp** (para geração de ativos PWA)

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais informações.
