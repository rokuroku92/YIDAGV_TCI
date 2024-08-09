package com.yid.agv.model;

public class BatteryTask {
    private Long id;
    private int agvId;
    private int battery;
    private int task;
    private String date;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public int getAgvId() {
        return agvId;
    }

    public void setAgvId(int agvId) {
        this.agvId = agvId;
    }

    public int getBattery() {
        return battery;
    }

    public void setBattery(int battery) {
        this.battery = battery;
    }

    public int getTask() {
        return task;
    }

    public void setTask(int task) {
        this.task = task;
    }

    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }
}
