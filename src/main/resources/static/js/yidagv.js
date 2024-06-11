const notificationDict = {1: "PCB測試",2: "PCB外線",3: "FQC",4: "FVI",5: "Routing",6: "BGA整面C",7: "PCB外AOI",8: "PCB噴塗",9: "Suep",10: "CNC一廠",11: "PCB網印",12: "棕化",13: "內層線路",14: "BGA整面A",15: "CNC二廠",16: "待命"};
//const stationsDict = {1: "1-1", 2: "1-2", 3: "1-3", 4: "1-4", 5: "1-5", 6: "2-1", 7: "2-2", 8: "2-3", 9: "2-4", 10: "2-5", 11: "3-1", 12: "3-2", 13: "3-3", 14: "3-4", 15: "3-5"};
// const notificationDict = {};
const notificationDictThai = {1: "PCB測試",2: "PCB外線",3: "FQC",4: "FVI",5: "Routing",6: "BGAเจินเมี้ยนC",7: "AOIนอกPCB",8: "การฉีดพ่น(เผินถู)PCB",9: "Suep",10: "CNCโรง1",11: "การพิมพ์ (หวั่งหยิ้ง)PCB",12: "บราวนิ่ง(จงฮ้าว)",13: "ภายใน(เน้ยเฉินเซี้ยนลู้)",14: "BGAเจินเมี้ยนA",15: "CNCโรง2",16: "รอ"};
const stationsDict = {};
const agvStatusDict = {};
var nowLanguage=localStorage.getItem("nowLanguage");
var lastTasks;

window.onload = async function(){
    if(nowLanguage == 'thai') {
        document.getElementById('lanThai').click();
    }
    try{
        await setStationsDict();
        await setNotificationStationsDict();
        await setAgvStatusDict();
    }catch(error){
        console.error("發生錯誤: ", error);
    }
    bindEl();

    getAgvStatus();
    getTasks();
    getCompletedTasks();
    getStationStatus();
    getAnalysis();
    getNotification();
    getIAlarm();
    setInterval(getAgvStatus, 1000);
    setInterval(getTasks, 1000);
    setInterval(getCompletedTasks, 1000);
    setInterval(getStationStatus, 1000);
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
//                console.log("stationsDict: ", stationsDict);
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

function getCompletedTasks() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/completedTasks", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = JSON.parse(this.responseText);
//            console.log(data);
            updateCompletedTasks(data);
        }
    };
}

function getStationStatus() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/station", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = JSON.parse(this.responseText);
            updateStationStatus(data);
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

