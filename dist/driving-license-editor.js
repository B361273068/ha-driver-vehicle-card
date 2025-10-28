import { LitElement, html, css } from 'https://unpkg.com/lit-element@2.4.0/lit-element.js?module';

// 兼容性处理 - 确保 fireEvent 可用
const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

class DrivingLicenseEditor extends LitElement {
  static get properties() {
    return {
      hass: Object,
      config: Object,
      _config: Object
    };
  }

  static get styles() {
    return css`
      .card-config {
        padding: 16px;
      }
      
      .config-section {
        margin-bottom: 24px;
        padding: 16px;
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        background: var(--card-background-color, white);
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--divider-color, #e0e0e0);
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-color, #03a9f4);
        margin: 0;
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
      
      .entity-select {
        width: 100%;
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
        border-radius: 50%;
        width: 24px;
        height: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
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
        font-size: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      
      .add-btn:hover {
        background: var(--dark-primary-color, #0288d1);
      }
      
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      
      .grid-3 {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 16px;
      }
      
      @media (max-width: 768px) {
        .grid-2,
        .grid-3 {
          grid-template-columns: 1fr;
        }
      }
      
      .help-text {
        font-size: 12px;
        color: var(--secondary-text-color, #757575);
        margin-top: 4px;
      }
    `;
  }

  constructor() {
    super();
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    
    // 确保必要字段存在
    if (!this._config.title) {
      this._config.title = '驾驶证和车辆状态';
    }
    
    if (!this._config.users || this._config.users.length === 0) {
      this._config.users = [this._getDefaultUser()];
    }
    
    if (!this._config.vehicles || this._config.vehicles.length === 0) {
      this._config.vehicles = [this._getDefaultVehicle()];
    }
  }

  // 获取所有实体
  getEntities() {
    if (!this.hass) return [];
    return Object.keys(this.hass.states).sort();
  }

  // 过滤实体类型
  filterEntities(prefix = '') {
    const entities = this.getEntities();
    if (!prefix) return entities;
    return entities.filter(entity => 
      entity.toLowerCase().includes(prefix.toLowerCase())
    );
  }

  // 更新配置
  _updateConfig() {
    const config = { ...this._config };
    
    // 确保必要字段存在
    if (!config.users || config.users.length === 0) {
      config.users = [this._getDefaultUser()];
    }
    
    if (!config.vehicles || config.vehicles.length === 0) {
      config.vehicles = [this._getDefaultVehicle()];
    }
    
    // 触发配置更改事件
    fireEvent(this, 'config-changed', { config });
  }

  // 获取默认用户配置
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

  // 获取默认车辆配置
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

  // 添加用户
  _addUser() {
    if (!this._config.users) {
      this._config.users = [];
    }
    this._config.users.push(this._getDefaultUser());
    this._updateConfig();
    this.requestUpdate();
  }

  // 删除用户
  _removeUser(index) {
    if (this._config.users.length <= 1) return;
    this._config.users.splice(index, 1);
    this._updateConfig();
    this.requestUpdate();
  }

  // 添加车辆
  _addVehicle() {
    if (!this._config.vehicles) {
      this._config.vehicles = [];
    }
    this._config.vehicles.push(this._getDefaultVehicle());
    this._updateConfig();
    this.requestUpdate();
  }

  // 删除车辆
  _removeVehicle(index) {
    if (this._config.vehicles.length <= 1) return;
    this._config.vehicles.splice(index, 1);
    this._updateConfig();
    this.requestUpdate();
  }

  // 更新用户配置
  _updateUser(index, field, value) {
    if (!this._config.users || !this._config.users[index]) return;
    
    if (field === 'name') {
      this._config.users[index].name = value;
    } else if (field.startsWith('entities.')) {
      const entityField = field.replace('entities.', '');
      if (!this._config.users[index].entities) {
        this._config.users[index].entities = {};
      }
      this._config.users[index].entities[entityField] = value;
    }
    
    this._updateConfig();
  }

  // 更新车辆配置
  _updateVehicle(index, field, value) {
    if (!this._config.vehicles || !this._config.vehicles[index]) return;
    
    if (field === 'plate') {
      this._config.vehicles[index].plate = value;
    } else if (field.startsWith('entities.')) {
      const entityField = field.replace('entities.', '');
      if (!this._config.vehicles[index].entities) {
        this._config.vehicles[index].entities = {};
      }
      this._config.vehicles[index].entities[entityField] = value;
    }
    
    this._updateConfig();
  }

  // 更新标题
  _updateTitle(value) {
    this._config.title = value;
    this._updateConfig();
  }

  // 实体选择器
  _renderEntitySelector(label, value, onChange, filter = '') {
    const entities = this.filterEntities(filter);
    
    return html`
      <div class="form-group">
        <label class="form-label">${label}</label>
        <select 
          class="form-control entity-select" 
          .value=${value || ''}
          @change=${e => onChange(e.target.value)}
        >
          <option value="">-- 选择实体 --</option>
          ${entities.map(entity => html`
            <option value=${entity}>${entity}</option>
          `)}
        </select>
        <div class="help-text">选择对应的传感器实体</div>
      </div>
    `;
  }

