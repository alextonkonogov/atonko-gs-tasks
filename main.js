var myApp = "";//URL нашего приложения
var tasks = "";//уникальный идентификатор нашей таблицы

$( document ).ready(function() {//функция запускается, как только страница будет готова для просмотра пользователю
	loadTasks ();//запускаем функцию для получения списка задач
	
	$('#taskListForm').on('change', function(e){
	    loadTasks ();
	});

	$('#commonModal').on('hidden.bs.modal', function (e) {
		$('.modal-title, .modal-body, .modal-footer, .alert-area').html('');
	})

});

function loadTasks () {
	var where = ($('#onlyInLine').prop('checked')) ? `WHERE C = 0` : ``;
	googleQuery (tasks, '0', 'A:C', `SELECT * ${where} ORDER BY A LIMIT 100`);
	//Эту функцию создал я для удобства. Она принимает следующие параметры по порядку:
	//1. Уникальный идентификатор таблицы;
	//2. Числовой идентификатор листа. По умолчанию у первого листа таблицы после ее создания он равен нулю. 
	//   При создании других листов генерируется 8-ми значный числовой идентификатор. 
	//   Увидеть его можно в адресной строке в параметре "gid" (например, "gid=99808602").
	//3. Столбцы, в которых будет осуществляться поиск согласно запросу.
	//4. Текст запроса в SQL-подобном формате. Обратите внимание, что формат все-таки отличается от SQL.
}

function googleQuery (sheet_id, sheet, range, query) {
	google.charts.load('45', {'packages':['corechart']});//загружаем библиотеку Google Charts
	google.charts.setOnLoadCallback (queryTable);//обозначаем, какая функция будет запущена по готовности библиотеки

	function queryTable () {
		//объект с настройками
		var opts = {sendMethod: 'auto'};
		//сама функция, выполняющая запрос к таблице
		var gquery = new google.visualization.Query(`https://docs.google.com/spreadsheets/d/${sheet_id}/gviz/tq?gid=${sheet}&range=${range}&headers=1&tq=${query}`, opts);
		//обозначаем, какая функция будет запущена при получении результатов
		gquery.send (callback);
	}

	function callback (e) {
		if (e.isError () ) {
			console.log(`Error in query: ${e.getMessage ()} ${e.getDetailedMessage ()}`);
			return;
		}//если ошибка, то записываем ее в консоль

		var data = e.getDataTable ();//если ошибки нет, то формируем данные для дальнейшей работы
		tasksTable (data); //передаем их в функцию, которая обработает данные и сформирует из них нашу таблицу
	}
}

function getTasks () {
	var action = "getTasks";
	var url = myApp+"?action="+action

	//подготавливаем и выполняем GET запрос
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
        	//в случае успеха преобразуем полученный ответ в JSON и передаем отдельной функции, которая сформирует нам таблицу
        	var data = JSON.parse(xhr.response);
        	tasksTable (data);
        }
    };
    try { xhr.send(); } catch (err) {console.log(err) }
}


//функция, которая обработает данные, полученные при выполнении запроса и сформирует из них таблицу
function tasksTable (data) {
	$('#tasksTableDiv').html(function(){
		//внутри объекта data находятся еще два объекта:
		//Sf - хранит в себе данные из первой строки таблицы, принимая их за заголовки
		//Tf - хранит в себе данные строк таблицы в виде массива
		
		var th = ``;
		for (i = 0; i < data.Sf.length; i++){
			//формируем заголовки таблицы
			th += `<th>${data.Sf[i].label}</th>`;
		}

		th =`<tr>${th}<th>Удалить</th></tr>`;

		var tr = '';
		for ( i = 0; i < data.Tf.length; i++ ) {
			var status = ( data.Tf[i].c[2].v == 0 ) ? `В очереди` : `Выполнена`;
			var color = ( data.Tf[i].c[2].v == 1 ) ? `class="table-success"` : ``;
			//внутри "c" (content) может содержаться два значения:
			//v - само значение (value)
			//f - значение в форматированном виде. Время мы будем брать именно отсюда
			
			//формируем содержание таблицы
			tr += `<tr ${color}>
						<td class="align-middle">${data.Tf[i].c[0].f}</td>
						<td class="align-middle text-left">${data.Tf[i].c[1].v}</td>
						<td class="align-middle"><button type="button" class="btn btn-link" onclick="updateTaskModal('${data.Tf[i].c[1].v}', '${data.Tf[i].c[2].v}', 'status')">${status}</button></td>
						<td class="align-middle"><button type="button" class="btn btn-link" onclick="deleteTask('${data.Tf[i].c[1].v}')">Удалить</button></td>
					</tr>`;
		}
		//формируем и возвращаем готовую таблицу
		return `<table class="table text-center"><thead>${th}</thead><tbody>${tr}</tbody></table>`;
	})
}


