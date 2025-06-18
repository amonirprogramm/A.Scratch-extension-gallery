(function(Scratch) {
    'use strict';

    if (!Scratch.extensions.unsandboxed) {
        throw new Error('Snackbar extension must run unsandboxed');
    }

    let snackbarConfig = {
        backgroundColor: '#333333',
        textColor: '#ffffff',
        font: 'Arial',
        size: 16,
        width: 300,
        height: 60,
        icon: '🔔',
        text: 'Notification',
        borderRadius: 8,
        duration: 3000,
        position: 'bottom-right',
        buttons: []
    };

    let currentSnackbar = null;
    let snackbarEvents = {};

    class SnackbarExtension {
        getInfo() {
            return {
                id: 'snackbar',
                name: 'Snackbar',
                color1: '#4CAF50',
                color2: '#45a049',
                blocks: [
                    {
                        opcode: 'showSnackbar',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'показать snackbar с текстом [TEXT]',
                        arguments: {
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Уведомление'
                            }
                        }
                    },
                    {
                        opcode: 'hideSnackbar',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'скрыть snackbar'
                    },
                    '---',
                    {
                        opcode: 'setBackgroundColor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить цвет фона [COLOR]',
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.COLOR,
                                defaultValue: '#333333'
                            }
                        }
                    },
                    {
                        opcode: 'setTextColor',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить цвет текста [COLOR]',
                        arguments: {
                            COLOR: {
                                type: Scratch.ArgumentType.COLOR,
                                defaultValue: '#ffffff'
                            }
                        }
                    },
                    {
                        opcode: 'setFont',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить шрифт [FONT]',
                        arguments: {
                            FONT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'Arial',
                                menu: 'fonts'
                            }
                        }
                    },
                    {
                        opcode: 'setSize',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить размер шрифта [SIZE]',
                        arguments: {
                            SIZE: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 16
                            }
                        }
                    },
                    {
                        opcode: 'setDimensions',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить размеры: ширина [WIDTH] высота [HEIGHT]',
                        arguments: {
                            WIDTH: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 300
                            },
                            HEIGHT: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 60
                            }
                        }
                    },
                    {
                        opcode: 'setIcon',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить иконку [ICON]',
                        arguments: {
                            ICON: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '🔔'
                            }
                        }
                    },
                    {
                        opcode: 'setSvgIcon',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить SVG иконку [SVG]',
                        arguments: {
                            SVG: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/></svg>'
                            }
                        }
                    },
                    {
                        opcode: 'setBorderRadius',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить закругление [RADIUS]',
                        arguments: {
                            RADIUS: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 8
                            }
                        }
                    },
                    {
                        opcode: 'setDuration',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить время отображения [DURATION] мс',
                        arguments: {
                            DURATION: {
                                type: Scratch.ArgumentType.NUMBER,
                                defaultValue: 3000
                            }
                        }
                    },
                    {
                        opcode: 'setPosition',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'установить позицию [POSITION]',
                        arguments: {
                            POSITION: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'bottom-right',
                                menu: 'positions'
                            }
                        }
                    },
                    {
                        opcode: 'addButton',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'добавить кнопку [BUTTON] с текстом [TEXT]',
                        arguments: {
                            BUTTON: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'ok',
                                menu: 'buttonTypes'
                            },
                            TEXT: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'ОК'
                            }
                        }
                    },
                    {
                        opcode: 'clearButtons',
                        blockType: Scratch.BlockType.COMMAND,
                        text: 'очистить все кнопки'
                    },
                    '---',
                    {
                        opcode: 'whenSnackbarClicked',
                        blockType: Scratch.BlockType.EVENT,
                        text: 'когда snackbar нажат',
                        isEdgeActivated: false
                    },
                    {
                        opcode: 'whenButtonClicked',
                        blockType: Scratch.BlockType.EVENT,
                        text: 'когда кнопка [BUTTON] нажата',
                        isEdgeActivated: false,
                        arguments: {
                            BUTTON: {
                                type: Scratch.ArgumentType.STRING,
                                defaultValue: 'ok',
                                menu: 'buttonTypes'
                            }
                        }
                    },
                    '---',
                    {
                        opcode: 'isSnackbarVisible',
                        blockType: Scratch.BlockType.BOOLEAN,
                        text: 'snackbar виден?'
                    },
                    {
                        opcode: 'getLastClickedButton',
                        blockType: Scratch.BlockType.REPORTER,
                        text: 'последняя нажатая кнопка'
                    }
                ],
                menus: {
                    fonts: {
                        acceptReporters: true,
                        items: [
                            'Arial',
                            'Helvetica',
                            'Times New Roman',
                            'Courier New',
                            'Verdana',
                            'Georgia',
                            'Comic Sans MS',
                            'Impact',
                            'Trebuchet MS',
                            'Arial Black'
                        ]
                    },
                    positions: {
                        acceptReporters: true,
                        items: [
                            { text: 'Верх слева', value: 'top-left' },
                            { text: 'Верх по центру', value: 'top-center' },
                            { text: 'Верх справа', value: 'top-right' },
                            { text: 'Низ слева', value: 'bottom-left' },
                            { text: 'Низ по центру', value: 'bottom-center' },
                            { text: 'Низ справа', value: 'bottom-right' },
                            { text: 'Центр', value: 'center' }
                        ]
                    },
                    buttonTypes: {
                        acceptReporters: true,
                        items: [
                            { text: 'ОК', value: 'ok' },
                            { text: 'Отмена', value: 'cancel' },
                            { text: 'Да', value: 'yes' },
                            { text: 'Нет', value: 'no' },
                            { text: 'Закрыть', value: 'close' }
                        ]
                    }
                }
            };
        }

        // Основные функции
        showSnackbar(args) {
            snackbarConfig.text = args.TEXT || 'Уведомление';
            this.createSnackbar();
        }

        hideSnackbar() {
            if (currentSnackbar) {
                currentSnackbar.remove();
                currentSnackbar = null;
            }
        }

        // Настройки внешнего вида
        setBackgroundColor(args) {
            snackbarConfig.backgroundColor = args.COLOR;
        }

        setTextColor(args) {
            snackbarConfig.textColor = args.COLOR;
        }

        setFont(args) {
            snackbarConfig.font = args.FONT;
        }

        setSize(args) {
            snackbarConfig.size = Math.max(8, Math.min(72, args.SIZE));
        }

        setDimensions(args) {
            snackbarConfig.width = Math.max(100, args.WIDTH);
            snackbarConfig.height = Math.max(40, args.HEIGHT);
        }

        setIcon(args) {
            snackbarConfig.icon = args.ICON;
            snackbarConfig.isSvg = false;
        }

        setSvgIcon(args) {
            snackbarConfig.icon = args.SVG;
            snackbarConfig.isSvg = true;
        }

        setBorderRadius(args) {
            snackbarConfig.borderRadius = Math.max(0, args.RADIUS);
        }

        setDuration(args) {
            snackbarConfig.duration = Math.max(500, args.DURATION);
        }

        setPosition(args) {
            snackbarConfig.position = args.POSITION;
        }

        // Управление кнопками
        addButton(args) {
            const button = {
                type: args.BUTTON,
                text: args.TEXT
            };
            
            // Проверяем, есть ли уже такая кнопка
            const existingIndex = snackbarConfig.buttons.findIndex(b => b.type === button.type);
            if (existingIndex >= 0) {
                snackbarConfig.buttons[existingIndex] = button;
            } else {
                snackbarConfig.buttons.push(button);
            }
        }

        clearButtons() {
            snackbarConfig.buttons = [];
        }

        // События
        whenSnackbarClicked() {
            // Этот блок активируется через runtime
        }

        whenButtonClicked(args) {
            // Этот блок активируется через runtime
        }

        // Репортеры
        isSnackbarVisible() {
            return currentSnackbar !== null;
        }

        getLastClickedButton() {
            return snackbarEvents.lastClickedButton || '';
        }

        // Создание snackbar
        createSnackbar() {
            // Удаляем существующий snackbar
            this.hideSnackbar();

            const snackbar = document.createElement('div');
            snackbar.className = 'scratch-snackbar';
            
            // Применяем стили
            Object.assign(snackbar.style, {
                position: 'fixed',
                backgroundColor: snackbarConfig.backgroundColor,
                color: snackbarConfig.textColor,
                fontFamily: snackbarConfig.font,
                fontSize: snackbarConfig.size + 'px',
                width: snackbarConfig.width + 'px',
                height: snackbarConfig.height + 'px',
                borderRadius: snackbarConfig.borderRadius + 'px',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                zIndex: '10000',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                opacity: '0',
                transform: 'translateY(20px)'
            });

            // Позиционирование
            const positions = {
                'top-left': { top: '20px', left: '20px' },
                'top-center': { top: '20px', left: '50%', transform: 'translateX(-50%) translateY(20px)' },
                'top-right': { top: '20px', right: '20px' },
                'bottom-left': { bottom: '20px', left: '20px' },
                'bottom-center': { bottom: '20px', left: '50%', transform: 'translateX(-50%) translateY(20px)' },
                'bottom-right': { bottom: '20px', right: '20px' },
                'center': { top: '50%', left: '50%', transform: 'translate(-50%, -50%) translateY(20px)' }
            };

            const pos = positions[snackbarConfig.position] || positions['bottom-right'];
            Object.assign(snackbar.style, pos);

            // Содержимое
            const content = document.createElement('div');
            content.style.display = 'flex';
            content.style.alignItems = 'center';
            content.style.flex = '1';

            // Иконка
            if (snackbarConfig.icon) {
                const iconElement = document.createElement('div');
                iconElement.style.marginRight = '12px';
                iconElement.style.flexShrink = '0';
                iconElement.style.display = 'flex';
                iconElement.style.alignItems = 'center';
                
                if (snackbarConfig.isSvg) {
                    iconElement.innerHTML = snackbarConfig.icon;
                    iconElement.style.width = (snackbarConfig.size + 4) + 'px';
                    iconElement.style.height = (snackbarConfig.size + 4) + 'px';
                    const svgEl = iconElement.querySelector('svg');
                    if (svgEl) {
                        svgEl.style.width = '100%';
                        svgEl.style.height = '100%';
                        svgEl.style.fill = snackbarConfig.textColor;
                    }
                } else {
                    iconElement.textContent = snackbarConfig.icon;
                    iconElement.style.fontSize = (snackbarConfig.size + 2) + 'px';
                }
                
                content.appendChild(iconElement);
            }

            // Текст
            const textElement = document.createElement('span');
            textElement.textContent = snackbarConfig.text;
            textElement.style.flex = '1';
            content.appendChild(textElement);

            snackbar.appendChild(content);

            // Кнопки
            if (snackbarConfig.buttons.length > 0) {
                const buttonsContainer = document.createElement('div');
                buttonsContainer.style.display = 'flex';
                buttonsContainer.style.gap = '8px';
                buttonsContainer.style.marginLeft = '16px';

                snackbarConfig.buttons.forEach(buttonConfig => {
                    const button = document.createElement('button');
                    button.textContent = buttonConfig.text;
                    button.style.cssText = `
                        background: rgba(255,255,255,0.2);
                        border: 1px solid rgba(255,255,255,0.3);
                        color: ${snackbarConfig.textColor};
                        padding: 6px 12px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-family: ${snackbarConfig.font};
                        font-size: ${Math.max(12, snackbarConfig.size - 2)}px;
                        transition: background 0.2s ease;
                    `;

                    button.addEventListener('mouseenter', () => {
                        button.style.background = 'rgba(255,255,255,0.3)';
                    });

                    button.addEventListener('mouseleave', () => {
                        button.style.background = 'rgba(255,255,255,0.2)';
                    });

                    button.addEventListener('click', (e) => {
                        e.stopPropagation();
                        snackbarEvents.lastClickedButton = buttonConfig.type;
                        this.triggerButtonEvent(buttonConfig.type);
                        this.hideSnackbar();
                    });

                    buttonsContainer.appendChild(button);
                });

                snackbar.appendChild(buttonsContainer);
            }

            // Обработчик клика по snackbar
            snackbar.addEventListener('click', () => {
                this.triggerSnackbarEvent();
            });

            // Добавляем в DOM
            document.body.appendChild(snackbar);
            currentSnackbar = snackbar;

            // Анимация появления
            requestAnimationFrame(() => {
                snackbar.style.opacity = '1';
                snackbar.style.transform = snackbar.style.transform.replace('translateY(20px)', 'translateY(0)');
            });

            // Автоскрытие
            if (snackbarConfig.duration > 0) {
                setTimeout(() => {
                    this.hideSnackbar();
                }, snackbarConfig.duration);
            }
        }

        // Триггеры событий
        triggerSnackbarEvent() {
            if (typeof Scratch !== 'undefined' && Scratch.vm) {
                Scratch.vm.runtime.startHats('snackbar_whenSnackbarClicked');
            }
        }

        triggerButtonEvent(buttonType) {
            if (typeof Scratch !== 'undefined' && Scratch.vm) {
                Scratch.vm.runtime.startHats('snackbar_whenButtonClicked', {
                    BUTTON: buttonType
                });
            }
        }
    }

    Scratch.extensions.register(new SnackbarExtension());
})(Scratch);