/* =====================================================
   Логика калькулятора корма для слонов
   Требования ТЗ: 4 типа ошибок, журнал в localStorage,
   кнопка очистки журнала.
   ===================================================== */

"use strict";

// --- Ключ localStorage и ссылки на элементы страницы ---

const STORAGE_KEY = "elephantFeedLog";

const form           = document.getElementById("calc-form");
const input          = document.getElementById("weight-input");
const errorMessage   = document.getElementById("error-message");
const resultBox      = document.getElementById("result-box");
const resultText     = document.getElementById("result-text");
const logList        = document.getElementById("log-list");
const clearLogButton = document.getElementById("clear-log-button");

// --- Тексты ошибок (строго по ТЗ) ---

const ERR_EMPTY      = "[пусто пиши что то]";
const ERR_NOT_NUMBER = "[не то смотри внимательнее]";
const ERR_ZERO       = "[0 ты чего]";
const ERR_NEGATIVE   = "[отрицательные не знаем]";

// --- Проверка ввода. Возвращает "" если всё хорошо, иначе текст ошибки ---

function validate(raw) {
    if (raw.trim() === "") {
        return ERR_EMPTY;
    }

    // Важно: сначала строгое приведение, потом сравнение с 0
    const value = Number(raw.trim());

    if (Number.isNaN(value)) {
        return ERR_NOT_NUMBER;
    }
    if (value === 0) {
        return ERR_ZERO;
    }
    if (value < 0) {
        return ERR_NEGATIVE;
    }

    return "";
}

// --- Сам расчёт: слон ест ~6% своего веса в сутки ---

function calculateFeed(weight) {
    const total  = weight * 0.06;               // всего корма, кг
    const rough  = total * 0.7;                 // сено и трава
    const juicy  = total * 0.3;                 // овощи и фрукты

    return {
        total: total.toFixed(1),
        rough: rough.toFixed(1),
        juicy: juicy.toFixed(1)
    };
}

// --- Форматирование времени для журнала ---

function formatTime(date) {
    const pad = (n) => String(n).padStart(2, "0");
    return (
        pad(date.getDate()) + "." + pad(date.getMonth() + 1) + "." +
        date.getFullYear() + " " +
        pad(date.getHours()) + ":" + pad(date.getMinutes()) + ":" +
        pad(date.getSeconds())
    );
}

// --- Журнал: чтение / запись / отрисовка ---

function loadLog() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
}

function saveLog(log) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (e) {
        // Если localStorage недоступен — журнал просто не сохранится
    }
}

// Отрисовка только ОДНОЙ новой записи (добавляется вниз списка)
function appendLogEntry(entry) {
    const li = document.createElement("li");
    li.className = "log-item";

    // textContent вместо innerHTML — защита от XSS
    const timeEl = document.createElement("div");
    timeEl.className = "log-time";
    timeEl.textContent = entry.time;

    const dataEl = document.createElement("div");
    dataEl.textContent = "Введено: " + entry.input + " кг";

    const resultEl = document.createElement("div");
    resultEl.className = "log-result";
    resultEl.textContent = "Итог: " + entry.result;

    li.append(timeEl, dataEl, resultEl);
    logList.appendChild(li); // вниз, старые записи не трогаем
}

function renderLog() {
    logList.innerHTML = "";
    loadLog().forEach(appendLogEntry);
}

// --- Показ ошибок и результата ---

function showError(text) {
    errorMessage.textContent = text;
    errorMessage.hidden = false;
    input.classList.add("invalid");
    resultBox.hidden = true;
}

function clearError() {
    errorMessage.textContent = "";
    errorMessage.hidden = true;
    input.classList.remove("invalid");
}

function showResult(text) {
    resultText.textContent = text;
    resultBox.hidden = false;
}

// --- Главный обработчик формы ---

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const raw = input.value;
    const error = validate(raw);

    if (error) {
        showError(error);
        return;
    }

    clearError();

    const weight = Number(raw.trim());
    const feed = calculateFeed(weight);

    const resultMessage =
        "Слон весом " + weight + " кг съедает около " + feed.total +
        " кг корма в сутки:\n" +
        "• сено и трава — " + feed.rough + " кг\n" +
        "• овощи и фрукты — " + feed.juicy + " кг";

    showResult(resultMessage);

    // Записываем в журнал и добавляем запись вниз списка
    const entry = {
        time: formatTime(new Date()),
        input: raw.trim(),
        result: "корм ≈ " + feed.total + " кг/сутки"
    };

    const log = loadLog();
    log.push(entry);
    saveLog(log);
    appendLogEntry(entry);
});

// --- Кнопка очистки журнала ---

clearLogButton.addEventListener("click", function () {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        // игнорируем, журнал уже очищен на экране
    }
    logList.innerHTML = "";
});

// --- Восстановление журнала после F5 ---

document.addEventListener("DOMContentLoaded", renderLog);
