var SCRIPT_PROP = PropertiesService.getScriptProperties();
var SPREADSHEET_NAME = 'Bookmarks';

function getScriptUrl() {
 var url = ScriptApp.getService().getUrl();
 return url;
}

function doGet(e) {
  setup();
  return HtmlService.createTemplateFromFile('index').evaluate().setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}

function setup() {
  var sheet = null;
  var fileId = null;
  var index = null;
  var file = DriveApp.getFilesByName(String(SCRIPT_PROP.getProperty('SPREADSHEET_NAME')));
  
  if(file.hasNext() == false) {
    sheet = SpreadsheetApp.create(SPREADSHEET_NAME);
    index = 0;
  } else {
    sheet = file.next();
    index = SpreadsheetApp.openById(sheet.getId()).getSheets()[0].getLastRow();
  }
  fileId = sheet.getId();
  
  SCRIPT_PROP.setProperty('ID', fileId);
  SCRIPT_PROP.setProperty('SPREADSHEET_NAME', SPREADSHEET_NAME);
  SCRIPT_PROP.setProperty('INDEX', index);
}

function request(action, data) {
  var obj = JSON.stringify({ status: 1, data: 'unknown error' });

  if(action == 'add') {
    obj = addAction(data);
  }
    
  if(action == 'modify') {
    obj = modifyAction(data);
  }

  if(action == 'delete') {
    obj = deleteAction(data);
  }

  if(action == 'list') {
    obj = listAction(data);
  }

  return obj;
}

function modifyAction(data) {
  console.log('modifyAction');
  console.log(data);

  var file = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('ID'));
  var sheet = file.getSheets()[0];
  var obj = JSON.stringify({ status: 4, data: 'Unknown link id requested'});

  var ids = sheet.getRange(1, 1, sheet.getLastRow()).getValues();
  var searchResult = ids.findIndex(data.id);

  if(searchResult != -1) {
    var values = sheet.getRange(searchResult, 1, 1, 6).getValues();
    var tempJson = getObjects(values, ['id', 'link', 'description', 'tags', 'favicon', 'title']);
    var row = [[tempJson[0].id, tempJson[0].link, data.description, data.tags, tempJson[0].favicon, tempJson[0].title]];
    sheet.getRange(searchResult, 1, 1, 6).setValues(row);
    obj = JSON.stringify({ status: 0, data: ''});
  }
  return obj;
}

function deleteAction(data) {
  console.log('deleteAction');
  console.log(data);

  var file = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('ID'));
  var sheet = file.getSheets()[0];
  var obj = JSON.stringify({ status: 4, data: 'Unknown link id requested'});

  var ids = sheet.getRange(1, 1, sheet.getLastRow()).getValues();
  var searchResult = ids.findIndex(data.id);

  if(searchResult != -1) {
    sheet.deleteRow(searchResult);
    obj = JSON.stringify({ status: 0, data: ''});
  }
  return obj;
}

function listAction(data) {
  console.log('listAction');
  console.log(data);

  var file = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('ID'));
  var sheet = file.getSheets()[0];
  var obj = JSON.stringify({ status: 3, data: 'Unknown link id requested'});

  if(Object.getOwnPropertyNames(data).length === 0 ) {
    var lastRow = sheet.getLastRow();
    if(lastRow > 0) {
      var values = sheet.getRange(1, 1, lastRow, 6).getValues();
      var tempJson = getObjects(values, ['id', 'link', 'description', 'tags', 'favicon', 'title']);
      obj = JSON.stringify({ status: 0, data: tempJson});
    } else {
      obj = JSON.stringify({ status: 3, data: 'Empty database'});
    }

  } else {
    var ids = sheet.getRange(1, 1, sheet.getLastRow()).getValues();
    var searchResult = ids.findIndex(data.id);

    if(searchResult != -1) {
      var values = sheet.getRange(searchResult, 1, 1, 6).getValues();
      var tempJson = getObjects(values, ['id', 'link', 'description', 'tags', 'favicon', 'title']);
      obj = JSON.stringify({ status: 0, data: tempJson[0]});
    }

  }

  return obj;
}

function addAction(data) {
  console.log('addAction');
  console.log(data);

  var obj = JSON.stringify({ status: 5, data: 'Unknown link'});

  if(data.link === '') {
  }
  else {
    var file = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('ID'));
    var id = incrementId();
    var options = {
      'muteHttpExceptions': true
      };
    var webData = UrlFetchApp.fetch(data.link, options);
    var webText = webData.getContentText();
    var titleRegExp = new RegExp('<title>(.*?)</title>', 'i');

    var faviconUrl = 'https://www.google.com/s2/favicons?domain='+data.link;

    var webTitle;
    if(titleRegExp.exec(webText) === null) {
      webTitle = data.link;
    } else {
      webTitle = titleRegExp.exec(webText)[1];
    }

    data.id = id;
    data.favicon = faviconUrl;
    data.title = webTitle;

    var row = [[id, data.link, data.description, data.tags, data.favicon, data.title]];
    var sheet = file.getSheets()[0];
    var nextRow = sheet.getLastRow()+1;
    sheet.getRange(nextRow, 1, 1, 6).setValues(row);
    obj = JSON.stringify({ status: 0, data: id });

  }

  return obj;
}

Array.prototype.findIndex = function(search)
{
  var result = -1;
  for(var t = 0; t < this.length; t++) {
    if(this[t] == search) {
      result = t;
      break;
    }
  }
  return result + 1;
}

function incrementId()
{
  var id = SCRIPT_PROP.getProperty('INDEX');
  SCRIPT_PROP.setProperty('INDEX', ++id);
  return id;
}

function isCellEmpty(cellData) {
  return typeof(cellData) == 'string' && cellData == '';
}

function getObjects(data, keys) {
  var objects = [];
  for (var i = 0; i < data.length; ++i) {
    var object = {};
    var hasData = false;
    for (var j = 0; j < data[i].length; ++j) {
      var cellData = data[i][j];
      if (isCellEmpty(cellData)) {
        object[keys[j]] = "";
        continue;
      }
      object[keys[j]] = cellData;
      hasData = true;
    }
    if (hasData) {
      objects.push(object);
    }
  }
  return objects;
}

function tester() {
}