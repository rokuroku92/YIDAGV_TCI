package com.yid.agv.backend;

import com.yid.agv.backend.datastorage.AGVManager;
import com.yid.agv.backend.datastorage.TaskQueue;
import com.yid.agv.model.AgvStatus;
import com.yid.agv.model.QTask;
import com.yid.agv.model.Station;
import com.yid.agv.repository.AnalysisDao;
import com.yid.agv.repository.NotificationDao;
import com.yid.agv.repository.StationDao;
import com.yid.agv.repository.TaskDao;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Component
public class ProcessTasks {

    private static final Logger log = LoggerFactory.getLogger(ProcessTasks.class);
    @Value("${agvControl.url}")
    private String agvUrlValue;
    @Value("${http.max_retry}")
    private int maxRetry;
    private static String agvUrl;
    @Autowired
    private TaskDao taskDao;
    @Autowired
    private StationDao stationDao;
    @Autowired
    private AnalysisDao analysisDao;
    @Autowired
    private NotificationDao notificationDao;
    @Autowired
    private TaskQueue taskQueue;
    @Autowired
    private AGVManager agvManager;

    private static int MAX_RETRY;

    private static Map<Integer, Integer> stationIdTagMap;
    private static QTask toStandbyTask;


    @PostConstruct
    public void _init() {
        agvUrl = agvUrlValue;
        MAX_RETRY = maxRetry;
        stationIdTagMap = stationDao.queryStations().stream().
                collect(Collectors.toMap(Station::getId, Station::getTag));
    }

    private static boolean isRetrying = false;

    @Scheduled(fixedRate = 5000)
    public void dispatchTasks() {
        if(isRetrying || InstantStatus.iTask) return;
        if(agvManager.getAgvStatus(1).getStatus() != 2) return;  // AGV未連線則無法派遣

        if (InstantStatus.getAgvLowBattery()[0] && !taskQueue.iEqualsBatteryStandbyStation()){
            InstantStatus.iStandbyTask = true;
            goStandbyTaskByAgvId(notificationDao, taskDao, 1, agvManager.getAgvStatus(1), true);
        } else if (taskQueue.iDispatch()) {
//            InstantStatus.iStandby = false;
            QTask goTask = taskQueue.peekTaskWithPlace();
            log.info("Process dispatch...");
            log.info(agvManager.getAgvStatus(1).getPlace());
            String result = dispatchTaskToAGV(notificationDao, goTask, agvManager.getAgvStatus(1).getPlace(), 1);
            if (Objects.requireNonNull(result).equals("OK")) {
                taskQueue.updateTaskStatus(taskQueue.getNowTaskNumber(), 1);
                InstantStatus.startStation = goTask.getStartStationId();
                InstantStatus.terminalStation = goTask.getTerminalStationId();
            } else if (result.equals("FailedDispatch")) {
                log.warn("發送任務三次皆失敗，已取消任務");
                notificationDao.insertMessage(NotificationDao.Title.AGV_SYSTEM, NotificationDao.Status.FAILED_SEND_TASK_THREE_TIMES);
                taskQueue.failedTask();
            }
        }else if(taskQueue.isEmpty() && !taskQueue.iEqualsStandbyStation()){
            InstantStatus.iStandbyTask = true;
            goStandbyTaskByAgvId(notificationDao, taskDao, 1, agvManager.getAgvStatus(1), false);
        }
    }


