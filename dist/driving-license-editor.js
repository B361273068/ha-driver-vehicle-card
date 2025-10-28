import { LitElement, html, css } from 'https://unpkg.com/lit-element@2.4.0/lit-element.js?module';
import { fireEvent } from 'custom-card-helpers';

class DrivingLicenseEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  static get styles() {
    return css`
      .editor-container {
        padding: 16px;
      }
      
      .section {
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .section:last-child {
        border-bottom: none;
      }
      
      .section-title {
        font-size: 1.1rem;
        font-weight: 500;
        margin-bottom: 12px;
        color: #1e40af;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      .form-control {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        font-size: 0.875rem;
      }
      
      .entity-select {
        width: 100%;
      }
      
      .user-item, .vehicle-item {
        padding: 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        margin-bottom: 12px;
        position: relative;
      }
      
      .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: #ef4444;
        cursor: pointer;
        font-size: 1rem;
      }
      
      .add-btn {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        background-color: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 500;
      }
      
      .add-btn:hover {
        background-color: #2563eb;
      }
      
      .add-btn i {
        margin-right: 6px;
      }
      
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      
      @media (max-width: 640px) {
        .grid-2 {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  constructor() {
    super();
    this.config = {
      title: '驾驶证和车辆状态',
      users: [],
      vehicles: []
    };
  }

  setConfig(config) {
    this.config = {
      title: '驾驶证和车辆状态',
      users: [],
      vehicles: [],
      ...config
    };

    // 确保至少有一个用户和车辆配置
    if (!this.config.users || this.config.users.length === 0) {
      this.config.users = [{
        name: '请输入姓名',
        entities: {
          license_expiry: '',
          license_status: '',
          penalty_points: ''
        }
      }];
    }

    if (!this.config.vehicles || this.config.vehicles.length === 0) {
      this.config.vehicles = [{
        plate: '请输入车牌号',
        entities: {
          inspection_date: '',
          vehicle_status: '',
          violations: ''
        }
      }];
    }
  }

  // 获取所有实体
  getEntities() {
    if (!this.hass) return [];
    return Object.keys(this.hass.states);
  }

  // 添加用户
  addUser() {
    this.config.users = [
      ...this.config.users,
      {
        name: '请输入姓名',
        entities: {
          license_expiry: '',
          license_status: '',
          penalty_points: ''
        }
      }
    ];
    this.requestUpdate();
    fireEvent(this, 'config-changed', { config: this.config });
  }

  // 删除用户
  removeUser(index) {
    if (this.config.users.length <= 1) return;
    this.config.users = this.config.users.filter((_, i) => i !== index);
    this.requestUpdate();
    fireEvent(this, 'config-changed', { config: this.config });
  }

  // 添加车辆
  addVehicle() {
    this.config.vehicles = [
      ...this.config.vehicles,
      {
        plate: '请输入车牌号',
        entities: {
          inspection_date: '',
          vehicle_status: '',
          violations: ''
        }
      }
    ];
    this.requestUpdate();
    fireEvent(this, 'config-changed', { config: this.config });
  }

  // 删除车辆
  removeVehicle(index) {
    if (this.config.vehicles.length <= 1) return;
    this.config.vehicles = this.config.vehicles.filter((_, i) => i !== index);
    this.requestUpdate();
    fireEvent(this, 'config-changed', { config: this.config });
  }

  // 更新用户配置
  updateUser(index, field, value) {
    const users = [...this.config.users];
    if (field === 'name') {
      users[index].name = value;
    } else {
      const [entityType, entityField] = field.split('.');
      if (entityType === 'entities') {
        users[index].entities[entityField] = value;
      }
    }
    this.config.users = users;
    fireEvent(this, 'config-changed', { config: this.config });
  }

  // 更新车辆配置
  updateVehicle(index, field, value) {
    const vehicles = [...this.config.vehicles];
    if (field === 'plate') {
      vehicles[index].plate = value;
    } else {
      const [entityType, entityField] = field.split('.');
      if (entityType === 'entities') {
        vehicles[index].entities[entityField] = value;
      }
    }
    this.config.vehicles = vehicles;
    fireEvent(this, 'config-changed', { config: this.config });
  }

  // 实体选择器组件
  renderEntitySelector(label, value, onChange) {
    return html`
      <div class="form-group">
        <label class="form-label">${label}</label>
        <select 
          class="form-control entity-select" 
          .value=${value || ''} 
          @change=${(e) => onChange(e.target.value)}
        >
          <option value="">选择实体...</option>
          ${this.getEntities().map(entity => html`
            <option value=${entity}>${entity}</option>
          `)}
        </select>
      </div>
    `;
  }

  // 用户配置项
  renderUserItem(user, index) {
    return html`
      <div class="user-item">
        <button 
          class="remove-btn" 
          @click=${() => this.removeUser(index)}
          title="删除用户"
        >
          <i class="fa fa-trash"></i>
        </button>
        