var alarmToggle = true;
function getIAlarm() {
    // if (Notification.permission !== 'granted') {
    //     Notification.requestPermission();
    // }
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/iAlarm", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = Number(this.responseText);
            if(data === 0){
                document.getElementById("messagebg").style.backgroundColor = "#FFFFFF";
            }else if(data === 1){
                if(alarmToggle){
                    document.getElementById("messagebg").style.backgroundColor = "#FF0000";
                    alarmToggle=false;
                    const audio = document.createElement("audio");
                    // audio.src = baseUrl+"/audio/laser.mp3";
                    audio.src = baseUrl+"/audio/alarm3.m4a";
                    audio.play();
                }else{
                    document.getElementById("messagebg").style.backgroundColor = "#FFFFFF";
                    alarmToggle=true;
                }
                
            }
        }
    };
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
                let content;
                switch(nowLanguage){
                    case "thai":
                        switch(agvStatusDict[data[i].status]){
                            case "離線":
                                content = "ออฟไลน์";
                                break;
                            case "連線":
                                content = "เชื่อมต่อ";
                                break;
                            case "AGV 手動模式":
                                content = "โหมดแมนนวล AGV";
                                break;
                            case "AGV 重新啟動":
                                content = "รีสตาร์ท AGV";
                                break;
                            case "AGV 緊急停止":
                                content = "AGV หยุดฉุกเฉิน";
                                break;
                            case "AGV 出軌":
                                content = "AGV ตกราง";
                                break;
                            case "AGV 發生碰撞":
                                content = "เอจีวีชนกัน";
                                break;
                            case "AGV 前有障礙":
                                content = "มีสิ่งกีดขวางด้านหน้า AGV";
                                break;
                            case "AGV 轉向角度過大":
                                content = "มุมบังคับเลี้ยว AGV ใหญ่เกินไป";
                                break;
                            case "AGV 卡號錯誤":
                                content = "ข้อผิดพลาดหมายเลขบัตร AGV";
                                break;
                            case "AGV 未知卡號":
                                content = "AGV ไม่ทราบหมายเลขบัตร";
                                break;
                            case "AGV 異常排除":
                                content = "การแก้ไขปัญหาความผิดปกติของ AGV";
                                break;
                            case "AGV 感知器偵測異常":
                                content = "เซ็นเซอร์ AGV ตรวจพบความผิดปกติ";
                                break;
                            case "AGV 充電異常":
                                content = "ความผิดปกติของการชาร์จ AGV";
                                break;
                            case "讀取狀態錯誤":
                                content = "ข้อผิดพลาดสถานะการอ่าน";
                                break;
                            case "任務執行失敗":
                                content = "การดำเนินการงานล้มเหลว";
                                break;
                            case "任務執行三次皆失敗":
                                content = "งานล้มเหลวสามครั้ง";
                                break;
                            case "發送任務失敗":
                                content = "การส่งงานล้มเหลว";
                                break;
                            case "發送任務三次皆失敗":
                                content = "ไม่สามารถส่งงานสามครั้ง";
                                break;
                            case "電池電量過低":
                                content = "พลังงานแบตเตอรี่ต่ำเกินไป";
                                break;
                            case "caller離線超過20秒，請至現場排除問題":
                                content = "ผู้โทรออฟไลน์นานกว่า 20 วินาที โปรดไปที่ไซต์เพื่อแก้ไขปัญหา";
                                break;
                            case "錯誤，任務起始站棧板離開。":
                                content = "เกิดข้อผิดพลาด เหลือแท่นวางสถานีเริ่มต้นงาน";
                                break;
                            case "錯誤，任務終點站上有其他棧板。":
                                content = "เกิดข้อผิดพลาด มีพาเลทอื่นๆ บนอาคารผู้โดยสารภารกิจ";
                                break;
                            default:
                                content = agvStatusDict[data[i].status];
                                break;
                        }
                        break;
                    default:
                        content = agvStatusDict[data[i].status];
                        break;
                }
                document.getElementById("status").value = content;
            }else{
                console.log("內容錯誤");
            }
            if(data[i].task === "" || data[i].task === undefined)
                switch(nowLanguage){
                    case "thai":
                        document.getElementById("task").value = "ขณะนี้ไม่มีงานใดๆ";  // 目前任務
                        break;
                    default:
                        document.getElementById("task").value = "目前沒有任務";  // 目前任務
                        break;
                }
            else 
                document.getElementById("task").value = data[i].task;  // 目前任務
            document.getElementById("place").value = data[i].place;  // 目前位置
            document.getElementById("battery").value = data[i].battery+"%";  // 目前電壓
            document.getElementById("signal").value = data[i].signal+"%";  // 信號強度

            // 更新位置
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
    "1001": [91.5, 50],
    "1002": [92.5, 50],
    "1003": [91.5, 48],
    "1004": [92.5, 48],
    "1005": [91.5, 46],
    "1006": [92.5, 46],
    "1007": [91.5, 44],
    "1008": [92.5, 44],
    "1009": [91.5, 42],
    "1010": [92.5, 42],
    "1011": [91.5, 40],
    "1012": [92.5, 40],

    "1013": [91.5, 37],
    "1014": [90, 34],
    "1015": [85, 34],
    "1016": [80, 34],
    "1017": [76, 34],

    "1018": [70, 25],
    "1019": [67, 25],
    "1020": [64, 25],
    "1021": [60, 25],
    "1022": [57, 25],
    "1023": [53, 25],
    "1024": [50, 25],
    "1025": [47, 25],
    "1026": [43, 25],
    "1027": [40, 25],
    
    "1028": [38, 20],
    "1029": [38, 12],

    "1030": [36, 6],
    "1031": [33, 6],
    "1032": [29, 6],
    "1033": [26, 6],
    "1034": [22, 6],
    "1035": [19, 6],
    "1036": [16, 6],
    "1037": [13, 6],
    "1038": [9, 6],
    "1039": [6, 6],

    "1040": [4.3, 10],
    "1041": [4.3, 23],
    "1042": [4.3, 37],
    "1043": [4.3, 50],

    "1044": [5, 65],
    "1045": [6, 65],
    "1046": [5, 67],
    "1047": [6, 67],
    "1048": [5, 69],
    "1049": [6, 69],
    "1050": [5, 71],
    "1051": [6, 71],
    "1052": [5, 73],
    "1053": [6, 73],
    "1054": [5, 76],

}

