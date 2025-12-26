// ==========================================
// Web Serial API - الاتصال بالأردوينو
// ==========================================

let port;
let reader;
let writer;
let isConnected = false;

// ==========================================
// عناصر الصفحة
// ==========================================

const connectBtn = document.getElementById('connectBtn');
const statusIndicator = document.getElementById('statusIndicator');
const sendLetterBtn = document.getElementById('sendLetterBtn');
const sendWordBtn = document.getElementById('sendWordBtn');
const sendManualBtn = document.getElementById('sendManualBtn');
const letterInput = document.getElementById('letterInput');
const wordInput = document.getElementById('wordInput');
const manualInput = document.getElementById('manualInput');
const logContainer = document.getElementById('logContainer');
const clearLogBtn = document.getElementById('clearLogBtn');

// ==========================================
// الاتصال بالأردوينو
// ==========================================

connectBtn.addEventListener('click', async () => {
    if (!isConnected) {
        await connectToArduino();
    } else {
        await disconnectFromArduino();
    }
});

async function connectToArduino() {
    try {
        // طلب المنفذ التسلسلي
        port = await navigator.serial.requestPort();
        
        // فتح المنفذ بسرعة 9600
        await port.open({ baudRate: 9600 });
        
        // إعداد القارئ والكاتب
        const textDecoder = new TextDecoderStream();
        const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
        reader = textDecoder.readable.getReader();
        
        const textEncoder = new TextEncoderStream();
        const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
        writer = textEncoder.writable.getWriter();
        
        isConnected = true;
        updateConnectionStatus(true);
        addLog('✅ متصل', 'success');
        
        // قراءة البيانات من الأردوينو
        readFromArduino();
        
    } catch (error) {
        console.error('خطأ في الاتصال:', error);
        addLog('❌ فشل الاتصال: ' + error.message, 'error');
    }
}

async function disconnectFromArduino() {
    try {
        if (reader) {
            await reader.cancel();
            await reader.releaseLock();
        }
        
        if (writer) {
            await writer.close();
        }
        
        if (port) {
            await port.close();
        }
        
        isConnected = false;
        updateConnectionStatus(false);
        addLog('⚠️ غير متصل', 'error');
        
    } catch (error) {
        console.error('خطأ في قطع الاتصال:', error);
    }
}

// ==========================================
// قراءة البيانات من الأردوينو
// ==========================================

async function readFromArduino() {
    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            // لا نعرض ردود الأردوينو في السجل
        }
    } catch (error) {
        console.error('خطأ في القراءة:', error);
    }
}

// ==========================================
// إرسال البيانات للأردوينو
// ==========================================

async function sendToArduino(data) {
    if (!isConnected) {
        addLog('❌ غير متصل! قم بالاتصال أولاً', 'error');
        return;
    }
    
    try {
        await writer.write(data + '\n');
        // عرض فقط الحروف والكلمات المرسلة
        addLog('📤 ' + data, 'success');
    } catch (error) {
        console.error('خطأ في الإرسال:', error);
        addLog('❌ فشل الإرسال', 'error');
    }
}

// ==========================================
// معالجات الأزرار
// ==========================================

sendLetterBtn.addEventListener('click', () => {
    const letter = letterInput.value.toUpperCase().trim();
    
    if (!letter) {
        addLog('⚠️ أدخل حرفاً أولاً!', 'error');
        return;
    }
    
    if (letter.length > 1) {
        addLog('⚠️ أدخل حرفاً واحداً فقط!', 'error');
        return;
    }
    
    if (!/^[A-Z]$/.test(letter)) {
        addLog('⚠️ أدخل حرفاً إنجليزياً فقط (A-Z)!', 'error');
        return;
    }
    
    sendToArduino(letter);
    letterInput.value = '';
});

