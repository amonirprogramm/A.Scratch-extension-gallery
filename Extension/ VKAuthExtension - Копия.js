class VKAuthExtension {
    constructor() {
        this.firstName = null;
        this.lastName = null;
        this.profilePicture = null;
        this.userId = null;
        this.screenName = null;
        this.sex = null;
        this.birthDate = null;
        this.city = null;
        this.country = null;
        this.accessToken = null;
        this.authWindow = null;
        this.authCheckInterval = null;
        this.messageListener = null;
    }

    getInfo() {
        return {
            id: 'vkAuth',
            name: 'VK Auth',
            color1: '#4A76A8',
            color2: '#2E5C8A',
            color3: '#1E3A5F',
            blocks: [
                {
                    opcode: 'login',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Open VK Login Page',
                },
                {
                    opcode: 'closeLogin',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Close Login Window',
                },
                {
                    opcode: 'clearData',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Clear data',
                },
                {
                    opcode: 'manualAuth',
                    blockType: Scratch.BlockType.COMMAND,
                    text: 'Parse URL manually: [URL]',
                    arguments: {
                        URL: {
                            type: Scratch.ArgumentType.STRING,
                            defaultValue: 'paste URL here'
                        }
                    }
                },
                {
                    opcode: 'isLoginWindowOpen',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: 'Is login window open?',
                },
                {
                    opcode: 'getFirstName',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'First Name',
                },
                {
                    opcode: 'getLastName',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Last Name',
                },
                {
                    opcode: 'getFullName',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Full Name',
                },
                {
                    opcode: 'getProfilePicture',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Profile Picture URL',
                },
                {
                    opcode: 'getUserId',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'User ID',
                },
                {
                    opcode: 'getScreenName',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Screen Name',
                },
                {
                    opcode: 'getSex',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Sex',
                },
                {
                    opcode: 'getBirthDate',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Birth Date',
                },
                {
                    opcode: 'getCity',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'City',
                },
                {
                    opcode: 'getCountry',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Country',
                },
                {
                    opcode: 'getAccessToken',
                    blockType: Scratch.BlockType.REPORTER,
                    text: 'Access Token',
                },
                {
                    opcode: 'isLoggedIn',
                    blockType: Scratch.BlockType.BOOLEAN,
                    text: 'Is logged in?',
                },
            ],
            menus: {},
            docsURI: 'https://dev.vk.com/ru/api/access-token/implicit-flow-user',
        };
    }

    login() {
        const appId = '51820074';
        
        // Создаем собственную страницу-прокси для авторизации
        const proxyHtml = this.createAuthProxyPage(appId);
        const blob = new Blob([proxyHtml], { type: 'text/html' });
        const proxyUrl = URL.createObjectURL(blob);

        console.log('VK Auth: Открываем страницу авторизации...');
        
        // Открываем окно с нашей прокси-страницей
        this.authWindow = window.open(
            proxyUrl, 
            'VKAuth', 
            'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no'
        );

        if (!this.authWindow) {
            alert('Popup заблокирован. Разрешите всплывающие окна и попробуйте снова.');
            URL.revokeObjectURL(proxyUrl);
            return;
        }

        // Настраиваем обработчик сообщений
        this.setupMessageListener();
        
        // Очищаем предыдущий интервал если есть
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
        }

        let attempts = 0;
        const maxAttempts = 3000; // 5 минут

        // Мониторим состояние окна
        this.authCheckInterval = setInterval(() => {
            attempts++;
            
            if (!this.authWindow || this.authWindow.closed) {
                console.log('VK Auth: Окно закрыто пользователем');
                this.cleanupAuth();
                URL.revokeObjectURL(proxyUrl);
                return;
            }

            if (attempts > maxAttempts) {
                console.log('VK Auth: Таймаут авторизации');
                this.closeLogin();
                URL.revokeObjectURL(proxyUrl);
                return;
            }

            // Каждые 10 секунд выводим информацию
            if (attempts % 1000 === 0) {
                console.log(`VK Auth: Ожидание авторизации ${Math.floor(attempts/100)} секунд...`);
            }

        }, 100);

        // Инструкция для пользователя
        setTimeout(() => {
            if (this.authWindow && !this.authWindow.closed) {
                console.log('='.repeat(60));
                console.log('ИНСТРУКЦИЯ ДЛЯ АВТОРИЗАЦИИ:');
                console.log('1. В открывшемся окне нажмите "Войти через VK"');
                console.log('2. Войдите в свой аккаунт VK');
                console.log('3. После авторизации данные загрузятся автоматически');
                console.log('4. Если автоматическая авторизация не сработала:');
                console.log('   - Скопируйте URL с #access_token=');
                console.log('   - Используйте блок "Parse URL manually"');
                console.log('='.repeat(60));
            }
        }, 2000);
    }

    createAuthProxyPage(appId) {
        const redirectUri = encodeURIComponent('https://oauth.vk.com/blank.html');
        const authUrl = `https://oauth.vk.com/authorize?client_id=${appId}&display=page&redirect_uri=${redirectUri}&response_type=token&v=5.199&revoke=1`;
        
        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VK Authorization</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #4A76A8, #2E5C8A);
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            padding: 20px;
            text-align: center;
            background: rgba(0,0,0,0.1);
        }
        
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 300;
        }
        
        .content {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .auth-card {
            background: white;
            color: #333;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
            width: 100%;
        }
        
        .auth-btn {
            background: #4A76A8;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 20px 0;
            transition: background 0.3s;
        }
        
        .auth-btn:hover {
            background: #2E5C8A;
        }
        
        .instructions {
            margin-top: 20px;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
            font-size: 14px;
            line-height: 1.5;
        }
        
        .close-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            font-size: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            cursor: pointer;
        }
        
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }
        
        .status.success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .status.error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <button class="close-btn" onclick="window.close()">&times;</button>
    
    <div class="header">
        <h1>Авторизация VK</h1>
    </div>
    
    <div class="content">
        <div class="auth-card">
            <h2>Войти через VKontakte</h2>
            <p>Для продолжения необходимо авторизоваться в VK</p>
            
            <a href="${authUrl}" class="auth-btn" target="_blank" onclick="handleAuth()">
                Войти через VK
            </a>
            
            <div class="instructions">
                <strong>Инструкция:</strong><br>
                1. Нажмите кнопку "Войти через VK"<br>
                2. Авторизуйтесь в VK<br>
                3. После авторизации скопируйте URL из адресной строки<br>
                4. Вставьте URL в поле ниже и нажмите "Обработать"
            </div>
            
            <div style="margin-top: 20px;">
                <input type="text" id="urlInput" placeholder="Вставьте URL с токеном здесь" 
                       style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                <button onclick="processUrl()" class="auth-btn" style="margin: 0;">Обработать URL</button>
            </div>
            
            <div id="status" class="status"></div>
        </div>
    </div>

    <script>
        function handleAuth() {
            showStatus('Откройте VK в новой вкладке и скопируйте URL после авторизации', 'info');
        }
        
        function processUrl() {
            const url = document.getElementById('urlInput').value.trim();
            
            if (!url) {
                showStatus('Введите URL', 'error');
                return;
            }
            
            if (url.includes('access_token=')) {
                showStatus('Токен найден! Отправляем данные...', 'success');
                
                // Отправляем данные в родительское окно
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'VK_AUTH_SUCCESS',
                        url: url
                    }, '*');
                }
                
                setTimeout(() => {
                    window.close();
                }, 1000);
            } else if (url.includes('error=')) {
                showStatus('Обнаружена ошибка в URL', 'error');
                
                if (window.opener) {
                    window.opener.postMessage({
                        type: 'VK_AUTH_ERROR',
                        url: url
                    }, '*');
                }
            } else {
                showStatus('URL не содержит токен авторизации. Убедитесь, что вы скопировали правильный URL после авторизации.', 'error');
            }
        }
        
        function showStatus(message, type) {
            const status = document.getElementById('status');
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
        }
        
        // Автоматическая обработка при вставке URL
        document.getElementById('urlInput').addEventListener('paste', function() {
            setTimeout(() => {
                const url = this.value.trim();
                if (url.includes('access_token=') || url.includes('error=')) {
                    processUrl();
                }
            }, 100);
        });
        
        // Обработка Enter
        document.getElementById('urlInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                processUrl();
            }
        });
    </script>