function addTaskModal() {
	var title = `Новая задача`;

	var form = `<form id="addTaskForm" onsubmit="return false;">
	              <div class="form-group">
	                <label for="task">Задача</label>
	                <input id="task" name="task" class="form-control form-control-sm" type="text">
	              </div>
	            </form>`;

	var buttons = `<button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>
            	   <button type="button" class="btn btn-success" onclick="addTask()">Сохранить</button>`;


	$('#commonModal .modal-header .modal-title').html(title);
	$('#commonModal .modal-body').html(form);
	$('#commonModal .modal-footer').html(buttons);
	$('#commonModal').modal('show');
}

function addTask () {
	var task = $('#task').val();
	var action = "addTask";
	var xhr = new XMLHttpRequest();
	var body = `task=${encodeURIComponent(task)}&action=${encodeURIComponent(action)}`;
	xhr.open("POST", myApp, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
        	$('#commonModal .alert-area').html(`<div class="alert alert-success" role="alert">${xhr.response}</div>`);
        	document.getElementById("addTaskForm").reset();//сбрасываем форму
			loadTasks ();//обновляем список задач
        }
    };
	try { xhr.send(body);} catch (err) {console.log(err) }
}

function deleteTask (task) {
	var action = "deleteTask";
	var xhr = new XMLHttpRequest();
	var body = `task=${encodeURIComponent(task)}&action=${encodeURIComponent(action)}`;
	xhr.open("POST", myApp, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
        	alert(xhr.response);
			loadTasks ();//обновляем список задач
        }
    };
	try { xhr.send(body);} catch (err) {console.log(err) }
}

function updateTaskModal(task, currentValue, where) {
	var title = `Редактировать задачу`;

	switch (where) {
		case "status":
			var input = `<div class="form-group">
			                <label for="status">Статус</label>
			                <select id="status" name="status" class="form-control form-control-sm">
			                	<option value="0" ${isSelected(currentValue, 0)}>В очереди</option>
			                	<option value="1" ${isSelected(currentValue, 1)}>Выполнена</option>
			                </select>
			            </div>`;
			break;
	}

	var form = `<form id="updateTaskForm" onsubmit="return false;">${input}</form>`;
	var buttons = `<button type="button" class="btn btn-secondary" data-dismiss="modal">Отмена</button>
            	   <button type="button" class="btn btn-success" onclick="updateTask('${task}', '${where}')">Сохранить</button>`;


	$('#commonModal .modal-header .modal-title').html(title);
	$('#commonModal .modal-body').html(form);
	$('#commonModal .modal-footer').html(buttons);
	$('#commonModal').modal('show');
}

function isSelected(currentValue, value) {
	if (currentValue == value) return `selected`;
}

function updateTask(task, where) {
	var action = "updateTask";

	switch (where) {
		case "status":
			var newValue = $('#status').val();
			break;
	}
	
	var xhr = new XMLHttpRequest();
	var body = `task=${encodeURIComponent(task)}&where=${encodeURIComponent(where)}&newValue=${encodeURIComponent(newValue)}&action=${encodeURIComponent(action)}`;

	xhr.open("POST", myApp, true);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
			$('#commonModal .alert-area').html(`<div class="alert alert-success" role="alert">${xhr.response}</div>`);
			loadTasks ();//обновляем список задач
        }
    };
	try { xhr.send(body);} catch (err) {console.log(err) }

}