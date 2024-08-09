var nowLanguage=localStorage.getItem("nowLanguage");

window.onload = function(){
    getMessage();
    switch(nowLanguage){
        case "thai":
            document.getElementById("homeBTN").value = "กลับสู่หน้าจอหลัก";  // 目前任務
            break;
        default:
            document.getElementById("homeBTN").value = "返回主畫面";  // 目前任務
            break;
    }
};

function getMessage() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', baseUrl + "/api/homepage/notifications", true);
    xhr.send();
    xhr.onload = function(){
        if(xhr.status == 200){
            let data = JSON.parse(this.responseText);
            addMessage(data);
        }
    };
}

function addMessage(data){
    let messageHTML = "";
    for(let i=0;i<data.length;i++){
        let datetime = data[i].createTime;
        let year = datetime.substring(0, 4);
        let month = datetime.substring(4, 6);
        let day = datetime.substring(6, 8);
        let hour = datetime.substring(8, 10);
        let minute = datetime.substring(10, 12);
        let second = datetime.substring(12, 14);
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

        let content;
        switch(nowLanguage){
            case "thai":
                switch(data[i].content){
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
                        content = data[i].content;
                        break;
                }
                break;
            default:
                content = data[i].content;
                break;
        }
        messageHTML += '<div class="row"><div class="col message"><div class="nfStatus '+level+'"></div><div class="messageContentDiv">' +
								'<label class="messageTitle">'+data[i].name+'</label>' +
								'<label class="messageContent">'+content+'</label>' +
								'<label class="messageTime">'+year+"/"+month+"/"+day+'&nbsp;'+hour+":"+minute+":"+second+'</label></div></div></div>';
    }
    document.getElementById("notification").innerHTML = messageHTML;
}

async function refreshData() {
    const selectDate = document.getElementById('selectDate').value.replaceAll("-","");
    const response = await fetch(`${baseUrl}/api/homepage/notifications/byDate?date=${selectDate}`);
    const data = await response.json();
    addMessage(data);
}