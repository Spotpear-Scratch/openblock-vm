/**
 * This class provides a ScratchLinkSocket implementation using WebSockets,
 * attempting to connect with the locally installed Scratch-Link.
 *
 * To connect with ScratchLink without WebSockets, you must implement all of the
 * public methods in this class.
 * - open()
 * - close()
 * - setOn[Open|Close|Error]
 * - setHandleMessage
 * - sendMessage(msgObj)
 * - isOpen()
 */
  
// LMP : Some annoying issues
// serial-handler.js
// npm install serialport-binding-webserialapi
// npm install @serialport/stream 
//import SerialPort from '@serialport/stream';
//import WSABinding from 'serialport-binding-webserialapi';
//import { ReadlineParser } from '@serialport/parser-readline';


const { serial } = require("web-serial-polyfill");

const espLoaderTerminal = {
  clean: function () {
    console.log("clean");
  },
  writeLine: function (data) {
    console.log(data);
  },
  write: function (data) {
    console.log(data);
  },
};
/**
 * Web Serial UART Handler Class
 * Provides interface for serial communication with callbacks and line buffering
 */
class WebSerialUART {
    constructor(options = {}) {
        this.port = null;
        this.reader = null;
        this.writer = null;
        this.readBuffer = '';
        this.isConnected = false;
        this.isReading = false;
        
        // Default options
        this.options = {
            baudRate: 9600,
            dataBits: 8,
            stopBits: 1,
            parity: 'none',
            flowControl: 'none',
            bufferSize: 255,
            ...options
        };
        
        // Callbacks
        this.onOpen = null;
        this.onClosed = null;
        this.onDisconnect = null;
        this.onDataReady = null;
        this.onError = null;
    }
    
    /**
     * Check if Web Serial API is supported
     */
    static isSupported() {
        // Serial API is supported in secure contexts (HTTPS) and in some browsers
        if ('serial' in navigator) {
            return true;

        }
        // USB API is supported in secure contexts (HTTPS) and in some browsers; use web-polyfill (Android)
        if ( 'usb' in navigator ) {
            return true;
        }
    }
    
