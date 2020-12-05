const DB_NAME = 'management';
const DB_VERSION = 1;
//jQuery
$(function () {
    if ($("#index").length) {
        $("#year .plate").val(today('YEAR'));
        $("#month .plate").val(today('MONTH'));
        let request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function (e) {
            upgrade(e);
        };
        request.onsuccess = function (e) {
            let response = readMonthReports(e);
            response.onsuccess = function (e) {
                let data = e.target.result;
                console.log(data);
            }
        };
    }
    if ($("#new").length) {
        let year = today('YEAR');
        let month = ("0" + today('MONTH')).slice(-2);
        let day = ("0" + today('DATE')).slice(-2);
        let date = year + '-' + month + '-' + day;
        $("input[name='date']").val(date);

        $("#entry").click(function (e) {
            let date = $("input[name='date']").val().replace(/-/g, '/');
            let start = $("input[name='start']").val();
            let finish = $("input[name='finish']").val();
            let details = $("textarea[name=details]").val();
            let message = '勤務日\n' + dc(date) + '\n勤務時間\n' + start + ' - ' + finish + '\nMemo\n' + details;

            let check = confirm(message);
            if (check) {
                let request = indexedDB.open(DB_NAME, DB_VERSION);
                request.onupgradeneeded = function (e) {
                    upgrade(e);
                };
                request.onsuccess = function (e) {
                    let report = {
                        date: Date.parse(date),
                        start: start,
                        finish: finish,
                        details: details,
                        option: null
                    };
                    insertReport(e, report);
                    window.location.href = 'index.html';
                }
            }
        })
    }

});

function dc(date) {
    return date.replace('/', '年').replace('/', '月') + '日';
}

function upgrade(e) {
    console.log('version:' + e.oldVersion + ' to version:' + e.newVersion);
    let database = e.target.result;
    let report = database.createObjectStore('report', {keyPath: 'id', autoIncrement: true})
    report.createIndex('date', 'date');
    report.createIndex('start', 'start');
    report.createIndex('finish', 'finish');
    report.createIndex('details', 'details');
    report.createIndex('option', 'option');
    console.log('database-upgrade!');
    database.close();
}

function insertReport(e, report) {
    let database = e.target.result;
    let transaction = database.transaction('report', 'readwrite');
    let report_store = transaction.objectStore('report');
    report_store.add(report);
    transaction.oncomplete = function (event) {
        console.log('inserted!');
    };
    transaction.onerror = function (event) {
        console.log('error!');
    };
    database.close();
}

function readYearReports(e) {
    let database = e.target.result;
    let transaction = database.transaction('report');
    let report_store = transaction.objectStore('report');
    let request = report_store.getAll();
    request.onerror = function (event) {
        // エラー処理!
    };
    request.onsuccess = function (event) {
        // request.result に対して行う処理!
    };
}

function readMonthReports(e) {
    let database = e.target.result;
    let transaction = database.transaction('report');
    let report_store = transaction.objectStore('report');
    let index = report_store.index('date');
    let range = IDBKeyRange.bound(Date.parse('2020/12/01'), Date.parse('2020/12/31'));
    return index.getAll(range);
}

function today(type) {
    let today = new Date();
    switch (type) {
        case 'YEAR':
            return today.getFullYear();
        case 'MONTH':
            return today.getMonth() + 1;
        case 'DATE':
            return today.getDate();
    }
}

function tapNext(tag, num) {
    $(tag).text(parseInt($(tag).text()) + num);
}