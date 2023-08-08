package com.yid.agv.backend.datastorage;


import com.yid.agv.backend.InstantStatus;
import com.yid.agv.model.QTask;
import com.yid.agv.repository.StationDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Iterator;
import java.util.List;
import java.util.Objects;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedDeque;

@Component
public class TaskQueue {
    @Autowired
    private StationDao stationDao;
    @Autowired
    private AGVManager agvManager;
    @Autowired
    private StationManager stationManager;
    private final Queue<QTask> taskQueue;
    private final int[] bookedStation;
    private String nowTaskNumber;

    private TaskQueue() {
        taskQueue = new ConcurrentLinkedDeque<>();
        bookedStation = new int[15];
    }

    @SuppressWarnings("unused")
    private static class Holder {
        private static final TaskQueue INSTANCE = new TaskQueue();
    }



    public boolean iDispatch(){
        return !InstantStatus.iTask && !InstantStatus.iStandbyTask && !taskQueue.isEmpty();
    }

    public boolean iGoStandby(){
        int place = Integer.parseInt(agvManager.getAgvStatus(1).getPlace());
        if (place == -1) return false;

        List<String> standbyTags = stationDao.queryStandbyTags();
        boolean iEquals = false;

        for (String standbyTag : standbyTags) {
            if (Integer.parseInt(standbyTag) == place)
                iEquals = true;
        }
        return !InstantStatus.iTask && taskQueue.isEmpty() && !iEquals;
    }

    public boolean addTaskToQueue(QTask task) {
        if(taskQueue.size() >= 5)
            return false;
        taskQueue.offer(task);
        bookedStation[task.getStartStationId()-1] = 1;
        bookedStation[task.getTerminalStationId()-1] = 2;
        return true;
    }


    public Integer getTerminalByNotification(String notificationId){
        if(taskQueue.size() >= 5) return null;
        int s,x;
        int notificationIdInt = Integer.parseInt(notificationId);
        if (notificationIdInt > 0 && notificationIdInt <= 5){
            s=1;x=5;
        }else if(notificationIdInt > 5 && notificationIdInt <= 10){
            s=6;x=10;
        }else if(notificationIdInt > 10 && notificationIdInt <= 15){
            s=11;x=15;
        }else {
            s = 0;x = 1;
        }
        for(int i=s;i<=x;i++){
            int stationStatus = stationManager.getStationStatus(i).getStatus();
            if(stationStatus == 0 || stationStatus == 1)
                return i;
        }
        return null;
    }

    public QTask peekTaskWithPlace() {
        if(taskQueue.isEmpty())return null;
        int place = Integer.parseInt(agvManager.getAgvStatus(1).getPlace()); // 只有一台車id=1
        int start, end;
        if (place >= 1001 && place <= 1050){
            start = 1;end = 5;
        } else if (place > 1050 && place <= 1100) {
            start = 6;end = 10;
        } else if (place > 1100 && place <= 1150) {
            start = 11;end = 15;
        }else return null;

        for (QTask task : taskQueue) {
            Integer startStation = task.getStartStationId();
            if(startStation >= start && startStation <= end){
                nowTaskNumber = task.getTaskNumber();
                return task;
            }
        }

        QTask task = taskQueue.peek();
        nowTaskNumber = Objects.requireNonNull(task).getTaskNumber();
        return task;
    }

    public boolean removeTaskByTaskNumber(String taskNumber) {
        Iterator<QTask> taskIterator = taskQueue.iterator();
        while (taskIterator.hasNext()) {
            QTask task = taskIterator.next();
            if (task.getTaskNumber().equals(taskNumber) && task.getStatus()==0) {
                taskIterator.remove();
                bookedStation[task.getStartStationId()-1] = 0;
                bookedStation[task.getTerminalStationId()-1] = 0;
                return true;
            }
        }
        return false;
    }

    public void failedTask() {
        Iterator<QTask> taskIterator = taskQueue.iterator();
        while (taskIterator.hasNext()) {
            QTask task = taskIterator.next();
            if (task.getTaskNumber().equals(nowTaskNumber)) {
                taskIterator.remove();
                bookedStation[task.getStartStationId()-1] = 0;
                bookedStation[task.getTerminalStationId()-1] = 0;
                nowTaskNumber = null;
            }
        }
    }

    public void completedTask() {
        taskQueue.removeIf(task -> task.getTaskNumber().equals(nowTaskNumber));
        nowTaskNumber=null;
    }

    public QTask getTaskByTaskNumber(String taskNumber) {
        return taskQueue.stream()
                .filter(task -> task.getTaskNumber().equals(taskNumber))
                .findFirst()
                .orElse(null);
    }

    public void updateTaskStatus(String taskNumber, int status){
        for (QTask task : taskQueue) {
            if (task.getTaskNumber().equals(taskNumber)) {
                task.setStatus(status);
            }
        }
    }

    public String getNowTaskNumber() {
        return nowTaskNumber;
    }

    public void setNowTaskNumber(String taskNumber) {
        nowTaskNumber = taskNumber;
    }

    public int getBookedStationStatusByStation(int station){
        return bookedStation[station-1];
    }

    public void setBookedStation(int station, int status){
        bookedStation[station-1] = status;
    }

}
