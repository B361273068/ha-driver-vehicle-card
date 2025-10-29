# Home Assistant Assistant 驾驶证和车辆状态卡片

一个用于Home Assistant Lovelace界面的自定义卡片，用于展示驾驶证和车辆状态信息。

<img width="497" height="663" alt="image" src="https://github.com/user-attachments/assets/26e1a179-c850-41de-b9d3-568bf2cf96da" />



## 功能特点

- 展示驾驶证信息：有效期、有效期倒计时、驾驶证状态、扣分情况
- 展示车辆信息：年审审日期、年审倒计时、车辆状态、违章信息
- 支持多用户和多车辆配置
- 可视化编辑器，易于配置
- 自动计算倒计时天数
- 根据状态颜色标识（正常、警告、危险）
- 响应式设计，适配不同屏幕尺寸
- 支持搜索Home Assistant中所有集成的实体


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

## 问题反馈

如有任何问题或建议，请在GitHub上提交issue。

## 许可证

MIT License
