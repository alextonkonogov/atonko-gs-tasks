//Получаем доступ к таблице по ссылке с уникальным идентификатором
var tasklist = SpreadsheetApp.openByUrl("");
//Получаем доступ к странице по ее имени
var tasks = tasklist.getSheetByName("tasks");

//Стандартная функция Google Apps Script для прослушивания входящих запросов, отправленных методом POST
function doPost (e) {
    var operation = e.parameter.action;//получаем параметр "action"

    switch (operation) {

        case "addTask": return addTask (e);
        case "deleteTask": return deleteTask (e);
        case "updateTask": return updateTask (e);

    }

}

//Стандартная функция Google Apps Script для прослушивания входящих запросов, отправленных методом GET
function doGet (e) {
    var operation = e.parameter.action;//получаем параметр "action"

    switch (operation) {

        case "getTasks": return getTasks ();

    }

}

//Функция, отвечающая за получение строк и отправку данных клиенту
function getTasks () {
    var lastrow = tasks.getLastRow();//получаем номер последней строки в таблице
    var data = tasks.getRange("A1:C" + lastrow).getValues();//получаем массив указанных колонок
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);//возвращает в ответ записанные данные в JSON формате
}


//Функция, отвечающая за добавление новых задач
function addTask (e) {
    var dateTime = Utilities.formatDate(new Date(), "GMT+4", "dd.MM.yyy HH:mm:ss");//определяем дату в нужном формате и часовом поясе
    var task = e.parameter.task;//получаем название задачи в переданном параметре
    var status = 0; //ноль будет обозначать статус "ожидает", так как при создании задачи, она не может быть уже выполненной
    if (String(task).trim() == "") {
        return ContentService.createTextOutput('Описание задачи не может быть пустым! Попробуй еще раз');
    }

    tasks.appendRow([dateTime,task,status]); //обращаемся к нашей странице “tasks” определяем крайнюю свободную строку и вставляем полученные значения. Аналогично INSERT.
    return ContentService.createTextOutput('Задача успешно добавлена!');//возвращает в ответ текстовое сообщение об успехе
}


//Функция, отвечающая за удаление задач
function deleteTask (e) {
    var task = e.parameter.task;//получаем название задачи в переданном параметре
    var lastrow = tasks.getLastRow();//получаем номер последней строки в таблице
    var array = tasks.getRange("B1:B" + lastrow).getValues();//получаем массив указанных ячеек колонки, в которой будем искать соответствие

    for (var i = 0; i <= array.length; i++) {
        if (array[i] == task) {//если элемент соответствует искомому в массиве, то...
            tasks.deleteRow(i+1);//обращаемся к нашей странице “tasks” и удаляем строку, в которой было найдено совпадение. Прибавляем единичку, т.к. это был массив и у него нумерация идет с нуля...
            break;//завершаем цикл, т.к. мы нашли что искали и сделали, что хотели
        }
    }

    return ContentService.createTextOutput("Задача успешно удалена!");
}

//Функция, отвечающая за обновление задач
function updateTask (e) {
    var task = e.parameter.task;//получаем название задачи в переданном параметре
    var newValue = e.parameter.newValue;//получаем новое значение в переданном параметре
    var where = e.parameter.where;//получаем название колонки, в которой будем заменять старое значение новым
    var lastrow = tasks.getLastRow();//получаем номер последней строки в таблице

    switch(where){
        case "task":
            var col = "B";
            break;
        case "status":
            var col = "C";
            break;
    }

    var array = tasks.getRange("B1:B" + lastrow).getValues();//получаем массив указанных ячеек колонки, в которой будем искать соответствие

    for (var i = 0; i <= array.length; i++) {//запускаем цикл по массиву
        if (array[i] == task) {//если элемент соответствует искомому, то...
            tasks.getRange(col + (i+1)).setValue(newValue);//обращаемся к нашей странице “tasks” и обновляем нужную колонку, в которой было найдено совпадение
            break;//завершаем цикл, т.к. мы нашли что искали и сделали, что хотели
        }
    }

    return ContentService.createTextOutput("Задача успешно обновлена!");
}