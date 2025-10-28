class DrivingLicenseCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    // 设置默认配置
    this._config = {
      title: '驾驶证和车辆状态',
      users: [],
      vehicles: [],
      ...config
    };

    // 确保至少有一个用户和车辆配置
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
    // 根据配置的用户和车辆数量动态计算卡片大小
    let size = 1; // 基础大小
    size += this._config.users.length * 4; // 每个用户4行
    size += this._config.vehicles.length * 4; // 每辆车4行
    return size;
  }

  // 计算两个日期之间的天数差
  calculateDaysDifference(dateString) {
    if (!dateString) return '未知';
    
    const today = new Date();
    const targetDate = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(targetDate.getTime())) return '无效日期';
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  }

  // 获取实体状态
  getEntityState(entityId) {
    if (!this._hass || !entityId) return null;
    return this._hass.states[entityId];
  }

  // 获取状态颜色
  getStatusColor(status) {
    if (!status) return 'text-gray-600';
    
    status = status.toLowerCase();
    if (status.includes('正常')) return 'text-green-600';
    if (status.includes('警告') || status.includes('即将到期')) return 'text-orange-500';
    if (status.includes('过期') || status.includes('异常')) return 'text-red-600';
    return 'text-gray-600';
  }

  // 获取倒计时颜色
  getCountdownColor(days) {
    if (days === '未知' || days === '无效日期') return 'text-gray-600';
    if (days < 0) return 'text-red-600';
    if (days < 30) return 'text-orange-500';
    return 'text-green-600';
  }

  // 获取扣分颜色
  getPointsColor(points, maxPoints = 12) {
    if (points === '未知') return 'text-gray-600';
    
    const pointsValue = parseInt(points);
    if (isNaN(pointsValue)) return 'text-gray-600';
    
    const percentage = pointsValue / maxPoints;
    if (percentage >= 0.75) return 'text-red-600';
    if (percentage >= 0.5) return 'text-orange-500';
    return 'text-green-600';
  }

  render() {
    if (!this._hass || !this._config) return;

    // 加载Tailwind CSS
    const tailwindUrl = 'https://cdn.tailwindcss.com';
    const fontAwesomeUrl = 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css';

    // 获取当前时间用于最后更新时间
    const now = new Date();
    const lastUpdated = now.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    // 渲染用户驾驶证信息
    const renderUserSections = () => {
      return this._config.users.map((user, index) => {
        const expiryEntity = this.getEntityState(user.entities?.license_expiry);
        const statusEntity = this.getEntityState(user.entities?.license_status);
        const pointsEntity = this.getEntityState(user.entities?.penalty_points);
        
        const expiryDate = expiryEntity?.state || '未配置';
        const expiryDays = this.calculateDaysDifference(expiryDate);
        const status = statusEntity?.state || '未配置';
        const points = pointsEntity?.state || '0';
        const maxPoints = pointsEntity?.attributes?.max_points || 12;
        
        return `
          <div class="user-section mt-4 border-l-4 border-blue-600 pl-3">
            <div class="section-header flex items-center text-lg font-semibold text-blue-600">
              <i class="fa fa-id-card mr-2"></i>
              <span>驾驶证信息 - ${user.name}</span>
            </div>
            <div class="info-grid grid grid-cols-2 gap-2 mt-2">
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">有效期至</span>
                <div class="info-value text-right">${expiryDate}</div>
              </div>
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">有效期倒计时</span>
                <div class="info-value text-right ${this.getCountdownColor(expiryDays)}">
                  ${typeof expiryDays === 'number' ? `${expiryDays}天` : expiryDays}
                </div>
              </div>
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">驾驶证状态</span>
                <div class="info-value text-right ${this.getStatusColor(status)}">${status}</div>
              </div>
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">扣分情况</span>
                <div class="info-value text-right ${this.getPointsColor(points, maxPoints)}">
                  ${points}/${maxPoints}分
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    // 渲染车辆信息
    const renderVehicleSections = () => {
      return this._config.vehicles.map((vehicle, index) => {
        const inspectionEntity = this.getEntityState(vehicle.entities?.inspection_date);
        const statusEntity = this.getEntityState(vehicle.entities?.vehicle_status);
        const violationsEntity = this.getEntityState(vehicle.entities?.violations);
        
        const inspectionDate = inspectionEntity?.state || '未配置';
        const inspectionDays = this.calculateDaysDifference(inspectionDate);
        const status = statusEntity?.state || '未配置';
        const violations = violationsEntity?.state || '0';
        const violationsDesc = violationsEntity?.attributes?.description || `${violations}条未处理`;
        
        return `
          <div class="vehicle-section mt-4 border-l-4 border-green-600 pl-3">
            <div class="section-header flex items-center text-lg font-semibold text-green-600">
              <i class="fa fa-car mr-2"></i>
              <span>车辆信息 - ${vehicle.plate}</span>
            </div>
            <div class="info-grid grid grid-cols-2 gap-2 mt-2">
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">年审日期</span>
                <div class="info-value text-right">${inspectionDate}</div>
              </div>
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">年审倒计时</span>
                <div class="info-value text-right ${this.getCountdownColor(inspectionDays)}">
                  ${typeof inspectionDays === 'number' ? `${inspectionDays}天` : inspectionDays}
                </div>
              </div>
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">车辆状态</span>
                <div class="info-value text-right ${this.getStatusColor(status)}">${status}</div>
              </div>
              <div class="info-item">
                <span class="info-label text-sm text-gray-500">违章信息</span>
                <div class="info-value text-right ${violations > 0 ? 'text-orange-500' : 'text-green-600'}">
                  ${violationsDesc}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    // 卡片HTML结构
    this.shadowRoot.innerHTML = `
      <style>
        @import url('${tailwindUrl}');
        @import url('${fontAwesomeUrl}');
        
        .card-content {
          padding: 16px;
        }
        
        .section-header {
          margin-bottom: 8px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .info-value {
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .update-time {
          font-size: 0.75rem;
          color: #6b7280;
          text-align: right;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
        }
      </style>
      
      <ha-card>
        <div class="card-header">
          <div class="card-title">${this._config.title}</div>
        </div>
        <div class="card-content">
          ${renderUserSections()}
          ${renderVehicleSections()}
          <div class="update-time">
            最后更新: ${lastUpdated}
          </div>
        </div>
      </ha-card>
    `;
  }
}

// 编辑器类
class DrivingLicenseEditor extends HTMLElement {
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
        }
        .section {
          margin-bottom: 20px;
          padding: 16px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 8px;
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
        }
        .form-control {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 4px;
          background: var(--card-background-color, white);
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
          <div class="form-group">
            <label class="form-label">驾驶证有效期实体</label>
            <select class="form-control license-expiry">
              ${this._renderEntityOptions(user.entities?.license_expiry)}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">驾驶证状态实体</label>
            <select class="form-control license-status">
              ${this._renderEntityOptions(user.entities?.license_status)}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">扣分情况实体</label>
            <select class="form-control penalty-points">
              ${this._renderEntityOptions(user.entities?.penalty_points)}
            </select>
          </div>
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
          <div class="form-group">
            <label class="form-label">年审日期实体</label>
            <select class="form-control inspection-date">
              ${this._renderEntityOptions(vehicle.entities?.inspection_date)}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">车辆状态实体</label>
            <select class="form-control vehicle-status">
              ${this._renderEntityOptions(vehicle.entities?.vehicle_status)}
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">违章信息实体</label>
            <select class="form-control violations">
              ${this._renderEntityOptions(vehicle.entities?.violations)}
            </select>
          </div>
        </div>
      </div>
    `).join('');
  }

  _renderEntityOptions(selectedValue) {
    const entities = this._getEntities();
    let options = '<option value="">-- 选择实体 --</option>';
    entities.forEach(entity => {
      const selected = entity === selectedValue ? 'selected' : '';
      options += `<option value="${entity}" ${selected}>${entity}</option>`;
    });
    return options;
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

    // 用户配置更新
    this.querySelectorAll('.user-name').forEach((input) => {
      input.addEventListener('input', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateUserField(index, 'name', e.target.value);
      });
    });

    this.querySelectorAll('.license-expiry').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateUserField(index, 'entities.license_expiry', e.target.value);
      });
    });

    this.querySelectorAll('.license-status').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateUserField(index, 'entities.license_status', e.target.value);
      });
    });

    this.querySelectorAll('.penalty-points').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateUserField(index, 'entities.penalty_points', e.target.value);
      });
    });

    // 车辆配置更新
    this.querySelectorAll('.vehicle-plate').forEach((input) => {
      input.addEventListener('input', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateVehicleField(index, 'plate', e.target.value);
      });
    });

    this.querySelectorAll('.inspection-date').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateVehicleField(index, 'entities.inspection_date', e.target.value);
      });
    });

    this.querySelectorAll('.vehicle-status').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateVehicleField(index, 'entities.vehicle_status', e.target.value);
      });
    });

    this.querySelectorAll('.violations').forEach((select) => {
      select.addEventListener('change', (e) => {
        const index = this._getParentIndex(e.target);
        this._updateVehicleField(index, 'entities.violations', e.target.value);
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

// 自动注册卡片和编辑器
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

console.log('Driving License Card automatically registered');