sendWordBtn.addEventListener('click', () => {
    const word = wordInput.value.toUpperCase().trim();
    
    if (!word) {
        addLog('⚠️ أدخل كلمة أولاً!', 'error');
        return;
    }
    
    if (!/^[A-Z]+$/.test(word)) {
        addLog('⚠️ أدخل أحرفاً إنجليزية فقط (A-Z)!', 'error');
        return;
    }
    
    sendToArduino(word);
    wordInput.value = '';
});

sendManualBtn.addEventListener('click', () => {
    const command = manualInput.value.trim();
    
    if (!command) {
        addLog('⚠️ أدخل أمراً أولاً!', 'error');
        return;
    }
    
    sendToArduino(command);
    manualInput.value = '';
});

// السماح بالإرسال عند الضغط على Enter
letterInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendLetterBtn.click();
    }
});

wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendWordBtn.click();
    }
});

manualInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendManualBtn.click();
    }
});

// ==========================================
// الأوامر السريعة
// ==========================================

function sendQuickCommand(command) {
    if (!isConnected) {
        addLog('❌ غير متصل! قم بالاتصال أولاً', 'error');
        return;
    }
    sendToArduino(command);
}

// ==========================================
// النقر على بطاقات الحروف
// ==========================================

document.querySelectorAll('.letter-badge').forEach(badge => {
    badge.addEventListener('click', () => {
        const letter = badge.textContent.trim();
        if (!isConnected) {
            addLog('❌ غير متصل! قم بالاتصال أولاً', 'error');
            return;
        }
        sendToArduino(letter);
    });
});

// ==========================================
// تحديث حالة الاتصال
// ==========================================

function updateConnectionStatus(connected) {
    if (connected) {
        statusIndicator.classList.add('connected');
        statusIndicator.querySelector('.status-text').textContent = 'متصل';
        connectBtn.textContent = 'قطع الاتصال';
        connectBtn.classList.remove('btn-primary');
        connectBtn.classList.add('btn-clear');
    } else {
        statusIndicator.classList.remove('connected');
        statusIndicator.querySelector('.status-text').textContent = 'غير متصل';
        connectBtn.textContent = 'الاتصال بالأردوينو';
        connectBtn.classList.remove('btn-clear');
        connectBtn.classList.add('btn-primary');
    }
}

// ==========================================
// إضافة سجل
// ==========================================

function addLog(message, type = 'info') {
    // إزالة رسالة "لا توجد رسائل"
    const emptyMessage = logContainer.querySelector('.log-empty');
    if (emptyMessage) {
        emptyMessage.remove();
    }
    
    // إنشاء عنصر السجل
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    
    const logMessage = document.createElement('span');
    logMessage.className = 'log-message';
    logMessage.textContent = message;
    
    const logTime = document.createElement('span');
    logTime.className = 'log-time';
    const now = new Date();
    logTime.textContent = now.toLocaleTimeString('ar-SA');
    
    logEntry.appendChild(logMessage);
    logEntry.appendChild(logTime);
    
    // إضافة في الأعلى
    logContainer.insertBefore(logEntry, logContainer.firstChild);
    
    // الحد الأقصى 50 رسالة
    const entries = logContainer.querySelectorAll('.log-entry');
    if (entries.length > 50) {
        entries[entries.length - 1].remove();
    }
}

// ==========================================
// مسح السجل
// ==========================================

clearLogBtn.addEventListener('click', () => {
    logContainer.innerHTML = '<p class="log-empty">لا توجد رسائل بعد...</p>';
});

// ==========================================
// التحقق من دعم Web Serial API
// ==========================================

if (!('serial' in navigator)) {
    connectBtn.disabled = true;
    connectBtn.textContent = 'المتصفح غير مدعوم';
    addLog('❌ استخدم Chrome أو Edge', 'error');
}

// ==========================================
// رسالة ترحيبية
// ==========================================

window.addEventListener('load', () => {
    if ('serial' in navigator) {
        addLog('👋 اضغط "الاتصال بالأردوينو" للبدء', 'info');
    }
});
