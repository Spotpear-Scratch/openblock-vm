const formatMessage = require('format-message');

const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

const CommonPeripheral = require('../common/common-peripheral');

/**
* The list of USB device filters.
* @readonly
*/
const PNPID_LIST = [
    'USB\\VID_303A&PID_1001'
];

/**
* Configuration of serialport
* @readonly
*/
const SERIAL_CONFIG = {
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1
};

/**
 * Configuration of flash.
 * @readonly
 */
const DIVECE_OPT = {
    type: 'spotpear'
};

const LedState = {
    On: '1',
    Off: '0'
};

const Key = {
    A: 'a',
    B: 'b'
};

const Pins = {
    P0: '0',
    P1: '1',
    P2: '2',
    P3: '3',
    P4: '4',
    P5: '5',
};

const Level = {
    High: '1',
    Low: '0'
};

/**
 * Manage communication with a spotpear peripheral over a OpenBlock Link client socket.
 */
class SpotPear extends CommonPeripheral{
    /**
     * Construct a spotpear communication object.
     * @param {Runtime} runtime - the OpenBlock runtime
     * @param {string} deviceId - the id of the deivce
     * @param {string} originalDeviceId - the original id of the peripheral, like xxx_arduinoUno
     */
    constructor (runtime, deviceId, originalDeviceId) {
        super(runtime, deviceId, originalDeviceId, PNPID_LIST, SERIAL_CONFIG, DIVECE_OPT);
    }
}

/**
 * OpenBlock blocks to interact with a spotpear peripheral.
 */
class OpenBlockSpotpearDevice {
    /**
     * @return {string} - the ID of this deivce.
     */
    get DEVICE_ID () {
        return 'spotpear';
    }

