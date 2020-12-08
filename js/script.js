const DB_NAME = 'management';
const DB_VERSION = 1;

function getRequest() {
    let request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = function (event) {
        upgrade(event);
    };
    return request;
}

function dc(date) {
    return date.replace('/', '年').replace('/', '月') + '日';
}

function upgrade(e) {
    console.log('version:' + e.oldVersion + ' to version:' + e.newVersion);
    let database = e.target.result;
    let diary = database.createObjectStore('diary', {keyPath: 'id', autoIncrement: true});
    diary.createIndex('date', 'date');
    diary.createIndex('start', 'start');
    diary.createIndex('finish', 'finish');
    diary.createIndex('details', 'details');
    diary.createIndex('wage', 'wage');
    diary.createIndex('option', 'option');
    let setting = database.createObjectStore('setting', {keyPath: 'id', autoIncrement: true});
    setting.createIndex('hourly', 'hourly');
    setting.put({id: 1, hourly: 0});
    console.log('upgrade');
}

function writeDiary(e, report) {
    let database = e.target.result;
    let transaction = database.transaction('diary', 'readwrite');
    let store = transaction.objectStore('diary');
    let add = store.add(report);
    add.onsuccess = function () {
        alert('更新しました')
    }
    database.close();
}

function updateDiary() {

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
    let data = readSetting(e, 'readwrite');
    data['setting'].onsuccess = function () {
        let setting = data['setting'].result;
        setting.hourly = hourly;
        let put = data['store'].put(setting);
        put.onsuccess = function (event) {
            alert('更新が完了しました');
            window.location.reload();
        };
    }
}

/**
 *
 * @param {String} type 'readonly' or 'readwrite'
 * @returns {IDBRequest<any>|{setting: IDBRequest<any>, store: IDBObjectStore}}
 */
function readSetting(e, type) {
    let database = e.target.result;
    let transaction = database.transaction('setting', type);
    let store = transaction.objectStore('setting');
    let get = store.get(1)
    database.close();
    switch (type) {
        case 'readonly':
            return get;
        case 'readwrite':
            return {'setting': get, 'store': store}
    }

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
    return {'year': year, 'month': month};
}


//jQuery
$(function () {
    if ($("#index").length) {
        //load
        setValue('init');
        let request = getRequest();
        request.onsuccess = function (event) {
            let value = getValue();
            let month_diaries = readMonthDiaries(event, value['year'], value['month']);
            month_diaries.onsuccess = function () {
                console.log(month_diaries.result);
            }
            let year_diaries = readYearDiaries(event, value['year']);
            year_diaries.onsuccess = function () {

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
        let request = getRequest();
        request.onsuccess = function (event) {
            let setting = readSetting(event, 'readonly');
            setting.onsuccess = function () {
                if (setting.result.hourly) {
                    $("input[name='hourly']").val(setting.result.hourly);
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
                let hourly = $("input[name=hourly]").val();
                let wage = (time / 60000) * hourly / 60;
                let message = '勤務日\n' + dc(date) + '\n勤務時間\n' + start + ' - ' + finish + '\n給与\n' + wage + '\nMemo\n' + details;

                let check = confirm(message);
                if (check) {
                    let request = getRequest();
                    request.onsuccess = function (event) {
                        let report = {
                            date: Date.parse(date),
                            start: start,
                            finish: finish,
                            details: details,
                            wage: wage,
                            option: {hourly: hourly}
                        };
                        writeDiary(event, report);
                        window.location.href = 'index.html';
                    }
                }
            }
        })
    }
    if ($("#setting").length) {
        let request = getRequest();
        request.onsuccess = function (event) {
            let setting = readSetting(event, 'readonly');
            setting.onsuccess = function () {
                $("input[name='hourly']").val(setting.result.hourly);
            }
        }

        $("#submit").click(function () {
            let hourly = $("input[name='hourly']").val();
            let request = getRequest();
            request.onsuccess = function (event) {
                updateSetting(event, hourly);
            }
        })
    }
});