    /**
     * Request and connect to a serial port
     */
    async connect() {
        try {
            if (!WebSerialUART.isSupported()) {
                throw new Error('Web Serial API not supported');
            }

            var isAndroid = /Android/i.test(navigator.userAgent);
            
            const data = await navigator.userAgentData.getHighEntropyValues(['platform']);
            var serialLib;

            // Android only has the polyfill
            if (isAndroid) {
                serialLib = serial;

            // Android but in desktop mode; only has polyfill
            } else if ((data.platform === "Linux") && !('hid' in navigator)) {
                serialLib = serial;
            
            // Desktop, prefer native if available
            } else if ('serial' in navigator) {
                serialLib = navigator.serial;

            // Fallback to polyfill if USB is available
            } else if ('usb' in navigator) {
                serialLib = serial;

            } else {
                alert("UART=" + (serialLib === navigator.serial ? "native" : "polyfill"));
                alert("UART=" + navigator.platform);
                alert("UART=" + navigator.userAgent);
                alert("UART=" + data.platform);
                alert("UART=" + ( ('hid' in navigator)? "HID" : "no HID"))   ;
                alert("UART=" + ('bluetooth' in navigator ? "Bluetooth" : "no Bluetooth"))   ;
                alert("UART=" + ('usb' in navigator ? "USB" : "no USB"))   ;
                alert("UART=" + ('serial' in navigator ? "Serial" : "no Serial"))   ;
                serialLib = serial;
            }
            // alert("UART=" + (serialLib === navigator.serial ? "native" : "polyfill"));

            // Request port from user
            // this.port = await navigator.serial.requestPort();
            this.port = await serialLib.requestPort();
            
            // Open the port with specified options
            await this.port.open({
                baudRate: this.options.baudRate,
                dataBits: this.options.dataBits,
                stopBits: this.options.stopBits,
                parity: this.options.parity,
                flowControl: this.options.flowControl
            });
            
            this.isConnected = true;
            this.writer = this.port.writable.getWriter();
            
            // Start reading
            this.startReading();
            
            // Call onOpen callback
            if (this.onOpen) {
                this.onOpen();
            }
            
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
    
    /**
     * Connect to a previously paired port
     */
    async connectToPairedPort(port) {
        try {
            this.port = port;
            
            await this.port.open({
                baudRate: this.options.baudRate,
                dataBits: this.options.dataBits,
                stopBits: this.options.stopBits,
                parity: this.options.parity,
                flowControl: this.options.flowControl
            });
            
            this.isConnected = true;
            this.writer = this.port.writable.getWriter();
            
            this.startReading();
            
            if (this.onOpen) {
                this.onOpen();
            }
            
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
    
    /**
     * Get list of previously paired ports
     */
    static async getPairedPorts() {
        if (!WebSerialUART.isSupported()) {
            return [];
        }
        return await navigator.serial.getPorts();
    }
    
    /**
     * Start reading from the serial port
     */
    async startReading() {
        if (!this.port || !this.isConnected || this.isReading) {
            return;
        }
        
        this.isReading = true;
        this.reader = this.port.readable.getReader();
        
        try {
            while (this.isReading && this.isConnected) {
                console.log("UART: wait for input");
                const { value, done } = await this.reader.read();
                console.log("UART:"+value);
                
                if (done) {
                    break;
                }
                
                // Convert Uint8Array to string
                const chunk = new TextDecoder().decode(value);
                this.readBuffer += chunk;
                console.log("UART:"+chunk);
                console.log("UART:"+this.readBuffer);
                
                // Process complete lines
                this.processBuffer();
            }
        } catch (error) {
            if (this.isConnected) {
                if (this.onError) {
                    this.onError(error);
                }
                if (this.onDisconnect) {
                    this.onDisconnect();
                }
            }
        } finally {
            if (this.reader) {
                this.reader.releaseLock();
                this.reader = null;
            }
            this.isReading = false;
        }
    }
    
    /**
     * Process the read buffer and extract complete lines
     */
    processBuffer() {
        let lineEndIndex;
        
        while ((lineEndIndex = this.findLineEnd()) !== -1) {
            // Extract complete line (without line ending)
            const line = this.readBuffer.substring(0, lineEndIndex);
            console.log("LINE:"+line);
            
            // Remove processed data from buffer (including line ending)
            const nextLineStart = this.skipLineEnding(lineEndIndex);
            this.readBuffer = this.readBuffer.substring(nextLineStart);
            
            // Call onDataReady callback with complete line
            if (this.onDataReady && line.length > 0) {

                this.onDataReady(line);
            }
        }
    }
    
    /**
     * Find the index of line ending (CR, LF, or CRLF)
     */
    findLineEnd() {
        const crIndex = this.readBuffer.indexOf('\r');
        const lfIndex = this.readBuffer.indexOf('\n');
        
        if (crIndex === -1 && lfIndex === -1) {
            return -1;
        }
        
        if (crIndex === -1) return lfIndex;
        if (lfIndex === -1) return crIndex;
        
        return Math.min(crIndex, lfIndex);
    }
    
    /**
     * Skip line ending characters and return next character position
     */
    skipLineEnding(lineEndIndex) {
        if (lineEndIndex >= this.readBuffer.length) {
            return this.readBuffer.length;
        }
        
        const char = this.readBuffer[lineEndIndex];
        
        if (char === '\r') {
            // Check for CRLF
            if (lineEndIndex + 1 < this.readBuffer.length && 
                this.readBuffer[lineEndIndex + 1] === '\n') {
                return lineEndIndex + 2;
            }
            return lineEndIndex + 1;
        } else if (char === '\n') {
            return lineEndIndex + 1;
        }
        
        return lineEndIndex + 1;
    }
    
    /**
     * Write a message to the serial port
     */
    async write(message) {
        if (!this.writer || !this.isConnected) {
            throw new Error('Not connected to serial port');
        }
        
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(message);
            await this.writer.write(data);
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
            throw error;
        }
    }
    
    /**
     * Write a line (message + line ending)
     */
    async writeLine(message, lineEnding = '\n') {
        return await this.write(message + lineEnding);
    }
    
    /**
     * Disconnect from the serial port
     */
    async disconnect() {
        this.isReading = false;
        this.isConnected = false;
        
        try {
            if (this.reader) {
                await this.reader.cancel();
                this.reader.releaseLock();
                this.reader = null;
            }
            
            if (this.writer) {
                this.writer.releaseLock();
                this.writer = null;
            }
            
            if (this.port) {
                await this.port.close();
                this.port = null;
            }
            
            if (this.onClosed) {
                this.onClosed();
            }
            
        } catch (error) {
            if (this.onError) {
                this.onError(error);
            }
        }
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isReading: this.isReading,
            hasPort: !!this.port,
            hasReader: !!this.reader,
            hasWriter: !!this.writer
        };
    }
    
    /**
     * Clear the read buffer
     */
    clearBuffer() {
        this.readBuffer = '';
    }
    
    /**
     * Get current buffer content
     */
    getBuffer() {
        return this.readBuffer;
    }
}

/**
 * Serial Port Manager - Helper class for managing multiple connections
 */
class SerialPortManager {
    constructor() {
        this.connections = new Map();
    }
    
    /**
     * Create a new UART connection with a unique ID
     */
    createConnection(id, options = {}) {
        if (this.connections.has(id)) {
            throw new Error(`Connection with ID '${id}' already exists`);
        }
        
        const uart = new WebSerialUART(options);
        this.connections.set(id, uart);
        
        // Set up disconnect handler to clean up
        const originalOnClosed = uart.onClosed;
        uart.onClosed = () => {
            this.connections.delete(id);
            if (originalOnClosed) {
                originalOnClosed();
            }
        };
        
        return uart;
    }
    
    /**
     * Get connection by ID
     */
    getConnection(id) {
        return this.connections.get(id);
    }
    
    /**
     * Remove connection by ID
     */
    async removeConnection(id) {
        const connection = this.connections.get(id);
        if (connection) {
            await connection.disconnect()
            this.connections.delete(id);
        }
    }
    
    /**
     * Get all connection IDs
     */
    getConnectionIds() {
        return Array.from(this.connections.keys());
    }
    
    /**
     * Disconnect all connections
     */
    async disconnectAll() {
        const promises = [];
        for (const connection of this.connections.values()) {
            promises.push(connection.disconnect());
        }
        await Promise.all(promises);
        this.connections.clear();
    }
}

// Usage example:
/*
// Create UART instance
const uart = new WebSerialUART({
    baudRate: 115200,
    dataBits: 8,
    stopBits: 1,
    parity: 'none'
});

// Set up callbacks
uart.onOpen = () => {
    console.log('Serial port opened');
};

uart.onClosed = () => {
    console.log('Serial port closed');
};

uart.onDisconnect = () => {
    console.log('Serial port disconnected');
};

uart.onDataReady = (line) => {
    console.log('Received line:', line);
};

uart.onError = (error) => {
    console.error('Serial error:', error);
};

// Connect to port
try {
    await uart.connect();
    
    // Send some data
    await uart.writeLine('Hello UART!');
    
} catch (error) {
    console.error('Connection failed:', error);
}
*/

class ScratchLinkWebSocket {
    constructor (type) {
        this._type = type;
        this._onOpen = null;
        this._onClose = null;
        this._onError = null;
        this._handleMessage = null;

        this._ws = null;
        this.wuart = null;
    }

    open () {
        switch (this._type) {
        case 'BLE':
            this._ws = new WebSocket('ws://127.0.0.1:20111/openblock/ble');
            break;
        case 'BT':
            this._ws = new WebSocket('ws://127.0.0.1:20111/openblock/bt');
            break;
        case 'SERIALPORT':
            this._ws = new WebSocket('ws://127.0.0.1:20111/openblock/serialport');
            break;
        case 'WSERIALPORT':
             console.log("LMP-Debug: webuart: Open!");
             try {
                // Create UART instance
                this.wuart = new WebSerialUART({
                    baudRate: 115200,
                    dataBits: 8,
                    stopBits: 1,
                    parity: 'none'
                });

                // Set up callbacks
                this.wuart.onOpen = () => {
                    console.log('LMP-DEBUG: Serial port opened, updating UI');

                    // Confirm to app were open
                    if (this._onOpen) this._onOpen();
                };

                this.wuart.onDisconnect = () => {
                    console.log('LMP-DEBUG: Serial port disconnected');
                    this.wuart.disconnect().then( () => { console.log('LMP-DEBUG: Serial port disconnected and closed'); } );

                    // Update App
                    this._onClose();
                };

                this.wuart.onClosed = () => {
                    console.log('LMP-DEBUG: Serial port closed');
                    this.wuart.disconnect().then( () => { console.log('LMP-DEBUG: Serial port disconnected and closed'); } );

                    // Update App
                    this._onClose();
                };

                // Connect to port
                try {
                    (async () => { 
                        console.log("LMP-DEBUG: Attempting a connection..."); 
                        const value = await this.wuart.connect(); 
                    })();
                } catch (error) {
                    console.error('Serial port couldnt be connected to:', error);
                }

             }catch (err) {
                console.error('There was an error connecting to the serial port:', err);
                throw new Error(`Unknown OpenblockLink art Type: ${this._type}`);
            }
            break;
        default:
            throw new Error(`Unknown OpenblockLink socket Type: ${this._type}`);
        }

        if( this.wuart ) {
            // NOTE: This should be state decode where we decide whatever it is the UART should be saying back, inc. uart stuffs
            this.wuart.onDataReady = (line) => {
                console.log('LMP-DEBUG: Received line:', line);

                // FIXME: Should be a FIFO with timeouts on each one, because i assume we could be getting events everywhere
                if( this._state === 'didDiscoverPeripheral' ) {
                    // First response is probably the echo back, string check waiting for Spot...
                    if( line.startsWith("Spot")) {
                        setTimeout(() => {
                            let json2 =  {"jsonrpc": "2.0", "method": "didDiscoverPeripheral", "params":{"peripheralId":0x001,"name": line,"rssi": -70}} ;
                            this._handleMessage(json2);
                        }, 100);
                        this._state = null;
                    }
                }

                if( this._state === 'write' || this._state === null ) {
                    // Send to the UI console
                    setTimeout(() => {
                        let uuencodedLine = btoa( line+"\n" );
                        let json2 =  {"jsonrpc": "2.0", "method": "onMessage", "params":{"message":uuencodedLine}} ;
                        this._handleMessage(json2);
                    }, 100);
                }

                // this._handleMessage(_json);
            };

        } else {

            if (this._onOpen && this._onClose && this._onError && this._handleMessage) {
                this._ws.onopen = this._onOpen;
                this._ws.onclose = this._onClose;
                this._ws.onerror = this._onError;
            } else {
                throw new Error('Must set open, close, message and error handlers before calling open on the socket');
            }
            this._ws.onmessage = this._onMessage.bind(this);
        }
        
    }

    close () {

        if( this.wuart ) {
            console.log("LMP-DEBUG: Close UART requested.");

            this.wuart.disconnect().then( () => { console.log('LMP-DEBUG: Serial port disconnected and closed'); } );
        } else {
            this._ws.close();
            this._ws = null;
        }
    }

    sendLineByLineEnded()
    {
        let json2 =  {"jsonrpc": "2.0", "method": "uploadSuccess", "params":{"peripheralId":0x000,"name": "EV3","rssi": -70}} ;
        this._handleMessage(json2);
    }

    sendLineByLine( linesArray )
    {
        if (linesArray.length === 0) {
            console.log("LMP-DEBUG: Sent whole program!");

            // Flag completion
            setTimeout(() => {
                // Close the program, then send UART restart message && RPC "Soft Restarting Board"
                this.wuart.writeLine( "f.close()\r\n" ).then( () => { 
                    // Send CTRL-D to restart board
                    this.wuart.writeLine( "\x04" ).then( () => { this.sendLineByLineEnded(); } );
                });
            }, 100);

            return;
        }

        // Wrap line
        let fwriteLine = 'f.write( r"' + linesArray[0] + '" + "\\r\\n" )' +"\r\n" ;
        console.log("LMP-DEBUG: Sending line:"+linesArray[0]);
        this.wuart.writeLine( fwriteLine ).then( () => { linesArray.shift() ; this.sendLineByLine( linesArray ); } );        
    }

    sendMessage (message) {
        const messageText = JSON.stringify(message);
        
        console.log("LMP-Debug: sendMessage->"+messageText);
        
        if(typeof message.method === 'string' && message.method === 'discover') {
            console.log("Discover message!")
            // json.method = true; // _handleRequest = moethod, _handleResponse=nope
//            let json =  {"jsonrpc": "2.0", "id": message.id, "result":null} ;           
//            this._handleMessage(json);

//            let json2 =  {"jsonrpc": "2.0", "method": "didDiscoverPeripheral", "params":{"peripheralId":0x000,"name": "EV3","rssi": -70}} ;
//            this._handleMessage(json2);

            setTimeout(() => {
                        let json =  {"jsonrpc": "2.0", "id": message.id, "result":null} ;           
                        this._handleMessage(json);
            }, 500);

            // Write to UART and obtain name; will report Micropyton name from machine.name
            this._state = 'didDiscoverPeripheral';
            (async () => { 
                console.log("LMP-DEBUG: Writing board ident python request!"); 
                const value = await this.wuart.writeLine('\x03import os ; print(os.uname().machine)\n\r\n'); 
                console.log("LMP-DEBUG: Write ident done, waiting delayed response event!");
            })();

            // Set timer, we reject the menu once we get something, timeout, they can reconnect and choose new one

        }
        debugger;
        if( this.wuart ) 
        {
        }
        else {
            this._ws.send(messageText);
        }

        if(typeof message.method === 'string' && message.method === 'connect') {
            setTimeout(() => {
                        let json =  {"jsonrpc": "2.0", "id": message.id, "result":null} ;           
                        this._handleMessage(json);
            }, 500);
        }

        if(typeof message.method === 'string' && message.method === 'read') {
            setTimeout(() => {
                        let json =  {"jsonrpc": "2.0", "id": message.id, "result":null} ;           
                        this._handleMessage(json);
            }, 500);
        }

        // We are expecting a response from the UART; so anything we get we will throw it back
        if(typeof message.method === 'string' && message.method === 'write') {
            const decodedString = atob(message.params.message);
            console.log(decodedString);

            this._state = 'write';

            // Send the line to the UART
            (async () => { console.log("LMP-DEBUG: Writing line to the uart"); const value = await this.wuart.writeLine(decodedString+'\n\r\n'); console.log("write done!:", value);  })();

            setTimeout(() => {
                        let json =  {"jsonrpc": "2.0", "id": message.id, "result":null} ;           
                        this._handleMessage(json);
            }, 500);
        }

        // Upload program to the board over uart
        if(typeof message.method === 'string' && message.method === 'upload') {
            const decodedString = atob(message.params.message);
            console.log(decodedString);

            const linesArray = decodedString.split('\n');
            

            // Send program to be written to the flash as "main.py"
            // insert initial file open.
            const fopenLine = 'f = open("main.py","w")\r\n' ;
            this.wuart.writeLine( fopenLine ).then( () => { this.sendLineByLine( linesArray ); } );

            setTimeout(() => {
                        let json =  {"jsonrpc": "2.0", "id": message.id, "result":null} ;           
                        this._handleMessage(json);
            }, 100);

        }


    }

    setOnOpen (fn) {
        this._onOpen = fn;
    }

    setOnClose (fn) {
        this._onClose = fn;
    }

    setOnError (fn) {
        this._onError = fn;
    }

    setHandleMessage (fn) {
        console.log("LMP-Debug: setHandleMessage->"+fn);
        debugger;
        this._handleMessage = fn;
    }

    isOpen () {
        if( this.wuart )
            return true;
        else
            return this._ws && this._ws.readyState === this._ws.OPEN;
    }

    _onMessage (e) {
        console.log( "#################################### onMessage!");
        debugger;

        const json = JSON.parse(e.data);
        this._handleMessage(json);
    }
}

module.exports = ScratchLinkWebSocket;
