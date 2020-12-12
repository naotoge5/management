const DB_NAME = 'management';
const DB_VERSION = 1;

function openDatabase() {
    let open = indexedDB.open(DB_NAME, DB_VERSION);
    open.onupgradeneeded = function (event) {
        upgrade(event);
    };
    return open;
}

function dc(date) {
    return date.replace('/', '年').replace('/', '月') + '日';
}

function upgrade(e) {
    console.log('version:' + e.oldVersion + ' to version:' + e.newVersion);
    let database = e.target.result;
    let diary = database.createObjectStore('diary', { keyPath: 'id', autoIncrement: true });
    diary.createIndex('date', 'date');
    diary.createIndex('start', 'start');
    diary.createIndex('finish', 'finish');
    diary.createIndex('details', 'details');
    diary.createIndex('wage', 'wage');
    diary.createIndex('option', 'option');
    let setting = database.createObjectStore('setting', { keyPath: 'id', autoIncrement: true });
    setting.createIndex('hourly', 'hourly');
    setting.put({ id: 1, hourly: 0 });
    let month_diary = database.createObjectStore('month_diary', { keyPath: 'month' });
    month_diary.createIndex('wage', 'wage');
    month_diary.createIndex('time', 'time');
    month_diary.createIndex('deduction', 'deduction');
    month_diary.createIndex('days', 'days');
    console.log('upgrade');
}

function writeDiary(e, diary) {
    let database = e.target.result;
    let transaction = database.transaction('diary', 'readwrite');
    let store = transaction.objectStore('diary');
    let write = store.add(diary);
    database.close();
    return write;
}

function updateDiary(e, diary) {
    let database = e.target.result;
    let transaction = database.transaction('diary', 'readonly');
    let store = transaction.objectStore('diary');
    let read = store.get(id);
    read.onsuccess = function () {
        let put = store.put(diary);
        put.onsuccess = function (event) {
            alert('更新が完了しました');
            window.location.reload();
        };
    }
}

function readDiary(e, id) {
    let database = e.target.result;
    let transaction = database.transaction('diary', 'readonly');
    let store = transaction.objectStore('diary');
    let read = store.get(id);
    database.close();
    return read;
}

/**
 *
 * @param {Number} year
 * @param {Number} month
 * @returns {IDBRequest<any[]>}
 */
function readMonthDiaries(e, year, month) {
    year -= month === 12 ? 1 : 0;
    let first = Date.parse(year + '/' + month + '/01');
    let last = Date.parse(new Date(year, month, 0).toDateString());
    let database = e.target.result;
    let transaction = database.transaction('diary');
    let store = transaction.objectStore('diary');
    let index = store.index('date');
    let range = IDBKeyRange.bound(first, last);
    return index.getAll(range);
}

/**
 *
 * @param {Number} year
 * @returns {IDBRequest<any[]>}
 */
function readYearDiaries(e, year) {
    let database = e.target.result;
    let transaction = database.transaction('diary');
    let store = transaction.objectStore('diary');
    let index = store.index('date');
    let range = IDBKeyRange.bound((year - 1) + '/12/01', year + '/11/30');
    return index.getAll(range);
}

/**
 *
 * @param {Number} hourly
 */
function updateSetting(e, hourly) {
    let database = e.target.result;
    let transaction = database.transaction('setting', 'readwrite');
    let store = transaction.objectStore('setting');
    let read = store.get(1)
    read.onsuccess = function () {
        let setting = read.result;
        setting.hourly = hourly;
        let write = store.put(setting);
        write.onsuccess = function (event) {
            alert('更新が完了しました');
            window.location.reload();
        };
    }
}

/**
 *
 * @returns {IDBRequest<any>|{setting: IDBRequest<any>, store: IDBObjectStore}}
 */
function readSetting(e) {
    let database = e.target.result;
    let transaction = database.transaction('setting', 'readonly');
    let store = transaction.objectStore('setting');
    let read = store.get(1)
    database.close();
    return read;
}

/**
 *
 * @param {String} type
 * @returns {string|number}
 */
