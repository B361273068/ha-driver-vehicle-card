// 主卡片类
class DrivingLicenseCard extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._cardHeight = 0;
  }

  setConfig(config) {
    this._config = config || this.getDefaultConfig();
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateContent();
  }

  getDefaultConfig() {
    return {
      title: '驾驶证和车辆状态',
      show_last_updated: true,
      last_update_entity: '',
      users: [{
        name: '示例用户',
        entities: {
          license_expiry: '',
          license_status: '',
          penalty_points: ''
        }
      }],
      vehicles: [{
        plate_entity: '',
        entities: {
          inspection_date: '',
          vehicle_status: '',
          violations: ''
        }
      }]
    };
  }

  render() {
    this.innerHTML = `
      <ha-card header="驾驶证和车辆状态">
        <div class="card-content">
          <div class="last-updated" id="last-updated"></div>
          
          <div class="section">
            <div class="section-title">驾驶证信息</div>
            <div id="users-container" class="users-container"></div>
          </div>
          
          <div class="section">
            <div class="section-title">车辆信息</div>
            <div id="vehicles-container" class="vehicles-container"></div>
          </div>
        </div>
        
        <style>
          ha-card {
            padding: 16px;
            background: var(--card-background-color);
            border-radius: var(--ha-card-border-radius, 12px);
            box-shadow: var(--ha-card-box-shadow, 0 2px 4px rgba(0,0,0,0.1));
          }
          
          .card-content {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          
          .last-updated {
            font-size: 12px;
            color: var(--secondary-text-color);
            text-align: right;
            margin-bottom: 8px;
          }
          
          .section {
            background: var(--secondary-background-color);
            border-radius: 8px;
            padding: 16px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 12px;
            color: var(--primary-text-color);
            border-bottom: 1px solid var(--divider-color);
            padding-bottom: 8px;
          }
          
          .user-card, .vehicle-card {
            background: var(--card-background-color);
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 12px;
            border: 1px solid var(--divider-color);
          }
          
          .user-name, .vehicle-plate {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 8px;
            color: var(--primary-text-color);
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .info-label {
            font-size: 12px;
            color: var(--secondary-text-color);
          }
          
          .info-value {
            font-size: 14px;
            color: var(--primary-text-color);
            font-weight: 500;
          }
          
          .status-normal {
            color: var(--success-color);
          }
          
          .status-warning {
            color: var(--warning-color);
          }
          
          .status-error {
            color: var(--error-color);
          }
        </style>
      </ha-card>
    `;
  }

  updateContent() {
    if (!this._hass) return;

    // 更新最后更新时间
    this.updateLastUpdated();

    // 更新用户信息
    this.updateUsers();

    // 更新车辆信息
    this.updateVehicles();
  }

  updateLastUpdated() {
    const lastUpdatedEl = this.querySelector('#last-updated');
    if (!this._config.show_last_updated) {
      lastUpdatedEl.style.display = 'none';
      return;
    }

    let lastUpdateTime = '未知';
    
    if (this._config.last_update_entity) {
      const entity = this._hass.states[this._config.last_update_entity];
      if (entity) {
        lastUpdateTime = entity.state;
      }
    } else {
      lastUpdateTime = new Date().toLocaleString('zh-CN');
    }

    lastUpdatedEl.textContent = `最后更新: ${lastUpdateTime}`;
    lastUpdatedEl.style.display = 'block';
  }

  updateUsers() {
    const container = this.querySelector('#users-container');
    if (!container) return;

    const users = this._config.users || [];
    
    container.innerHTML = users.map(user => `
      <div class="user-card">
        <div class="user-name">${user.name || '未知用户'}</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">准驾车型</span>
            <span class="info-value">${this.getEntityValue(user.entities?.license_expiry, '未设置')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">检验有效期</span>
            <span class="info-value">${this.getEntityValue(user.entities?.license_status, '未设置')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">证件状态</span>
            <span class="info-value ${this.getStatusClass(this.getEntityValue(user.entities?.penalty_points))}">
              ${this.getEntityValue(user.entities?.penalty_points, '未设置')}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">违章记分</span>
            <span class="info-value">${this.getEntityValue(user.entities?.penalty_points, '0')}分</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateVehicles() {
    const container = this.querySelector('#vehicles-container');
    if (!container) return;

    const vehicles = this._config.vehicles || [];
    
    container.innerHTML = vehicles.map(vehicle => `
      <div class="vehicle-card">
        <div class="vehicle-plate">${this.getEntityValue(vehicle.plate_entity, '未知车牌')}</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">年审日期</span>
            <span class="info-value">${this.getEntityValue(vehicle.entities?.inspection_date, '未设置')}</span>
          </div>
          <div class="info-item">
            <span class="info-label">车辆状态</span>
            <span class="info-value ${this.getStatusClass(this.getEntityValue(vehicle.entities?.vehicle_status))}">
              ${this.getEntityValue(vehicle.entities?.vehicle_status, '未设置')}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">违章信息</span>
            <span class="info-value">${this.getEntityValue(vehicle.entities?.violations, '无')}</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  getEntityValue(entityId, defaultValue = '未知') {
    if (!entityId || !this._hass) return defaultValue;
    
    const entity = this._hass.states[entityId];
    return entity ? entity.state : defaultValue;
  }

  getStatusClass(value) {
    if (!value || value === '未知' || value === '未设置') return '';
    
    const lowerValue = value.toLowerCase();
    if (lowerValue.includes('正常') || lowerValue.includes('有效') || lowerValue === '0') {
      return 'status-normal';
    } else if (lowerValue.includes('警告') || lowerValue.includes('即将到期')) {
      return 'status-warning';
    } else if (lowerValue.includes('异常') || lowerValue.includes('过期') || lowerValue.includes('无效')) {
      return 'status-error';
    }
    
    return '';
  }

  getCardSize() {
    return 3;
  }
}

// 简化版编辑器 - 避免复杂的实体搜索功能
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
      users: [],
      vehicles: []
    };
  }

  render() {
    this.innerHTML = `
      <div class="card-config">
        <div class="config-section">
          <div class="section-header">基本配置</div>
          
          <div class="form-group">
            <label>卡片标题</label>
            <input 
              type="text" 
              value="${this.escapeHtml(this._config.title)}" 
              data-path="title"
              class="config-input"
            >
          </div>
          
          <div class="form-group checkbox-group">
            <label>
              <input 
                type="checkbox" 
                ${this._config.show_last_updated !== false ? 'checked' : ''}
                data-path="show_last_updated"
              >
              显示最后更新时间
            </label>
          </div>
        </div>

        <div class="config-section">
          <div class="section-header">驾驶证信息配置</div>
          <div id="users-container">
            ${this.renderUsers()}
          </div>
          <button class="add-btn" id="add-user" type="button">+ 添加驾驶证信息</button>
        </div>

        <div class="config-section">
          <div class="section-header">车辆信息配置</div>
          <div id="vehicles-container">
            ${this.renderVehicles()}
          </div>
          <button class="add-btn" id="add-vehicle" type="button">+ 添加车辆信息</button>
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
            color: var(--primary-text-color);
          }
          
          .config-input {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            background: var(--card-background-color);
            color: var(--primary-text-color);
            box-sizing: border-box;
            font-size: 14px;
            font-family: inherit;
          }
          
          .checkbox-group {
            display: flex;
            align-items: center;
          }
          
          .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 0;
            cursor: pointer;
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
          
          .add-btn {
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 10px 16px;
            cursor: pointer;
            width: 100%;
            font-size: 14px;
            margin-top: 8px;
          }
          
          .entity-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
          }
        </style>
      </div>
    `;

    this.setupEventListeners();
  }

  renderUsers() {
    const users = this._config.users || [];
    if (users.length === 0) {
      users.push({
        name: '示例用户',
        entities: { license_expiry: '', license_status: '', penalty_points: '' }
      });
    }
    
    return users.map((user, index) => `
      <div class="user-config" data-index="${index}">
        <button class="remove-btn" data-type="user" data-index="${index}" 
                ${users.length <= 1 ? 'disabled' : ''} type="button">
          删除
        </button>
        
        <div class="form-group">
          <label>用户姓名</label>
          <input 
            type="text" 
            value="${this.escapeHtml(user.name)}" 
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
              value="${this.escapeHtml(user.entities?.license_expiry || '')}" 
              data-type="user" 
              data-index="${index}"
              data-path="license_expiry"
              class="config-input"
              placeholder="sensor.license_expiry_date"
            >
          </div>
          
          <div class="form-group">
            <label>驾驶证状态实体</label>
            <input 
              type="text" 
              value="${this.escapeHtml(user.entities?.license_status || '')}" 
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
              value="${this.escapeHtml(user.entities?.penalty_points || '')}" 
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
    const vehicles = this._config.vehicles || [];
    if (vehicles.length === 0) {
      vehicles.push({
        plate_entity: '',
        entities: { inspection_date: '', vehicle_status: '', violations: '' }
      });
    }
    
    return vehicles.map((vehicle, index) => `
      <div class="vehicle-config" data-index="${index}">
        <button class="remove-btn" data-type="vehicle" data-index="${index}"
                ${vehicles.length <= 1 ? 'disabled' : ''} type="button">
          删除
        </button>
        
        <div class="form-group">
          <label>车牌号码实体</label>
          <input 
            type="text" 
            value="${this.escapeHtml(vehicle.plate_entity || '')}" 
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
              value="${this.escapeHtml(vehicle.entities?.inspection_date || '')}" 
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
              value="${this.escapeHtml(vehicle.entities?.vehicle_status || '')}" 
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
              value="${this.escapeHtml(vehicle.entities?.violations || '')}" 
              data-type="vehicle" 
              data-index="${index}"
              data-path="violations"
              class="config-input"
              placeholder="sensor.violations_count"
            >
          </div>
        </div>
      </div>
    `).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  setupEventListeners() {
    // 输入框事件
    this.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        this.handleInputChange(e.target);
      });
      input.addEventListener('blur', (e) => {
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
    this.querySelector('#add-user')?.addEventListener('click', () => {
      this.addUser();
    });

    this.querySelector('#add-vehicle')?.addEventListener('click', () => {
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
    
    this.fireConfigChanged();
  }

  updateConfig(key, value) {
    this._config[key] = value;
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
  }

  addUser() {
    if (!this._config.users) this._config.users = [];
    this._config.users.push({
      name: '新用户',
      entities: { license_expiry: '', license_status: '', penalty_points: '' }
    });
    this.render();
    this.fireConfigChanged();
  }

  addVehicle() {
    if (!this._config.vehicles) this._config.vehicles = [];
    this._config.vehicles.push({
      plate_entity: '',
      entities: { inspection_date: '', vehicle_status: '', violations: '' }
    });
    this.render();
    this.fireConfigChanged();
  }

  removeItem(type, index) {
    if (type === 'user' && this._config.users.length > 1) {
      this._config.users.splice(index, 1);
      this.render();
      this.fireConfigChanged();
    } else if (type === 'vehicle' && this._config.vehicles.length > 1) {
      this._config.vehicles.splice(index, 1);
      this.render();
      this.fireConfigChanged();
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

// 确保只注册一次
if (!customElements.get('driving-license-card')) {
  customElements.define('driving-license-card', DrivingLicenseCard);
}

if (!customElements.get('driving-license-editor')) {
  customElements.define('driving-license-editor', DrivingLicenseEditor);
}

console.log('Driving License Card loaded successfully');