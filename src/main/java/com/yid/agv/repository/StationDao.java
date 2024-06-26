
package com.yid.agv.repository;


import com.yid.agv.model.NotificationStation;
import com.yid.agv.model.Station;

import java.util.List;

public interface StationDao {
    List<Station> queryStations();
    List<String> queryStandbyTags();
    List<NotificationStation> queryNotificationStations();
    String getStationTagById(int id);
}