function updateAGVPositions(tag) {
    let realTag = String(Math.floor(((Number(tag) % 1000) % 250) + Math.floor(Number(tag) / 1000) * 1000));
    var map = document.getElementById("map");
    var mapWidth = map.clientWidth;
    var mapHeight = map.clientHeight;
    var place = mapTagPositions[realTag];

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
                let notificationstation = nowLanguage == 'thai' ? notificationDictThai[data[i].notificationStationId] : notificationDict[data[i].notificationStationId];
                if (data[i].status != 0){
                    taskHTML += '<div class="row taskcontent"><div class="col-3">'+stationsDict[data[i].startStationId]+'</div>'+
                                                            '<div class="col-4">'+notificationstation+'</div><div class="col-3">'+stationsDict[data[i].terminalStationId]+
                                                            '</div><div class="col-2 removebtncol"></div></div>';
                }else{
                    taskHTML += '<div class="row taskcontent"><div class="col-3">'+stationsDict[data[i].startStationId]+'</div>'+
                                                        '<div class="col-4"><nobr>'+notificationstation+'</nobr></div><div class="col-3">'+
                                                        stationsDict[data[i].terminalStationId]+'</div><div class="col-2 removebtncol">'+
                                                        '<button type="button" class="btn btnt" onclick="removeTaskById('+data[i].taskNumber.substring(1)+
                                                        ')"><svg width="16" height="16"><use xlink:href="#trash"/></svg></button></div></div>';
                }
                document.getElementById(stationsDict[data[i].terminalStationId]+"b").innerHTML = notificationstation;
                        //    console.log(data.tasks[i].notice_station);
            }
            document.getElementById("task_body").innerHTML = taskHTML;
        }else{
            switch(nowLanguage){
                case "thai":
                    document.getElementById('task_body').innerHTML = '<p style="color: #5C5C5C;padding-top: 10px;">ขณะนี้ไม่มีงานใดๆ</p>';
                    break;
                default:
                    document.getElementById('task_body').innerHTML = '<p style="color: #5C5C5C;padding-top: 10px;">目前沒有任務</p>';
                    break;
            }
            
        }
        lastTasks = data;
    }
}

function updateCompletedTasks(data){
    for(let i=1;i<=15;i++){
        if(data[i] != 0){
            let notificationstation = nowLanguage == 'thai' ? notificationDictThai[data[i]] : notificationDict[data[i]];
            document.getElementById(stationsDict[String(i)]+"b").innerHTML = notificationstation;
        }
    }
}


