// 主卡片类
class DrivingLicenseCard extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
  }

  setConfig(config) {
    if (!config) {
      throw new Error('Invalid configuration');
    }
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateContent();
  }

  render() {
    if (!this._config) return;

    this.innerHTML = `
      <ha-card header="${this._config.title || '驾驶证和车辆状态'}">
        <div class="card-content">
          ${this._config.show_last_updated ? '<div class="last-updated" id="last-updated"></div>' : ''}
          
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
    if (!this._hass || !this._config) return;

    this.updateLastUpdated();
    this.updateUsers();
    this.updateVehicles();
  }

  updateLastUpdated() {
    const lastUpdatedEl = this.querySelector('#last-updated');
    if (!lastUpdatedEl) return;

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
  }

  updateUsers() {
    const container = this.querySelector('#users-container');
    if (!container) return;

    const users = this._config.users || [];
    
    container.innerHTML = users.map(user => `
      <div class="user-card">
        <div class="user-name">${this.escapeHtml(user.name || '未知用户')}</div>
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
    return entity ? this.escapeHtml(entity.state) : defaultValue;
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

  escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getCardSize() {
    return 3;
  }
}

// 注册自定义元素
customElements.define('driving-license-card', DrivingLicenseCard);

// HACS 配置
console.log('Driving License Card loaded successfully');
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'driving-license-card',
  name: 'Driving License Card',
  description: 'A card to display driving license and vehicle status information',
  preview: true
});