package com.yid.agv.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class EventLoggerService {
    private static final Logger log = LoggerFactory.getLogger(EventLoggerService.class);
    private static final String FILE_PATH = "AGVSystem-event.txt";
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public void logEvent(int agvId, String event, int battery, String place) {
        String timestamp = LocalDateTime.now().format(formatter);

        try {
            File file = new File(FILE_PATH);

            // 如果文件不存在，則創建
            if (!file.exists()) {
                if(!file.createNewFile()) {
                    log.error("Failed to create file: " + FILE_PATH);
                    return;
                }
            }

            // 使用 FileWriter 和 BufferedWriter 寫入文件
            try (FileWriter fw = new FileWriter(file, true);
                 BufferedWriter bw = new BufferedWriter(fw)) {
                bw.write(timestamp+ " | AGV: " + agvId + " | Event: " + event + " | Battery: " + battery + " | Place: " + place);
                bw.newLine();
            }

        } catch (IOException e) {
            // 處理例外狀況
            log.error(e.getMessage());
        }
    }
}