  // 渲染用户配置项
  _renderUserItem(user, index) {
    return html`
      <div class="config-item">
        <button 
          class="remove-btn"
          @click=${() => this._removeUser(index)}
          ?disabled=${(!this._config.users || this._config.users.length <= 1)}
          title=${this._config.users.length <= 1 ? "至少保留一个用户" : "删除用户"}
        >
          ×
        </button>
        
        <div class="form-group">
          <label class="form-label">用户姓名</label>
          <input
            type="text"
            class="form-control"
            .value=${user.name || ''}
            @input=${e => this._updateUser(index, 'name', e.target.value)}
            placeholder="输入用户姓名"
          >
        </div>
        
        <div class="grid-3">
          ${this._renderEntitySelector(
            '驾驶证有效期',
            user.entities?.license_expiry,
            value => this._updateUser(index, 'entities.license_expiry', value),
            'date'
          )}
          
          ${this._renderEntitySelector(
            '驾驶证状态',
            user.entities?.license_status,
            value => this._updateUser(index, 'entities.license_status', value),
            'status'
          )}
          
          ${this._renderEntitySelector(
            '扣分情况',
            user.entities?.penalty_points,
            value => this._updateUser(index, 'entities.penalty_points', value),
            'point'
          )}
        </div>
      </div>
    `;
  }

  // 渲染车辆配置项
  _renderVehicleItem(vehicle, index) {
    return html`
      <div class="config-item">
        <button 
          class="remove-btn"
          @click=${() => this._removeVehicle(index)}
          ?disabled=${(!this._config.vehicles || this._config.vehicles.length <= 1)}
          title=${this._config.vehicles.length <= 1 ? "至少保留一个车辆" : "删除车辆"}
        >
          ×
        </button>
        
        <div class="form-group">
          <label class="form-label">车牌号</label>
          <input
            type="text"
            class="form-control"
            .value=${vehicle.plate || ''}
            @input=${e => this._updateVehicle(index, 'plate', e.target.value)}
            placeholder="输入车牌号"
          >
        </div>
        
        <div class="grid-3">
          ${this._renderEntitySelector(
            '年审日期',
            vehicle.entities?.inspection_date,
            value => this._updateVehicle(index, 'entities.inspection_date', value),
            'date'
          )}
          
          ${this._renderEntitySelector(
            '车辆状态',
            vehicle.entities?.vehicle_status,
            value => this._updateVehicle(index, 'entities.vehicle_status', value),
            'status'
          )}
          
          ${this._renderEntitySelector(
            '违章信息',
            vehicle.entities?.violations,
            value => this._updateVehicle(index, 'entities.violations', value),
            'violation'
          )}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.hass) {
      return html`<div class="card-config">Loading Home Assistant data...</div>`;
    }

    const config = this._config || {};

    return html`
      <div class="card-config">
        <!-- 基本配置 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">基本配置</h3>
          </div>
          
          <div class="form-group">
            <label class="form-label">卡片标题</label>
            <input
              type="text"
              class="form-control"
              .value=${config.title || '驾驶证和车辆状态'}
              @input=${e => this._updateTitle(e.target.value)}
              placeholder="输入卡片标题"
            >
            <div class="help-text">设置卡片在界面上显示的标题</div>
          </div>
        </div>

        <!-- 用户配置 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">驾驶证信息配置</h3>
            <button class="add-btn" @click=${this._addUser.bind(this)}>
              <span>+ 添加用户</span>
            </button>
          </div>
          
          <div class="help-text" style="margin-bottom: 16px;">
            配置驾驶证相关信息，支持多个用户
          </div>
          
          ${(config.users || [this._getDefaultUser()]).map((user, index) => 
            this._renderUserItem(user, index)
          )}
        </div>

        <!-- 车辆配置 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">车辆信息配置</h3>
            <button class="add-btn" @click=${this._addVehicle.bind(this)}>
              <span>+ 添加车辆</span>
            </button>
          </div>
          
          <div class="help-text" style="margin-bottom: 16px;">
            配置车辆相关信息，支持多辆车
          </div>
          
          ${(config.vehicles || [this._getDefaultVehicle()]).map((vehicle, index) => 
            this._renderVehicleItem(vehicle, index)
          )}
        </div>

        <!-- 使用说明 -->
        <div class="config-section">
          <div class="section-header">
            <h3 class="section-title">使用说明</h3>
          </div>
          
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
            <p><strong>提示：</strong>使用模板传感器创建所需实体</p>
          </div>
        </div>
      </div>
    `;
  }
}

// 注册编辑器
if (!customElements.get('driving-license-editor')) {
  customElements.define('driving-license-editor', DrivingLicenseEditor);
}

// 注册到 HACS
if (window.customCards) {
  window.customCards.push({
    type: 'driving-license-card',
    name: 'Driving License Card',
    description: 'A card to display driving license and vehicle status information',
    preview: true,
    documentationURL: 'https://github.com/B361273068/ha-driving-license-card'
  });
}

console.log('Driving License Editor loaded successfully');
