package com.yid.agv.repository.impls;

import com.yid.agv.model.BatteryTask;
import com.yid.agv.repository.BatteryTaskDao;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class BatteryTaskDaoImpl implements BatteryTaskDao {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public List<BatteryTask> queryBatteryTaskRecentlyByAGV(Integer agvId) {
        String sql = "SELECT * \n" +
                "FROM (\n" +
                "    SELECT * \n" +
                "    FROM battery_task\n" +
                "    WHERE `agv_id` = ?\n" +
                "    ORDER BY id DESC\n" +
                "    LIMIT 30\n" +
                ") AS subquery\n" +
                "ORDER BY id ASC";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(BatteryTask.class), agvId);
    }

    @Override
    public List<BatteryTask> queryBatteryTaskByAGVAndDay(Integer agvId, String date) {
        String sql = "SELECT *\n" +
                "FROM battery_task\n" +
                "WHERE DATE_FORMAT(`date`, '%Y%m%d') = ?\n" +
                "AND `agv_id` = ?";
        return jdbcTemplate.query(sql, new BeanPropertyRowMapper<>(BatteryTask.class), date, agvId);
    }

    @Override
    public void insertNewBatteryTask(int agvId, int battery, int task) {
        String sql = "INSERT INTO `battery_task`(`agv_id`,`battery`,`task`) VALUES(?, ?, ?)";
        // 使用 JdbcTemplate 的 update 方法執行 SQL 語句
        jdbcTemplate.update(sql, agvId, battery, task);
    }
}