</body>
</html>`;
    }

    setupMessageListener() {
        // Удаляем предыдущий обработчик если есть
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
        }

        this.messageListener = (event) => {
            // Проверяем, что сообщение от нашего окна авторизации
            if (event.source === this.authWindow) {
                console.log('VK Auth: Получено сообщение от окна авторизации:', event.data);
                
                if (event.data && event.data.type === 'VK_AUTH_SUCCESS') {
                    this.handleAuthSuccess(event.data.url);
                } else if (event.data && event.data.type === 'VK_AUTH_ERROR') {
                    this.handleAuthError(event.data.url);
                }
            }
        };

        window.addEventListener('message', this.messageListener);
    }

    closeLogin() {
        console.log('VK Auth: Закрываем окно авторизации...');
        this.cleanupAuth();
    }

    cleanupAuth() {
        if (this.authCheckInterval) {
            clearInterval(this.authCheckInterval);
            this.authCheckInterval = null;
        }
        
        if (this.authWindow && !this.authWindow.closed) {
            this.authWindow.close();
        }
        this.authWindow = null;
        
        if (this.messageListener) {
            window.removeEventListener('message', this.messageListener);
            this.messageListener = null;
        }
        
        console.log('VK Auth: Очистка завершена');
    }

    manualAuth(args) {
        const url = args.URL;
        console.log('VK Auth: Ручная обработка URL');
        
        if (!url || url === 'paste URL here') {
            console.log('VK Auth: Введите корректный URL с токеном');
            return;
        }

        if (this.processAuthUrl(url)) {
            this.closeLogin();
        }
    }

    processAuthUrl(url) {
        if (!url) return false;

        console.log('VK Auth: Обрабатываем URL...');

        // Проверяем наличие токена
        if (url.includes('#access_token=') || url.includes('&access_token=')) {
            console.log('VK Auth: Найден токен в URL!');
            return this.handleAuthSuccess(url);
        }

        // Проверяем ошибки
        if (url.includes('error=')) {
            console.log('VK Auth: Найдена ошибка в URL');
            this.handleAuthError(url);
            return true;
        }

        return false;
    }

    handleAuthSuccess(url) {
        console.log('VK Auth: Обрабатываем успешную авторизацию');
        
        try {
            let hashPart;
            
            // Ищем hash часть в разных форматах
            if (url.includes('#')) {
                hashPart = url.split('#')[1];
            } else if (url.includes('access_token=')) {
                const tokenStart = url.indexOf('access_token=');
                hashPart = url.substring(tokenStart);
            }

            if (!hashPart) {
                console.error('VK Auth: Не найдена hash часть в URL');
                return false;
            }

            const params = new URLSearchParams(hashPart);
            const accessToken = params.get('access_token');
            const userId = params.get('user_id');
            
            console.log('VK Auth: Извлечены параметры', {
                hasToken: !!accessToken,
                hasUserId: !!userId,
                userId: userId
            });

            if (accessToken && userId) {
                this.accessToken = accessToken;
                this.userId = userId;
                
                // Закрываем окно авторизации
                this.closeLogin();
                
                console.log('VK Auth: Токен сохранен, загружаем данные пользователя...');
                
                // Загружаем информацию о пользователе
                this.getUserInfo().then(() => {
                    console.log('VK Auth: Авторизация полностью завершена!');
                    console.log('Данные пользователя:', {
                        name: this.getFullName(),
                        id: this.userId,
                        city: this.city,
                        hasPhoto: !!this.profilePicture
                    });
                }).catch((error) => {
                    console.error('VK Auth: Ошибка загрузки данных пользователя:', error);
                });

                return true;
            } else {
                console.error('VK Auth: Не найдены токен или ID пользователя');
                return false;
            }
        } catch (error) {
            console.error('VK Auth: Ошибка обработки авторизации:', error);
            return false;
        }
    }

    handleAuthError(url) {
        console.log('VK Auth: Обрабатываем ошибку авторизации');
        
        try {
            const errorMatch = url.match(/error=([^&]*)/);
            const errorDescMatch = url.match(/error_description=([^&]*)/);
            
            console.error('VK Auth Error:', {
                error: errorMatch ? decodeURIComponent(errorMatch[1]) : 'unknown',
                description: errorDescMatch ? decodeURIComponent(errorDescMatch[1]) : 'unknown'
            });
        } catch (e) {
            console.error('VK Auth: Ошибка парсинга ошибки:', e);
        }
        
        this.closeLogin();
    }

    async getUserInfo() {
        if (!this.accessToken || !this.userId) {
            console.log('VK Auth: Нет токена или ID для загрузки данных');
            return Promise.reject('Нет токена или ID');
        }

        console.log('VK Auth: Загружаем данные пользователя через VK API...');

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const callbackName = 'vkCallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            window[callbackName] = (data) => {
                console.log('VK Auth: Получен ответ от API');
                
                try {
                    if (data.response && data.response.length > 0) {
                        const user = data.response[0];
                        
                        this.firstName = user.first_name || '';
                        this.lastName = user.last_name || '';
                        this.profilePicture = user.photo_200 || '';
                        this.screenName = user.screen_name || '';
                        this.sex = this.getSexString(user.sex);
                        this.birthDate = user.bdate || '';
                        this.city = user.city ? user.city.title : '';
                        this.country = user.country ? user.country.title : '';
                        
                        console.log('VK Auth: Данные пользователя загружены успешно');
                        resolve(user);
                    } else if (data.error) {
                        console.error('VK Auth: Ошибка API:', data.error);
                        reject(new Error(data.error.error_msg || 'VK API Error'));
                    } else {
                        console.error('VK Auth: Пустой ответ от API');
                        reject(new Error('Пустой ответ от VK API'));
                    }
                } catch (error) {
                    console.error('VK Auth: Ошибка обработки ответа API:', error);
                    reject(error);
                }
                
                // Очистка
                setTimeout(() => {
                    try {
                        if (document.head.contains(script)) {
                            document.head.removeChild(script);
                        }
                        delete window[callbackName];
                    } catch (e) {}
                }, 100);
            };
            
            const fields = 'first_name,last_name,photo_200,screen_name,sex,bdate,city,country';
            const apiUrl = `https://api.vk.com/method/users.get?user_ids=${this.userId}&fields=${fields}&access_token=${this.accessToken}&v=5.199&callback=${callbackName}`;
            
            script.src = apiUrl;
            script.onerror = (error) => {
                console.error('VK Auth: Ошибка загрузки API скрипта:', error);
                reject(new Error('Ошибка загрузки API скрипта'));
                try {
                    if (document.head.contains(script)) {
                        document.head.removeChild(script);
                    }
                    delete window[callbackName];
                } catch (e) {}
            };
            
            document.head.appendChild(script);
            
            // Таймаут для запроса
            setTimeout(() => {
                if (window[callbackName]) {
                    console.error('VK Auth: Таймаут API запроса');
                    reject(new Error('Таймаут запроса к VK API'));
                    try {
                        if (document.head.contains(script)) {
                            document.head.removeChild(script);
                        }
                        delete window[callbackName];
                    } catch (e) {}
                }
            }, 15000);
        });
    }

    getSexString(sexCode) {
        switch (sexCode) {
            case 1: return 'Женский';
            case 2: return 'Мужской';
            default: return 'Не указан';
        }
    }

    clearData() {
        this.firstName = null;
        this.lastName = null;
        this.profilePicture = null;
        this.userId = null;
        this.screenName = null;
        this.sex = null;
        this.birthDate = null;
        this.city = null;
        this.country = null;
        this.accessToken = null;
        
        this.closeLogin();
        
        console.log('VK Auth: Все данные очищены');
    }

    isLoginWindowOpen() {
        return !!(this.authWindow && !this.authWindow.closed);
    }

    getFirstName() {
        return this.firstName || '';
    }

    getLastName() {
        return this.lastName || '';
    }

    getFullName() {
        const first = this.firstName || '';
        const last = this.lastName || '';
        return first && last ? `${first} ${last}` : first || last || '';
    }

    getProfilePicture() {
        return this.profilePicture || '';
    }

    getUserId() {
        return this.userId || '';
    }

    getScreenName() {
        return this.screenName || '';
    }

    getSex() {
        return this.sex || '';
    }

    getBirthDate() {
        return this.birthDate || '';
    }

    getCity() {
        return this.city || '';
    }

    getCountry() {
        return this.country || '';
    }

    getAccessToken() {
        return this.accessToken || '';
    }

    isLoggedIn() {
        return !!(this.accessToken && this.userId);
    }
}

Scratch.extensions.register(new VKAuthExtension());
