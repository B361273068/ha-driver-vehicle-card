// 主卡片类
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

    // 获取最后更新时间（从配置的实体获取）
    let lastUpdated = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // 尝试从配置的实体获取最后更新时间
    const lastUpdateEntityId = this._config.last_update_entity;
    if (lastUpdateEntityId) {
      const lastUpdateEntity = this.getEntityState(lastUpdateEntityId);
      if (lastUpdateEntity) {
        // 优先使用实体的最后更新时间
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
          <div class="license-card">
            <div class="card-header">
              <div class="header-icon">📄</div>
              <div class="header-title">
                <div class="title-main">驾驶证信息</div>
                <div class="title-sub">${user.name}</div>
              </div>
              <div class="status-badge status-${statusInfo.color}">
                <ha-icon icon="mdi:${statusInfo.icon}"></ha-icon>
                ${statusInfo.text}
              </div>
            </div>
            
            <div class="card-content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">有效期至</div>
                  <div class="info-value">${expiryDate || '未配置'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">有效期倒计时</div>
                  <div class="info-value countdown-${countdownInfo.color}">
                    ${countdownInfo.text}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">扣分情况</div>
                  <div class="info-value points-${pointsInfo.color}">
                    ${pointsInfo.text}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">累计扣分</div>
                  <div class="points-progress">
                    <div class="progress-bar">
                      <div class="progress-fill points-${pointsInfo.color}" 
                           style="width: ${(pointsInfo.value / 12) * 100}%"></div>
                    </div>
                    <div class="progress-text">${pointsInfo.value}/12</div>
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
        
        const plateNumber = plateEntity?.state || '未配置车牌';
        const inspectionDate = inspectionEntity?.state || null;
        const inspectionDays = this.calculateDaysDifference(inspectionDate);
        const statusInfo = this.getStatusInfo(statusEntity?.state);
        const violations = violationsEntity?.state || '0';
        const violationsCount = parseInt(violations) || 0;
        const countdownInfo = this.getCountdownInfo(inspectionDays);
        
        return `
          <div class="vehicle-card">
            <div class="card-header">
              <div class="header-icon">🚗</div>
              <div class="header-title">
                <div class="title-main">车辆信息</div>
                <div class="title-sub">${plateNumber}</div>
              </div>
              <div class="status-badge status-${statusInfo.color}">
                <ha-icon icon="mdi:${statusInfo.icon}"></ha-icon>
                ${statusInfo.text}
              </div>
            </div>
            
            <div class="card-content">
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">年审日期</div>
                  <div class="info-value">${inspectionDate || '未配置'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">年审倒计时</div>
                  <div class="info-value countdown-${countdownInfo.color}">
                    ${countdownInfo.text}
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">违章信息</div>
                  <div class="info-value violations-${violationsCount > 0 ? 'red' : 'green'}">
                    ${violationsCount}条未处理
                  </div>
                </div>
                <div class="info-item">
                  <div class="info-label">车辆状态</div>
                  <div class="status-indicators">
                    <div class="status-indicator status-${statusInfo.color}">
                      <ha-icon icon="mdi:${statusInfo.icon}"></ha-icon>
                      ${statusInfo.text}
                    </div>
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
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 16px;
          color: var(--primary-text-color);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .license-card, .vehicle-card {
          background: var(--card-background-color);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border: 1px solid var(--divider-color);
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .license-card:hover, .vehicle-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .card-header {
          display: flex;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, var(--primary-color), #1976D2);
          color: white;
          gap: 12px;
        }
        
        .header-icon {
          font-size: 24px;
          opacity: 0.9;
        }
        
        .header-title {
          flex: 1;
        }
        
        .title-main {
          font-size: 16px;
          font-weight: 500;
        }
        
        .title-sub {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 2px;
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
        }
        
        .card-content {
          padding: 20px 16px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .info-label {
          font-size: 12px;
          color: var(--secondary-text-color);
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        
        .points-progress {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .progress-bar {
          flex: 1;
          height: 8px;
          background: var(--divider-color);
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 12px;
          color: var(--secondary-text-color);
          min-width: 40px;
          font-weight: 500;
        }
        
        .status-indicators {
          display: flex;
          gap: 8px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          background: var(--secondary-background-color);
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
        
        .progress-fill.points-green { background: var(--success-color, #4CAF50); }
        .progress-fill.points-orange { background: var(--warning-color, #FF9800); }
        .progress-fill.points-red { background: var(--error-color, #F44336); }
        
        .last-updated {
          text-align: center;
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--divider-color);
          background: var(--secondary-background-color);
          padding: 8px 16px;
          border-radius: 8px;
        }
        
        @media (max-width: 600px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
          
          .card-content {
            padding: 16px 12px;
          }
        }
      </style>
      
      <ha-card>
        <div class="card-container">
          <div class="card-title">
            <span>${this._config.title}</span>
          </div>
          
          <div class="cards-grid">
            ${renderUserCards()}
            ${renderVehicleCards()}
          </div>
          
          ${this._config.show_last_updated ? `
            <div class="last-updated">
              📅 最后更新: ${lastUpdated}
            </div>
          ` : ''}
        </div>
      </ha-card>
    `;
  }
}

// 编辑器类 - 完全重写输入处理
class DrivingLicenseEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._inputTimeout = null;
  }

  setConfig(config) {
    this._config = config || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) {
      this.innerHTML = `<div>Loading...</div>`;
      return;
    }

    const config = this._config;

    this.innerHTML = `
      <style>
        .editor-container {
          padding: 20px;
          font-family: var(--paper-font-body1_-_font-family);
          background: var(--card-background-color);
        }
        
        .section {
          margin-bottom: 24px;
          padding: 20px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 12px;
          background: var(--card-background-color, white);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--primary-color, #03a9f4);
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid var(--primary-color);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .section-title::before {
          content: "📋";
          font-size: 16px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--primary-text-color, #212121);
          font-size: 14px;
        }
        
        .form-control {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          background: var(--card-background-color, white);
          color: var(--primary-text-color, #212121);
          font-size: 14px;
          transition: border-color 0.3s ease;
          box-sizing: border-box;
        }
        
        .form-control:focus {
          outline: none;
          border-color: var(--primary-color, #03a9f4);
        }
        
        .form-control[type="text"] {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        
        .config-item {
          position: relative;
          padding: 20px;
          margin-bottom: 20px;
          border: 2px solid var(--divider-color, #e0e0e0);
          border-radius: 12px;
          background: var(--secondary-background-color, #f8f9fa);
        }
        
        .remove-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: var(--error-color, #f44336);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background-color 0.3s ease;
        }
        
        .remove-btn:hover {
          background: var(--dark-error-color, #d32f2f);
        }
        
        .remove-btn:disabled {
          background: var(--disabled-color, #9e9e9e);
          cursor: not-allowed;
        }
        
        .add-btn {
          background: var(--primary-color, #03a9f4);
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          cursor: pointer;
          margin-top: 12px;
          font-size: 14px;
          font-weight: 600;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .add-btn:hover {
          background: var(--dark-primary-color, #0288d1);
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .help-text {
          font-size: 12px;
          color: var(--secondary-text-color, #757575);
          margin-top: 6px;
          font-style: italic;
        }
        
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
        }
        
        .checkbox-group input[type="checkbox"] {
          width: 18px;
          height: 18px;
        }
        
        .entity-select {
          width: 100%;
        }
        
        /* 防止语音助手弹出的特殊样式 */
        .no-voice-assistant {
          -webkit-user-select: text !important;
          -moz-user-select: text !important;
          -ms-user-select: text !important;
          user-select: text !important;
        }
        
        .no-voice-assistant:focus {
          outline: 2px solid var(--primary-color) !important;
          outline-offset: 2px !important;
        }
        
        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .editor-container {
            padding: 16px;
          }
          
          .section {
            padding: 16px;
          }
        }
      </style>

      <div class="editor-container">
        <!-- 基本配置 -->
        <div class="section">
          <div class="section-title">基本配置</div>
          <div class="form-group">
            <label class="form-label">卡片标题</label>
            <input
              type="text"
              class="form-control no-voice-assistant"
              value="${config.title || '驾驶证和车辆状态'}"
              placeholder="输入卡片标题"
              id="card-title-input"
            >
            <div class="help-text">设置卡片显示的主标题</div>
          </div>
          <div class="form-group">
            <div class="checkbox-group">
              <input
                type="checkbox"
                id="show-last-updated"
                ${config.show_last_updated !== false ? 'checked' : ''}
              >
              <label class="form-label" for="show-last-updated">显示最后更新时间</label>
            </div>
            <div class="help-text">显示数据的最后更新时间</div>
          </div>
          <div class="form-group">
            <label class="form-label">最后更新时间实体</label>
            ${this._renderEntitySelector(
              '选择最后更新时间实体',
              config.last_update_entity || '',
              -1,
              'last_update_entity',
              'config'
            )}
            <div class="help-text">选择用于显示最后更新时间的实体（可选）</div>
          </div>
        </div>

        <!-- 用户配置 -->
        <div class="section">
          <div class="section-title">👤 驾驶证信息配置</div>
          <div id="users-container">
            ${this._renderUsers()}
          </div>
          <button class="add-btn" id="add-user-btn" type="button">
            <span>+</span> 添加用户
          </button>
        </div>

        <!-- 车辆配置 -->
        <div class="section">
          <div class="section-title">🚗 车辆信息配置</div>
          <div id="vehicles-container">
            ${this._renderVehicles()}
          </div>
          <button class="add-btn" id="add-vehicle-btn" type="button">
            <span>+</span> 添加车辆
          </button>
        </div>

        <!-- 使用说明 -->
        <div class="section">
          <div class="section-title">📖 使用说明</div>
          <div style="font-size: 14px; color: var(--secondary-text-color, #757575); line-height: 1.6;">
            <p><strong>实体配置要求：</strong></p>
            <ul style="margin: 12px 0; padding-left: 20px;">
              <li><strong>驾驶证有效期</strong>：日期格式传感器 (YYYY-MM-DD)</li>
              <li><strong>驾驶证状态</strong>：文本状态传感器 (正常/警告/过期)</li>
              <li><strong>扣分情况</strong>：数字类型传感器</li>
              <li><strong>车牌号码</strong>：文本类型传感器</li>
              <li><strong>年审日期</strong>：日期格式传感器 (YYYY-MM-DD)</li>
              <li><strong>车辆状态</strong>：文本状态传感器 (正常/异常)</li>
              <li><strong>违章信息</strong>：数字类型传感器</li>
              <li><strong>最后更新时间</strong>：任何包含时间信息的实体</li>
            </ul>
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
      <div class="config-item" data-index="${index}">
        <button class="remove-btn" data-user-index="${index}" ${users.length <= 1 ? 'disabled' : ''} title="删除用户" type="button">
          删除
        </button>
        
        <div class="form-group">
          <label class="form-label">👤 用户姓名</label>
          <input
            type="text"
            class="form-control no-voice-assistant user-name"
            value="${user.name || ''}"
            placeholder="请输入用户姓名"
            data-index="${index}"
          >
          <div class="help-text">驾驶证持有人的姓名</div>
        </div>
        
        <div class="grid-2">
          ${this._renderEntitySelector(
            '📅 驾驶证有效期实体',
            user.entities?.license_expiry,
            index,
            'license_expiry',
            'user'
          )}
          
          ${this._renderEntitySelector(
            '📊 驾驶证状态实体',
            user.entities?.license_status,
            index,
            'license_status',
            'user'
          )}
          
          ${this._renderEntitySelector(
            '⚠️ 扣分情况实体',
            user.entities?.penalty_points,
            index,
            'penalty_points',
            'user'
          )}
        </div>
      </div>
    `).join('');
  }

  _renderVehicles() {
    const vehicles = this._config.vehicles || [this._getDefaultVehicle()];
    return vehicles.map((vehicle, index) => `
      <div class="config-item" data-index="${index}">
        <button class="remove-btn" data-vehicle-index="${index}" ${vehicles.length <= 1 ? 'disabled' : ''} title="删除车辆" type="button">
          删除
        </button>
        
        <div class="form-group">
          <label class="form-label">🚗 车牌号码实体</label>
          ${this._renderEntitySelector(
            '选择车牌号码实体',
            vehicle.plate_entity,
            index,
            'plate_entity',
            'vehicle_plate'
          )}
          <div class="help-text">选择包含车牌号码的传感器实体</div>
        </div>
        
        <div class="grid-2">
          ${this._renderEntitySelector(
            '📅 年审日期实体',
            vehicle.entities?.inspection_date,
            index,
            'inspection_date',
            'vehicle'
          )}
          
          ${this._renderEntitySelector(
            '📊 车辆状态实体',
            vehicle.entities?.vehicle_status,
            index,
            'vehicle_status',
            'vehicle'
          )}
          
          ${this._renderEntitySelector(
            '🚨 违章信息实体',
            vehicle.entities?.violations,
            index,
            'violations',
            'vehicle'
          )}
        </div>
      </div>
    `).join('');
  }

  _renderEntitySelector(label, selectedValue, index, field, type = 'user') {
    const entities = this._getEntities();
    let options = '<option value="">-- 选择实体 --</option>';
    entities.forEach(entity => {
      const selected = entity === selectedValue ? 'selected' : '';
      options += `<option value="${entity}" ${selected}>${entity}</option>`;
    });
    
    return `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <select class="form-control entity-select" data-type="${type}" data-index="${index}" data-field="${field}">
          ${options}
        </select>
        <div class="help-text">从列表中选择对应的传感器实体</div>
      </div>
    `;
  }

  _getEntities() {
    if (!this._hass) return [];
    return Object.keys(this._hass.states).sort();
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
    // 使用更彻底的事件处理方案
    this._setupInputHandlers();
    
    // 复选框更新
    const checkbox = this.querySelector('#show-last-updated');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this._updateConfig('show_last_updated', e.target.checked);
      });
    }

    // 实体选择器更新
    this.querySelectorAll('.entity-select').forEach((select) => {
      select.addEventListener('change', (e) => {
        const type = e.target.getAttribute('data-type');
        const index = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        
        if (type === 'user') {
          this._updateUserField(index, `entities.${field}`, e.target.value);
        } else if (type === 'vehicle_plate') {
          this._updateVehicleField(index, 'plate_entity', e.target.value);
        } else if (type === 'config') {
          this._updateConfig(field, e.target.value);
        } else {
          this._updateVehicleField(index, `entities.${field}`, e.target.value);
        }
      });
    });

    // 删除按钮事件
    this.querySelectorAll('.remove-btn[data-user-index]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.target.getAttribute('data-user-index'));
        this._removeUser(index);
      });
    });

    this.querySelectorAll('.remove-btn[data-vehicle-index]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(e.target.getAttribute('data-vehicle-index'));
        this._removeVehicle(index);
      });
    });

    // 添加按钮事件
    this.querySelector('#add-user-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._addUser();
    });
    this.querySelector('#add-vehicle-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this._addVehicle();
    });
  }

  _setupInputHandlers() {
    // 为所有输入框设置防抖和事件阻止
    const setupInputHandler = (input) => {
      // 清除现有事件监听器
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);
      
      // 添加新的事件监听器
      newInput.addEventListener('input', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // 清除之前的超时
        if (this._inputTimeout) {
          clearTimeout(this._inputTimeout);
        }
        
        // 设置新的超时
        this._inputTimeout = setTimeout(() => {
          if (newInput.classList.contains('user-name')) {
            const index = parseInt(newInput.getAttribute('data-index'));
            this._updateUserField(index, 'name', newInput.value);
          } else if (newInput.id === 'card-title-input') {
            this._updateConfig('title', newInput.value);
          }
        }, 300);
      });
      
      // 阻止所有键盘事件
      const stopAllEvents = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return false;
      };
      
      newInput.addEventListener('keydown', stopAllEvents);
      newInput.addEventListener('keyup', stopAllEvents);
      newInput.addEventListener('keypress', stopAllEvents);
      newInput.addEventListener('compositionstart', stopAllEvents);
      newInput.addEventListener('compositionupdate', stopAllEvents);
      newInput.addEventListener('compositionend', stopAllEvents);
      
      // 焦点事件
      newInput.addEventListener('focus', (e) => {
        e.stopPropagation();
      });
      
      newInput.addEventListener('blur', (e) => {
        e.stopPropagation();
        // 立即更新配置
        if (newInput.classList.contains('user-name')) {
          const index = parseInt(newInput.getAttribute('data-index'));
          this._updateUserField(index, 'name', newInput.value);
        } else if (newInput.id === 'card-title-input') {
          this._updateConfig('title', newInput.value);
        }
      });
      
      // 防止拖拽等操作
      newInput.addEventListener('dragstart', stopAllEvents);
      newInput.addEventListener('drop', stopAllEvents);
    };

    // 设置所有输入框
    this.querySelectorAll('.no-voice-assistant').forEach(setupInputHandler);
  }

  _getParentIndex(element) {
    const parent = element.closest('.config-item');
    return parent ? parseInt(parent.getAttribute('data-index')) : 0;
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

  _addUser() {
    if (!this._config.users) this._config.users = [];
    this._config.users.push(this._getDefaultUser());
    this._fireEvent();
    this._render();
  }

  _removeUser(index) {
    if (!this._config.users || this._config.users.length <= 1) return;
    this._config.users.splice(index, 1);
    this._fireEvent();
    this._render();
  }

  _addVehicle() {
    if (!this._config.vehicles) this._config.vehicles = [];
    this._config.vehicles.push(this._getDefaultVehicle());
    this._fireEvent();
    this._render();
  }

  _removeVehicle(index) {
    if (!this._config.vehicles || this._config.vehicles.length <= 1) return;
    this._config.vehicles.splice(index, 1);
    this._fireEvent();
    this._render();
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

// 注册到 HACS
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'driving-license-card',
  name: 'Driving License Card',
  description: 'A card to display driving license and vehicle status information',
  preview: true,
  documentationURL: 'https://github.com/B361273068/ha-driving-license-card'
});

console.log('Enhanced Driving License Card loaded successfully');
