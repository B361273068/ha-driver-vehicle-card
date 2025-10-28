[file name]: image.png
[file content begin]
驾驶证和车辆状态

驾驶证信息

有效期至    2026-05-20

有效期倒计时    205天

驾驶证状态    正常

扣分情况    3分 / 12分

车辆信息

年审日期    2025-12-15

年审倒计时    49天

车辆状态    正常

违章信息    2条未处理

最后更新: 2025/10/27 14:19:23


[file content end]

// 主卡片类 - 修改样式以匹配图片
class DrivingLicenseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  static getConfigElement() {
    return document.createElement("driving-license-editor");
  }

  static getStubConfig() {
    return {
      title: "驾驶证和车辆状态",
      show_last_updated: true,
      last_update_entity: "",
      users: [
        {
          name: "示例用户",
          entities: {
            license_expiry: "",
            license_status: "",
            penalty_points: ""
          }
        }
      ],
      vehicles: [
        {
          plate_entity: "",
          entities: {
            inspection_date: "",
            vehicle_status: "",
            violations: ""
          }
        }
      ]
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("配置不能为空");
    }

    this._config = {
      title: '驾驶证和车辆状态',
      show_last_updated: true,
      last_update_entity: '',
      users: [],
      vehicles: [],
      ...config
    };

    if (!this._config.users || this._config.users.length === 0) {
      this._config.users = [{
        name: '请配置姓名',
        entities: {
          license_expiry: '',
          license_status: '',
          penalty_points: ''
        }
      }];
    }

    if (!this._config.vehicles || this._config.vehicles.length === 0) {
      this._config.vehicles = [{
        plate_entity: '',
        entities: {
          inspection_date: '',
          vehicle_status: '',
          violations: ''
        }
      }];
    }

    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    let size = 2;
    size += this._config.users.length * 2;
    size += this._config.vehicles.length * 3;
    return size;
  }

  calculateDaysDifference(dateString) {
    if (!dateString) return null;
    const today = new Date();
    const targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) return null;
    const diffTime = targetDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getEntityState(entityId) {
    if (!this._hass || !entityId) return null;
    return this._hass.states[entityId];
  }

  getStatusInfo(status) {
    if (!status) return { text: '未知', color: 'gray', icon: 'help-circle' };
    
    status = status.toLowerCase();
    if (status.includes('正常')) return { text: '正常', color: 'green', icon: 'check-circle' };
    if (status.includes('警告') || status.includes('即将到期')) return { text: '警告', color: 'orange', icon: 'alert-circle' };
    if (status.includes('过期') || status.includes('异常')) return { text: '异常', color: 'red', icon: 'close-circle' };
    return { text: status, color: 'blue', icon: 'information' };
  }

  getCountdownInfo(days) {
    if (days === null || days === undefined) return { text: '未知', color: 'gray' };
    if (days < 0) return { text: '已过期', color: 'red' };
    if (days < 30) return { text: `${days}天`, color: 'orange' };
    if (days < 90) return { text: `${days}天`, color: 'blue' };
    return { text: `${days}天`, color: 'green' };
  }

  getPointsInfo(points, maxPoints = 12) {
    if (!points || points === '未知') return { text: '0分', color: 'green', value: 0 };
    
    const pointsValue = parseInt(points);
    if (isNaN(pointsValue)) return { text: '0分', color: 'green', value: 0 };
    
    const percentage = pointsValue / maxPoints;
    let color = 'green';
    if (percentage >= 0.75) color = 'red';
    else if (percentage >= 0.5) color = 'orange';
    
    return { text: `${pointsValue}分`, color, value: pointsValue };
  }

  render() {
    if (!this._hass || !this._config) return;

    let lastUpdated = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const lastUpdateEntityId = this._config.last_update_entity;
    if (lastUpdateEntityId) {
      const lastUpdateEntity = this.getEntityState(lastUpdateEntityId);
      if (lastUpdateEntity) {
        const updateTime = lastUpdateEntity.last_updated || lastUpdateEntity.state;
        if (updateTime) {
          lastUpdated = new Date(updateTime).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      }
    }

    const renderUserCards = () => {
      return this._config.users.map((user, index) => {
        const expiryEntity = this.getEntityState(user.entities?.license_expiry);
        const statusEntity = this.getEntityState(user.entities?.license_status);
        const pointsEntity = this.getEntityState(user.entities?.penalty_points);
        
        const expiryDate = expiryEntity?.state || null;
        const expiryDays = this.calculateDaysDifference(expiryDate);
        const statusInfo = this.getStatusInfo(statusEntity?.state);
        const pointsInfo = this.getPointsInfo(pointsEntity?.state);
        const countdownInfo = this.getCountdownInfo(expiryDays);
        
        return `
          <div class="info-card">
            <div class="card-header">
              <div class="header-icon">🚗</div>
              <div class="header-title">驾驶证信息</div>
            </div>
            
            <div class="card-content">
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">有效期至</div>
                  <div class="info-value">${expiryDate || '未配置'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">有效期倒计时</div>
                  <div class="info-value countdown-${countdownInfo.color}">
                    ${countdownInfo.text}
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">驾驶证状态</div>
                  <div class="info-value status-${statusInfo.color}">
                    ${statusInfo.text}
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">扣分情况</div>
                  <div class="info-value points-${pointsInfo.color}">
                    ${pointsInfo.text} / 12分
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    const renderVehicleCards = () => {
      return this._config.vehicles.map((vehicle, index) => {
        const plateEntity = this.getEntityState(vehicle.plate_entity);
        const inspectionEntity = this.getEntityState(vehicle.entities?.inspection_date);
        const statusEntity = this.getEntityState(vehicle.entities?.vehicle_status);
        const violationsEntity = this.getEntityState(vehicle.entities?.violations);
        
        const plateNumber = plateEntity?.state || '';
        const inspectionDate = inspectionEntity?.state || null;
        const inspectionDays = this.calculateDaysDifference(inspectionDate);
        const statusInfo = this.getStatusInfo(statusEntity?.state);
        const violations = violationsEntity?.state || '0';
        const violationsCount = parseInt(violations) || 0;
        const countdownInfo = this.getCountdownInfo(inspectionDays);
        
        return `
          <div class="info-card">
            <div class="card-header">
              <div class="header-icon">📄</div>
              <div class="header-title">车辆信息</div>
            </div>
            
            <div class="card-content">
              <div class="info-grid">
                <div class="info-row">
                  <div class="info-label">年审日期</div>
                  <div class="info-value">${inspectionDate || '未配置'}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">年审倒计时</div>
                  <div class="info-value countdown-${countdownInfo.color}">
                    ${countdownInfo.text}
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">车辆状态</div>
                  <div class="info-value status-${statusInfo.color}">
                    ${statusInfo.text}
                  </div>
                </div>
                <div class="info-row">
                  <div class="info-label">违章信息</div>
                  <div class="info-value violations-${violationsCount > 0 ? 'red' : 'green'}">
                    ${violationsCount}条未处理
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .card-container {
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family);
        }
        
        .card-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--primary-text-color);
          text-align: center;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--primary-color);
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .info-card {
          background: var(--card-background-color);
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          border: 1px solid var(--divider-color);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          padding: 16px 20px;
          background: linear-gradient(135deg, var(--primary-color), #1976D2);
          color: white;
          gap: 12px;
        }
        
        .header-icon {
          font-size: 20px;
          opacity: 0.9;
        }
        
        .header-title {
          font-size: 16px;
          font-weight: 600;
        }
        
        .card-content {
          padding: 20px;
        }
        
        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid var(--divider-color);
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .info-label {
          font-size: 14px;
          color: var(--secondary-text-color);
          font-weight: 500;
          flex: 1;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-text-color);
          text-align: right;
          flex: 1;
        }
        
        /* 颜色主题 */
        .status-green, .countdown-green, .points-green {
          color: var(--success-color, #4CAF50);
        }
        .status-orange, .countdown-orange, .points-orange {
          color: var(--warning-color, #FF9800);
        }
        .status-red, .countdown-red, .points-red, .violations-red {
          color: var(--error-color, #F44336);
        }
        .status-blue, .countdown-blue {
          color: var(--info-color, #2196F3);
        }
        .status-gray, .countdown-gray {
          color: var(--disabled-text-color, #9E9E9E);
        }
        
        .last-updated {
          text-align: center;
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 20px;
          padding: 12px 16px;
          background: var(--secondary-background-color);
          border-radius: 8px;
          border: 1px solid var(--divider-color);
        }
        
        .last-updated::before {
          content: "📅 ";
          margin-right: 4px;
        }
        
        @media (max-width: 768px) {
          .cards-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .card-content {
            padding: 16px;
          }
          
          .info-row {
            padding: 10px 0;
          }
          
          .info-label, .info-value {
            font-size: 13px;
          }
        }
        
        @media (max-width: 480px) {
          .card-container {
            padding: 12px;
          }
          
          .card-title {
            font-size: 16px;
            margin-bottom: 16px;
          }
          
          .card-header {
            padding: 12px 16px;
          }
          
          .header-title {
            font-size: 15px;
          }
        }
      </style>
      
      <ha-card>
        <div class="card-container">
          <div class="card-title">${this._config.title}</div>
          
          <div class="cards-grid">
            ${renderUserCards()}
            ${renderVehicleCards()}
          </div>
          
          ${this._config.show_last_updated ? `
            <div class="last-updated">最后更新：${lastUpdated}</div>
          ` : ''}
        </div>
      </ha-card>
    `;
  }
}

// 编辑器类保持不变
class DrivingLicenseEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
    this._inputTimeout = null;
  }

  setConfig(config) {
    if (!config) {
      config = {};
    }
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._config) {
      this._render();
    }
  }

  _render() {
    if (!this._config) {
      this._config = {};
    }

    const config = this._config;

    this.innerHTML = `
      <div class="editor-container">
        <style>
          .editor-container {
            padding: 16px;
            font-family: var(--paper-font-body1_-_font-family);
          }
          
          .section {
            margin-bottom: 24px;
            padding: 16px;
            border: 1px solid var(--divider-color);
            border-radius: 8px;
            background: var(--card-background-color);
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--primary-text-color);
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--divider-color);
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: var(--primary-text-color);
            font-size: 14px;
          }
          
          .text-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            background: var(--card-background-color);
            color: var(--primary-text-color);
            font-size: 14px;
            box-sizing: border-box;
          }
          
          .text-input:focus {
            outline: none;
            border-color: var(--primary-color);
          }
          
          .config-item {
            position: relative;
            padding: 16px;
            margin-bottom: 16px;
            border: 1px solid var(--divider-color);
            border-radius: 8px;
            background: var(--secondary-background-color);
          }
          
          .remove-btn {
            position: absolute;
            top: 12px;
            right: 12px;
            background: var(--error-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 10px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          }
          
          .remove-btn:hover {
            background: var(--dark-error-color);
          }
          
          .remove-btn:disabled {
            background: var(--disabled-color);
            cursor: not-allowed;
          }
          
          .add-btn {
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 16px;
            cursor: pointer;
            margin-top: 8px;
            font-size: 14px;
            font-weight: 500;
          }
          
          .add-btn:hover {
            background: var(--dark-primary-color);
          }
          
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          .help-text {
            font-size: 12px;
            color: var(--secondary-text-color);
            margin-top: 4px;
            font-style: italic;
          }
          
          .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 0;
          }
          
          .checkbox-group input[type="checkbox"] {
            width: 16px;
            height: 16px;
          }
          
          @media (max-width: 768px) {
            .grid-2 {
              grid-template-columns: 1fr;
              gap: 12px;
            }
            
            .editor-container {
              padding: 12px;
            }
            
            .section {
              padding: 12px;
            }
          }
        </style>

        <!-- 基本配置 -->
        <div class="section">
          <div class="section-title">基本配置</div>
          <div class="form-group">
            <label class="form-label">卡片标题</label>
            <input
              type="text"
              class="text-input"
              value="${config.title || '驾驶证和车辆状态'}"
              placeholder="输入卡片标题"
              data-path="title"
            >
            <div class="help-text">设置卡片显示的主标题</div>
          </div>
          <div class="form-group">
            <div class="checkbox-group">
              <input
                type="checkbox"
                id="show-last-updated"
                data-path="show_last_updated"
                ${config.show_last_updated !== false ? 'checked' : ''}
              >
              <label class="form-label" for="show-last-updated">显示最后更新时间</label>
            </div>
            <div class="help-text">显示数据的最后更新时间</div>
          </div>
          <div class="form-group">
            <label class="form-label">最后更新时间实体</label>
            <input
              type="text"
              class="text-input entity-input"
              value="${config.last_update_entity || ''}"
              placeholder="输入实体ID，如: sensor.last_update"
              data-path="last_update_entity"
            >
            <div class="help-text">输入实体ID，如: sensor.last_update_time</div>
          </div>
        </div>

        <!-- 用户配置 -->
        <div class="section">
          <div class="section-title">驾驶证信息配置</div>
          <div id="users-container">
            ${this._renderUsers()}
          </div>
          <button class="add-btn" id="add-user-btn" type="button">
            + 添加用户
          </button>
        </div>

        <!-- 车辆配置 -->
        <div class="section">
          <div class="section-title">车辆信息配置</div>
          <div id="vehicles-container">
            ${this._renderVehicles()}
          </div>
          <button class="add-btn" id="add-vehicle-btn" type="button">
            + 添加车辆
          </button>
        </div>

        <!-- 使用说明 -->
        <div class="section">
          <div class="section-title">使用说明</div>
          <div style="font-size: 14px; color: var(--secondary-text-color); line-height: 1.6;">
            <p><strong>实体配置要求：</strong></p>
            <ul style="margin: 8px 0; padding-left: 16px;">
              <li><strong>驾驶证有效期</strong>：日期格式传感器 (YYYY-MM-DD)</li>
              <li><strong>驾驶证状态</strong>：文本状态传感器 (正常/警告/过期)</li>
              <li><strong>扣分情况</strong>：数字类型传感器</li>
              <li><strong>车牌号码</strong>：文本类型传感器</li>
              <li><strong>年审日期</strong>：日期格式传感器 (YYYY-MM-DD)</li>
              <li><strong>车辆状态</strong>：文本状态传感器 (正常/异常)</li>
              <li><strong>违章信息</strong>：数字类型传感器</li>
              <li><strong>最后更新时间</strong>：任何包含时间信息的实体</li>
            </ul>
            <p><strong>实体ID格式：</strong> domain.entity_name，例如: sensor.driving_license_expiry</p>
            <p><strong>提示</strong>：使用模板传感器创建所需实体</p>
          </div>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _renderUsers() {
    const users = this._config.users || [this._getDefaultUser()];
    return users.map((user, index) => `
      <div class="config-item">
        <button class="remove-btn" data-user-index="${index}" ${users.length <= 1 ? 'disabled' : ''} type="button">
          删除
        </button>
        
        <div class="form-group">
          <label class="form-label">用户姓名</label>
          <input
            type="text"
            class="text-input user-name"
            value="${user.name || ''}"
            placeholder="请输入用户姓名"
            data-user-index="${index}"
            data-path="name"
          >
          <div class="help-text">驾驶证持有人的姓名</div>
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">驾驶证有效期实体</label>
            <input
              type="text"
              class="text-input entity-input"
              value="${user.entities?.license_expiry || ''}"
              placeholder="输入实体ID，如: sensor.license_expiry"
              data-user-index="${index}"
              data-entity-type="license_expiry"
            >
            <div class="help-text">选择驾驶证有效期实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">驾驶证状态实体</label>
            <input
              type="text"
              class="text-input entity-input"
              value="${user.entities?.license_status || ''}"
              placeholder="输入实体ID，如: sensor.license_status"
              data-user-index="${index}"
              data-entity-type="license_status"
            >
            <div class="help-text">选择驾驶证状态实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">扣分情况实体</label>
            <input
              type="text"
              class="text-input entity-input"
              value="${user.entities?.penalty_points || ''}"
              placeholder="输入实体ID，如: sensor.penalty_points"
              data-user-index="${index}"
              data-entity-type="penalty_points"
            >
            <div class="help-text">选择扣分情况实体</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  _renderVehicles() {
    const vehicles = this._config.vehicles || [this._getDefaultVehicle()];
    return vehicles.map((vehicle, index) => `
      <div class="config-item">
        <button class="remove-btn" data-vehicle-index="${index}" ${vehicles.length <= 1 ? 'disabled' : ''} type="button">
          删除
        </button>
        
        <div class="form-group">
          <label class="form-label">车牌号码实体</label>
          <input
            type="text"
            class="text-input entity-input"
            value="${vehicle.plate_entity || ''}"
            placeholder="输入实体ID，如: sensor.car_plate"
            data-vehicle-index="${index}"
            data-entity-type="plate_entity"
          >
          <div class="help-text">选择包含车牌号码的传感器实体</div>
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">年审日期实体</label>
            <input
              type="text"
              class="text-input entity-input"
              value="${vehicle.entities?.inspection_date || ''}"
              placeholder="输入实体ID，如: sensor.inspection_date"
              data-vehicle-index="${index}"
              data-entity-type="inspection_date"
            >
            <div class="help-text">选择年审日期实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">车辆状态实体</label>
            <input
              type="text"
              class="text-input entity-input"
              value="${vehicle.entities?.vehicle_status || ''}"
              placeholder="输入实体ID，如: sensor.vehicle_status"
              data-vehicle-index="${index}"
              data-entity-type="vehicle_status"
            >
            <div class="help-text">选择车辆状态实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">违章信息实体</label>
            <input
              type="text"
              class="text-input entity-input"
              value="${vehicle.entities?.violations || ''}"
              placeholder="输入实体ID，如: sensor.violations"
              data-vehicle-index="${index}"
              data-entity-type="violations"
            >
            <div class="help-text">选择违章信息实体</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  _getDefaultUser() {
    return {
      name: '新用户',
      entities: {
        license_expiry: '',
        license_status: '',
        penalty_points: ''
      }
    };
  }

  _getDefaultVehicle() {
    return {
      plate_entity: '',
      entities: {
        inspection_date: '',
        vehicle_status: '',
        violations: ''
      }
    };
  }

  _bindEvents() {
    this._setupInputHandlers();
    
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const target = e.target;
        const path = target.getAttribute('data-path');
        this._updateConfig(path, target.checked);
      });
    });

    this.querySelectorAll('.remove-btn[data-user-index]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const userIndex = parseInt(e.target.getAttribute('data-user-index'));
        this._removeUser(userIndex);
      });
    });

    this.querySelectorAll('.remove-btn[data-vehicle-index]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const vehicleIndex = parseInt(e.target.getAttribute('data-vehicle-index'));
        this._removeVehicle(vehicleIndex);
      });
    });

    this.querySelector('#add-user-btn').addEventListener('click', () => {
      this._addUser();
    });
    this.querySelector('#add-vehicle-btn').addEventListener('click', () => {
      this._addVehicle();
    });
  }

  _setupInputHandlers() {
    const setupInputHandler = (input) => {
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      newInput.addEventListener('blur', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._handleInputUpdate(e.target);
      });
      
      newInput.addEventListener('input', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (this._inputTimeout) {
          clearTimeout(this._inputTimeout);
        }
        
        this._inputTimeout = setTimeout(() => {
          this._handleInputUpdate(e.target);
        }, 500);
      });
      
      const stopPropagation = (e) => {
        e.stopPropagation();
      };
      
      newInput.addEventListener('keydown', stopPropagation);
      newInput.addEventListener('keyup', stopPropagation);
      newInput.addEventListener('keypress', stopPropagation);
    };

    this.querySelectorAll('input[type="text"]').forEach(setupInputHandler);
  }

  _handleInputUpdate(target) {
    const path = target.getAttribute('data-path');
    
    if (target.classList.contains('user-name')) {
      const userIndex = parseInt(target.getAttribute('data-user-index'));
      this._updateUserField(userIndex, 'name', target.value);
    } else if (target.classList.contains('entity-input')) {
      const userIndex = target.getAttribute('data-user-index');
      const vehicleIndex = target.getAttribute('data-vehicle-index');
      const entityType = target.getAttribute('data-entity-type');

      if (userIndex !== null) {
        this._updateUserField(parseInt(userIndex), `entities.${entityType}`, target.value);
      } else if (vehicleIndex !== null) {
        if (entityType === 'plate_entity') {
          this._updateVehicleField(parseInt(vehicleIndex), 'plate_entity', target.value);
        } else {
          this._updateVehicleField(parseInt(vehicleIndex), `entities.${entityType}`, target.value);
        }
      } else {
        this._updateConfig(path, target.value);
      }
    } else {
      this._updateConfig(path, target.value);
    }
  }

  _addUser() {
    if (!this._config.users) this._config.users = [];
    this._config.users.push(this._getDefaultUser());
    this._fireEvent();
  }

  _addVehicle() {
    if (!this._config.vehicles) this._config.vehicles = [];
    this._config.vehicles.push(this._getDefaultVehicle());
    this._fireEvent();
  }

  _removeUser(index) {
    if (!this._config.users || this._config.users.length <= 1) return;
    this._config.users.splice(index, 1);
    this._fireEvent();
  }

  _removeVehicle(index) {
    if (!this._config.vehicles || this._config.vehicles.length <= 1) return;
    this._config.vehicles.splice(index, 1);
    this._fireEvent();
  }

  _updateConfig(key, value) {
    this._config[key] = value;
    this._fireEvent();
  }

  _updateUserField(index, field, value) {
    if (!this._config.users) this._config.users = [this._getDefaultUser()];
    if (!this._config.users[index]) return;

    if (field === 'name') {
      this._config.users[index].name = value;
    } else if (field.startsWith('entities.')) {
      const entityField = field.replace('entities.', '');
      if (!this._config.users[index].entities) {
        this._config.users[index].entities = {};
      }
      this._config.users[index].entities[entityField] = value;
    }

    this._fireEvent();
  }

  _updateVehicleField(index, field, value) {
    if (!this._config.vehicles) this._config.vehicles = [this._getDefaultVehicle()];
    if (!this._config.vehicles[index]) return;

    if (field === 'plate_entity') {
      this._config.vehicles[index].plate_entity = value;
    } else if (field.startsWith('entities.')) {
      const entityField = field.replace('entities.', '');
      if (!this._config.vehicles[index].entities) {
        this._config.vehicles[index].entities = {};
      }
      this._config.vehicles[index].entities[entityField] = value;
    }

    this._fireEvent();
  }

  _fireEvent() {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true
    });
    event.detail = { config: this._config };
    this.dispatchEvent(event);
  }
}

// 注册卡片和编辑器
if (!customElements.get('driving-license-card')) {
  customElements.define('driving-license-card', DrivingLicenseCard);
}

if (!customElements.get('driving-license-editor')) {
  customElements.define('driving-license-editor', DrivingLicenseEditor);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'driving-license-card',
  name: 'Driving License Card',
  description: 'A card to display driving license and vehicle status information',
  preview: true,
  documentationURL: 'https://github.com/B361273068/ha-driving-license-card'
});

console.log('Driving License Card with updated design loaded successfully');
