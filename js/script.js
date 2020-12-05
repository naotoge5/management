const DB_NAME = 'management';
const DB_VERSION = 1;
//　DB名を指定して接続
let request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = function (event) {
    // クライアントがデータベースを持っていない場合にトリガーされます
    // ...初期化を行います...
    const DB = event.result;
    const report = DB.createObjectStore('report', {keyPath: 'id', autoIncrement: true})
    report.createIndex('date', 'date');
    report.createIndex('start', 'start');
    report.createIndex('finish', 'finish');
    report.createIndex('details', 'details');

    console.log('db upgrade');
};

request.onerror = function () {
    console.error("Error", request.error);
};

request.onsuccess = function () {
    let db = request.result;
    // db オブジェクトを仕様してデータベースを操作します
};

//jQuery
$(function () {

});