function updateStationStatus(data){
    // 更改站點按鈕顏色
    for(let i=0;i<15;i++){ // 0~15要改
        let m = "s" + String(i);
        switch (data[i].status) {
            case 0:
                document.getElementById(m).className = "st btn btn-success disabled";
                document.getElementById(stationsDict[i+1]+"b").innerHTML = '';
                break;
            case 1:
                document.getElementById(m).className = "st btn btn-primary";
                document.getElementById(stationsDict[i+1]+"b").innerHTML = '';
                break;
            case 2:
                document.getElementById(m).className = "st btn btn-warning disabled";
                break;
            case 3:
                document.getElementById(m).className = "st btn btn-warning red disabled";
                break;
            case 4:
                document.getElementById(m).className = "st btn btn-danger disabled";
                break;
            case 6:
                document.getElementById(m).className = "st btn disabled";
                break;
            default:
                console.log(`內容錯誤: ${data[i].status}.`);
        }
    }
    checkStartInput();
}

function updateMessage(data){
    switch(nowLanguage){
        case "thai":
            let originalMessage = data[0].content;
            switch(originalMessage){
                case "離線":
                    document.getElementById("message").innerHTML = "ออฟไลน์";
                    break;
                case "連線":
                    document.getElementById("message").innerHTML = "เชื่อมต่อ";
                    break;
                case "AGV 手動模式":
                    document.getElementById("message").innerHTML = "โหมดแมนนวล AGV";
                    break;
                case "AGV 重新啟動":
                    document.getElementById("message").innerHTML = "รีสตาร์ท AGV";
                    break;
                case "AGV 緊急停止":
                    document.getElementById("message").innerHTML = "AGV หยุดฉุกเฉิน";
                    break;
                case "AGV 出軌":
                    document.getElementById("message").innerHTML = "AGV ตกราง";
                    break;
                case "AGV 發生碰撞":
                    document.getElementById("message").innerHTML = "เอจีวีชนกัน";
                    break;
                case "AGV 前有障礙":
                    document.getElementById("message").innerHTML = "มีสิ่งกีดขวางด้านหน้า AGV";
                    break;
                case "AGV 轉向角度過大":
                    document.getElementById("message").innerHTML = "มุมบังคับเลี้ยว AGV ใหญ่เกินไป";
                    break;
                case "AGV 卡號錯誤":
                    document.getElementById("message").innerHTML = "ข้อผิดพลาดหมายเลขบัตร AGV";
                    break;
                case "AGV 未知卡號":
                    document.getElementById("message").innerHTML = "AGV ไม่ทราบหมายเลขบัตร";
                    break;
                case "AGV 異常排除":
                    document.getElementById("message").innerHTML = "การแก้ไขปัญหาความผิดปกติของ AGV";
                    break;
                case "AGV 感知器偵測異常":
                    document.getElementById("message").innerHTML = "เซ็นเซอร์ AGV ตรวจพบความผิดปกติ";
                    break;
                case "AGV 充電異常":
                    document.getElementById("message").innerHTML = "ความผิดปกติของการชาร์จ AGV";
                    break;
                case "讀取狀態錯誤":
                    document.getElementById("message").innerHTML = "ข้อผิดพลาดสถานะการอ่าน";
                    break;
                case "任務執行失敗":
                    document.getElementById("message").innerHTML = "การดำเนินการงานล้มเหลว";
                    break;
                case "任務執行三次皆失敗":
                    document.getElementById("message").innerHTML = "งานล้มเหลวสามครั้ง";
                    break;
                case "發送任務失敗":
                    document.getElementById("message").innerHTML = "การส่งงานล้มเหลว";
                    break;
                case "發送任務三次皆失敗":
                    document.getElementById("message").innerHTML = "ไม่สามารถส่งงานสามครั้ง";
                    break;
                case "電池電量過低":
                    document.getElementById("message").innerHTML = "พลังงานแบตเตอรี่ต่ำเกินไป";
                    break;
                case "caller離線超過20秒，請至現場排除問題":
                    document.getElementById("message").innerHTML = "ผู้โทรออฟไลน์นานกว่า 20 วินาที โปรดไปที่ไซต์เพื่อแก้ไขปัญหา";
                    break;
                case "錯誤，任務起始站棧板離開。":
                    document.getElementById("message").innerHTML = "เกิดข้อผิดพลาด เหลือแท่นวางสถานีเริ่มต้นงาน";
                    break;
                case "錯誤，任務終點站上有其他棧板。":
                    document.getElementById("message").innerHTML = "เกิดข้อผิดพลาด มีพาเลทอื่นๆ บนอาคารผู้โดยสารภารกิจ";
                    break;
                default:
                    document.getElementById("message").innerHTML = data[0].content;
                    break;
            }
            break;
        default:
            document.getElementById("message").innerHTML = data[0].content;
            break;
    }
    // console.log(data[0]);
}