        <div class="form-group">
          <label class="form-label">驾驶证持有人姓名</label>
          <input 
            type="text" 
            class="form-control" 
            .value=${user.name} 
            @input=${(e) => this.updateUser(index, 'name', e.target.value)}
          >
        </div>
        
        <div class="grid-2">
          ${this.renderEntitySelector(
            '驾驶证有效期实体',
            user.entities?.license_expiry,
            (value) => this.updateUser(index, 'entities.license_expiry', value)
          )}
          
          ${this.renderEntitySelector(
            '驾驶证状态实体',
            user.entities?.license_status,
            (value) => this.updateUser(index, 'entities.license_status', value)
          )}
          
          ${this.renderEntitySelector(
            '扣分情况实体',
            user.entities?.penalty_points,
            (value) => this.updateUser(index, 'entities.penalty_points', value)
          )}
        </div>
      </div>
    `;
  }

  // 车辆配置项
  renderVehicleItem(vehicle, index) {
    return html`
      <div class="vehicle-item">
        <button 
          class="remove-btn" 
          @click=${() => this.removeVehicle(index)}
          title="删除车辆"
        >
          <i class="fa fa-trash"></i>
        </button>
        
        <div class="form-group">
          <label class="form-label">车牌号</label>
          <input 
            type="text" 
            class="form-control" 
            .value=${vehicle.plate} 
            @input=${(e) => this.updateVehicle(index, 'plate', e.target.value)}
          >
        </div>
        
        <div class="grid-2">
          ${this.renderEntitySelector(
            '车辆年审日期实体',
            vehicle.entities?.inspection_date,
            (value) => this.updateVehicle(index, 'entities.inspection_date', value)
          )}
          
          ${this.renderEntitySelector(
            '车辆状态实体',
            vehicle.entities?.vehicle_status,
            (value) => this.updateVehicle(index, 'entities.vehicle_status', value)
          )}
          
          ${this.renderEntitySelector(
            '违章信息实体',
            vehicle.entities?.violations,
            (value) => this.updateVehicle(index, 'entities.violations', value)
          )}
        </div>
      </div>
    `;
  }

  render() {
    if (!this.hass) {
      return html`<div>Loading...</div>`;
    }

    return html`
      <div class="editor-container">
        <div class="section">
          <h3 class="section-title">基本配置</h3>
          <div class="form-group">
            <label class="form-label">卡片标题</label>
            <input 
              type="text" 
              class="form-control" 
              .value=${this.config.title} 
              @input=${(e) => {
                this.config.title = e.target.value;
                fireEvent(this, 'config-changed', { config: this.config });
              }}
            >
          </div>
        </div>

        <div class="section">
          <div class="flex justify-between items-center">
            <h3 class="section-title">驾驶证信息配置</h3>
            <button 
              class="add-btn" 
              @click=${this.addUser}
            >
              <i class="fa fa-plus"></i> 添加用户
            </button>
          </div>
          
          ${this.config.users.map((user, index) => this.renderUserItem(user, index))}
        </div>

        <div class="section">
          <div class="flex justify-between items-center">
            <h3 class="section-title">车辆信息配置</h3>
            <button 
              class="add-btn" 
              @click=${this.addVehicle}
            >
              <i class="fa fa-plus"></i> 添加车辆
            </button>
          </div>
          
          ${this.config.vehicles.map((vehicle, index) => this.renderVehicleItem(vehicle, index))}
        </div>
      </div>
    `;
  }
}

customElements.define('driving-license-editor', DrivingLicenseEditor);

// 注册编辑器
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'driving-license-card',
  name: 'Driving License Card',
  description: 'A card to display driving license and vehicle status information',
  preview: false,
  editor: 'driving-license-editor'
});
