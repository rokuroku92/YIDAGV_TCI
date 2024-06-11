//const notificationDict = {1: "PCB測試", 2: "PCB外線", 3: "PCB外AOI", 4: "PCB網印", 5: "CNC二廠", 6: "FQC", 7: "BGA整面C", 8: "棕化", 9: "內層線路", 10: "Suep", 11: "FVI", 12: "PCB噴塗", 13: "BGA整面A", 14: "CNC一廠", 15: "Routing"};
const notificationDict = {};
const stationsDict = {};
const agvStatusDict = {};
var lastTasks;

window.onload = async function(){
    try{
        await setStationsDict();
        await setNotificationStationsDict();
        await setAgvStatusDict();
    }catch(error){
        console.error("發生錯誤: ", error);
    }

    getAgvStatus();
    getTasks();
    getAnalysis();
    getNotification();
    getIAlarm();
    setInterval(getAgvStatus, 1000);
    setInterval(getTasks, 1000);
    setInterval(getNotification, 1000);
    setInterval(getIAlarm, 1000);
    setInterval(getAnalysis, 60000);
};

function setStationsDict() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', baseUrl + "/api/homepage/stationsData", true);
        xhr.send();
        xhr.onload = function(){
            if(xhr.status == 200){
                let stationList = JSON.parse(this.responseText);
                for(let i=0;i<stationList.length;i++){
                    stationsDict[stationList[i].id] = stationList[i].name;
                }
//                console.log("stationsDict: ", stationsDict);
                resolve(); // 解析成功时，将 Promise 设置为已完成状态
            }else {
                reject(new Error('Station列表獲取失敗')); // 解析失败时，将 Promise 设置为拒绝状态
            }
        };
    });
}

function setAgvStatusDict() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', baseUrl + "/api/homepage/agvStatusData", true);
        xhr.send();
        xhr.onload = function(){
            if(xhr.status == 200){
                let agvStatusDataList = JSON.parse(this.responseText);
                for(let i=0;i<agvStatusDataList.length;i++){
                    agvStatusDict[agvStatusDataList[i].id] = agvStatusDataList[i].content;
                }
//                console.log("agvStatusDict: ", agvStatusDict);
                resolve(); // 解析成功时，将 Promise 设置为已完成状态
            }else {
                reject(new Error('agvStatusData列表獲取失敗')); // 解析失败时，将 Promise 设置为拒绝状态
            }
        };
    });
}

function setNotificationStationsDict() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', baseUrl + "/api/homepage/notificationStationsData", true);
        xhr.send();
        xhr.onload = function(){
            if(xhr.status == 200){
                let stationList = JSON.parse(this.responseText);
                for(let i=0;i<stationList.length;i++){
                    notificationDict[stationList[i].id] = stationList[i].name;
                }
//                console.log("notificationDict: ", notificationDict);
                resolve(); // 解析成功时，将 Promise 设置为已完成状态
            }else {
                reject(new Error('NotificationStation列表獲取失敗')); // 解析失败时，将 Promise 设置为拒绝状态
            }
        };
    });
}

function getAgvStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/agv", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = JSON.parse(this.responseText);
//            console.log(data);
            updateAgvStatus(data);
        }
    };
}

function getTasks() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/tasks", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = JSON.parse(this.responseText);
//            console.log(data);
            updateTasks(data);
        }
    };
}


function getNotification() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/notifications", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = JSON.parse(this.responseText);
            updateMessage(data);
        }
    };
}

function getIAlarm() {
    if (Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/iAlarm", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = Number(this.responseText);
            if(data === 0) {
                // Caller 離線要不要叫
               // getEquipmentAlarm();
            } else if(data === 1){
                equipmentAlarmProgress();
            }
        }
    };
}

function getEquipmentAlarm() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/equipmentIAlarm", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = JSON.parse(this.responseText);
            var c=0;
            for(let i=0;i<data.length;i++){
                if(data[i] != 0){
                    c++;
                }
            }
            if(c>0) {
                equipmentAlarmProgress();
            } else {
                document.getElementById("messagebg").style.backgroundColor = "#FFFFFF";
                document.getElementById("notification").style.backgroundColor = "#FFFFFF";
            }
        }
    }
}

