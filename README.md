# Home Assistant Assistant 驾驶证和车辆状态卡片

一个用于Home Assistant Lovelace界面的自定义卡片，用于展示驾驶证和车辆状态信息。

![驾驶证和车辆状态卡片](https://p3-flow-imagex-download-sign.byteimg.com/tos-cn-i-a9rns2rl98/e4e292de120d403da324c1e83eb99a3f.png~tplv-a9rns2rl98-24:720:720.png?rcl=20251028140934E8AD7E6835B6EFAF35A9&rk3s=8e244e95&rrcfp=8a172a1a&x-expires=1762236574&x-signature=DOiFcsQzkLVDk0A39PkNhFkyuNg%3D)

## 功能特点

- 展示驾驶证信息：有效期、有效期倒计时、驾驶证状态、扣分情况
- 展示车辆信息：年审审日期、年审倒计时、车辆状态、违章信息
- 支持多用户和多车辆配置
- 可视化编辑器，易于配置
- 自动计算倒计时天数
- 根据状态颜色标识（正常、警告、危险）
- 响应式设计，适配不同屏幕尺寸

## 安装方法

### 通过HACS（推荐）

1. 确保已安装HACS
2. 在HACS中添加自定义仓库：`https://github.com/B361273068/ha-driving-license-card`
3. 搜索并安装"Driving License Card"
4. 重启Home Assistant

### 手动安装

1. 下载最新版本的`driving-license-card.js`和`driving-license-editor.js`
2. 在Home Assistant的`config/www`目录下创建`driving-license-card`文件夹
3. 将下载的文件复制到该文件夹
4. 在Home Assistant的Lovelace资源中添加：
   ```yaml
   resources:
     - url: /local/driving-license-card/driving-license-card.js
       type: module
     - url: /local/driving-license-card/driving-license-editor.js
       type: module
   ```
5. 重启Home Assistant

## 配置方法

### 基本配置

```yaml
type: 'custom:driving-license-card'
title: '驾驶证和车辆状态'
users:
  - name: '张三'
    entities:
      license_expiry: 'sensor.license_expiry_zhangsan'
      license_status: 'sensor.license_status_zhangsan'
      penalty_points: 'sensor.penalty_points_zhangsan'
vehicles:
  - plate: '京A12345'
    entities:
      inspection_date: 'sensor.inspection_date_vehicle1'
      vehicle_status: 'sensor.vehicle_status_vehicle1'
      violations: 'sensor.violations_vehicle1'
```

### 多用户和多车辆配置

```yaml
type: 'custom:driving-license-card'
title: '驾驶证和车辆状态'
users:
  - name: '张三'
    entities:
      license_expiry: 'sensor.license_expiry_zhangsan'
      license_status: 'sensor.license_status_zhangsan'
      penalty_points: 'sensor.penalty_points_zhangsan'
  - name: '李四'
    entities:
      license_expiry: 'sensor.license_expiry_lisi'
      license_status: 'sensor.license_status_lisi'
      penalty_points: 'sensor.penalty_points_lisi'
vehicles:
  - plate: '京A12345'
    entities:
      inspection_date: 'sensor.inspection_date_vehicle1'
      vehicle_status: 'sensor.vehicle_status_vehicle1'
      violations: 'sensor.violations_vehicle1'
  - plate: '沪B67890'
    entities:
      inspection_date: 'sensor.inspection_date_vehicle2'
      vehicle_status: 'sensor.vehicle_status_vehicle2'
      violations: 'sensor.violations_vehicle2'
```

### 实体配置示例

你需要在Home Assistant中创建以下类型的实体：

#### 驾驶证有效期实体
```yaml
sensor:
  - platform: template
    sensors:
      license_expiry_zhangsan:
        friendly_name: "张三驾驶证有效期"
        value_template: "2026-05-20"
        unit_of_measurement: "日期"
```

#### 驾驶证状态实体
```yaml
sensor:
  - platform: template
    sensors:
      license_status_zhangsan:
        friendly_name: "张三驾驶证状态"
        value_template: "正常"
```

#### 扣分情况实体
```yaml
sensor:
  - platform: template
    sensors:
      penalty_points_zhangsan:
        friendly_name: "张三扣分情况"
        value_template: "3"
        attributes:
          max_points: 12
```

#### 车辆年审日期实体
```yaml
sensor:
  - platform: template
    sensors:
      inspection_date_vehicle1:
        friendly_name: "车辆1年审日期"
        value_template: "2025-12-15"
        unit_of_measurement: "日期"
```

#### 车辆状态实体
```yaml
sensor:
  - platform: template
    sensors:
      vehicle_status_vehicle1:
        friendly_name: "车辆1状态"
        value_template: "正常"
```

#### 违章信息实体
```yaml
sensor:
  - platform: template
    sensors:
      violations_vehicle1:
        friendly_name: "车辆1违章信息"
        value_template: "2"
        attributes:
          description: "2条未处理"
          unit_of_measurement: "条"
```

## 使用可视化编辑器

1. 在Lovelace编辑模式下，点击"添加卡片"
2. 选择"Driving License Card"
3. 使用可视化编辑器配置卡片：
   - 设置卡片标题
   - 添加/删除用户，配置用户姓名和相关实体
   - 添加/删除车辆，配置车牌号和相关实体
4. 点击"保存"完成配置

## 状态颜色说明

- **绿色**：正常状态，倒计时充足
- **橙色**：警告状态，倒计时不足30天或有违章记录
- **红色**：危险状态，已过期或状态异常

## 注意事项

1. 确保所有实体的状态格式正确，特别是日期格式应为"YYYY-MM-DD"
2. 扣分情况实体应包含`max_points`属性（默认为12）
3. 违章信息实体可包含`description`属性用于显示详细信息
4. 卡片会自动计算倒计时天数，负数表示已过期

## 未来计划

- 添加提醒功能
- 添加历史记录查看
- 支持深色模式
- 添加更多状态信息

## 问题反馈

如有任何问题或建议，请在GitHub上提交issue。

## 许可证

MIT License