function today(type) {
    let today = new Date();
    switch (type) {
        case 'YEAR':
            return today.getFullYear();
        case 'MONTH':
            return today.getMonth() + 1;
        case 'DATE':
            return today.getDate();
        case 'DAY':
            return today.getFullYear() + '-' + ("0" + (today.getMonth() + 1)).slice(-2) + '-' + ("0" + (today.getDate() + 1)).slice(-2);
    }
}

function setValue(type, num = 0) {
    let year;
    let month;
    switch (type) {
        case 'YEAR':
            year = parseInt($("#year strong").text()) + num;
            $("#year strong").text(year);
            break;
        case 'MONTH':
            month = parseInt($("#month strong").text()) + num;
            switch (month) {
                case 0:
                    $("#month strong").text(12);
                    break;
                case 13:
                    $("#month strong").text(1);
                    break;
                default:
                    $("#month strong").text(month);
            }
            break;
        default:
            year = today('YEAR');
            month = today('MONTH');
            year += (month === 12) ? 1 : 0;
            $("#year strong").text(year);
            $("#month strong").text(month);
            break;
    }
}

/**
 *
 * @returns {{month: Number, year: Number}}
 */
function getValue() {
    let year = Number($("#year strong").text());
    let month = Number($("#month strong").text());
    return { 'year': year, 'month': month };
}

//jQuery
$(function () {
    if ($("#index").length) {
        //load
        setValue('init');
        let open = openDatabase();
        open.onsuccess = function (event) {
            let value = getValue();
            let read = readMonthDiaries(event, value['year'], value['month']);
            read.onsuccess = function () {
                console.log(read.result);
            }
            read = readYearDiaries(event, value['year']);
            read.onsuccess = function () {

            }
        };

        //event
        $(".float-left").click(function () {
            $(".float-left").index(this) ? setValue('MONTH', -1) : setValue('YEAR', -1);
        })
        $(".float-right").click(function () {
            $(".float-right").index(this) ? setValue('MONTH', 1) : setValue('YEAR', 1);
        })
    }
    if ($("#new").length) {
        //load
        $("input[name='date']").val(today('DAY'));
        let open = openDatabase();
        open.onsuccess = function (event) {
            let read = readSetting(event);
            read.onsuccess = function () {
                if (read.result.hourly) {
                    $("input[name='hourly']").val(read.result.hourly);
                } else {
                    window.location.href = 'setting.html';
                }
            }
        }

        //event
        $("#submit").click(function () {
            let date = $("input[name='date']").val().replace(/-/g, '/');
            let start = $("input[name='start']").val();
            let finish = $("input[name='finish']").val();
            let time = new Date(date + ' ' + finish) - new Date(date + ' ' + start);
            if (time < 0) {
                alert('正確に時刻を入力してください');
            } else {
                let details = $("textarea[name=details]").val();
                let hourly = Number($("input[name=hourly]").val());
                let wage = Number((time / 60000) * hourly / 60);
                let message = '勤務日\n' + dc(date) + '\n勤務時間\n' + start + ' - ' + finish + '\n給与\n' + wage + '\nMemo\n' + details;

                let check = confirm(message);
                if (check) {
                    let open = openDatabase();
                    open.onsuccess = function (event) {
                        let diary = {
                            date: Date.parse(date),
                            start: start,
                            finish: finish,
                            details: details,
                            wage: wage,
                            option: { hourly: hourly }
                        };
                        let write = writeDiary(event, diary);
                        write.onsuccess = function () {
                            alert('登録しました');
                            window.location.href = 'index.html';
                        }
                        write.onerror = function () {
                            alert('もう一度お試しください');
                        }
                    }
                }
            }
        })
    }
    if ($("#setting").length) {
        let open = openDatabase();
        open.onsuccess = function (event) {
            let read = readSetting(event);
            read.onsuccess = function () {
                $("input[name='hourly']").val(read.result.hourly);
            }
        }

        $("#submit").click(function () {
            let hourly = Number($("input[name='hourly']").val());
            let open = openDatabase();
            open.onsuccess = function (event) {
                updateSetting(event, hourly);
            }
        })
    }
});
//$.getScript("./script.js");
//comment