function bindEl(){
    // 地圖收縮
    $("#omap").click(function(el){
        $(this).css("display", "none");
        $("#cmap").css("display", "block");
    });
    $("#cmap").click(function(el){
            $(this).css("display", "none");
            $("#omap").css("display", "block");
    });

    const btns = document.querySelectorAll(".btn-check");
    // 逐一檢查按鈕是否被選中
    // btns.forEach(btn => {
    //     btn.addEventListener("click", () => {
    //         updateLan(btn.id);
    //         console.log("選中的按鈕ID是：" + btn.id);
    //     });
    // });
}


function checkStartInput() {
    const value = document.getElementById('ststation').value;
    
    if (!isNaN(value) && value !== "") {
        const stationElement = document.getElementById("s" + (parseInt(value) + 1));
        
        if (stationElement) {
            const stationClasses = stationElement.classList;
            
            if (stationClasses.contains('disable')) {
                document.getElementById("ststation").value = "";
                document.getElementById("ststationText").value = "";
            }
        }
    }
}

function checkStartAndTerminalInput() {
    const startValue = $('#ststation').val();
    const terminalValue = $('#notificationstation').val();

    if (!isNaN(startValue) && startValue !== "" && !isNaN(terminalValue) && terminalValue !== "") {
        const startRange = Math.floor((parseInt(startValue) - 1) / 5) + 1;
        const terminalRange = Math.floor((parseInt(terminalValue) - 1) / 5) + 1;

        if (startRange === terminalRange) {
            cn();
        }
    }
}

function setStartStationNo(no) {
    document.getElementById('ststation').value = no;
    document.getElementById('ststationText').value = stationsDict[no];
    checkStartInput();
    checkStartAndTerminalInput();
}

function setNotification(no) {
    document.getElementById('notificationstation').value = no;
    let notificationstationText = nowLanguage == 'thai' ? notificationDictThai[no] : notificationDict[no];
    document.getElementById('notificationstationText').value = notificationstationText;
    checkStartAndTerminalInput();
}
// 紀錄確認列與發送
function subm(){
    var check = confirm('是否確認發送從格位 ' + document.getElementById('ststationText').value + ' 到' + document.getElementById('notificationstationText').value + '通知站的任務？');
    if(!check) return;
    var now = new Date();
    var nowTime = ""+now.getFullYear()+("0"+(now.getMonth()+1)).slice(-2)+("0"+now.getDate()).slice(-2)+
                    ("0"+now.getHours()).slice(-2)+("0"+now.getMinutes()).slice(-2)+("0"+now.getSeconds()).slice(-2);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl+"/api/sendTask?time="+nowTime+"&agv=1&start="+document.getElementById('ststation').value+"&notification="+document.getElementById('notificationstation').value+"&mode=0", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = this.responseText;
            if(data == 'OK'){
                alert("Task sent successfully.");
            }else if(data == 'FAIL'){
                alert("Failed to send task.");
            }
        }
    };
    cn();
};
// 清除按鈕
function cn(){
    document.getElementById("ststation").value = "";
    document.getElementById("ststationText").value = "";
    document.getElementById("notificationstation").value = "";
    document.getElementById("notificationstationText").value = "";
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


function removeTaskById(id) {
    var check = confirm('是否要刪除任務： #' + id + ' ?');
    if(!check) return;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/cancelTask?taskNumber=" + id, true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            var data = this.responseText;
            console.log(data);
            if(data == 'OK') {
                alert("task number #"+id+" is been canceled.");
            }else if(data == 'FAIL'){
                alert("task number #"+id+" cannot be canceled.");
            }
        }
    };
}


