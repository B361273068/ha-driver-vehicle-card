// 主卡片类保持不变
class DrivingLicenseCard extends HTMLElement {
  // 原有代码保持不变...
}

// 修改后的编辑器类 - 使用Home Assistant标准选择器
class DrivingLicenseEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
  }

  setConfig(config) {
    this._config = config || {};
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  _render() {
    if (!this._hass) return;

    const config = this._config;

    this.innerHTML = `
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
        
        .entity-picker-container {
          width: 100%;
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

      <div class="editor-container">
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
            <div class="entity-picker-container" data-path="last_update_entity">
              <ha-form
                .hass="${this._hass}"
                .data="${{ entity: config.last_update_entity || '' }}"
                .schema="${[{
                  name: 'entity',
                  type: 'entity',
                  selector: { entity: {} },
                  required: false
                }]}"
                .computeLabel="${(schema) => ''}"
              ></ha-form>
            </div>
            <div class="help-text">选择用于显示最后更新时间的实体（可选）</div>
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
            <div class="entity-picker-container" 
                 data-user-index="${index}" 
                 data-entity-type="license_expiry">
              <ha-form
                .hass="${this._hass}"
                .data="${{ entity: user.entities?.license_expiry || '' }}"
                .schema="${[{
                  name: 'entity',
                  type: 'entity',
                  selector: { entity: {} },
                  required: false
                }]}"
                .computeLabel="${(schema) => ''}"
              ></ha-form>
            </div>
            <div class="help-text">选择驾驶证有效期实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">驾驶证状态实体</label>
            <div class="entity-picker-container" 
                 data-user-index="${index}" 
                 data-entity-type="license_status">
              <ha-form
                .hass="${this._hass}"
                .data="${{ entity: user.entities?.license_status || '' }}"
                .schema="${[{
                  name: 'entity',
                  type: 'entity',
                  selector: { entity: {} },
                  required: false
                }]}"
                .computeLabel="${(schema) => ''}"
              ></ha-form>
            </div>
            <div class="help-text">选择驾驶证状态实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">扣分情况实体</label>
            <div class="entity-picker-container" 
                 data-user-index="${index}" 
                 data-entity-type="penalty_points">
              <ha-form
                .hass="${this._hass}"
                .data="${{ entity: user.entities?.penalty_points || '' }}"
                .schema="${[{
                  name: 'entity',
                  type: 'entity',
                  selector: { entity: {} },
                  required: false
                }]}"
                .computeLabel="${(schema) => ''}"
              ></ha-form>
            </div>
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
          <div class="entity-picker-container" 
               data-vehicle-index="${index}" 
               data-entity-type="plate_entity">
            <ha-form
              .hass="${this._hass}"
              .data="${{ entity: vehicle.plate_entity || '' }}"
              .schema="${[{
                name: 'entity',
                type: 'entity',
                selector: { entity: {} },
                required: false
              }]}"
              .computeLabel="${(schema) => ''}"
            ></ha-form>
          </div>
          <div class="help-text">选择包含车牌号码的传感器实体</div>
        </div>
        
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">年审日期实体</label>
            <div class="entity-picker-container" 
                 data-vehicle-index="${index}" 
                 data-entity-type="inspection_date">
              <ha-form
                .hass="${this._hass}"
                .data="${{ entity: vehicle.entities?.inspection_date || '' }}"
                .schema="${[{
                  name: 'entity',
                  type: 'entity',
                  selector: { entity: {} },
                  required: false
                }]}"
                .computeLabel="${(schema) => ''}"
              ></ha-form>
            </div>
            <div class="help-text">选择年审日期实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">车辆状态实体</label>
            <div class="entity-picker-container" 
                 data-vehicle-index="${index}" 
                 data-entity-type="vehicle_status">
              <ha-form
                .hass="${this._hass}"
                .data="${{ entity: vehicle.entities?.vehicle_status || '' }}"
                .schema="${[{
                  name: 'entity',
                  type: 'entity',
                  selector: { entity: {} },
                  required: false
                }]}"
                .computeLabel="${(schema) => ''}"
              ></ha-form>
            </div>
            <div class="help-text">选择车辆状态实体</div>
          </div>
          
          <div class="form-group">
            <label class="form-label">违章信息实体</label>
            <div class="entity-picker-container" 
                 data-vehicle-index="${index}" 
                 data-entity-type="violations">
              <ha-form
                .hass="${this._hass}"
                .data="${{ entity: vehicle.entities?.violations || '' }}"
                .schema="${[{
                  name: 'entity',
                  type: 'entity',
                  selector: { entity: {} },
                  required: false
                }]}"
                .computeLabel="${(schema) => ''}"
              ></ha-form>
            </div>
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
    // 绑定输入框变化事件
    this.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('input', this._handleInputChange.bind(this));
    });

    // 绑定复选框变化事件
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', this._handleCheckboxChange.bind(this));
    });

    // 绑定实体选择器变化事件（处理ha-form的变化）
    this.querySelectorAll('ha-form').forEach(form => {
      form.addEventListener('value-changed', this._handleEntityPickerChange.bind(this));
    });

    // 绑定删除按钮事件
    this.querySelectorAll('.remove-btn[data-user-index]').forEach(btn => {
      btn.addEventListener('click', this._handleRemoveUser.bind(this));
    });

    this.querySelectorAll('.remove-btn[data-vehicle-index]').forEach(btn => {
      btn.addEventListener('click', this._handleRemoveVehicle.bind(this));
    });

    // 绑定添加按钮事件
    this.querySelector('#add-user-btn').addEventListener('click', this._addUser.bind(this));
    this.querySelector('#add-vehicle-btn').addEventListener('click', this._addVehicle.bind(this));
  }

  _handleInputChange(e) {
    const target = e.target;
    const path = target.getAttribute('data-path');
    
    if (target.classList.contains('user-name')) {
      const userIndex = parseInt(target.getAttribute('data-user-index'));
      this._updateUserField(userIndex, 'name', target.value);
    } else {
      this._updateConfig(path, target.value);
    }
  }

  _handleCheckboxChange(e) {
    const target = e.target;
    const path = target.getAttribute('data-path');
    this._updateConfig(path, target.checked);
  }

  _handleEntityPickerChange(e) {
    const form = e.target;
    const container = form.closest('.entity-picker-container');
    const path = container.getAttribute('data-path');
    const value = e.detail.value?.entity;

    if (path === 'last_update_entity') {
      this._updateConfig(path, value);
    } else {
      const userIndex = container.getAttribute('data-user-index');
      const vehicleIndex = container.getAttribute('data-vehicle-index');
      const entityType = container.getAttribute('data-entity-type');

      if (userIndex !== null) {
        this._updateUserField(parseInt(userIndex), `entities.${entityType}`, value);
      } else if (vehicleIndex !== null) {
        if (entityType === 'plate_entity') {
          this._updateVehicleField(parseInt(vehicleIndex), 'plate_entity', value);
        } else {
          this._updateVehicleField(parseInt(vehicleIndex), `entities.${entityType}`, value);
        }
      }
    }
  }

  // 其他事件处理方法保持不变...
  _handleRemoveUser(e) {
    const userIndex = parseInt(e.target.getAttribute('data-user-index'));
    this._removeUser(userIndex);
  }

  _handleRemoveVehicle(e) {
    const vehicleIndex = parseInt(e.target.getAttribute('data-vehicle-index'));
    this._removeVehicle(vehicleIndex);
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

// 注册到 HACS
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'driving-license-card',
  name: 'Driving License Card',
  description: 'A card to display driving license and vehicle status information',
  preview: true,
  documentationURL: 'https://github.com/B361273068/ha-driving-license-card'
});

console.log('Driving License Card with Home Assistant standard picker loaded successfully');