var alarmToggle = true;
function equipmentAlarmProgress(){
    if(alarmToggle){
        document.getElementById("messagebg").style.backgroundColor = "#FF0000";
        document.getElementById("notification").style.backgroundColor = "#FF0000";
        alarmToggle=false;
        const audio = document.createElement("audio");
        // audio.src = baseUrl+"/audio/laser.mp3";
        audio.src = baseUrl+"/audio/alarm3.m4a";
        audio.play();
    }else{
        document.getElementById("messagebg").style.backgroundColor = "#FFFFFF";
        document.getElementById("notification").style.backgroundColor = "#FFFFFF";
        alarmToggle=true;
    }
}

function getAnalysis(){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/analysis/mode?agvId=1&value=recently", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = JSON.parse(this.responseText);
            // console.log(data);
            countRate(data);
        }
    };
}



function updateAgvStatus(data){  // 更新資料
    for(let i=0;i<data.length;i++){
        if(data[i].battery === 0 && data[i].signal === 0){
            document.getElementById("agvOnlineStatus").style.display = "none";
            document.getElementById("agvOfflineStatus").style.display = "block";
//            demoPlace();
        }else{
            document.getElementById("agvOfflineStatus").style.display = "none";
            document.getElementById("agvOnlineStatus").style.display = "block";
            // 工作狀態
            if (data[i].status >=0 && data[i].status <= 13) {
                document.getElementById("status").value = agvStatusDict[data[i].status];
            }else{
                console.log("內容錯誤");
            }
            if(data[i].task === "" || data[i].task === undefined)
                document.getElementById("task").value = "目前沒有任務";  // 目前任務
            else 
                document.getElementById("task").value = data[i].task;  // 目前任務
            document.getElementById("place").value = data[i].place;  // 目前位置
            document.getElementById("battery").value = data[i].battery+"%";  // 目前電壓
            document.getElementById("signal").value = data[i].signal+"%";  // 信號強度


            updateAGVPositions(data[i].place);
        }
        // 放車子
        // document.getElementById("agv_car").innerHTML = '<img src="'+baseUrl+'/image/icon_mp.png" width="50" ' +
        //                                                'style="position: absolute;left: ' + data.place.coordinate[0] + 'px;top: ' + data.place.coordinate[1] + 'px;z-index: 10" />';
    }
}


var tag = 1001;
var tagF = true;
function demoPlace(){
    if(tagF){
        if(tag<1054){
            tag = tag + 1;
        } else {
            tagF = false;
        }
    } else {
        if(tag>1001){
            tag = tag - 1;
        } else {
            tagF = true;
        }
    }
    
    updateAGVPositions(String(tag));
}

const mapTagPositions = {
    "1001": [91.5, 50], "1251": [91.5, 50], "1751": [91.5, 50],
    "1002": [92.5, 50],
    "1003": [91.5, 48], "1253": [91.5, 48], "1753": [91.5, 48],
    "1004": [92.5, 48],
    "1005": [91.5, 46], "1255": [91.5, 46], "1755": [91.5, 46],
    "1006": [92.5, 46],
    "1007": [91.5, 44], "1257": [91.5, 44], "1757": [91.5, 44],
    "1008": [92.5, 44],
    "1009": [91.5, 42], "1259": [91.5, 42], "1759": [91.5, 42],
    "1010": [92.5, 42],
    "1011": [91.5, 40], "1261": [91.5, 40], "1761": [91.5, 40],
    "1012": [92.5, 40],

    "1263": [91.5, 37], "1763": [91.5, 37],
    "1014": [90, 34], "1514": [90, 34],
    "1015": [85, 34], "1515": [85, 34],
    "1016": [80, 34], "1516": [80, 34],
    "1017": [76, 34], "1517": [76, 34],

    "1018": [70, 25], "1518": [70, 25],
    "1019": [67, 25], "1519": [67, 25],
    "1020": [64, 25], "1520": [64, 25],
    "1021": [60, 25], "1521": [60, 25],
    "1022": [57, 25], "1522": [57, 25],
    "1023": [53, 25], "1523": [53, 25],
    "1024": [50, 25], "1524": [50, 25],
    "1025": [47, 25], "1525": [47, 25],
    "1026": [43, 25], "1526": [43, 25],
    "1027": [40, 25], "1527": [40, 25],

    "1278": [38, 20], "1778": [38, 20],
    "1279": [38, 12], "1779": [38, 12],

    "1030": [36, 6], "1530": [36, 6],
    "1031": [33, 6], "1531": [33, 6],
    "1032": [29, 6], "1532": [29, 6],
    "1033": [26, 6], "1533": [26, 6],
    "1034": [22, 6], "1534": [22, 6],
    "1035": [19, 6], "1535": [19, 6],
    "1036": [16, 6], "1536": [16, 6],
    "1037": [13, 6], "1537": [13, 6],
    "1038": [9, 6], "1538": [9, 6],
    "1039": [6, 6], "1539": [6, 6],

    "1290": [4.3, 10], "1790": [4.3, 10],
    "1291": [4.3, 23], "1791": [4.3, 23],
    "1292": [4.3, 37], "1792": [4.3, 37],
    "1293": [4.3, 50], "1793": [4.3, 50],

    "1044": [5, 65], "1294": [5, 65], "1794": [5, 65],
    "1045": [6, 65],
    "1046": [5, 67], "1296": [5, 67], "1796": [5, 67],
    "1047": [6, 67],
    "1048": [5, 69], "1298": [5, 69], "1798": [5, 69],
    "1049": [6, 69],
    "1050": [5, 71], "1300": [5, 71], "1800": [5, 71],
    "1051": [6, 71],
    "1052": [5, 73], "1302": [5, 73], "1802": [5, 73],
    "1053": [6, 73],
    "1054": [5, 76],

}

