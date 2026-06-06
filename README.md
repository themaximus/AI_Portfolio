# ⚡ AI-Driven Developer Portfolio & Web Systems Showcase

[English Version Below](#english-version)

Ласкаво просимо до репозиторію мого інтерактивного портфоліо. Цей проект є не просто резюме, а живою демонстрацією **AI-Driven Development (ADD)** та сучасної оркестрації веб-систем.

🔗 **Посилання на репозиторій:** [https://github.com/themaximus/AI_Portfolio](https://github.com/themaximus/AI_Portfolio)

---

## 🚀 Філософія: AI-Driven Architecture

Ця кодова база була спроектована, побудована та оптимізована за допомогою розробки нового покоління на базі штучного інтелекту. Замість ручного написання шаблонного коду я дію як **AI-оркестратор / системний інженер**, керуючи автономними агентами для швидкого створення функціоналу, написання тестів та автоматизації інфраструктури.

### ІИ-стек під моїм керуванням:
*   **IDE Агенти:** [Cursor](https://www.cursor.com/) та [Claude Code](https://github.com/anthropics/claude-code) для контекстного програмування.
*   **Агентний раннер:** [Antigravity](https://deepmind.google/) для глибокої автоматизації процесів.
*   **Автономна оркестрація:** [OpenClaw](https://github.com/openclaw) для автономного скриптування консолі та файлової системи.
*   **Локальна інфраструктура:** [LM Studio](https://lmstudio.ai/) для запуску приватних офлайн-моделей (Local LLMs) без передачі коду в сторонні хмари (Data Privacy).
*   **Контекстний шар:** Кастомні [MCP (Model Context Protocol) сервери](https://modelcontextprotocol.io/) для безпечного доступу моделей до локальної файлової системи.

---

## 🛠️ Основні системи та інтегровані демо-версії

Портфоліо містить два повністю функціональних додатки, вбудованих безпосередньо в інтерфейс:

### 1. 📋 Smart Board v6.7 (Персональна Вікі та робочий простір)
Інтерактивний менеджер завдань та документів, натхненний Notion.
*   **Блочний редактор:** Побудований на базі модульного [Editor.js](https://editorjs.io/).
*   **Гнучкі режими відображення:** Миттєве перемикання між **текстовим документом** та **Канбан-дошкою** (автоматичне створення карток на основі заголовків).
*   **Пошукова система:** Глибоке індексування та глобальний пошук по Ctrl + K.
*   **Портативність даних:** Повна підтримка експорту та імпорту локальних JSON-файлів.

### 2. ⚡ DTEK Outage Monitor
Клієнтський віджет для моніторингу графіків відключень електроенергії в місті Дніпро.
*   **CORS Bypass Proxy:** Локальний Node.js/Express проксі-сервер (`proxy-server.cjs`) для безпечного збору та парсингу актуальних графіків.
*   **Кросплатформенність:** Спільна кодова база, адаптована для десктопу (Electron) та мобільних пристроїв (Capacitor/Android).

---

## 🎨 Дизайн та візуальна досконалість

Візуальна частина реалізована на чистих веб-стандартах HTML/SCSS у стилі кібер-мінімалізму:
*   **Interactive 3D-фон:** Динамічні сітки на базі [Three.js](https://threejs.org/), які реагують на рухи миші.
*   **Плавна поява (Scroll Reveal):** М'які ефекти плавного підйому знизу для інтерфейсу та фонових полотен при завантаженні сторінки.
*   **Читабельність та контраст:** Напівпрозорі шари темного гласморфізму (`backdrop-filter: blur`) захищають текст від злиття з фоновими візерунками.
*   **Чистота інтерфейсу:** Жодного зайвого миготливого гліч-шуму — максимальний фокус на стабільності та зручності.

---

## 📦 Локальний запуск

### Вимоги
Переконайтеся, що у вас встановлено [Node.js](https://nodejs.org/).

### 1. Клонувати репозиторій
```bash
git clone https://github.com/themaximus/AI_Portfolio.git
cd AI_Portfolio
```

### 2. Встановити залежності
```bash
npm install
```

### 3. Запустити проксі-сервер DTEK
Необхідно запустити локальний проксі для збору даних з сайту ДТЕК:
```bash
node proxy-server.cjs
```
*Проксі запуститься на порту `http://localhost:3001`.*

### 4. Запустити локальний сервер розробки
У новому вікні терміналу запустіть Vite:
```bash
npm run dev
```
*Перейдіть у браузері за адресою `http://localhost:3000`.*

### 5. Збірка для продакшну
```bash
npm run build
```

---

## ⚡ Огляд технологічного стека

*   **Frontend Core:** HTML5, Modern ECMAScript (Vanilla JS), SCSS / CSS Custom Properties.
*   **3D Графіка:** WebGL, Three.js.
*   **Бібліотеки:** Editor.js, Vis-network.
*   **Середовище виконання:** Node.js, Electron, Capacitor (Android).
*   **Збирач:** Vite.

<br>
<br>

---
---

<a name="english-version"></a>

# ⚡ AI-Driven Developer Portfolio & Web Systems Showcase

Welcome to the central repository for my interactive portfolio. This project serves not just as a resume, but as a living demonstration of **AI-Driven Development (ADD)** and modern web systems orchestration. 

🔗 **Repository Link:** [https://github.com/themaximus/AI_Portfolio](https://github.com/themaximus/AI_Portfolio)

---

## 🚀 The Philosophy: AI-Driven Architecture

This codebase was architected, built, and optimized using a next-generation AI-assisted workflow. Instead of writing boilerplate code manually, I act as an **AI Orchestrator / Systems Engineer**, leveraging advanced agentic workflows to build features rapidly, write tests, and automate infrastructure.

### The AI Stack under my Orchestration:
*   **IDE Agents:** [Cursor](https://www.cursor.com/) & [Claude Code](https://github.com/anthropics/claude-code) for contextual programming.
*   **Agentic Runner:** [Antigravity](https://deepmind.google/) for deep workflow automation.
*   **Autonomous Workflows:** [OpenClaw](https://github.com/openclaw) for self-hosted console and file-system scripting.
*   **Local Infrastructure:** [LM Studio](https://lmstudio.ai/) running offline LLMs (Local Llama/Mistral) for private code processing (Data Privacy).
*   **Context Layer:** Custom [MCP (Model Context Protocol) Servers](https://modelcontextprotocol.io/) enabling LLMs to safely read/write local filesystem resources.

---

## 🛠️ Key Systems & Live Demos Included

This portfolio hosts two fully functional, embedded sub-applications (live demos) built from the ground up:

### 1. 📋 Smart Board v6.7 (Personal Wiki & Workspace)
An interactive Notion-inspired task and document manager.
*   **Rich Text Editor:** Built using modular block-based [Editor.js](https://editorjs.io/).
*   **Dual View System:** Instantly toggle between a **Document Text View** and a **Kanban Board** (automated card generation from document headings).
*   **Search Engine:** Deep indexing search utility accessible via `Ctrl + K`.
*   **Data Portability:** Supports local JSON export and import for full user privacy.

### 2. ⚡ DTEK Outage Monitor
A client-side widget designed to monitor electricity grid outage schedules in Dnipro, Ukraine.
*   **CORS Bypass Proxy:** Bundled with a Node.js/Express proxy server (`proxy-server.cjs`) to parse live schedules safely.
*   **Multi-Platform Target:** Powered by web standards, packaged for Desktop (Electron) and Mobile (Capacitor/Android).

---

## 🎨 Design & Aesthetic Excellence

The visual layer is built using vanilla HTML/SCSS with high-fidelity cyber-minimalism:
*   **Interactive 3D Backgrounds:** Dynamic canvas grids powered by [Three.js](https://threejs.org/) reacting to mouse movements.
*   **Smooth Scroll Entrances:** Custom viewport reveal animations that fade and slide background canvases and UI panels up from the bottom on page load.
*   **High Contrast & Readability:** Semi-transparent dark glassmorphism layers (`backdrop-filter: blur`) ensuring text stands out perfectly against animated background textures.
*   **Zero Glitch Clutter:** Completely stable layouts focusing on fast, clean user experience.

---

## 📦 How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed.

### 1. Clone the repository
```bash
git clone https://github.com/themaximus/AI_Portfolio.git
cd AI_Portfolio
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the DTEK Proxy Server
Run the local proxy to allow the DTEK monitor to fetch live scheduling:
```bash
node proxy-server.cjs
```
*The proxy will spin up at `http://localhost:3001`.*

### 4. Start the Frontend Development Server
In a new terminal window, start Vite:
```bash
npm run dev
```
*Open your browser and navigate to `http://localhost:3000` to view the live site.*

### 5. Build for Production
```bash
npm run build
```

---

## ⚡ Technical Stack Overview

*   **Frontend Core:** HTML5, Modern ECMAScript (Vanilla JS), SCSS / CSS Custom Properties.
*   **3D Graphics:** WebGL, Three.js.
*   **Rich Utilities:** Editor.js, Vis-network (for graph structures).
*   **Runtime Environments:** Node.js, Electron, Capacitor (Android).
*   **Bundler:** Vite.
