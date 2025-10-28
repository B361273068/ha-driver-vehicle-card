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
          plate: "示例车牌",
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
        plate: '请配置车牌号',
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

    const lastUpdated = new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

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
        const inspectionEntity = this.getEntityState(vehicle.entities?.inspection_date);
        const statusEntity = this.getEntityState(vehicle.entities?.vehicle_status);
        const violationsEntity = this.getEntityState(vehicle.entities?.violations);
        
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
                <div class="title-sub">${vehicle.plate}</div>
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
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .license-card, .vehicle-card {
          background: var(--card-background-color);
          border-radius: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1px solid var(--divider-color);
          overflow: hidden;
        }
        
        .card-header {
          display: flex;
          align-items: center;
          padding: 16px;
          background: var(--primary-color);
          color: white;
          gap: 12px;
        }
        
        .header-icon {
          font-size: 24px;
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
        }
        
        .status-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
          background: rgba(255,255,255,0.2);
        }
        
        .card-content {
          padding: 16px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-label {
          font-size: 12px;
          color: var(--secondary-text-color);
          font-weight: 500;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
        }
        
        .points-progress {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .progress-bar {
          flex: 1;
          height: 6px;
          background: var(--divider-color);
          border-radius: 3px;
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 12px;
          color: var(--secondary-text-color);
          min-width: 40px;
        }
        
        .status-indicators {
          display: flex;
          gap: 8px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
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
          text-align: right;
          font-size: 12px;
          color: var(--secondary-text-color);
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid var(--divider-color);
        }
        
        @media (max-width: 600px) {
          .cards-grid {
            grid-template-columns: 1fr;
          }
          
          .info-grid {
            grid-template-columns: 1fr;
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
              最后更新: ${lastUpdated}
            </div>
          ` : ''}
        </div>
      </ha-card>
    `;
  }
}

// 编辑器类
class DrivingLicenseEditor extends HTMLElement {
  constructor() {
    super();
    this._config = {};
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
          padding: 16px;
          font-family: var(--paper-font-body1_-_font-family);
        }
        .section {
          margin-bottom: 20px;
          padding: 16px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          background: var(--card-background-color, white);
        }
        .section-title {
          font-size: 18px;
          font-weight: 500;
          color: var(--primary-color, #03a9f4);
          margin-bottom: 16px;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--primary-text-color, #212121);
        }
        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 4px;
          background: var(--card-background-color, white);
          color: var(--primary-text-color, #212121);
          font-size: 14px;
        }
        .config-item {
          position: relative;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
          background: var(--secondary-background-color, #f5f5f5);
        }
        .remove-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--error-color, #f44336);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .remove-btn:disabled {
          background: var(--disabled-color, #9e9e9e);
          cursor: not-allowed;
        }
        .add-btn {
          background: var(--primary-color, #03a9f4);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          margin-top: 8px;
          font-size: 14px;
        }
        .add-btn:hover {
          background: var(--dark-primary-color, #0288d1);
        }
        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .help-text {
          font-size: 12px;
          color: var(--secondary-text-color, #757575);
          margin-top: 4px;
        }
        .checkbox-group {
          display: flex;
          align-items: center;
          gap: 8px;
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
              class="form-control"
              value="${config.title || '驾驶证和车辆状态'}"
            >
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
          </div>
        </div>

        <!-- 用户配置 -->
        <div class="section">
          <div class="section-title">驾驶证信息配置</div>
          <div id="users-container">
            ${this._renderUsers()}
          </div>
          <button class="add-btn" id="add-user-btn">+ 添加用户</button>
        </div>

        <!-- 车辆配置 -->
        <div class="section">
          <div class="section-title">车辆信息配置</div>
          <div id="vehicles-container">
            ${this._renderVehicles()}
          </div>
          <button class="add-btn" id="add-vehicle-btn">+ 添加车辆</button>
        </div>

        <!-- 使用说明 -->
        <div class="section">
          <div class="section-title">使用说明</div>
          <div style="font-size: 14px; color: var(--secondary-text-color, #757575);">
            <p><strong>实体配置要求：</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>驾驶证有效期：日期格式 (YYYY-MM-DD)</li>
              <li>驾驶证状态：文本状态 (正常/警告/过期)</li>
              <li>扣分情况：数字类型</li>
              <li>年审日期：日期格式 (YYYY-MM-DD)</li>
              <li>车辆状态：文本状态 (正常/异常)</li>
              <li>违章信息：数字类型</li>
            </ul>
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
        <button class="remove-btn" data-user-index="${index}" ${users.length <= 1 ? 'disabled' : ''}>删除</button>
        
        <div class="form-group">
          <label class="form-label">用户姓名</label>
          <input
            type="text"
            class="form-control user-name"
            value="${user.name || ''}"
            placeholder="输入用户姓名"
          >
        </div>
        
        <div class="grid-2">
          ${this._renderEntitySelector(
            '驾驶证有效期实体',
            user.entities?.license_expiry,
            index,
            'license_expiry'
          )}
          
          ${this._renderEntitySelector(
            '驾驶证状态实体',
            user.entities?.license_status,
            index,
            'license_status'
          )}
          
          ${this._renderEntitySelector(
            '扣分情况实体',
            user.entities?.penalty_points,
            index,
            'penalty_points'
          )}
        </div>
      </div>
    `).join('');
  }

  _renderVehicles() {
    const vehicles = this._config.vehicles || [this._getDefaultVehicle()];
    return vehicles.map((vehicle, index) => `
      <div class="config-item" data-index="${index}">
        <button class="remove-btn" data-vehicle-index="${index}" ${vehicles.length <= 1 ? 'disabled' : ''}>删除</button>
        
        <div class="form-group">
          <label class="form-label">车牌号</label>
          <input
            type="text"
            class="form-control vehicle-plate"
            value="${vehicle.plate || ''}"
            placeholder="输入车牌号"
          >
        </div>
        
        <div class="grid-2">
          ${this._renderEntitySelector(
            '年审日期实体',
            vehicle.entities?.inspection_date,
            index,
            'inspection_date',
            'vehicle'
          )}
          
          ${this._renderEntitySelector(
            '车辆状态实体',
            vehicle.entities?.vehicle_status,
            index,
            'vehicle_status',
            'vehicle'
          )}
          
          ${this._renderEntitySelector(
            '违章信息实体',
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
    
    const fieldName = type === 'user' ? `user-${index}-${field}` : `vehicle-${index}-${field}`;
    
    return `
      <div class="form-group">
        <label class="form-label">${label}</label>
        <select class="form-control entity-select" data-type="${type}" data-index="${index}" data-field="${field}">
          ${options}
        </select>
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
      plate: '新车牌',
      entities: {
        inspection_date: '',
        vehicle_status: '',
        violations: ''
      }
    };
  }

  _bindEvents() {
    // 标题更新
    const titleInput = this.querySelector('input[type="text"]');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        this._updateConfig('title', e.target.value);
      });
    }

    // 复选框更新
    const checkbox = this.querySelector('#show-last-updated');
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        this._updateConfig('show_last_updated', e.target.checked);
      });
    }

    // 用户配置更新
    this.querySelectorAll('.user-name').forEach((input) => {
      input.addEventListener('input', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateUserField(index, 'name', e.target.value);
      });
    });

    // 实体选择器更新
    this.querySelectorAll('.entity-select').forEach((select) => {
      select.addEventListener('change', (e) => {
        const type = e.target.getAttribute('data-type');
        const index = parseInt(e.target.getAttribute('data-index'));
        const field = e.target.getAttribute('data-field');
        
        if (type === 'user') {
          this._updateUserField(index, `entities.${field}`, e.target.value);
        } else {
          this._updateVehicleField(index, `entities.${field}`, e.target.value);
        }
      });
    });

    // 删除按钮事件
    this.querySelectorAll('.remove-btn[data-user-index]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-user-index'));
        this._removeUser(index);
      });
    });

    this.querySelectorAll('.remove-btn[data-vehicle-index]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.getAttribute('data-vehicle-index'));
        this._removeVehicle(index);
      });
    });

    // 添加按钮事件
    this.querySelector('#add-user-btn')?.addEventListener('click', () => this._addUser());
    this.querySelector('#add-vehicle-btn')?.addEventListener('click', () => this._addVehicle());
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

    if (field === 'plate') {
      this._config.vehicles[index].plate = value;
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

console.log('Driving License Card with fixed editor loaded successfully');