    public static synchronized String dispatchTaskToAGV(NotificationDao notificationDao, QTask task, String nowPlace, int mode) {
        int retryCount = 0;
        while (retryCount < MAX_RETRY) {
            try {
                if (task != null) {
//                    if(nowPlace.equals("1001")) nowPlace = "1501";
                    // Dispatch the task to the AGV control system
                    String url;
                    if (task.getStartStationId() == 16 || task.getStartStationId() == 17
                            || mode == 2
                            || InstantStatus.taskProgress == InstantStatus.TaskProgress.PRE_TERMINAL_STATION){
                        url = agvUrl + "/task0=" + task.getAgvId() + "&" + task.getModeId() + "&" + nowPlace +
                                "&" + stationIdTagMap.get(task.getTerminalStationId());
                    } else {
                        url = agvUrl + "/task0=" + task.getAgvId() + "&" + task.getModeId() + "&" + nowPlace +
                                "&" + stationIdTagMap.get(task.getStartStationId()) + "&" + stationIdTagMap.get(task.getTerminalStationId());
                    }

                    log.info("URL: " + url);

                    // 看有沒有需要分成不一樣站點數的網址

                    HttpClient httpClient = HttpClient.newHttpClient();
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(url))
                            .GET()
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    String webpageContent = response.body().trim();

                    log.info("Task number " + task.getTaskNumber() + " has been dispatched.");

                    if(webpageContent.equals("OK")){
                        return "OK";
                    } else if (webpageContent.equals("FAIL")) {
                        log.warn("發送任務FAIL");
                        isRetrying = true;
                        retryCount++;
                        if (retryCount < MAX_RETRY) {
                            System.err.println("Failed to dispatch task, retrying... (Attempt " + retryCount + ")");
                            try {
                                Thread.sleep(3000); // 延遲再重新發送
                            } catch (InterruptedException ignored) {
                            }
                        } else {
                            System.err.println("Failed to dispatch task after " + MAX_RETRY + " attempts.");
                        }
                    } else {
//                        return "OK";
                        return "FailedDispatch";
                    }
                } else {
                    return "Task null";
                }
            } catch (IOException | InterruptedException e) {
                log.warn("發送任務失敗3秒後重新發送");
                // 重新發送前增加延遲
                notificationDao.insertMessage(NotificationDao.Title.AGV_SYSTEM, NotificationDao.Status.FAILED_SEND_TASK);
                isRetrying = true;
                retryCount++;
                if (retryCount < MAX_RETRY) {
                    System.err.println("Failed to dispatch task, retrying... (Attempt " + retryCount + ")");
                    try {
                        Thread.sleep(3000); // 延遲再重新發送
                    } catch (InterruptedException ignored) {
                    }
                } else {
                    System.err.println("Failed to dispatch task after " + MAX_RETRY + " attempts.");
                }
            }
        }
        isRetrying = false;
        return "FailedDispatch";
    }

    public static void failedTask(TaskQueue taskQueue, TaskDao taskDao){
        taskDao.cancelTask(taskQueue.getNowTaskNumber());
        taskQueue.removeTaskByTaskNumber(taskQueue.getNowTaskNumber());
        taskQueue.setNowTaskNumber("");
    }

    public static void completedTask(TaskQueue taskQueue, AnalysisDao analysisDao){
        QTask cTask = taskQueue.getTaskByTaskNumber(taskQueue.getNowTaskNumber());
        taskQueue.setBookedStation(Objects.requireNonNull(cTask, "起始站為空").getStartStationId(), 0);
        taskQueue.setBookedStation(cTask.getTerminalStationId(), 4);
        int analysisId = analysisDao.getTodayAnalysisId().get(cTask.getAgvId() - 1).getAnalysisId();
        analysisDao.updateTask(analysisDao.queryAnalysisByAnalysisId(analysisId).getTask() + 1, analysisId);
        log.info("Completed task number "+cTask.getTaskNumber()+".");
        taskQueue.completedTask();
        taskQueue.setNowTaskNumber("");
    }

    private static final int[] stationTag1 = new int[]{1252, 1254, 1256, 1258, 1260,
            1001, 1002, 1003, 1004, 1005, 1006,
            1007, 1008, 1009, 1010, 1011, 1012,
            1751, 1753, 1755, 1757, 1759, 1761,
            1253, 1255, 1257, 1259, 1261, 1501,
            1502, 1503, 1504, 1505, 1506, 1507,
            1508, 1509, 1510, 1511, 1512};
    private static final int[] stationTag2 = new int[]{1795, 1797, 1799, 1801, 1803, 1054};
    public static void goStandbyTaskByAgvId(NotificationDao notificationDao, TaskDao taskDao, int agvId, AgvStatus agvStatus, boolean lowBattery){
        int place = Integer.parseInt(agvStatus.getPlace());
        int standbyStation = -1;

        for (int tag: stationTag1) {
            if (place == tag) {
                standbyStation = 16;
                break;
            }
        }
        if(standbyStation == -1){
            for (int tag: stationTag2) {
                if (place == tag) {
                    standbyStation = 17;
                    break;
                }
            }
        }
        if(standbyStation == -1 || lowBattery){
            standbyStation = 17;
        }


        LocalDateTime now = LocalDateTime.now();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String formattedDateTime = now.format(formatter);

        toStandbyTask = new QTask();
        if(!lowBattery) {
            toStandbyTask.setAgvId(agvId);
            toStandbyTask.setModeId(0);
            toStandbyTask.setStatus(0);
            toStandbyTask.setTaskNumber("#SB" + formattedDateTime);
            toStandbyTask.setStartStationId(standbyStation);
            toStandbyTask.setTerminalStationId(standbyStation);
            toStandbyTask.setNotificationStationId(16);
        } else {
            toStandbyTask.setAgvId(agvId);
            toStandbyTask.setModeId(0);
            toStandbyTask.setStatus(0);
            toStandbyTask.setTaskNumber("#LB" + formattedDateTime);
            toStandbyTask.setStartStationId(standbyStation);
            toStandbyTask.setTerminalStationId(standbyStation);
            toStandbyTask.setNotificationStationId(16);
        }
        log.info("toStandbyTask.getTaskNumber(): "+toStandbyTask.getTaskNumber());
        log.info("formattedDateTime: "+formattedDateTime);
        log.info("toStandbyTask.getAgvId(): "+toStandbyTask.getAgvId());
        log.info("toStandbyTask.getStartStationId(): "+toStandbyTask.getStartStationId());
        log.info("toStandbyTask.getTerminalStationId(): "+toStandbyTask.getTerminalStationId());
        log.info("toStandbyTask.getNotificationStationId(): "+toStandbyTask.getNotificationStationId());
        log.info("toStandbyTask.getModeId(): "+toStandbyTask.getModeId());

        taskDao.insertTask(toStandbyTask.getTaskNumber(), formattedDateTime, Integer.toString(toStandbyTask.getAgvId()),
                Integer.toString(toStandbyTask.getStartStationId()), Integer.toString(toStandbyTask.getTerminalStationId()),
                Integer.toString(toStandbyTask.getNotificationStationId()), Integer.toString(toStandbyTask.getModeId()));
        dispatchTaskToAGV(notificationDao, toStandbyTask, agvStatus.getPlace(), 1);
    }

    public static void failedGoStandbyTask(TaskDao taskDao){
        log.warn("Failed task number "+toStandbyTask.getTaskNumber()+".");
        taskDao.updateTaskStatus(toStandbyTask.getTaskNumber(), -1);
        toStandbyTask = null;
    }

    public static void completedGoStandbyTask(TaskDao taskDao){
        log.info("Completed task number "+toStandbyTask.getTaskNumber()+".");
        taskDao.updateTaskStatus(toStandbyTask.getTaskNumber(), 100);
        toStandbyTask = null;
    }
    public static boolean getIsRetrying(){
        return isRetrying;
    }
}