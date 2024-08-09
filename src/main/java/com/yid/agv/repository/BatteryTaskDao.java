package com.yid.agv.repository;

import com.yid.agv.model.BatteryTask;

import java.util.List;

public interface BatteryTaskDao {

    List<BatteryTask> queryBatteryTaskRecentlyByAGV(Integer agvId);

    // date format: YYYYMMDD
    List<BatteryTask> queryBatteryTaskByAGVAndDay(Integer agvId, String date);

    void insertNewBatteryTask(int agvId, int battery, int task);
}