function updateAGVPositions(tag) {
    var map = document.getElementById("map");
    var mapWidth = map.clientWidth;
    var mapHeight = map.clientHeight;
    var place = mapTagPositions[tag];

    document.getElementById("agv_car").style.transform = "translate(" + ((place[0]/100) * mapWidth) +"px, " + ((place[1]/100) * mapHeight) + "px)";
}


function updateTasks(data){
    if(lastTasks != data){
        // 清除佇列任務
        // document.getElementById('task_body').innerHTML = '';
        // 加入佇列任務
        if(data.length>0){
            var taskHTML="";
            for(let i=0;i<data.length;i++){
                taskHTML += '<div class="row taskcontent"><div class="col-3">'+stationsDict[data[i].startStationId]+'</div>'+
                            '<div class="col-4">'+notificationDict[data[i].notificationStationId]+'</div><div class="col-3">'+stationsDict[data[i].terminalStationId]+
                            '</div></div>';
//                document.getElementById(stationsDict[data[i].terminalStationId]+"b").innerHTML = notificationDict[data[i].notificationStationId];
                        //    console.log(data.tasks[i].notice_station);
            }
            document.getElementById("task_body").innerHTML = taskHTML;
            lastTasks = data;
        }else{
            document.getElementById('task_body').innerHTML = '<p style="color: #5C5C5C;padding-top: 10px;">目前沒有任務</p>';
        }
    }
}

function updateCompletedTasks(data){
    for(let i=1;i<=15;i++){
        if(data[i] != 0){
            console.log("gg");
            document.getElementById(stationsDict[String(i)]+"b").innerHTML = notificationDict[data[i]];
        }
    }
}


function updateMessage(data){
    let messageHTML = "";
    for(let i=0;i<data.length;i++){
        var datetime = data[i].createTime;
        var year = datetime.substring(0, 4);
        var month = datetime.substring(4, 6);
        var day = datetime.substring(6, 8);
        var hour = datetime.substring(8, 10);
        var minute = datetime.substring(10, 12);
        var second = datetime.substring(12, 14);
        let level;
        switch (data[i].level) {
            case 1:
                level = "info";
                break;
            case 2:
                level = "warning";
                break;
            case 3:
                level = "danger";
                break;
            default:
                level = "info";
                break;
        }
        messageHTML += '<div class="row"><div class="col message"><div class="nfStatus '+level+'"></div><div class="messageContentDiv">' +
								'<label class="messageTitle">'+data[i].name+'</label>' +
								'<label class="messageContent">'+data[i].content+'</label>' +
								'<label class="messageTime">'+year+"/"+month+"/"+day+'&nbsp;'+hour+":"+minute+":"+second+'</label></div></div></div>';
    }
    document.getElementById("notification").innerHTML = messageHTML;
}

function countRate(data) {
    var task_sum = 0;
    var work_sum = 0;
    var open_sum = 0;
    var x=0;
    for(let i=0 ; i < data.length ; i++) {
        task_sum += data[i].task;
        work_sum += data[i].workingMinute;
        open_sum += data[i].openMinute;
        if(data[i].task>0)x++;
    }
    document.getElementById("work_sum").value = String(Math.floor(work_sum/60))+"hr";
    document.getElementById("open_sum").value = String(Math.floor(open_sum/60))+"hr";
    document.getElementById("rate").value = String(((work_sum/open_sum)*100).toFixed(1))+"%";
    document.getElementById("task_sum").value = task_sum;
}