function changeLanguage(lan) {
    nowLanguage=lan;
    localStorage.setItem("nowLanguage", lan);
    switch(lan){
        case "thai":
            document.getElementById("labelAgvStatus").innerHTML = "สถานะ AGV";
            document.getElementById("agvOfflineStatus").innerHTML = "<h1>ไม่ได้เชื่อมต่อ AGV</h1>";
            document.getElementById("labelAStatus").innerHTML = "สถานะการทำงาน&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            document.getElementById("labelATask").innerHTML = "งานปัจจุบัน&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            document.getElementById("labelAPlace").innerHTML = "ตำแหน่งที่ตั้ง&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
            document.getElementById("labelABattery").innerHTML = "แรงดันไฟฟ้าในปัจจุบัน";
            document.getElementById("labelASignal").innerHTML = "ความแรงของสัญญาณ";
            document.getElementById("labelTask").innerHTML = "คิวงาน";
            document.getElementById("labelTStartStation").innerHTML = "<nobr>สถานีต้นทาง</nobr>";
            document.getElementById("labelTNotificationStation").innerHTML = "<nobr>สถานีแจ้งเตือน</nobr>";
            document.getElementById("labelTTerminalStation").innerHTML = "<nobr>แผนกสุดท้าย</nobr>";
            document.getElementById("labelAWorkTotal").innerHTML = "ชั่วโมงการทำงานทั้งหมด";
            document.getElementById("labelAOpenTotal").innerHTML = "ชั่วโมงเปิดเครื่องทั้งหมด";
            document.getElementById("labelARate").innerHTML = "อัตราการใช้";
            document.getElementById("labelATaskTotal").innerHTML = "จำนวนงานสะสม";
            document.getElementById("labelStartStation").innerHTML = "สถานีต้นทาง";
            document.getElementById("labelNotificationStation").innerHTML = "สถานีแจ้งเตือน";
            document.getElementById("labelAnalysis").innerHTML = "การวิเคราะห์ผลประโยชน์";
            document.getElementById("labelMessage").innerHTML = "ข้อความระบบ:";
            document.getElementById("labelSendStartStation").innerHTML = "สถานีต้นทาง:";
            document.getElementById("labelSendNotificationStation").innerHTML = "สถานีแจ้งเตือน:";
            document.getElementById("PCB測試").innerHTML = "<nobr>การทดสอบPCB(เชอร์ซื่อ)</nobr>";
            document.getElementById("PCB外線").innerHTML = "<nobr>เส้นนอกPCB(ไหว้เซี้ยน)</nobr>";
            document.getElementById("FQC").innerHTML = "<nobr>FQC</nobr>";
            document.getElementById("FVI").innerHTML = "<nobr>FVI</nobr>";
            document.getElementById("Routing").innerHTML = "<nobr>Routing(รูต้า)</nobr>";
            document.getElementById("BGA整面C").innerHTML = "<nobr>BGAเจินเมี้ยนC</nobr>";
            document.getElementById("PCB外AOI").innerHTML = "<nobr>AOIนอกPCB</nobr>";
            document.getElementById("PCB噴塗").innerHTML = "<nobr>การฉีดพ่น(เผินถู)PCB</nobr>";
            document.getElementById("Suep").innerHTML = "<nobr>Suep</nobr>";
            document.getElementById("CNC一廠").innerHTML = "<nobr>CNCโรง1</nobr>";
            document.getElementById("PCB網印").innerHTML = "<nobr>การพิมพ์ (หวั่งหยิ้ง)PCB</nobr>";
            document.getElementById("棕化").innerHTML = "<nobr>บราวนิ่ง(จงฮ้าว)</nobr>";
            document.getElementById("內層線路").innerHTML = "<nobr>ภายใน(เน้ยเฉินเซี้ยนลู้)</nobr>";
            document.getElementById("BGA整面A").innerHTML = "<nobr>BGAเจินเมี้ยนA</nobr>";        
            document.getElementById("CNC二廠").innerHTML = "<nobr>CNCโรง2</nobr>";
            document.getElementById("taskConfirmBTN").value = "ยืนยัน";
            document.getElementById("taskClearBTN").value = "ชัดเจน";
            break;
        default:
            document.getElementById("labelAgvStatus").innerHTML = "AGV 狀態";
            document.getElementById("agvOfflineStatus").innerHTML = "<h1>AGV未連線</h1>";
            document.getElementById("labelAStatus").innerHTML = "工作狀態";
            document.getElementById("labelATask").innerHTML = "目前任務";
            document.getElementById("labelAPlace").innerHTML = "即時位置";
            document.getElementById("labelABattery").innerHTML = "目前電壓";
            document.getElementById("labelASignal").innerHTML = "信號強度";
            document.getElementById("labelTask").innerHTML = "任務佇列";
            document.getElementById("labelTStartStation").innerHTML = "<nobr>出發站</nobr>";
            document.getElementById("labelTNotificationStation").innerHTML = "<nobr>通知站</nobr>";
            document.getElementById("labelTTerminalStation").innerHTML = "<nobr>終點站</nobr>";
            document.getElementById("labelAWorkTotal").innerHTML = "總工作時數";
            document.getElementById("labelAOpenTotal").innerHTML = "總開機時數";
            document.getElementById("labelARate").innerHTML = "稼動率";
            document.getElementById("labelATaskTotal").innerHTML = "累積任務數";
            document.getElementById("labelStartStation").innerHTML = "出發站";
            document.getElementById("labelNotificationStation").innerHTML = "通知站";
            document.getElementById("labelAnalysis").innerHTML = "效益分析";
            document.getElementById("labelMessage").innerHTML = "系統訊息:";
            document.getElementById("labelSendStartStation").innerHTML = "出發站：";
            document.getElementById("labelSendNotificationStation").innerHTML = "通知站：";
            document.getElementById("PCB測試").innerHTML = "<nobr>PCB測試</nobr>";
            document.getElementById("PCB外線").innerHTML = "<nobr>PCB外線</nobr>";
            document.getElementById("FQC").innerHTML = "<nobr>FQC</nobr>";
            document.getElementById("FVI").innerHTML = "<nobr>FVI</nobr>";
            document.getElementById("Routing").innerHTML = "<nobr>Routing</nobr>";
            document.getElementById("BGA整面C").innerHTML = "<nobr>BGA整面C</nobr>";
            document.getElementById("PCB外AOI").innerHTML = "<nobr>PCB外AOI</nobr>";
            document.getElementById("PCB噴塗").innerHTML = "<nobr>PCB噴塗</nobr>";
            document.getElementById("Suep").innerHTML = "<nobr>Suep</nobr>";
            document.getElementById("CNC一廠").innerHTML = "<nobr>CNC一廠</nobr>";
            document.getElementById("PCB網印").innerHTML = "<nobr>PCB網印</nobr>";
            document.getElementById("棕化").innerHTML = "<nobr>棕化</nobr>";
            document.getElementById("內層線路").innerHTML = "<nobr>內層線路</nobr>";
            document.getElementById("BGA整面A").innerHTML = "<nobr>BGA整面A</nobr>";        
            document.getElementById("CNC二廠").innerHTML = "<nobr>CNC二廠</nobr>";
            document.getElementById("taskConfirmBTN").value = "確認";
            document.getElementById("taskClearBTN").value = "清除";
            break;
    }
    let notificationstation = document.getElementById('notificationstation').value
    if (notificationstation != null && notificationstation != ""){
        setNotification(notificationstation);
    }
    lastTasks = [];
}