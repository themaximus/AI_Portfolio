/**
 * board-app.js
 * Port of Smart Board v6.7 (NotatkiApp1) into the portfolio workspace.
 * Encapsulated inside the initBoardApp() function.
 */

export function initBoardApp() {
    // ФИКС: Подавление ошибки SecurityError для getLayoutMap в iframe Canvas
    if (navigator.keyboard) {
        navigator.keyboard.getLayoutMap = () => Promise.resolve(new Map());
    }

    const appContainerWindow = document.querySelector('.board-app-window');
    if (!appContainerWindow) return;

    // --- СИСТЕМА ЛОКАЛІЗАЦІЇ ---
    const TRANSLATIONS = {
        ua: {
            ok: 'ОК',
            cancel: 'Скасувати',
            save: 'Зберегти',
            yes: 'Так',
            no: 'Ні',
            understand: 'Зрозуміло',
            renameProject: 'Перейменувати проєкт',
            newName: 'Нова назва:',
            deleteProject: 'Видалення проєкту',
            deleteConfirm: 'Ви впевнені, що хочете видалити проєкт "{name}"? Ця дія є незворотною.',
            newProject: 'Новий проєкт',
            enterProjectName: 'Введіть назву нового проєкту',
            recently: 'Нещодавно',
            edited: 'Змінено:',
            error: 'Помилка',
            importPdfError: 'Не вдалося імпортувати PDF файл.',
            selectPdf: '📄 Оберіть PDF-файл',
            savePdfError: 'Помилка збереження PDF:',
            expand: '↕️ Розгорнути',
            sidePeek: '◨ Збоку',
            moveToSide: 'Перемістити в бічну панель',
            collapseCard: '− Згорнути',
            collapse: '− Згорнути',
            centerWidth: '⇥ По центру',
            fullWidth: '↔ На всю ширину',
            selectFile: '📎 Оберіть будь-який файл',
            saveFileError: 'Помилка збереження файлу:',
            defaultPage: 'Головна',
            searchPlaceholder: 'Пошук...',
            searchProjects: '🔍 Пошук проєктів...',
            searchWiki: 'Пошук...',
            searchGlobal: 'Пошук по всім сторінкам...',
            untitledPage: 'Нова сторінка',
            added: 'Додано',
        },
        en: {
            ok: 'OK',
            cancel: 'Cancel',
            save: 'Save',
            yes: 'Yes',
            no: 'No',
            understand: 'Got it',
            renameProject: 'Rename Project',
            newName: 'New name:',
            deleteProject: 'Delete Project',
            deleteConfirm: 'Are you sure you want to delete project "{name}"? This action cannot be undone.',
            newProject: 'New Project',
            enterProjectName: 'Enter new project name',
            recently: 'Recently',
            edited: 'Modified:',
            error: 'Error',
            importPdfError: 'Failed to import PDF file.',
            selectPdf: '📄 Choose PDF file',
            savePdfError: 'Failed to save PDF:',
            expand: '↕️ Expand',
            sidePeek: '◨ Side Peek',
            moveToSide: 'Move to side panel',
            collapseCard: '− Collapse',
            collapse: '− Collapse',
            centerWidth: '⇥ Centered',
            fullWidth: '↔ Full Width',
            selectFile: '📎 Choose any file',
            saveFileError: 'Failed to save file:',
            defaultPage: 'Main Page',
            searchPlaceholder: 'Search...',
            searchProjects: '🔍 Search projects...',
            searchWiki: 'Search wiki...',
            searchGlobal: 'Search all pages...',
            untitledPage: 'Untitled Page',
            added: 'Added',
        }
    };

    function t(key) {
        const lang = document.documentElement.lang || 'ua';
        return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS['ua'][key] || key;
    }

    // --- СИСТЕМА КАСТОМНЫХ ДИАЛОГОВ ---
    const CustomDialog = {
        show: function({ type, title, message = '', placeholder = '', defaultValue = '', confirmText = t('ok'), cancelText = t('cancel') }) {
            return new Promise((resolve) => {
                const overlay = document.getElementById('customDialogOverlay');
                const titleEl = document.getElementById('customDialogTitle');
                const messageEl = document.getElementById('customDialogMessage');
                const inputWrapper = document.querySelector('.custom-dialog-input-wrapper');
                const inputEl = document.getElementById('customDialogInput');
                const confirmBtn = document.getElementById('customDialogConfirmBtn');
                const cancelBtn = document.getElementById('customDialogCancelBtn');

                titleEl.textContent = title;
                confirmBtn.textContent = confirmText;
                cancelBtn.textContent = cancelText;

                if (message) {
                    messageEl.textContent = message;
                    messageEl.style.display = 'block';
                } else {
                    messageEl.style.display = 'none';
                }

                if (type === 'prompt') {
                    inputWrapper.style.display = 'block';
                    inputEl.placeholder = placeholder;
                    inputEl.value = defaultValue;
                } else {
                    inputWrapper.style.display = 'none';
                }

                cancelBtn.style.display = type === 'alert' ? 'none' : 'block';

                overlay.classList.add('active');
                if (type === 'prompt') {
                    setTimeout(() => inputEl.focus(), 50); 
                }

                const cleanup = () => {
                    overlay.classList.remove('active');
                    confirmBtn.onclick = null;
                    cancelBtn.onclick = null;
                    inputEl.onkeydown = null;
                };

                confirmBtn.onclick = () => {
                    cleanup();
                    if (type === 'prompt') {
                        resolve(inputEl.value.trim() === '' ? null : inputEl.value.trim());
                    } else {
                        resolve(true);
                    }
                };

                cancelBtn.onclick = () => {
                    cleanup();
                    resolve(type === 'prompt' ? null : false);
                };

                inputEl.onkeydown = (e) => {
                    if (e.key === 'Enter') confirmBtn.onclick();
                    if (e.key === 'Escape') cancelBtn.onclick();
                };
            });
        },
        prompt: function(title, placeholder = '', defaultValue = '') {
            return this.show({ type: 'prompt', title, placeholder, defaultValue, confirmText: t('save') });
        },
        confirm: function(title, message = '') {
            return this.show({ type: 'confirm', title, message, confirmText: t('yes'), cancelText: t('no') });
        },
        alert: function(title, message = '') {
            return this.show({ type: 'alert', title, message, confirmText: t('understand') });
        }
    };

    // --- DOM ELEMENTS ---
    const boardContainer = document.getElementById('boardContainer');
    const documentViewContainer = document.getElementById('documentViewContainer');
    const docTitle = document.getElementById('docTitle');
    const docLastModified = document.getElementById('docLastModified');
    const wikiSearchInput = document.getElementById('wikiSearchInput');
    const exportDataBtn = document.getElementById('exportDataBtn');
    const importDataBtn = document.getElementById('importDataBtn');
    const importFileInput = document.getElementById('importFileInput');

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const appTitleButton = document.getElementById('appTitleButton');
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    const boardListEl = document.getElementById('boardList');
    const newBoardNameInput = document.getElementById('newBoardNameInput');
    const addBoardBtn = document.getElementById('addBoardBtn');
    const currentBoardTitleEl = document.getElementById('currentBoardTitle');
    const sidebarProjectTitle = document.getElementById('sidebarProjectTitle');
    
    const mediaModal = document.getElementById('mediaModal');
    const mediaModalContent = document.getElementById('mediaModalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');

    const graphViewContainer = document.getElementById('graphViewContainer');
    const showDocumentViewBtn = document.getElementById('showDocumentViewBtn');
    const showBoardViewBtn = document.getElementById('showBoardViewBtn');
    const showGraphViewBtn = document.getElementById('showGraphViewBtn');
    const addColumnBtn = document.getElementById('addColumnBtn');

    const customModalOverlay = document.getElementById('customModalOverlay');
    const customModalDialogContent = document.getElementById('customModalContent');
    const customModalButtons = document.getElementById('customModalButtons');

    const themeToggleBtn = document.getElementById('themeToggleBtn');

    // --- CONSTANTS & STATE ---
    const LS_THEME_KEY = 'smartKanbanTheme';
    const LS_ALL_BOARDS_KEY = 'smartKanbanAllBoards'; 
    const LS_ACTIVE_BOARD_ID_KEY = 'smartKanbanActiveBoardId'; 
    const LS_PROJECTS_KEY = 'smartKanbanProjects';

    let allProjectsData = {}; 
    let currentProjectId = null; 
    let allBoardsData = {};
    let activeBoardId = null;
    let currentView = 'document';
    let saveTimeout;
    let network = null;
    let editorInstance = null;

    function loadProjects() {
        const data = localStorage.getItem(LS_PROJECTS_KEY);
        allProjectsData = data ? JSON.parse(data) : {};
    }

    function saveProjects() {
        localStorage.setItem(LS_PROJECTS_KEY, JSON.stringify(allProjectsData));
    }

    function renderProjectGrid() {
        const grid = document.getElementById('projectGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const createCard = document.createElement('div');
        createCard.className = 'project-card create-new';
        createCard.innerHTML = `
            <div class="create-icon">➕</div>
            <div class="project-title">${t('newProject')}</div>
        `;
        createCard.addEventListener('click', createNewProject);
        grid.appendChild(createCard);

        Object.keys(allProjectsData).forEach(projectId => {
            const project = allProjectsData[projectId];
            const card = document.createElement('div');
            card.className = 'project-card';
            const coverColor = project.coverColor || 'var(--accent-secondary)';
            const dateStr = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : t('recently');

            card.innerHTML = `
                <div class="project-cover" style="background-color: ${coverColor}">
                    ${project.icon || '📂'}
                    <div class="project-card-actions">
                        <button class="btn-project-edit" title="${t('renameProject')}">✏️</button>
                        <button class="btn-project-delete" title="${t('deleteProject')}">🗑️</button>
                    </div>
                </div>
                <div class="project-info">
                    <div class="project-title" title="${project.title}">${project.title}</div>
                    <div class="project-meta">${t('edited')} ${dateStr}</div>
                </div>
            `;

            card.querySelector('.btn-project-edit').onclick = async (e) => {
                e.stopPropagation();
                const newTitle = await CustomDialog.prompt(t('renameProject'), t('newName'), project.title);
                if (newTitle && newTitle !== project.title) {
                    project.title = newTitle;
                    saveProjects();
                    renderProjectGrid();
                }
            };

            card.querySelector('.btn-project-delete').onclick = async (e) => {
                e.stopPropagation();
                const confirmed = await CustomDialog.confirm(t('deleteProject'), t('deleteConfirm').replace('{name}', project.title));
                if (confirmed) {
                    delete allProjectsData[projectId];
                    saveProjects();
                    renderProjectGrid();
                }
            };

            card.addEventListener('click', () => openProject(projectId));
            grid.appendChild(card);
        });
    }

    async function createNewProject() {
        const title = await CustomDialog.prompt(t('newProject'), t('enterProjectName'));
        if (!title) return;
        const newId = generateId('proj');
        const colors = ['#2c3e50', '#8e44ad', '#16a085', '#d35400', '#2980b9'];
        allProjectsData[newId] = {
            title: title,
            coverColor: colors[Math.floor(Math.random() * colors.length)],
            icon: '📝',
            updatedAt: new Date().toISOString(),
            boardsData: {},
            activeBoardId: null
        };
        saveProjects();
        openProject(newId);
    }

    function openProject(projectId) {
        currentProjectId = projectId;
        const project = allProjectsData[projectId];
        allBoardsData = project.boardsData || {};
        activeBoardId = project.activeBoardId || null;
        
        document.getElementById('projectManagerScreen').style.display = 'none';
        document.getElementById('appWorkspace').style.display = 'flex';
        
        if (sidebarProjectTitle) {
            sidebarProjectTitle.innerHTML = `${project.title}`;
        }

        const titleSpan = document.querySelector('#appTitleButton span');
        if (titleSpan) titleSpan.textContent = project.title;

        if (!activeBoardId || !allBoardsData[activeBoardId]) {
            activeBoardId = Object.keys(allBoardsData)[0] || null;
            if (!activeBoardId) {
                activeBoardId = generateId('board');
                allBoardsData[activeBoardId] = { name: t('defaultPage'), fullContent: { blocks: [] }, columns: [], updatedAt: new Date().toISOString() };
                saveAllBoards();
            }
        }
        loadBoard();
    }

    async function exitToDashboard() {
        if (currentProjectId && allProjectsData[currentProjectId]) {
            await saveCurrentDocument();
            saveCurrentBoardState();
            allProjectsData[currentProjectId].boardsData = allBoardsData;
            allProjectsData[currentProjectId].activeBoardId = activeBoardId;
            allProjectsData[currentProjectId].updatedAt = new Date().toISOString();
            saveProjects();
        }
        currentProjectId = null;
        allBoardsData = {};
        activeBoardId = null;
        document.getElementById('appWorkspace').style.display = 'none';
        document.getElementById('projectManagerScreen').style.display = 'flex';
        renderProjectGrid();
    }

    async function handlePDFImport(file) {
        try {
            const fileId = await IndexedDBManager.saveFile(file);
            
            if (editorInstance && currentView === 'document' && !allBoardsData[activeBoardId].isPdf) {
                editorInstance.blocks.insert('pdf', { fileId: fileId, fileName: file.name, mode: 'card' });
                return;
            }

            const newBoardId = generateId('board');
            const boardName = "📄 " + file.name.replace('.pdf', ''); 

            allBoardsData[newBoardId] = { 
                name: boardName, 
                parentId: activeBoardId, 
                isPdf: true,             
                fileId: fileId,          
                pdfViewMode: 'center',   
                fullContent: { blocks: [] }, 
                columns: [],
                updatedAt: new Date().toISOString()
            };

            saveAllBoards();
            switchBoard(newBoardId);
            switchView('document'); 
            renderBoardTree();
        } catch (err) {
            console.error('Native PDF Import Error:', err);
            await CustomDialog.alert(t('error'), t('importPdfError'));
        }
    }

    function generateId(prefix = 'id') { 
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; 
    }
    const debouncedSaveDoc = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveCurrentDocument(), 1500);
    };
    const debouncedSaveBoard = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => saveCurrentBoardState(), 1000);
    };

    // --- CUSTOM BLOCKS ---
    class PDFBlock {
        static get toolbox() { return { title: 'PDF Attachment', icon: '📄' }; }
        constructor({data}) { 
            this.data = (data && Object.keys(data).length > 0) ? data : { fileId: '', fileName: '', mode: 'card' }; 
            this.isNew = !this.data.fileId; // Помечаем, если блок только что создан пуст
        }
        
        render() {
            const container = document.createElement('div');
            this.container = container;
            this._renderContent();

            // Автоматически открываем проводник при создании нового блока через меню "+"
            if (this.isNew) {
                this.isNew = false;
                setTimeout(() => this.container.click(), 50); 
            }

            return container;
        }

        async _renderContent() {
            const { fileId, fileName, mode } = this.data;
            this.container.innerHTML = '';

            // Если файла еще нет (пустой блок)
            if (!fileId) {
                this.container.innerHTML = `<div style="padding: 1.5rem; border: 2px dashed var(--border-color); border-radius: 12px; opacity: 0.8; cursor: pointer; text-align: center; font-weight: bold;">${t('selectPdf')}</div>`;
                this.container.onclick = () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'application/pdf';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            try {
                                const newFileId = await IndexedDBManager.saveFile(file);
                                this.data = { fileId: newFileId, fileName: file.name, mode: 'card' };
                                this._renderContent();
                                if (typeof debouncedSaveDoc === 'function') debouncedSaveDoc();
                            } catch (err) {
                                console.error(t('savePdfError'), err);
                            }
                        }
                    };
                    input.click(); // Вызываем системное окно выбора файла
                };
                return;
            }

            const isCard = mode === 'card' || !mode;
            
            if (isCard) {
                this.container.className = 'pdf-attachment-card';
                this.container.innerHTML = `
                    <span class="pdf-icon">📄</span>
                    <span class="pdf-name">${fileName}</span>
                    <div class="pdf-card-actions">
                        <button class="btn-pdf-action action-expand" title="${t('expand')}">↕️ ${t('expand').replace('↕️ ', '')}</button>
                        <button class="btn-pdf-action action-side" title="${t('sidePeek')}">◨ ${t('sidePeek').replace('◨ ', '')}</button>
                    </div>
                `;
                
                this.container.onclick = () => openSidePeek(fileId, fileName);

                this.container.querySelector('.action-expand').onclick = (e) => {
                    e.stopPropagation();
                    const sidePanel = document.getElementById('pdfSidePeek');
                    if (sidePanel.classList.contains('active')) document.getElementById('pdfSideClose').click();
                    this.data.mode = 'inline-center';
                    this._renderContent();
                    if (typeof debouncedSaveDoc === 'function') debouncedSaveDoc();
                };

                this.container.querySelector('.action-side').onclick = (e) => {
                    e.stopPropagation();
                    openSidePeek(fileId, fileName);
                };
            } 
            else {
                const isFull = mode === 'inline-full';
                this.container.className = `pdf-inline-container ${isFull ? 'w-full' : 'w-center'}`;
                this.container.innerHTML = `
                    <div class="pdf-inline-toolbar">
                        <span class="pdf-inline-name">📄 ${fileName}</span>
                        <div class="pdf-inline-actions">
                            <button class="btn-pdf-action action-side" title="${t('moveToSide')}">◨ ${t('sidePeek').replace('◨ ', '')}</button>
                            <button class="btn-pdf-action action-collapse" title="${t('collapseCard')}">− ${t('collapse').replace('− ', '')}</button>
                            <button class="btn-pdf-action action-width ${isFull ? 'is-active' : ''}">${isFull ? t('centerWidth') : t('fullWidth')}</button>
                        </div>
                    </div>
                    <iframe class="pdf-inline-iframe"></iframe>
                `;
                
                this.container.onclick = null; // Убираем клик по всему контейнеру

                this.container.querySelector('.action-side').onclick = () => {
                    this.data.mode = 'card';
                    this._renderContent();
                    openSidePeek(fileId, fileName);
                    if (typeof debouncedSaveDoc === 'function') debouncedSaveDoc();
                };

                this.container.querySelector('.action-collapse').onclick = () => {
                    this.data.mode = 'card';
                    this._renderContent();
                    if (typeof debouncedSaveDoc === 'function') debouncedSaveDoc();
                };
                this.container.querySelector('.action-width').onclick = () => {
                    this.data.mode = isFull ? 'inline-center' : 'inline-full';
                    this._renderContent();
                    if (typeof debouncedSaveDoc === 'function') debouncedSaveDoc();
                };

                const iframe = this.container.querySelector('.pdf-inline-iframe');
                const blob = await IndexedDBManager.getFile(fileId);
                if (blob) iframe.src = URL.createObjectURL(blob);
            }
        }

        save() { return this.data; }
    }

    function getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const icons = {
            'pdf': '📕',
            'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️',
            'doc': '📝', 'docx': '📝', 'txt': '📄', 'rtf': '📄',
            'xls': '📊', 'xlsx': '📊', 'csv': '📊',
            'fbx': '🧊', 'obj': '🧊', 'blend': '🧊', 
            'exe': '⚙️', 'apk': '📱',
            'mp3': '🎵', 'wav': '🎵',
            'mp4': '🎬', 'mov': '🎬',
            'png': '🖼️', 'jpg': '🖼️', 'jpeg': '🖼️'
        };
        return icons[ext] || '📁';
    }
    class AttachmentBlock {
        static get toolbox() { return { title: 'File Attachment', icon: '📎' }; }
        constructor({data}) { 
            this.data = (data && Object.keys(data).length > 0) ? data : { fileId: '', fileName: '', fileSize: '', date: '' }; 
            this.isNew = !this.data.fileId;
        }
        
        render() {
            const container = document.createElement('div');
            this.container = container;
            this._renderContent();

            // Автоматически открываем проводник
            if (this.isNew) {
                this.isNew = false;
                setTimeout(() => this.container.click(), 50);
            }

            return container;
        }

        async _renderContent() {
            const { fileId, fileName, fileSize, date } = this.data;
            this.container.innerHTML = '';
            
            // Если файла нет (пустой блок)
            if (!fileId) {
                this.container.innerHTML = `<div style="padding: 1.5rem; border: 2px dashed var(--border-color); border-radius: 12px; opacity: 0.8; cursor: pointer; text-align: center; font-weight: bold;">${t('selectFile')}</div>`;
                this.container.onclick = () => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            try {
                                const newFileId = await IndexedDBManager.saveFile(file);
                                let sizeStr = (file.size / 1024).toFixed(1) + ' KB';
                                if (file.size > 1024 * 1024) sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                                const dateStr = new Date().toLocaleDateString();
                                
                                this.data = { fileId: newFileId, fileName: file.name, fileSize: sizeStr, date: dateStr };
                                this._renderContent();
                                if (typeof debouncedSaveDoc === 'function') debouncedSaveDoc();
                            } catch (err) {
                                console.error(t('saveFileError'), err);
                            }
                        }
                    };
                    input.click();
                };
                return;
            }

            // Логика отрисовки если файл УЖЕ загружен
            const icon = getFileIcon(fileName);
            this.container.className = 'universal-file-card';
            this.container.onclick = null; // Выключаем клик по всей карточке
            
            this.container.innerHTML = `
                <div class="uf-icon-box">${icon}</div>
                <div class="uf-info">
                    <div class="uf-name" title="${fileName}">${fileName}</div>
                    <div class="uf-meta">${fileSize} • ${t('added')}: ${date}</div>
                </div>
                <div class="uf-actions">
                    <button class="btn btn-secondary btn-uf-download" title="Download file">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    </button>
                </div>
            `;

            const btnDownload = this.container.querySelector('.btn-uf-download');
            btnDownload.onclick = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                try {
                    const fileBlob = await IndexedDBManager.getFile(fileId);
                    if (!fileBlob) return await CustomDialog.alert("Помилка", "Файл не знайдено в базі даних.");
                    const url = URL.createObjectURL(fileBlob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
                } catch (err) {
                    console.error("Ошибка при скачивании файла:", err);
                }
            };
        }

        save() { return this.data; }
    }

    class NPCStatBlock {
        static get toolbox() { return { title: 'NPC Stats', icon: '👤' }; }
        constructor({data}) { this.data = data || { name: '', hp: 100, damage: 10 }; }
        render() {
            const div = document.createElement('div');
            div.className = 'cdx-npc-stat';
            div.innerHTML = `
                <div style="padding: 1rem; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-elements-lighter); display: flex; flex-direction: column; gap: 0.8rem; margin: 10px 0;">
                    <div style="font-weight: 700; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; display: flex; align-items: center; gap: 8px;">👤 Характеристики NPC</div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span style="min-width: 60px; font-weight: 600;">Ім'я:</span>
                        <input type="text" class="npc-name" value="${this.data.name || ''}" placeholder="Гоблін-розвідник" style="flex-grow: 1; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 12px; border-radius: 8px; outline: none;">
                    </div>
                    <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-weight: 600;">❤️ HP:</span>
                            <input type="number" class="npc-hp" value="${this.data.hp || 100}" style="width: 80px; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 12px; border-radius: 8px; outline: none;">
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span style="font-weight: 600;">⚔️ Шкода:</span>
                            <input type="number" class="npc-damage" value="${this.data.damage || 10}" style="width: 80px; background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-primary); padding: 8px 12px; border-radius: 8px; outline: none;">
                        </div>
                    </div>
                </div>
            `;
            return div;
        }
        save(blockContent) {
            return {
                name: blockContent.querySelector('.npc-name').value,
                hp: blockContent.querySelector('.npc-hp').value,
                damage: blockContent.querySelector('.npc-damage').value
            };
        }
    }

    function getEditorTools() {
        const tools = {
            npcStat: { class: NPCStatBlock },
            pdf: { class: PDFBlock },
            file: { class: AttachmentBlock }
        };

        if (typeof window.Header !== 'undefined') tools.header = { class: window.Header, inlineToolbar: true, config: { levels: [1, 2, 3], defaultLevel: 2 } };
        if (typeof window.List !== 'undefined') tools.list = { class: window.List, inlineToolbar: true };
        if (typeof window.Checklist !== 'undefined') tools.checklist = { class: window.Checklist, inlineToolbar: true };
        if (typeof window.Table !== 'undefined') tools.table = { class: window.Table, inlineToolbar: true };
        
        const codeClass = (typeof window.CodeTool !== 'undefined') ? window.CodeTool : (typeof window.Code !== 'undefined' ? window.Code : null);
        if (codeClass) tools.code = { class: codeClass };

        if (typeof window.ToggleBlock !== 'undefined') tools.toggle = { class: window.ToggleBlock, inlineToolbar: true };
        
        const calloutClass = (typeof window.EditorjsCallout !== 'undefined') ? window.EditorjsCallout : (typeof window.Callout !== 'undefined' ? window.Callout : null);
        if (calloutClass) tools.callout = { class: calloutClass, inlineToolbar: true };

        if (typeof window.InlineCode !== 'undefined') tools.inlineCode = { class: window.InlineCode };
        
        const linkClass = (typeof window.LinkTool !== 'undefined') ? window.LinkTool : (typeof window.Link !== 'undefined' ? window.Link : null);
        if (linkClass) tools.linkTool = { class: linkClass };

        if (typeof window.ImageTool !== 'undefined') {
            tools.image = {
                class: window.ImageTool,
                config: {
                    uploader: {
                        async uploadByFile(file) {
                            try {
                                const fileId = await IndexedDBManager.saveFile(file);
                                const blob = await IndexedDBManager.getFile(fileId);
                                const url = URL.createObjectURL(blob);
                                
                                setTimeout(() => {
                                    saveCurrentDocument();
                                    saveAllBoards();
                                }, 100);

                                return { success: 1, file: { url, fileId } };
                            } catch (err) {
                                console.error("Image upload failed:", err);
                                return { success: 0 };
                            }
                        }
                    }
                }
            };
        }

        return tools;
    }

    const IndexedDBManager = {
        db: null, storeName: 'files',
        init() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open('SmartKanbanDB', 1);
                request.onupgradeneeded = (e) => { if (!e.target.result.objectStoreNames.contains(this.storeName)) e.target.result.createObjectStore(this.storeName); };
                request.onsuccess = (e) => { this.db = e.target.result; resolve(); };
                request.onerror = (e) => reject(e.target.error);
            });
        },
        saveFile(file) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([this.storeName], 'readwrite');
                const id = generateId('file');
                const request = transaction.objectStore(this.storeName).put(file, id);
                request.onsuccess = () => resolve(id);
                request.onerror = () => reject();
            });
        },
        getFile(id) {
            return new Promise((resolve, reject) => {
                if (!id) { resolve(null); return; }
                const request = this.db.transaction([this.storeName], 'readonly').objectStore(this.storeName).get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject();
            });
        }
    };

    function initTheme() {
        const theme = localStorage.getItem(LS_THEME_KEY) || 'dark';
        appContainerWindow.setAttribute('data-board-theme', theme);
        if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    function toggleTheme() {
        const theme = appContainerWindow.getAttribute('data-board-theme') === 'dark' ? 'light' : 'dark';
        appContainerWindow.setAttribute('data-board-theme', theme);
        localStorage.setItem(LS_THEME_KEY, theme);
        if (themeToggleBtn) themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    const boardTreeState = JSON.parse(localStorage.getItem('smartKanbanTreeState') || '{}');

    function saveTreeState() {
        localStorage.setItem('smartKanbanTreeState', JSON.stringify(boardTreeState));
    }

    function renderBoardTree(parentId = null, containerElement = boardListEl, level = 0, searchTerm = '') {
        if (parentId === null) {
            containerElement.innerHTML = '';
        }

        const allIds = Object.keys(allBoardsData);
        
        function boardOrDescendantMatches(id) {
            if (!searchTerm) return true;
            if (allBoardsData[id].name.toLowerCase().includes(searchTerm)) return true;
            const children = allIds.filter(bid => allBoardsData[bid].parentId === id);
            return children.some(cid => boardOrDescendantMatches(cid));
        }

        const childrenIds = allIds.filter(id => 
            (allBoardsData[id].parentId || null) === parentId && boardOrDescendantMatches(id)
        ).sort((a, b) => (allBoardsData[a].name || '').localeCompare(allBoardsData[b].name || ''));

        if (childrenIds.length === 0) return;

        const ul = document.createElement('ul');
        ul.className = level === 0 ? 'board-tree-root' : 'board-tree-branch';
        
        childrenIds.forEach(boardId => {
            const boardData = allBoardsData[boardId];
            const li = document.createElement('li');
            li.className = 'board-list-item';
            if (boardId === activeBoardId) li.classList.add('active-board');

            const titleWrapper = document.createElement('div');
            titleWrapper.className = 'board-item-title-wrapper';

            const hasChildren = allIds.some(b => allBoardsData[b].parentId === boardId);
            const isExpanded = boardTreeState[boardId] !== false;

            const toggleBtn = document.createElement('span');
            toggleBtn.className = 'board-toggle-icon';
            toggleBtn.style.cursor = hasChildren ? 'pointer' : 'default';
            toggleBtn.innerHTML = hasChildren ? (isExpanded ? '▾' : '▸') : '•';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'board-item-name';
            
            if (searchTerm && boardData.name.toLowerCase().includes(searchTerm)) {
                const regex = new RegExp(`(${searchTerm})`, 'gi');
                titleSpan.innerHTML = boardData.name.replace(regex, '<mark>$1</mark>');
            } else {
                titleSpan.textContent = boardData.name;
            }

            const actionsWrapper = document.createElement('div');
            actionsWrapper.className = 'board-item-actions';
            
            const addBtn = document.createElement('button');
            addBtn.className = 'btn-icon';
            addBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;
            addBtn.title = "Додати підсторінку";
            addBtn.onclick = async (e) => { 
                e.stopPropagation(); 
                const name = await CustomDialog.prompt('Нова сторінка', 'Введіть назву:', 'Нова сторінка'); 
                if (name) createNewBoard(name, boardId); 
            };

            const delBtn = document.createElement('button');
            delBtn.className = 'btn-icon';
            delBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
            delBtn.title = "Видалити сторінку";
            delBtn.onclick = async (e) => { 
                e.stopPropagation(); 
                const isConfirmed = await CustomDialog.confirm('Видалення', `Видалити "${boardData.name}" та всі вкладені сторінки?`);
                if (isConfirmed) { 
                    deleteBoardRecursive(boardId); 
                    saveAllBoards(); 
                    if (activeBoardId === boardId) switchBoard(Object.keys(allBoardsData)[0]); 
                    else renderBoardTree(null, boardListEl, 0, searchTerm); 
                } 
            };

            actionsWrapper.append(addBtn, delBtn);
            titleWrapper.append(toggleBtn, titleSpan, actionsWrapper);
            li.appendChild(titleWrapper);

            const childrenContainer = document.createElement('div');
            childrenContainer.style.display = isExpanded ? 'block' : 'none';

            if (hasChildren) {
                const handleToggle = (e) => {
                    e.stopPropagation();
                    const isVisible = childrenContainer.style.display !== 'none';
                    childrenContainer.style.display = isVisible ? 'none' : 'block';
                    toggleBtn.innerHTML = isVisible ? '▸' : '▾';
                    boardTreeState[boardId] = !isVisible;
                    saveTreeState();
                };
                toggleBtn.onclick = handleToggle;
            }

            titleWrapper.onclick = () => switchBoard(boardId);

            ul.appendChild(li);
            renderBoardTree(boardId, childrenContainer, level + 1, searchTerm);
            ul.appendChild(childrenContainer);
        });

        containerElement.appendChild(ul);
    }

    function deleteBoardRecursive(id) {
        const children = Object.keys(allBoardsData).filter(bid => allBoardsData[bid].parentId === id);
        children.forEach(cid => deleteBoardRecursive(cid));
        delete allBoardsData[id];
    }

    function createNewBoard(name = null, pid = null) {
        const bname = (typeof name === 'string' ? name : newBoardNameInput.value.trim());
        if (!bname) return;
        const id = generateId('board');
        allBoardsData[id] = { 
            name: bname, 
            parentId: pid, 
            fullContent: { blocks: [] }, 
            columns: [], 
            updatedAt: new Date().toISOString() 
        };
        saveAllBoards(); 
        switchBoard(id); 
        newBoardNameInput.value = '';
        sidebar.classList.remove('active'); 
        overlay.classList.remove('active');
    }

    async function switchBoard(id) {
        if (!id || !allBoardsData[id] || activeBoardId === id) {
            sidebar.classList.remove('active'); 
            overlay.classList.remove('active');
            return;
        }
        
        await saveCurrentDocument(); 
        saveCurrentBoardState();
        
        const sidePeek = document.getElementById('pdfSidePeek');
        if (sidePeek && sidePeek.classList.contains('active')) {
            sidePeek.classList.remove('active');
            document.getElementById('appWorkspace')?.classList.remove('side-peek-active');
            delete sidePeek.dataset.currentFileId; 
            const iframe = document.getElementById('pdfSideIframe');
            if (iframe) {
                if (iframe.src && iframe.src.startsWith('blob:')) {
                    URL.revokeObjectURL(iframe.src);
                }
                iframe.removeAttribute('src'); 
            }
        }

        if (editorInstance && editorInstance.render) {
            try {
                await editorInstance.isReady;
                await editorInstance.render({ blocks: [] });
            } catch(e) {}
        }

        activeBoardId = id; 
        
        if (currentProjectId && allProjectsData[currentProjectId]) {
            allProjectsData[currentProjectId].activeBoardId = activeBoardId;
            saveProjects(); 
        } else {
            localStorage.setItem(LS_ACTIVE_BOARD_ID_KEY, id);
        }

        await loadBoard();
        
        sidebar.classList.remove('active'); 
        overlay.classList.remove('active');
    }

    function formatDataForEditor(savedContent) {
        if (!savedContent) return { blocks: [] };
        if (typeof savedContent === 'object' && savedContent.blocks) return savedContent; 
        if (typeof savedContent === 'string' && (savedContent.trim().startsWith('{') || savedContent.trim().startsWith('['))) {
            try {
                const parsed = JSON.parse(savedContent);
                if (parsed && parsed.blocks) return parsed;
            } catch (e) {}
        }

        if (typeof savedContent === 'string') {
            const blocks = [];
            const parts = savedContent.split(/(!\[\[(?:file|pdf)\|.*?\]\])/g);
            parts.forEach(part => {
                if (!part) return;
                const fileMatch = part.match(/!\[\[file\|(.*?)\|(.*?)\|(.*?)\|(.*?)\]\]/);
                if (fileMatch) {
                    blocks.push({
                        type: "file",
                        data: { fileId: fileMatch[1], fileName: fileMatch[2], fileSize: fileMatch[3], date: fileMatch[4] }
                    });
                    return;
                }
                const pdfMatch = part.match(/!\[\[pdf\|(.*?)\|(.*?)\]\]/);
                if (pdfMatch) {
                    blocks.push({
                        type: "pdf",
                        data: { fileId: pdfMatch[1], fileName: pdfMatch[2], mode: 'card' }
                    });
                    return;
                }
                const paragraphs = part.split(/\n\n+/);
                paragraphs.forEach(p => {
                    if (p.trim()) {
                        blocks.push({
                            type: "paragraph",
                            data: { text: p.trim().replace(/\n/g, '<br>') }
                        });
                    }
                });
            });
            return { blocks: blocks };
        }
        return { blocks: [] };
    }

    function loadAllBoards() { allBoardsData = JSON.parse(localStorage.getItem(LS_ALL_BOARDS_KEY) || '{}'); }
    function saveAllBoards() {
        if (currentProjectId && allProjectsData[currentProjectId]) {
            allProjectsData[currentProjectId].boardsData = allBoardsData;
            allProjectsData[currentProjectId].updatedAt = new Date().toISOString();
            saveProjects(); 
        } else {
            localStorage.setItem(LS_ALL_BOARDS_KEY, JSON.stringify(allBoardsData));
        }
    }
    
    async function saveCurrentDocument() {
        if (!activeBoardId || !allBoardsData[activeBoardId]) return;
        const page = allBoardsData[activeBoardId];
        if (page.isPdf || page.type === 'pdf') return; 

        if (editorInstance && editorInstance.save) {
            try {
                const data = await editorInstance.save();
                page.fullContent = data;
                page.name = docTitle.textContent;
                page.updatedAt = new Date().toISOString();
                saveAllBoards(); 
                updateCurrentBoardTitle(); 
            } catch(e) {
                console.error("Ошибка сохранения Editor.js:", e);
            }
        }
    }

    function saveCurrentBoardState() {
        if (currentView !== 'board' || !activeBoardId || !allBoardsData[activeBoardId]) return;
        const columns = Array.from(boardContainer.children).map(col => ({
            id: col.dataset.columnId, 
            title: col.querySelector('.column-title-input')?.value || '',
            tasks: Array.from(col.querySelectorAll('.task')).map(t => ({ 
                id: t.dataset.taskId, 
                content: t.querySelector('.task-content-editor')?.innerHTML || '' 
            }))
        }));
        allBoardsData[activeBoardId].columns = columns;
        saveAllBoards();
    }

    function updateCurrentBoardTitle() { currentBoardTitleEl.textContent = allBoardsData[activeBoardId]?.name || ''; }

    async function resolveMediaUrls(container = document) {
        const elements = container.querySelectorAll('[data-file-id]');
        for (const el of elements) {
            const fileId = el.getAttribute('data-file-id');
            if (!fileId) continue;
            try {
                const blob = await IndexedDBManager.getFile(fileId);
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    if (el.tagName === 'IMG' || el.tagName === 'IFRAME' || el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
                        el.src = url;
                    }
                }
            } catch (e) { console.error('Failed to resolve media:', fileId, e); }
        }
    }

    async function renderDocumentView() {
        const page = allBoardsData[activeBoardId];
        docTitle.textContent = page.name;
        docLastModified.textContent = new Date(page.updatedAt).toLocaleString();
        
        const editorHolder = document.getElementById('editorjs');
        const header = document.querySelector('.document-header');

        if (page.isPdf) {
            if (editorInstance) {
                try { editorInstance.destroy(); } catch(e) {}
                editorInstance = null;
            }
            header.style.display = 'none';
            documentViewContainer.style.alignItems = 'stretch';
            const currentMode = page.pdfViewMode || 'center';
            const toggleBtnText = currentMode === 'center' ? '↔ На всю ширину' : '⇥ По центру';
            editorHolder.style.maxWidth = '100%';
            editorHolder.style.padding = '0';
            editorHolder.innerHTML = `
                <div class="pdf-reader-wrapper mode-${currentMode}">
                    <div class="pdf-toolbar">
                        <h2 style="font-size: 1.5rem; margin: 0; color: var(--text-primary);">${page.name}</h2>
                        <button id="togglePdfViewBtn" class="btn btn-secondary">${toggleBtnText}</button>
                    </div>
                    <iframe data-file-id="${page.fileId}" class="pdf-iframe"></iframe>
                </div>
            `;
            document.getElementById('togglePdfViewBtn').onclick = () => {
                page.pdfViewMode = page.pdfViewMode === 'center' ? 'full' : 'center';
                saveAllBoards(); renderDocumentView();
            };
            await resolveMediaUrls(editorHolder);
            return;
        }

        header.style.display = 'block';
        documentViewContainer.style.alignItems = 'center';
        editorHolder.style.maxWidth = '';
        editorHolder.style.padding = '';

        const safeData = formatDataForEditor(page.fullContent);
        
        if (safeData && safeData.blocks) {
            for (const block of safeData.blocks) {
                if (block.type === 'image' && block.data.file && block.data.file.fileId) {
                    try {
                        const blob = await IndexedDBManager.getFile(block.data.file.fileId);
                        if (blob) block.data.file.url = URL.createObjectURL(blob);
                    } catch(e) {}
                }
            }
        }

        if (editorInstance && editorInstance.render) {
            try {
                await editorInstance.isReady;
                await editorInstance.render(safeData);
            } catch (e) {
                console.warn("Ошибка рендера, пересоздаем редактор:", e);
                editorHolder.innerHTML = '';
                try { editorInstance.destroy(); } catch(err) {}
                createNewEditor(safeData);
            }
        } else {
            editorHolder.innerHTML = '';
            createNewEditor(safeData);
        }
    }

    function createNewEditor(data) {
        try {
            editorInstance = new window.EditorJS({
                holder: 'editorjs',
                tools: getEditorTools(),
                data: data,
                placeholder: 'Натисніть "/" для вибору команди...',
                onChange: () => debouncedSaveDoc()
            });
        } catch (err) {
            console.error("КРИТИЧНА ПОМИЛКА ініціалізації Editor.js:", err);
            document.getElementById('editorjs').innerHTML = '<div style="padding: 2rem; color: var(--accent-danger);">Помилка завантаження редактора. Спробуйте оновити сторінку.</div>';
        }
    }

    async function loadBoard() {
        updateCurrentBoardTitle(); renderBoardTree();
        if (currentView === 'document') renderDocumentView();
        else if (currentView === 'board') {
            boardContainer.innerHTML = '';
            (allBoardsData[activeBoardId].columns || []).forEach(c => {
                const col = document.createElement('div'); col.className = 'column'; col.dataset.columnId = c.id;
                col.innerHTML = `<div class="column-header"><input class="column-title-input" value="${c.title}"></div><div class="tasks-list"></div>`;
                const list = col.querySelector('.tasks-list');
                c.tasks.forEach(t => {
                    const task = document.createElement('div'); task.className = 'task'; task.dataset.taskId = t.id;
                    task.innerHTML = `<div class="task-content-editor" contenteditable="true">${t.content}</div>`;
                    task.oninput = debouncedSaveBoard;
                    list.appendChild(task);
                });
                boardContainer.appendChild(col);
            });
            await resolveMediaUrls(boardContainer);
        }
    }

    function switchView(view) {
        currentView = view;
        [boardContainer, graphViewContainer, documentViewContainer].forEach(el => el.style.display = 'none');
        document.querySelectorAll('.view-switcher .btn').forEach(b => b.classList.remove('active'));
        if (view === 'document') { documentViewContainer.style.display = 'flex'; showDocumentViewBtn.classList.add('active'); renderDocumentView(); }
        else if (view === 'board') { boardContainer.style.display = 'flex'; showBoardViewBtn.classList.add('active'); loadBoard(); }
    }

    async function openSidePeek(fileId, fileName) {
        if (!fileId) return;
        const panel = document.getElementById('pdfSidePeek');
        const iframe = document.getElementById('pdfSideIframe');
        const mainEl = document.getElementById('appWorkspace');
        if (panel.classList.contains('active') && panel.dataset.currentFileId === fileId) {
            document.getElementById('pdfSideClose').click();
            return;
        }
        panel.dataset.currentFileId = fileId;
        document.getElementById('pdfSideTitle').textContent = fileName;
        try {
            const fileBlob = await IndexedDBManager.getFile(fileId);
            if (fileBlob) {
                panel.classList.add('active');
                if (mainEl) mainEl.classList.add('side-peek-active');
                setTimeout(() => {
                    if (panel.classList.contains('active') && panel.dataset.currentFileId === fileId) {
                        if (iframe.src) URL.revokeObjectURL(iframe.src);
                        iframe.src = URL.createObjectURL(fileBlob);
                    }
                }, 350); 
            }
        } catch (err) { console.error("Ошибка Side Peek:", err); }
    }

    document.getElementById('pdfSideClose')?.addEventListener('click', () => {
        const panel = document.getElementById('pdfSidePeek');
        const mainEl = document.getElementById('appWorkspace');
        const iframe = document.getElementById('pdfSideIframe');
        panel.classList.remove('active');
        if (mainEl) mainEl.classList.remove('side-peek-active');
        setTimeout(() => { 
            if (iframe) {
                if (iframe.src && iframe.src.startsWith('blob:')) {
                    URL.revokeObjectURL(iframe.src);
                }
                iframe.removeAttribute('src'); 
            }
        }, 300); 
    });

    async function init() {
        initTheme();
        await IndexedDBManager.init();
        loadProjects();

        const oldBoardsData = localStorage.getItem(LS_ALL_BOARDS_KEY);
        if (oldBoardsData && Object.keys(allProjectsData).length === 0) {
            const defaultProjId = generateId('proj');
            allProjectsData[defaultProjId] = {
                title: document.documentElement.lang === 'en' ? "My First Project" : "Мій перший проєкт",
                coverColor: "#34495e",
                icon: '🚀',
                updatedAt: new Date().toISOString(),
                boardsData: JSON.parse(oldBoardsData),
                activeBoardId: localStorage.getItem(LS_ACTIVE_BOARD_ID_KEY)
            };
            saveProjects();
        }

        // Apply localized placeholders
        const projectSearch = document.getElementById('projectSearch');
        if (projectSearch) projectSearch.placeholder = t('searchProjects');
        const wikiSearch = document.getElementById('wikiSearchInput');
        if (wikiSearch) wikiSearch.placeholder = t('searchWiki');
        const globalSearch = document.getElementById('globalSearchInput');
        if (globalSearch) globalSearch.placeholder = t('searchGlobal');

        document.getElementById('appWorkspace').style.display = 'none';
        document.getElementById('projectManagerScreen').style.display = 'flex';
        renderProjectGrid();

        document.getElementById('projectSearch').oninput = (e) => {
            const term = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.project-grid .project-card:not(.create-new)');
            cards.forEach(card => {
                const title = card.querySelector('.project-title').textContent.toLowerCase();
                card.style.display = title.includes(term) ? 'flex' : 'none';
            });
        };
        document.getElementById('btnBackToProjects').onclick = exitToDashboard;

        // Привязка кнопки "Прикрепить файл"
        document.getElementById('btnAttachFile')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file || !editorInstance) return;

                try {
                    const fileId = await IndexedDBManager.saveFile(file);
                    let sizeStr = (file.size / 1024).toFixed(1) + ' KB';
                    if (file.size > 1024 * 1024) {
                        sizeStr = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
                    }
                    const dateStr = new Date().toLocaleDateString();
                    
                    // ПРОВЕРКА НА PDF: Если это PDF, вставляем интерактивный PDF-блок!
                    if (file.name.toLowerCase().endsWith('.pdf')) {
                        editorInstance.blocks.insert('pdf', { 
                            fileId: fileId, 
                            fileName: file.name, 
                            mode: 'card' 
                        });
                    } else {
                        // Для остальных файлов вставляем стандартную карточку вложения
                        editorInstance.blocks.insert('file', { 
                            fileId: fileId, 
                            fileName: file.name, 
                            fileSize: sizeStr, 
                            date: dateStr 
                        });
                    }
                    
                    saveCurrentDocument();
                } catch (err) {
                    console.error("Ошибка сохранения файла:", err);
                }
            };
            input.click();
        });

        appTitleButton.onclick = () => { sidebar.classList.add('active'); overlay.classList.add('active'); };
        closeSidebarBtn.onclick = overlay.onclick = () => { sidebar.classList.remove('active'); overlay.classList.remove('active'); };
        themeToggleBtn.onclick = toggleTheme;
        addBoardBtn.onclick = () => createNewBoard();
        showDocumentViewBtn.onclick = () => switchView('document');
        showBoardViewBtn.onclick = () => switchView('board');
        docTitle.oninput = debouncedSaveDoc;
        
        wikiSearchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase().trim();
            renderBoardTree(null, boardListEl, 0, term);
        };

        documentViewContainer.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG' && e.target.closest('.ce-block')) {
                const mediaModal = document.getElementById('mediaModal');
                const mediaModalContent = document.getElementById('mediaModalContent');
                if (mediaModal && mediaModalContent) {
                    mediaModalContent.innerHTML = `<img src="${e.target.src}" style="max-width: 95vw; max-height: 95vh; object-fit: contain; border-radius: 12px;">`;
                    mediaModal.classList.add('active');
                }
            }
        });

        // --- УМНЫЙ КЛИК И ПРИЕМ ФАЙЛОВ ДЛЯ РОДНОГО СПОЙЛЕРА ---
        if (documentViewContainer) {
            // 1. Клик по всей ширине строки
            documentViewContainer.addEventListener('click', (e) => {
                const toggle = e.target.closest('.toggle-block');
                if (!toggle) return;

                // Если кликнули по содержимому ВНУТРИ раскрытого спойлера - не мешаем
                const content = toggle.querySelector('.toggle-block__content');
                if (content && content.contains(e.target)) return;

                // Если кликнули точно по тексту заголовка (поле ввода) - не мешаем
                if (e.target.closest('.toggle-block__input') || e.target.closest('.toggle-block__text')) return;

                // Если кликнули просто по пустой области в этой строке - раскрываем/закрываем!
                const icon = toggle.querySelector('.toggle-block__icon');
                if (icon && e.target !== icon) {
                    icon.click();
                }
            });

            // 2. Раскрытие спойлера при наведении файла из проводника
            documentViewContainer.addEventListener('dragover', (e) => {
                const toggle = e.target.closest('.toggle-block');
                
                // Очищаем подсветку у других спойлеров
                document.querySelectorAll('.toggle-block.is-drag-over').forEach(el => {
                    if (el !== toggle) el.classList.remove('is-drag-over');
                });
                
                // Если тащат файл из ОС над спойлером
                if (toggle && e.dataTransfer.types.includes('Files')) {
                    e.preventDefault(); 
                    e.stopPropagation();
                    toggle.classList.add('is-drag-over');
                    
                    // Распахиваем спойлер автоматически
                    const content = toggle.querySelector('.toggle-block__content');
                    const icon = toggle.querySelector('.toggle-block__icon');
                    // У стандартного спойлера закрытый контент имеет атрибут hidden или display: none
                    if (content && (content.hidden || content.style.display === 'none')) {
                         if (icon) icon.click();
                    }
                }
            });

            // Сброс подсветки если увели файл в сторону
            documentViewContainer.addEventListener('dragleave', (e) => {
                const toggle = e.target.closest('.toggle-block');
                if (toggle && !toggle.contains(e.relatedTarget)) {
                    toggle.classList.remove('is-drag-over');
                }
            });

            // Сброс подсветки после того как бросили файл
            documentViewContainer.addEventListener('drop', (e) => {
                document.querySelectorAll('.toggle-block.is-drag-over').forEach(el => {
                    el.classList.remove('is-drag-over');
                });
                
                const file = e.dataTransfer.files[0];
                if (file && file.type === 'application/pdf') {
                    e.preventDefault();
                    e.stopPropagation();
                    handlePDFImport(file);
                }
            });
        }
        
        const closeModal = () => {
            mediaModal.classList.remove('active');
            if (mediaModalContent.firstChild && (mediaModalContent.firstChild.tagName === 'VIDEO' || mediaModalContent.firstChild.tagName === 'AUDIO')) {
                mediaModalContent.firstChild.pause();
            }
            setTimeout(() => mediaModalContent.innerHTML = '', 300);
        };
        closeModalBtn.onclick = closeModal;
        mediaModal.onclick = (e) => { if (e.target === mediaModal) closeModal(); };

        exportDataBtn.onclick = () => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([JSON.stringify(allBoardsData, null, 2)], { type: 'application/json' }));
            link.download = 'wiki_export.json'; link.click();
        };
        importDataBtn.onclick = () => importFileInput.click();
        importFileInput.onchange = (e) => {
            const reader = new FileReader();
            reader.onload = (ev) => { allBoardsData = JSON.parse(ev.target.result); saveAllBoards(); location.reload(); };
            reader.readAsText(e.target.files[0]);
        };

        // --- ГЛОБАЛЬНЫЙ ПОИСК (Ctrl+K / Cmd+K) ---
        const globalSearchOverlay = document.getElementById('globalSearchOverlay');
        const globalSearchInput = document.getElementById('globalSearchInput');
        const globalSearchResults = document.getElementById('globalSearchResults');

        function openGlobalSearch() {
            globalSearchOverlay.classList.add('active');
            setTimeout(() => globalSearchInput.focus(), 50);
            globalSearchInput.value = '';
            globalSearchResults.innerHTML = '';
        }

        function closeGlobalSearch() {
            globalSearchOverlay.classList.remove('active');
        }

        // Открытие по Ctrl+K или Cmd+K
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                openGlobalSearch();
            }
            if (e.key === 'Escape' && globalSearchOverlay.classList.contains('active')) {
                closeGlobalSearch();
            }
        });

        // Закрытие по клику вне окна
        globalSearchOverlay.addEventListener('click', (e) => {
            if (e.target === globalSearchOverlay) closeGlobalSearch();
        });

        // Логика поиска
        globalSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            globalSearchResults.innerHTML = '';

            if (!query || query.length < 2) return;

            const results = [];

            // Перебираем все страницы в проекте
            Object.keys(allBoardsData).forEach(boardId => {
                const board = allBoardsData[boardId];
                if (!board) return;

                const boardName = board.name || '';
                let matchFound = false;
                let snippets = [];

                // Проверяем название страницы
                if (boardName.toLowerCase().includes(query)) {
                    matchFound = true;
                }

                // Проверяем текст внутри страницы (полнотекстовый поиск)
                if (board.fullContent && board.fullContent.blocks) {
                    board.fullContent.blocks.forEach(block => {
                        let textToSearch = '';

                        if (block.type === 'paragraph' || block.type === 'header') {
                            textToSearch = block.data.text || '';
                        } else if (block.type === 'list') {
                            textToSearch = (block.data.items || []).join(' ');
                        } else if (block.type === 'file' || block.type === 'pdf') {
                            textToSearch = block.data.fileName || '';
                        }

                        // Очищаем HTML-теги для чистого поиска
                        const cleanText = textToSearch.replace(/<[^>]*>?/gm, '');

                        if (cleanText.toLowerCase().includes(query)) {
                            matchFound = true;
                            // Создаем сниппет с подсветкой слова
                            const regex = new RegExp(`(${query})`, 'gi');
                            const highlighted = cleanText.replace(regex, '<mark>$1</mark>');

                            // Если текст длинный, обрезаем его для красоты
                            snippets.push(highlighted.length > 120 ? highlighted.substring(0, 120) + '...' : highlighted);
                        }
                    });
                }

                if (matchFound) {
                    results.push({ 
                        id: boardId, 
                        title: boardName, 
                        snippet: snippets.length > 0 ? snippets[0] : (document.documentElement.lang === 'en' ? 'Match in page title' : 'Збіг у назві сторінки')
                    });
                }
            });

            if (results.length === 0) {
                globalSearchResults.innerHTML = `<div style="padding: 2rem; text-align: center; color: var(--text-secondary);">${document.documentElement.lang === 'en' ? 'No results found. Try another query.' : 'Нічого не знайдено. Спробуйте інший запит.'}</div>`;
                return;
            }

            // Рендер результатов
            results.forEach(res => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `
                    <div class="search-result-title">📄 ${res.title}</div>
                    <div class="search-result-snippet">${res.snippet}</div>
                `;
                div.onclick = () => {
                    closeGlobalSearch();
                    switchBoard(res.id); // Переключаемся на найденную страницу
                };
                globalSearchResults.appendChild(div);
            });
        });

        window.addEventListener('beforeunload', () => {

            document.querySelectorAll('[data-file-id]').forEach(el => {
                if (el.src && el.src.startsWith('blob:')) URL.revokeObjectURL(el.src);
            });
            saveCurrentDocument(); 
            saveCurrentBoardState();
        });

        // Listen for language changes and refresh board components
        window.addEventListener('lang-changed', () => {
            const projectSearch = document.getElementById('projectSearch');
            if (projectSearch) projectSearch.placeholder = t('searchProjects');
            const wikiSearch = document.getElementById('wikiSearchInput');
            if (wikiSearch) wikiSearch.placeholder = t('searchWiki');
            const globalSearch = document.getElementById('globalSearchInput');
            if (globalSearch) globalSearch.placeholder = t('searchGlobal');

            renderProjectGrid();
            if (currentProjectId) {
                const project = allProjectsData[currentProjectId];
                if (sidebarProjectTitle) sidebarProjectTitle.innerHTML = `${project.title}`;
                const titleSpan = document.querySelector('#appTitleButton span');
                if (titleSpan) titleSpan.textContent = project.title;
                
                renderBoardTree();
                loadBoard();
            }
        });
    }

    init();
}