    get LEDSTATE_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'spotpear.ledState.on',
                    default: 'on',
                    description: 'label for led state on'
                }),
                value: LedState.On
            },
            {
                text: formatMessage({
                    id: 'spotpear.ledState.off',
                    default: 'off',
                    description: 'label for led state off'
                }),
                value: LedState.Off
            }
        ];
    }

    get LEDBRT_MENU () {
        return [
            {
                text: '0',
                value: '0'
            },
            {
                text: '1',
                value: '1'
            },
            {
                text: '2',
                value: '2'
            },
            {
                text: '3',
                value: '3'
            },
            {
                text: '4',
                value: '4'
            },
            {
                text: '5',
                value: '5'
            },
            {
                text: '6',
                value: '6'
            },
            {
                text: '7',
                value: '7'
            },
            {
                text: '8',
                value: '8'
            },
            {
                text: '9',
                value: '9'
            }
        ];
    }

    get TIMER_MENU () {
        return [
            {
                text: 'A',
                value: '1'
            },
            {
                text: 'B',
                value: '2'
            },
            {
                text: 'C',
                value: '3'
            },
            {
                text: 'D',
                value: '4'
            },
            {
                text: 'E',
                value: '5'
            },
        ];
    }

    get KEYS_MENU () {
        return [
            {
                text: 'A',
                value: Key.A
            },
            {
                text: 'B',
                value: Key.B
            }
        ];
    }

    get PINS_MENU () {
        return [
            {
                text: 'P0',
                value: Pins.P0
            },
            {
                text: 'P1',
                value: Pins.P1
            },
            {
                text: 'P2',
                value: Pins.P2
            },
            {
                text: 'P3',
                value: Pins.P3
            },
            {
                text: 'P4',
                value: Pins.P4
            },

        ];
    }

    get LEVEL_MENU () {
        return [
            {
                text: formatMessage({
                    id: 'spotpear.levelMenu.high',
                    default: 'high',
                    description: 'label for high level'
                }),
                value: Level.High
            },
            {
                text: formatMessage({
                    id: 'spotpear.levelMenu.low',
                    default: 'low',
                    description: 'label for low level'
                }),
                value: Level.Low
            }
        ];
    }
    
    get TOUCH_PINS_MENU () {
        return [
            {
                text: 'P0',
                value: Pins.P0
            },
            {
                text: 'P1',
                value: Pins.P1
            },
            {
                text: 'P2',
                value: Pins.P2
            }
        ];
    }

    get CHANNEL_MENU () {
        const channel = [];

        for (let i = 0; i < 84; i++) {
            channel.push(
                {
                    text: `${i}`,
                    value: `${i}`
                });
        }
        return channel;
    }

    get FONTSIZE_MENU () {
        return [
            {
                text: '14',
                value: '14'
            },
            {
                text: '16',
                value: '16'
            },
            {
                text: '24',
                value: '24'
            }
        ];
    }

    /**
     * Construct a set of spotpear blocks.
     * @param {Runtime} runtime - the OpenBlock runtime.
     * @param {string} originalDeviceId - the original id of the peripheral, like xxx_arduinoUno
     */
    constructor (runtime, originalDeviceId) {
        /**
         * The OpenBlock runtime.
         * @type {Runtime}
         */
        this.runtime = runtime;

        // Create a new spotpear peripheral instance
        this._peripheral = new SpotPear(this.runtime, this.DEVICE_ID, originalDeviceId);
    }

    /**
     * @returns {Array.<object>} metadata for this extension and its blocks.
     */
    getInfo () {
        return [{
            id: 'pin',
            name: formatMessage({
                id: 'spotpear.category.pins',
                default: 'Pins',
                description: 'The name of the spotpear device pin category'
            }),
            color1: '#4C97FF',
            color2: '#3373CC',
            color3: '#3373CC',

            blocks: [
                {
                    opcode: 'setDigitalOutput',
                    text: formatMessage({
                        id: 'spotpear.pins.setDigitalOutput',
                        default: 'set digital pin [PIN] out [LEVEL]',
                        description: 'spotpear set digital pin out'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'pins',
                            defaultValue: Pins.P0
                        },
                        LEVEL: {
                            type: ArgumentType.STRING,
                            menu: 'level',
                            defaultValue: Level.High
                        }
                    }
                },
                {
                    opcode: 'setPwmOutput',
                    text: formatMessage({
                        id: 'spotpear.pins.setPwmOutput',
                        default: 'set pwm pin [PIN] out [OUT]',
                        description: 'spotpear set pwm pin out'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'pins',
                            defaultValue: Pins.P0
                        },
                        OUT: {
                            type: ArgumentType.UINT10_NUMBER,
                            defaultValue: '1023'
                        }
                    }
                },
                '---',
                {
                    opcode: 'readDigitalPin',
                    text: formatMessage({
                        id: 'spotpear.pins.readDigitalPin',
                        default: 'read digital pin [PIN]',
                        description: 'spotpear read digital pin'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'pins',
                            defaultValue: Pins.P0
                        }
                    }
                },
                '---',
                {
                    opcode: 'pinTouched',
                    text: formatMessage({
                        id: 'spotpear.pins.pinIsTouched',
                        default: 'pin [PIN] is touched',
                        description: 'spotpear pin is touched'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        PIN: {
                            type: ArgumentType.STRING,
                            menu: 'touchPins',
                            defaultValue: Pins.P0
                        }
                    }
                }
            ],
            menus: {
                pins: {
                    items: this.PINS_MENU
                },
                level: {
                    acceptReporters: true,
                    items: this.LEVEL_MENU
                },
                touchPins: {
                    items: this.TOUCH_PINS_MENU
                }
            }
        },
        {
            id: 'timer',
            name: formatMessage({
                id: 'spotpear.category.timer',
                default: 'Timer',
                description: 'The name of the spotpear device timer category'
            }),
            color1: '#FF3399',
            color2: '#C8299A',
            color3: '#C8299A',

            blocks: [
                {
                    opcode: 'setTimer',
                    text: formatMessage({
                        id: 'spotpear.timer.setTimer',
                        default: 'set timer [TIMER] to [VALUE] milliseconds',
                        description: 'spotpear timer configuration'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TIMER: {
                            type: ArgumentType.NUMBER,
                            menu: 'timer',
                            defaultValue: 'A'
                        },
                        VALUE: {
                            type: ArgumentType.POSITIVE_NUMBER,
                            defaultValue: '5000'
                        }
                    }
                }
            ],
            menus: {
                timer: {
                    acceptReporters: true,
                    items: this.TIMER_MENU
                },
            }
        },
        {
            id: 'display',
            name: formatMessage({
                id: 'spotpear.category.display',
                default: 'Display',
                description: 'The name of the spotpear device display category'
            }),
            color1: '#9966FF',
            color2: '#774DCB',
            color3: '#774DCB',
            blocks: [
                {
                    opcode: 'setLED',
                    text: formatMessage({
                        id: 'spotpear.display.setLED',
                        default: 'set LED [STATE]',
                        description: 'spotpear set LED'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        STATE: {
                            type: ArgumentType.NUMBER,
                            menu: 'ledStatus',
                            defaultValue: LedState.On,
                        },
                    }
                },
                {
                    opcode: 'drawPixel',
                    text: formatMessage({
                        id: 'spotpear.display.drawPixel',
                        default: 'draw pixel at x:[X]y:[Y] in [COLOR]',
                        description: 'spotpear draw pixel'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                        },
                    }
                },
                {
                    opcode: 'drawLine',
                    text: formatMessage({
                        id: 'spotpear.display.drawLine',
                        default: 'draw line starting at x1:[X1]y1:[Y1] going to x2:[X2]y2:[Y2] in [COLOR] and [WIDTH] thickness',
                        description: 'spotpear draw line'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        Y1: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        X2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50'
                        },
                        Y2: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '50'
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                        },
                        WIDTH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '1'
                        }
                    }
                },
                {
                    opcode: 'drawCircle',
                    text: formatMessage({
                        id: 'spotpear.display.drawCircle',
                        default: 'draw circle starting at x:[X]y:[Y] with radius:[RADIUS] in [COLOR]',
                        description: 'spotpear draw circle'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        RADIUS: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '8'
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                        },
                    }
                },
                {
                    opcode: 'drawRectangle',
                    text: formatMessage({
                        id: 'spotpear.display.drawRectangle',
                        default: 'draw rectangle starting at x:[X]y:[Y] with width:[WIDTH] and height:[HEIGHT] in [COLOR]',
                        description: 'spotpear draw rectangle'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        WIDTH: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        HEIGHT: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                        },
                    }
                },
                {
                    opcode: 'showImage',
                    text: formatMessage({
                        id: 'spotpear.display.showImage',
                        default: 'show image [VALUE]',
                        description: 'spotpear show image'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VALUE: {
                            type: ArgumentType.MATRIX,
                            defaultValue: '0101010101100010101000100'
                        }
                    }
                },
                {
                    opcode: 'showImage16x16',
                    text: formatMessage({
                        id: 'spotpear.display.showImage16x16',
                        default: 'show image [VALUE]',
                        description: 'spotpear show image 16x16'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        VALUE: {
                            type: ArgumentType.MATRIX16X16,
                            defaultValue: '0101010101100010101000100010101010110001010100010001010101011000101010001000101010101100010101000100010101010110001010100010001010101011000101010001000101000100010101010110001010100010001010101011000101010001000101010101100010101000100010101010110001010100'
                        }
                    }
                },
                {
                    opcode: 'show',
                    text: formatMessage({
                        id: 'spotpear.display.show',
                        default: 'show [TEXT] at x:[X]y:[Y] in [COLOR] with size [SIZE]',
                        description: 'spotpear show'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello OpenBlock'
                        },
                        X: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        Y: {
                            type: ArgumentType.NUMBER,
                            defaultValue: '10'
                        },
                        COLOR: {
                            type: ArgumentType.COLOR,
                        },
                        SIZE: {
                            type: ArgumentType.NUMBER,
                            menu: 'fontSize',
                            defaultValue: '14'
                        }
                    }
                },
                '---',
                {
                    opcode: 'clearDisplay',
                    text: formatMessage({
                        id: 'spotpear.display.clearDisplay',
                        default: 'clear screen',
                        description: 'spotpear clear display'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'setBackgroundColor',
                    text: formatMessage({
                        id: 'spotpear.display.setBackgroundColor',
                        default: 'set background to [COLOR]',
                        description: 'spotpear set background color'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        COLOR: {
                            type: ArgumentType.COLOR,
                        }
                    }
                },
                '---',
                {
                    opcode: 'rgb',
                    text: formatMessage({
                        id: 'spotpear.display.rgb',
                        default: 'r[RED] g[GREEN] b[BLUE] to hex',
                        description: 'convert rgb value to hex'
                    }),
                    blockType: BlockType.REPORTER,
                    arguments: {
                        RED: {
                            type: ArgumentType.UINT8_NUMBER,
                            defaultValue: 128
                        },
                        GREEN: {
                            type: ArgumentType.UINT8_NUMBER,
                            defaultValue: 128
                        },
                        BLUE: {
                            type: ArgumentType.UINT8_NUMBER,
                            defaultValue: 128
                        },
                    }
                }
            ],
            menus: {
                ledStatus: {
                    items: this.LEDSTATE_MENU
                },
                fontSize: {
                    items: this.FONTSIZE_MENU
                },
            }
        },
        {
            id: 'sensor',
            name: formatMessage({
                id: 'spotpear.category.sensor',
                default: 'Sensor',
                description: 'The name of the spotpear device sensor category'
            }),
            color1: '#4CBFE6',
            color2: '#2E8EB8',
            color3: '#2E8EB8',

            blocks: [
                {
                    opcode: 'buttonIsPressed',
                    text: formatMessage({
                        id: 'spotpear.sensor.buttonIsPressed',
                        default: '[KEY] button is pressed?',
                        description: 'wether spotpear button is pressed'
                    }),
                    blockType: BlockType.BOOLEAN,
                    arguments: {
                        KEY: {
                            type: ArgumentType.STRING,
                            menu: 'keys',
                            defaultValue: Key.A
                        }
                    }
                },
            ],
            menus: {
                keys: {
                    items: this.KEYS_MENU
                },
            }
        },
        {
            id: 'wireless',
            name: formatMessage({
                id: 'spotpear.category.wireless',
                default: 'Wireless',
                description: 'The name of the spotpear device wireless category'
            }),
            color1: '#D65CD6',
            color2: '#BD42BD',
            color3: '#BD42BD',

            blocks: [
                {
                    opcode: 'openWirelessCommunication',
                    text: formatMessage({
                        id: 'spotpear.wireless.openWirelessCommunication',
                        default: 'open wireless communication',
                        description: 'spotpear open wireless communication'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'closeWirelessCommunication',
                    text: formatMessage({
                        id: 'spotpear.wireless.closeWirelessCommunication',
                        default: 'close wireless communication',
                        description: 'spotpear close wireless communication'
                    }),
                    blockType: BlockType.COMMAND
                },
                {
                    opcode: 'resetWirelessCommunication',
                    text: formatMessage({
                        id: 'spotpear.wireless.resetWirelessCommunication',
                        default: 'reset wireless communication',
                        description: 'spotpear reset wireless communication'
                    }),
                    blockType: BlockType.COMMAND
                },
                '---',
                {
                    opcode: 'sendWirelessMessage',
                    text: formatMessage({
                        id: 'spotpear.wireless.sendWirelessMessage',
                        default: 'send wireless message [TEXT]',
                        description: 'spotpear send wireless message'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello OpenBlock'
                        }
                    }
                },
                {
                    opcode: 'receiveWirelessMessage',
                    text: formatMessage({
                        id: 'spotpear.wireless.receiveWirelessMessage',
                        default: 'receive wireless message',
                        description: 'spotpear receive wireless message'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true
                },
                {
                    opcode: 'setWirelessCommunicationChannel',
                    text: formatMessage({
                        id: 'spotpear.wireless.setWirelessCommunicationChannel',
                        default: 'set wireless communication channel as [CH]',
                        description: 'spotpear set wireless communication channel'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        CH: {
                            type: ArgumentType.STRING,
                            menu: 'channel',
                            defaultValue: '0'
                        }
                    }
                }
            ],
            menus: {
                channel: {
                    items: this.CHANNEL_MENU
                }
            }
        },
        {
            id: 'console',
            name: formatMessage({
                id: 'spotpear.category.console',
                default: 'Console',
                description: 'The name of the spotpear device console category'
            }),
            color1: '#FF3399',
            color2: '#CC297A',
            color3: '#CC297A',

            blocks: [
                {
                    opcode: 'consolePrint',
                    text: formatMessage({
                        id: 'spotpear.console.consolePrint',
                        default: 'print [TEXT]',
                        description: 'spotpear console print'
                    }),
                    blockType: BlockType.COMMAND,
                    arguments: {
                        TEXT: {
                            type: ArgumentType.STRING,
                            defaultValue: 'Hello OpenBlock'
                        }
                    }
                }
            ],
            menus: { }
        }
        ];
    }
}

module.exports = OpenBlockSpotpearDevice;
