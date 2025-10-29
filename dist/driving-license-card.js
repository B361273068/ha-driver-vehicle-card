// 主卡片类 - 修复配置解析问题
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

    // 深度合并配置，确保所有必要的字段都存在
    this._config = this.deepMerge(this.getDefaultConfig(), config);
    
    // 确保users和vehicles是数组
    if (!Array.isArray(this._config.users)) {
      this._config.users = [this.getDefaultUser()];
    }
    
    if (!Array.isArray(this._config.vehicles)) {
      this._config.vehicles = [this.getDefaultVehicle()];
    }

    // 清理空配置
    this.cleanConfig();

    this.render();
  }

  getDefaultConfig() {
    return {
      title: '驾驶证和车辆状态',
      show_last_updated: true,
      last_update_entity: '',
      users: [],
      vehicles: []
    };
  }

  getDefaultUser() {
    return {
      name: '请配置姓名',
      entities: {
        license_expiry: '',
        license_status: '',
        penalty_points: ''
      }
    };
  }

  getDefaultVehicle() {
    return {
      plate_entity: '',
      entities: {
        inspection_date: '',
        vehicle_status: '',
        violations: ''
      }
    };
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] instanceof Object && key in target) {
        result[key] = this.deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  cleanConfig() {
    // 清理users配置
    this._config.users = this._config.users.map(user => ({
      ...this.getDefaultUser(),
      ...user,
      entities: {
        ...this.getDefaultUser().entities,
        ...(user.entities || {})
      }
    }));

    // 清理vehicles配置
    this._config.vehicles = this._config.vehicles.map(vehicle => ({
      ...this.getDefaultVehicle(),
      ...vehicle,
      entities: {
        ...this.getDefaultVehicle().entities,
        ...(vehicle.entities || {})
      }
    }));
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    let size = 2;
    size += (this._config.users?.length || 0) * 2;
    size += (this._config.vehicles?.length || 0) * 3;
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
    if (!status) return { text: '未知', color: 'gray' };
    
    status = status.toLowerCase();
    if (status.includes('正常')) return { text: '正常', color: 'green' };
    if (status.includes('警告') || status.includes('即将到期')) return { text: '警告', color: 'orange' };
    if (status.includes('过期') || status.includes('异常')) return { text: '异常', color: 'red' };
    return { text: status, color: 'blue' };
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

    const renderUserSection = () => {
      const users = this._config.users || [];
      return users.map((user, index) => {
        const expiryEntity = this.getEntityState(user.entities?.license_expiry);
        const statusEntity = this.getEntityState(user.entities?.license_status);
        const pointsEntity = this.getEntityState(user.entities?.penalty_points);
        
        const expiryDate = expiryEntity?.state || '未配置';
        const expiryDays = this.calculateDaysDifference(expiryDate);
        const statusInfo = this.getStatusInfo(statusEntity?.state);
        const pointsInfo = this.getPointsInfo(pointsEntity?.state);
        const countdownInfo = this.getCountdownInfo(expiryDays);
        
        const sectionTitle = user.name ? `驾驶证信息-${user.name}` : '驾驶证信息';
        
        return `
          <div class="section">
            <div class="section-header">
              <div class="section-title">${sectionTitle}</div>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">有效期至</span>
                  <span class="info-value ${countdownInfo.color}">${expiryDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">有效期倒计时</span>
                  <span class="info-value ${countdownInfo.color}">${countdownInfo.text}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">驾驶证状态</span>
                  <span class="info-value ${statusInfo.color}">${statusInfo.text}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">扣分情况</span>
                  <span class="info-value ${pointsInfo.color}">${pointsInfo.text} / 12分</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    const renderVehicleSection = () => {
      const vehicles = this._config.vehicles || [];
      return vehicles.map((vehicle, index) => {
        const plateEntity = this.getEntityState(vehicle.plate_entity);
        const inspectionEntity = this.getEntityState(vehicle.entities?.inspection_date);
        const statusEntity = this.getEntityState(vehicle.entities?.vehicle_status);
        const violationsEntity = this.getEntityState(vehicle.entities?.violations);
        
        const plateNumber = plateEntity?.state || '';
        const inspectionDate = inspectionEntity?.state || '未配置';
        const inspectionDays = this.calculateDaysDifference(inspectionDate);
        const statusInfo = this.getStatusInfo(statusEntity?.state);
        const violations = violationsEntity?.state || '0';
        const violationsCount = parseInt(violations) || 0;
        const violationsColor = violationsCount > 0 ? 'red' : 'green';
        const countdownInfo = this.getCountdownInfo(inspectionDays);
        
        const sectionTitle = plateNumber ? `车辆信息 - ${plateNumber}` : '车辆信息';
        
        return `
          <div class="section">
            <div class="section-header">
              <div class="section-title">${sectionTitle}</div>
            </div>
            <div class="section-content">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">年审日期</span>
                  <span class="info-value ${countdownInfo.color}">${inspectionDate}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">年审倒计时</span>
                  <span class="info-value ${countdownInfo.color}">${countdownInfo.text}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">车辆状态</span>
                  <span class="info-value ${statusInfo.color}">${statusInfo.text}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">违章信息</span>
                  <span class="info-value ${violationsColor}">${violationsCount}条未处理</span>
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
          font-family: var(--paper-font-body1_-_font-family);
        }
        
        .card-container {
          background: var(--card-background-color, white);
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .main-header {
          background: #2196F3 !important;
          padding: 16px 20px;
          color: white;
        }
        
        .main-title {
          font-size: 18px;
          font-weight: 600;
          text-align: center;
          margin: 0;
        }
        
        .content-area {
          padding: 0;
        }
        
        .section {
          margin-bottom: 0;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
        }
        
        .section:last-child {
          border-bottom: none;
        }
        
        .section-header {
          background: #2196F3 !important;
          padding: 12px 16px;
          color: white;
        }
        
        .section-title {
          font-size: 16px;
          font-weight: 600;
        }
        
        .section-content {
          padding: 16px;
          background: white;
        }
        
        .info-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }
        
        .info-label {
          font-size: 14px;
          font-weight: 500;
          color: #000000 !important;
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 600;
        }
        
        .green {
          color: var(--success-color, #4CAF50);
        }
        
        .orange {
          color: var(--warning-color, #FF9800);
        }
        
        .red {
          color: var(--error-color, #F44336);
        }
        
        .blue {
          color: var(--info-color, #2196F3);
        }
        
        .gray {
          color: var(--disabled-text-color, #9E9E9E);
        }
        
        .last-updated {
          text-align: center;
          font-size: 12px;
          color: var(--secondary-text-color, #666);
          padding: 12px 16px;
          background: var(--secondary-background-color, #f5f5f5);
          border-top: 1px solid var(--divider-color, #e0e0e0);
        }
      </style>
      
      <ha-card>
        <div class="card-container">
          <div class="main-header">
            <div class="main-title">${this._config.title}</div>
          </div>
          
          <div class="content-area">
            ${renderUserSection()}
            ${renderVehicleSection()}
          </div>
          
          ${this._config.show_last_updated ? `
            <div class="last-updated">最后更新：${lastUpdated}</div>
          ` : ''}
        </div>
      </ha-card>
    `;
  }
}

// 简化编辑器类
class DrivingLicenseEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
  }

  setConfig(config) {
    this._config = config || this.getDefaultConfig();
    this.render();
  }

  getDefaultConfig() {
    return {
      title: '驾驶证和车辆状态',
      show_last_updated: true,
      last_update_entity: '',
      users: [this.getDefaultUser()],
      vehicles: [this.getDefaultVehicle()]
    };
  }

  getDefaultUser() {
    return {
      name: '示例用户',
      entities: {
        license_expiry: '',
        license_status: '',
        penalty_points: ''
      }
    };
  }

  getDefaultVehicle() {
    return {
      plate_entity: '',
      entities: {
        inspection_date: '',
        vehicle_status: '',
        violations: ''
      }
    };
  }

  render() {
    const config = this._config;
    
    this.innerHTML = `
      <div class="card-config">
        <div class="config-section">
          <div class="section-header">基本配置</div>
          
          <div class="form-group">
            <label>卡片标题</label>
            <input 
              type="text" 
              value="${config.title || '驾驶证和车辆状态'}" 
              data-path="title"
              class="config-input"
            >
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                ${config.show_last_updated !== false ? 'checked' : ''}
                data-path="show_last_updated"
              >
              显示最后更新时间
            </label>
          </div>
          
          <div class="form-group">
            <label>最后更新时间实体</label>
            <input 
              type="text" 
              value="${config.last_update_entity || ''}" 
              data-path="last_update_entity"
              class="config-input"
              placeholder="sensor.last_update_time"
            >
          </div>
        </div>

        <div class="config-section">
          <div class="section-header">驾驶证信息配置</div>
          <div id="users-container">
            ${this.renderUsers()}
          </div>
          <button class="add-btn" id="add-user">+ 添加用户</button>
        </div>

        <div class="config-section">
          <div class="section-header">车辆信息配置</div>
          <div id="vehicles-container">
            ${this.renderVehicles()}
          </div>
          <button class="add-btn" id="add-vehicle">+ 添加车辆</button>
        </div>

        <style>
          .card-config {
            padding: 16px;
            font-family: var(--paper-font-body1_-_font-family);
          }
          
          .config-section {
            margin-bottom: 24px;
            padding: 16px;
            border: 1px solid var(--divider-color);
            border-radius: 8px;
            background: var(--card-background-color);
          }
          
          .section-header {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--divider-color);
          }
          
          .form-group {
            margin-bottom: 16px;
          }
          
          .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
          }
          
          .config-input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            background: var(--card-background-color);
            color: var(--primary-text-color);
            box-sizing: border-box;
          }
          
          .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .user-config, .vehicle-config {
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
            width: 100%;
            font-size: 14px;
          }
          
          .entity-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
        </style>
      </div>
    `;

    this.setupEventListeners();
  }

  renderUsers() {
    const users = this._config.users || [this.getDefaultUser()];
    return users.map((user, index) => `
      <div class="user-config" data-index="${index}">
        <button class="remove-btn" data-type="user" data-index="${index}" 
                ${users.length <= 1 ? 'disabled' : ''}>
          删除
        </button>
        
        <div class="form-group">
          <label>用户姓名</label>
          <input 
            type="text" 
            value="${user.name || ''}" 
            data-type="user" 
            data-index="${index}"
            data-path="name"
            class="config-input"
            placeholder="请输入用户姓名"
          >
        </div>
        
        <div class="entity-grid">
          <div class="form-group">
            <label>驾驶证有效期实体</label>
            <input 
              type="text" 
              value="${user.entities?.license_expiry || ''}" 
              data-type="user" 
              data-index="${index}"
              data-path="license_expiry"
              class="config-input"
              placeholder="sensor.license_expiry"
            >
          </div>
          
          <div class="form-group">
            <label>驾驶证状态实体</label>
            <input 
              type="text" 
              value="${user.entities?.license_status || ''}" 
              data-type="user" 
              data-index="${index}"
              data-path="license_status"
              class="config-input"
              placeholder="sensor.license_status"
            >
          </div>
          
          <div class="form-group">
            <label>扣分情况实体</label>
            <input 
              type="text" 
              value="${user.entities?.penalty_points || ''}" 
              data-type="user" 
              data-index="${index}"
              data-path="penalty_points"
              class="config-input"
              placeholder="sensor.penalty_points"
            >
          </div>
        </div>
      </div>
    `).join('');
  }

  renderVehicles() {
    const vehicles = this._config.vehicles || [this.getDefaultVehicle()];
    return vehicles.map((vehicle, index) => `
      <div class="vehicle-config" data-index="${index}">
        <button class="remove-btn" data-type="vehicle" data-index="${index}"
                ${vehicles.length <= 1 ? 'disabled' : ''}>
          删除
        </button>
        
        <div class="form-group">
          <label>车牌号码实体</label>
          <input 
            type="text" 
            value="${vehicle.plate_entity || ''}" 
            data-type="vehicle" 
            data-index="${index}"
            data-path="plate_entity"
            class="config-input"
            placeholder="sensor.car_plate"
          >
        </div>
        
        <div class="entity-grid">
          <div class="form-group">
            <label>年审日期实体</label>
            <input 
              type="text" 
              value="${vehicle.entities?.inspection_date || ''}" 
              data-type="vehicle" 
              data-index="${index}"
              data-path="inspection_date"
              class="config-input"
              placeholder="sensor.inspection_date"
            >
          </div>
          
          <div class="form-group">
            <label>车辆状态实体</label>
            <input 
              type="text" 
              value="${vehicle.entities?.vehicle_status || ''}" 
              data-type="vehicle" 
              data-index="${index}"
              data-path="vehicle_status"
              class="config-input"
              placeholder="sensor.vehicle_status"
            >
          </div>
          
          <div class="form-group">
            <label>违章信息实体</label>
            <input 
              type="text" 
              value="${vehicle.entities?.violations || ''}" 
              data-type="vehicle" 
              data-index="${index}"
              data-path="violations"
              class="config-input"
              placeholder="sensor.violations"
            >
          </div>
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    // 输入框事件
    this.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        this.handleInputChange(e.target);
      });
    });

    // 复选框事件
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.handleInputChange(e.target);
      });
    });

    // 删除按钮事件
    this.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        const index = parseInt(e.target.dataset.index);
        this.removeItem(type, index);
      });
    });

    // 添加按钮事件
    this.querySelector('#add-user').addEventListener('click', () => {
      this.addUser();
    });

    this.querySelector('#add-vehicle').addEventListener('click', () => {
      this.addVehicle();
    });
  }

  handleInputChange(target) {
    const path = target.dataset.path;
    const type = target.dataset.type;
    const index = target.dataset.index;

    let value = target.type === 'checkbox' ? target.checked : target.value;

    if (type === 'user') {
      this.updateUserField(parseInt(index), path, value);
    } else if (type === 'vehicle') {
      this.updateVehicleField(parseInt(index), path, value);
    } else {
      this.updateConfig(path, value);
    }
  }

  updateConfig(key, value) {
    this._config[key] = value;
    this.fireConfigChanged();
  }

  updateUserField(index, field, value) {
    if (!this._config.users[index]) return;

    if (field === 'name') {
      this._config.users[index].name = value;
    } else {
      if (!this._config.users[index].entities) {
        this._config.users[index].entities = {};
      }
      this._config.users[index].entities[field] = value;
    }

    this.fireConfigChanged();
  }

  updateVehicleField(index, field, value) {
    if (!this._config.vehicles[index]) return;

    if (field === 'plate_entity') {
      this._config.vehicles[index].plate_entity = value;
    } else {
      if (!this._config.vehicles[index].entities) {
        this._config.vehicles[index].entities = {};
      }
      this._config.vehicles[index].entities[field] = value;
    }

    this.fireConfigChanged();
  }

  addUser() {
    this._config.users.push(this.getDefaultUser());
    this.render();
  }

  addVehicle() {
    this._config.vehicles.push(this.getDefaultVehicle());
    this.render();
  }

  removeItem(type, index) {
    if (type === 'user' && this._config.users.length > 1) {
      this._config.users.splice(index, 1);
      this.render();
    } else if (type === 'vehicle' && this._config.vehicles.length > 1) {
      this._config.vehicles.splice(index, 1);
      this.render();
    }
  }

  fireConfigChanged() {
    const event = new Event('config-changed', {
      bubbles: true,
      composed: true
    });
    event.detail = { config: this._config };
    this.dispatchEvent(event);
  }
}

// 注册自定义元素
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
  preview: true
});

console.log('Driving License Card with fixed configuration parsing loaded successfully');