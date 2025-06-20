class OpenRouterAI {
  constructor(runtime) {
    this.runtime = runtime;
    this.apiKey = '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
    this.lastResponse = '';
    this.availableModels = [];
    this.chatHistory = [];
    this.systemPrompt = '';
    this.lastRequest = '';
    this.lastUsage = null;
    this.lastCost = 0;
    this.webSearchResults = [];
    this.loadedFileData = '';
    
    // Параметры для запросов
    this.temperature = 0.7;
    this.maxTokens = 1000;
    this.topP = 1;
    
    // Параметры веб-поиска
    this.maxSearchResults = 5;
    this.searchPrompt = 'Рассмотрите эти результаты веб-поиска при формировании ответа:';
  }

  getInfo() {
    return {
      id: 'openrouter',
      name: 'OpenRouter ИИ',
      color1: '#4A90E2',
      color2: '#357ABD',
      blocks: [
        // Настройка API
        {
          opcode: 'setApiKey',
          blockType: Scratch.BlockType.COMMAND,
          text: 'установить API ключ OpenRouter [KEY]',
          arguments: {
            KEY: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'ваш-api-ключ-здесь'
            }
          }
        },
        
        // Системный промпт
        {
          opcode: 'setSystemPrompt',
          blockType: Scratch.BlockType.COMMAND,
          text: 'установить системный промпт [PROMPT]',
          arguments: {
            PROMPT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Ты полезный ИИ-ассистент.'
            }
          }
        },
        {
          opcode: 'getSystemPrompt',
          blockType: Scratch.BlockType.REPORTER,
          text: 'текущий системный промпт'
        },
        
        // Управление чатом
        {
          opcode: 'clearChat',
          blockType: Scratch.BlockType.COMMAND,
          text: 'очистить историю чата'
        },
        {
          opcode: 'addUserMessage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'добавить сообщение пользователя [MESSAGE] в чат',
          arguments: {
            MESSAGE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Привет!'
            }
          }
        },
        {
          opcode: 'addAssistantMessage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'добавить ответ ассистента [MESSAGE] в чат',
          arguments: {
            MESSAGE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Привет! Как дела?'
            }
          }
        },
        {
          opcode: 'getChatHistory',
          blockType: Scratch.BlockType.REPORTER,
          text: 'история чата (JSON)'
        },
        
        // Отправка сообщений
        {
          opcode: 'sendMessage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'отправить сообщение [MESSAGE] модели [MODEL]',
          arguments: {
            MESSAGE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Привет, как дела?'
            },
            MODEL: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'openai/gpt-4o-mini'
            }
          }
        },
        {
          opcode: 'sendChatMessage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'продолжить чат с сообщением [MESSAGE] используя модель [MODEL]',
          arguments: {
            MESSAGE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Продолжим наш разговор'
            },
            MODEL: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'openai/gpt-4o-mini'
            }
          }
        },

        // Веб-поиск (новая реализация)
        {
          opcode: 'webSearch',
          blockType: Scratch.BlockType.COMMAND,
          text: 'веб-поиск [QUERY] с моделью [MODEL] макс результатов [MAX_RESULTS]',
          arguments: {
            QUERY: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'последние новости ИИ'
            },
            MODEL: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'openai/gpt-4o-mini'
            },
            MAX_RESULTS: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 5
            }
          }
        },
        {
          opcode: 'webSearchOnline',
          blockType: Scratch.BlockType.COMMAND,
          text: 'веб-поиск онлайн [QUERY] с моделью [MODEL] (:online добавляется автоматически)',
          arguments: {
            QUERY: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'актуальные события'
            },
            MODEL: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'openai/gpt-4o-mini'
            }
          }
        },
        {
          opcode: 'setSearchPrompt',
          blockType: Scratch.BlockType.COMMAND,
          text: 'установить промпт для поиска [PROMPT]',
          arguments: {
            PROMPT: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Рассмотрите эти результаты веб-поиска при формировании ответа:'
            }
          }
        },
        {
          opcode: 'getWebSearchSources',
          blockType: Scratch.BlockType.REPORTER,
          text: 'источники веб-поиска (JSON)'
        },
        {
          opcode: 'getSourceByIndex',
          blockType: Scratch.BlockType.REPORTER,
          text: 'источник номер [INDEX] детали',
          arguments: {
            INDEX: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        {
          opcode: 'getSourcesCount',
          blockType: Scratch.BlockType.REPORTER,
          text: 'количество источников'
        },
        
        // Работа с изображениями
        {
          opcode: 'sendImageMessage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'отправить изображение (data URL) [IMAGE_DATA] с сообщением [MESSAGE] модели vision [MODEL]',
          arguments: {
            IMAGE_DATA: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'data:image/jpeg;base64,/9j/4AAQSkZJ...'
            },
            MESSAGE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Что ты видишь на этом изображении?'
            },
            MODEL: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'openai/gpt-4o'
            }
          }
        },
        
        // Загрузка файлов
        {
          opcode: 'loadFile',
          blockType: Scratch.BlockType.COMMAND,
          text: 'загрузить файл и конвертировать в data URL'
        },
        {
          opcode: 'getLoadedFile',
          blockType: Scratch.BlockType.REPORTER,
          text: 'загруженный файл data URL'
        },
        {
          opcode: 'sendFileMessage',
          blockType: Scratch.BlockType.COMMAND,
          text: 'отправить файл [FILE_DATA] с сообщением [MESSAGE] модели [MODEL]',
          arguments: {
            FILE_DATA: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'data:text/plain;base64,SGVsbG8gV29ybGQ='
            },
            MESSAGE: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'Проанализируй этот файл'
            },
            MODEL: {
              type: Scratch.ArgumentType.STRING,
              defaultValue: 'openai/gpt-4o'
            }
          }
        },
        
        // Получение результатов
        {
          opcode: 'getResponse',
          blockType: Scratch.BlockType.REPORTER,
          text: 'последний ответ ИИ'
        },
        {
          opcode: 'getLastRequest',
          blockType: Scratch.BlockType.REPORTER,
          text: 'детали последнего запроса'
        },
        
        // Модели
        {
          opcode: 'getAvailableModels',
          blockType: Scratch.BlockType.COMMAND,
          text: 'загрузить доступные модели'
        },
        
        // Настройки параметров
        {
          opcode: 'setChatParameters',
          blockType: Scratch.BlockType.COMMAND,
          text: 'установить температуру [TEMP] макс токенов [TOKENS] top_p [TOP_P]',
          arguments: {
            TEMP: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 0.7
            },
            TOKENS: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1000
            },
            TOP_P: {
              type: Scratch.ArgumentType.NUMBER,
              defaultValue: 1
            }
          }
        },
        
        // Статистика
        {
          opcode: 'getTokenUsage',
          blockType: Scratch.BlockType.REPORTER,
          text: 'токенов использовано в последнем запросе'
        },
        {
          opcode: 'getCost',
          blockType: Scratch.BlockType.REPORTER,
          text: 'стоимость последнего запроса'
        }
      ]
    };
  }

  // Настройка API
  setApiKey(args) {
    this.apiKey = args.KEY;
    console.log('OpenRouter API ключ установлен');
  }

  // Системный промпт
  setSystemPrompt(args) {
    this.systemPrompt = args.PROMPT;
  }

  getSystemPrompt() {
    return this.systemPrompt;
  }

  // Управление чатом
  clearChat() {
    this.chatHistory = [];
  }

  addUserMessage(args) {
    this.chatHistory.push({
      role: 'user',
      content: args.MESSAGE
    });
  }

  addAssistantMessage(args) {
    this.chatHistory.push({
      role: 'assistant',
      content: args.MESSAGE
    });
  }

  getChatHistory() {
    return JSON.stringify(this.chatHistory);
  }

  // Загрузка файлов
  loadFile() {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '*/*';
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.loadedFileData = e.target.result;
            resolve();
          };
          reader.readAsDataURL(file);
        } else {
          this.loadedFileData = '';
          resolve();
        }
      };
      
      input.click();
    });
  }

  getLoadedFile() {
    return this.loadedFileData || '';
  }

  // Извлечение источников из ответа OpenRouter API
  extractSourcesFromResponse(responseData) {
    this.webSearchResults = [];
    
    if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
      const message = responseData.choices[0].message;
      
      // Извлекаем источники из annotations (стандартизированный формат OpenRouter)
      if (message.annotations && Array.isArray(message.annotations)) {
        message.annotations.forEach((annotation, index) => {
          // Проверяем разные типы аннотаций для веб-поиска
          if (annotation.type === 'web_search' || 
              annotation.type === 'web_search_result' || 
              annotation.type === 'citation') {
            this.webSearchResults.push({
              index: index + 1,
              title: annotation.title || annotation.name || `Источник ${index + 1}`,
              url: annotation.url || annotation.link || '',
              snippet: annotation.text || annotation.content || annotation.snippet || '',
              publishedDate: annotation.published_date || annotation.date || null,
              domain: annotation.domain || this.extractDomain(annotation.url || ''),
              type: annotation.type || 'web_search'
            });
          }
        });
      }
      
      // Резервный способ: извлекаем ссылки из текста ответа
      if (this.webSearchResults.length === 0) {
        const content = message.content || '';
        const urlPattern = /https?:\/\/[^\s\)]+/g;
        const urls = content.match(urlPattern) || [];
        
        const uniqueUrls = [...new Set(urls)];
        uniqueUrls.forEach((url, index) => {
          const cleanUrl = url.replace(/[.,;]$/, '');
          this.webSearchResults.push({
            index: index + 1,
            title: `Источник ${index + 1}`,
            url: cleanUrl,
            snippet: '',
            publishedDate: null,
            domain: this.extractDomain(cleanUrl),
            type: 'extracted_url'
          });
        });
      }
    }
    
    return this.webSearchResults;
  }

  // Извлечение домена из URL
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return '';
    }
  }

  // Основная функция отправки запросов
  async makeRequest(messages, model, useWebSearch = false, maxResults = 5, searchPrompt = '') {
    if (!this.apiKey) {
      this.lastResponse = 'Ошибка: API ключ не установлен';
      return false;
    }

    this.lastRequest = `Модель: ${model}, Сообщений: ${messages.length}`;
    
    try {
      const requestBody = {
        model: model,
        messages: messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP
      };

      // Добавляем веб-поиск через plugins
      if (useWebSearch) {
        requestBody.plugins = [{
          id: 'web',
          max_results: Math.max(1, Math.min(10, maxResults))
        }];
        
        // Добавляем кастомный промпт для поиска если указан
        if (searchPrompt) {
          requestBody.plugins[0].search_prompt = searchPrompt;
        }
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://scratch.mit.edu',
          'X-Title': 'Scratch OpenRouter Extension'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (response.ok) {
        const responseContent = data.choices[0].message.content;
        this.lastResponse = responseContent;
        
        // Извлекаем источники из ответа
        if (useWebSearch) {
          this.extractSourcesFromResponse(data);
        }
        
        this.lastUsage = data.usage;
        this.lastCost = data.usage ? (data.usage.total_tokens * 0.00001) : 0;
        return true;
      } else {
        this.lastResponse = `Ошибка: ${data.error?.message || 'Неизвестная ошибка'}`;
        this.webSearchResults = [];
        return false;
      }
    } catch (error) {
      this.lastResponse = `Ошибка сети: ${error.message}`;
      this.webSearchResults = [];
      return false;
    }
  }

  // Отправка простого сообщения
  async sendMessage(args) {
    const messages = [];
    
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: args.MESSAGE
    });

    await this.makeRequest(messages, args.MODEL, false);
  }

  // Продолжение чата
  async sendChatMessage(args) {
    const messages = [];
    
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    // Добавляем историю чата
    messages.push(...this.chatHistory);
    
    // Добавляем новое сообщение пользователя
    messages.push({
      role: 'user',
      content: args.MESSAGE
    });

    const success = await this.makeRequest(messages, args.MODEL, false);
    
    if (success) {
      // Добавляем в историю чата
      this.chatHistory.push({
        role: 'user',
        content: args.MESSAGE
      });
      this.chatHistory.push({
        role: 'assistant',
        content: this.lastResponse
      });
    }
  }

  // Веб-поиск с plugins
  async webSearch(args) {
    const messages = [];
    
    // Системный промпт для веб-поиска
    const searchSystemPrompt = this.systemPrompt || 
      'Ты полезный ИИ-ассистент с доступом к актуальному веб-поиску. Предоставляй точную, актуальную информацию на основе результатов веб-поиска. Включай релевантные цитаты где это уместно.';
    
    messages.push({
      role: 'system',
      content: searchSystemPrompt
    });
    
    messages.push({
      role: 'user',
      content: args.QUERY
    });

    await this.makeRequest(messages, args.MODEL, true, args.MAX_RESULTS, this.searchPrompt);
  }

  // Веб-поиск с :online постфиксом
  async webSearchOnline(args) {
    const messages = [];
    
    // Системный промпт для веб-поиска
    const searchSystemPrompt = this.systemPrompt || 
      'Ты полезный ИИ-ассистент с доступом к актуальному веб-поиску. Предоставляй точную, актуальную информацию на основе результатов веб-поиска. Включай релевантные цитаты где это уместно.';
    
    messages.push({
      role: 'system',
      content: searchSystemPrompt
    });
    
    messages.push({
      role: 'user',
      content: args.QUERY
    });

    // Добавляем :online к модели для активации веб-поиска
    const onlineModel = args.MODEL.includes(':online') ? args.MODEL : `${args.MODEL}:online`;
    
    await this.makeRequest(messages, onlineModel, false);
  }

  // Установка промпта для поиска
  setSearchPrompt(args) {
    this.searchPrompt = args.PROMPT;
    console.log('Промпт для поиска установлен:', this.searchPrompt);
  }

  // Отправка изображения (data URL)
  async sendImageMessage(args) {
    const messages = [];
    
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: [
        {
          type: 'text',
          text: args.MESSAGE
        },
        {
          type: 'image_url',
          image_url: {
            url: args.IMAGE_DATA
          }
        }
      ]
    });

    await this.makeRequest(messages, args.MODEL, false);
  }

  // Отправка файла
  async sendFileMessage(args) {
    const messages = [];
    
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    // Определяем тип файла
    const isImage = args.FILE_DATA.startsWith('data:image/');
    
    if (isImage) {
      // Если это изображение, используем vision API
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: args.MESSAGE
          },
          {
            type: 'image_url',
            image_url: {
              url: args.FILE_DATA
            }
          }
        ]
      });
    } else {
      // Для текстовых файлов декодируем base64
      try {
        const base64Data = args.FILE_DATA.split(',')[1];
        const decodedData = atob(base64Data);
        
        messages.push({
          role: 'user',
          content: `${args.MESSAGE}\n\nСодержимое файла:\n${decodedData}`
        });
      } catch (error) {
        messages.push({
          role: 'user',
          content: `${args.MESSAGE}\n\nОшибка чтения файла: ${error.message}`
        });
      }
    }

    await this.makeRequest(messages, args.MODEL, false);
  }

  // Получение источников веб-поиска
  getWebSearchSources() {
    return JSON.stringify(this.webSearchResults);
  }

  getSourceByIndex(args) {
    const index = parseInt(args.INDEX) - 1;
    if (index >= 0 && index < this.webSearchResults.length) {
      return JSON.stringify(this.webSearchResults[index]);
    }
    return 'Источник не найден';
  }

  getSourcesCount() {
    return this.webSearchResults.length;
  }

  // Получение результатов
  getResponse() {
    return this.lastResponse || '';
  }

  getLastRequest() {
    return this.lastRequest || 'Запросы не выполнялись';
  }

  // Работа с моделями
  async getAvailableModels() {
    if (!this.apiKey) {
      this.availableModels = ['Ошибка: API ключ не установлен'];
      return;
    }

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        this.availableModels = data.data.map(model => model.id);
      } else {
        this.availableModels = [`Ошибка: ${data.error?.message || 'Неизвестная ошибка'}`];
      }
    } catch (error) {
      this.availableModels = [`Ошибка сети: ${error.message}`];
    }
  }

  // Настройки параметров
  setChatParameters(args) {
    this.temperature = Math.max(0, Math.min(2, args.TEMP));
    this.maxTokens = Math.max(1, Math.min(4000, args.TOKENS));
    this.topP = Math.max(0, Math.min(1, args.TOP_P));
  }

  // Статистика
  getTokenUsage() {
    return this.lastUsage ? this.lastUsage.total_tokens : 0;
  }

  getCost() {
    return this.lastCost ? this.lastCost.toFixed(6) : '0.000000';
  }
}

Scratch.extensions.register(new OpenRouterAI());
