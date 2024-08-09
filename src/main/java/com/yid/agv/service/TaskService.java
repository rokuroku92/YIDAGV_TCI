
package com.yid.agv.service;

import com.yid.agv.backend.InstantStatus;
import com.yid.agv.backend.datastorage.StationManager;
import com.yid.agv.backend.datastorage.TaskQueue;
import com.yid.agv.model.QTask;
import com.yid.agv.model.Task;
import com.yid.agv.repository.TaskDao;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Map;

@Service
public class TaskService {
    private static final Logger log = LoggerFactory.getLogger(TaskService.class);
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private TaskDao taskDao;

    @Autowired
    private StationManager stationManager;
    @Autowired
    private TaskQueue taskQueue;
    private String lastDate;

    public Map<Integer, Integer> getCompletedTasksMap() {
        return InstantStatus.getCallerStationStatusMap();
    }

    public Collection<QTask> getTaskQueue(){
        return taskQueue.getTaskQueueCopy();
    }

    public List<Task> queryTodayTasks(){
        return taskDao.queryTodayTasks();
    }

    public List<Task> queryTasksByDate(String date){
        return taskDao.queryTasksByDate(date);
    }

    public List<Task> queryAllTasks(){
        return taskDao.queryAllTasks();
    }

    public boolean cancelTask(String taskNumber){
        return taskQueue.removeTaskByTaskNumber(taskNumber) && taskDao.cancelTask(taskNumber);
    }

    public String insertTaskAndAddTask(String time, String agv, String start, String notification, String mode) {
        if(time.equals("")
            ||agv.equals("")
            ||start.equals("")
            ||notification.equals("")
            ||mode.equals("")) return "資料錯誤！";

        if (stationManager.getStationStatus(Integer.parseInt(start)).getStatus() != 1
                || taskQueue.getBookedStationStatusByStation(Integer.parseInt(start)) != 0)
            return "起始格位不可用！";
        // getTerminal if not, return false
        Integer terminal = taskQueue.getTerminalByNotification(notification);
        if (terminal == null) return "終點格位已滿!";

        String lastTaskNumber = taskDao.selectLastTaskNumber();
        if (lastDate == null) {
            // 伺服器重啟
            lastDate = lastTaskNumber.substring(1, 9);
        }
        System.out.println("lastDate: "+lastDate);
        System.out.println("time.substring(0, 8): "+time.substring(0, 8));
        int serialNumber;
        if (!lastDate.equals(time.substring(0, 8))){
            serialNumber = 1;
            lastDate = time.substring(0, 8);
        } else {
            // 日期未變更，流水號遞增
            serialNumber = Integer.parseInt(lastTaskNumber.substring(9));
            serialNumber++;
        }
        String taskNumber = "#" + lastDate + String.format("%04d", serialNumber);

        QTask newTask = new QTask();
        newTask.setStatus(0);
        newTask.setTaskNumber(taskNumber);
        newTask.setAgvId(Integer.parseInt(agv));
        newTask.setModeId(Integer.parseInt(mode));
        newTask.setStartStationId(Integer.parseInt(start));
        newTask.setNotificationStationId(Integer.parseInt(notification));
        newTask.setTerminalStationId(terminal);

        return taskQueue.addTaskToQueue(newTask) &&
                taskDao.insertTask(taskNumber, time, agv, start, terminal.toString(), notification, mode) ? "任務發送成功!" : "任務發送失敗!";
//        return ProcessTasks.addTaskToQueue(newTask) &&
//                (("".equals(start)) ?
//                taskDao.insertTaskNoStart(taskNumber, time, agv, terminal.toString(), notification, mode) :
//                taskDao.insertTask(taskNumber, time, agv, start, terminal.toString(), notification, mode));
        // 這個專案中目前taskDao.insertTaskNoStart()永遠不會用到。
    }

    public String goStandbyTask(int mode) {
        log.info("Manual goStandbyTask mode {}", mode);
        int standbyStation;

        if (mode == 3) {
            standbyStation = 17;
        } else {
            standbyStation = 16;
        }

        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String formattedDateTime = now.format(formatter);

        QTask toStandbyTask = new QTask();

        toStandbyTask.setAgvId(1);
        toStandbyTask.setModeId(0);
        toStandbyTask.setStatus(0);
        toStandbyTask.setTaskNumber("#SB" + formattedDateTime);
        toStandbyTask.setStartStationId(standbyStation);
        toStandbyTask.setTerminalStationId(standbyStation);
        toStandbyTask.setNotificationStationId(16);

        return (taskQueue.addTaskToQueue(toStandbyTask) &&
        taskDao.insertTask(toStandbyTask.getTaskNumber(), formattedDateTime, Integer.toString(toStandbyTask.getAgvId()),
                Integer.toString(toStandbyTask.getStartStationId()), Integer.toString(toStandbyTask.getTerminalStationId()),
                Integer.toString(toStandbyTask.getNotificationStationId()), Integer.toString(toStandbyTask.getModeId()))) ? "任務發送成功!" : "任務發送失敗!";
    }
}
