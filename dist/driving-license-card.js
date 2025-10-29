// 主卡片类 - 修复样式问题
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

    console.log("原始配置:", config);
    
    // 修复配置结构
    this._config = this.fixConfigStructure(config);
    
    console.log("修复后配置:", this._config);

    this.render();
  }

  fixConfigStructure(config) {
    const fixedConfig = {
      title: config.title || '驾驶证和车辆状态',
      show_last_updated: config.show_last_updated !== false,
      last_update_entity: config.last_update_entity || '',
      users: this.fixUsersConfig(config.users),
      vehicles: this.fixVehiclesConfig(config.vehicles)
    };

    return fixedConfig;
  }

  fixUsersConfig(usersConfig) {
    if (!usersConfig || (Array.isArray(usersConfig) && usersConfig.length === 0)) {
      return [{
        name: '请配置姓名',
        entities: {
          license_expiry: '',
          license_status: '',
          penalty_points: ''
        }
      }];
    }

    if (Array.isArray(usersConfig)) {
      return usersConfig.map(user => ({
        name: user.name || '未命名用户',
        entities: {
          license_expiry: user.entities?.license_expiry || user.license_expiry || '',
          license_status: user.entities?.license_status || user.license_status || '',
          penalty_points: user.entities?.penalty_points || user.penalty_points || ''
        }
      }));
    }

    if (typeof usersConfig === 'object') {
      return [{
        name: usersConfig.name || '未命名用户',
        entities: {
          license_expiry: usersConfig.entities?.license_expiry || usersConfig.license_expiry || '',
          license_status: usersConfig.entities?.license_status || usersConfig.license_status || '',
          penalty_points: usersConfig.entities?.penalty_points || usersConfig.penalty_points || ''
        }
      }];
    }

    return [{
      name: '请配置姓名',
      entities: {
        license_expiry: '',
        license_status: '',
        penalty_points: ''
      }
    }];
  }

  fixVehiclesConfig(vehiclesConfig) {
    if (!vehiclesConfig || (Array.isArray(vehiclesConfig) && vehiclesConfig.length === 0)) {
      return [{
        plate_entity: '',
        entities: {
          inspection_date: '',
          vehicle_status: '',
          violations: ''
        }
      }];
    }

    if (Array.isArray(vehiclesConfig)) {
      return vehiclesConfig.map(vehicle => ({
        plate_entity: vehicle.plate_entity || '',
        entities: {
          inspection_date: vehicle.entities?.inspection_date || vehicle.inspection_date || '',
          vehicle_status: vehicle.entities?.vehicle_status || vehicle.vehicle_status || '',
          violations: vehicle.entities?.violations || vehicle.violations || ''
        }
      }));
    }

    if (typeof vehiclesConfig === 'object') {
      return [{
        plate_entity: vehiclesConfig.plate_entity || '',
        entities: {
          inspection_date: vehiclesConfig.entities?.inspection_date || vehiclesConfig.inspection_date || '',
          vehicle_status: vehiclesConfig.entities?.vehicle_status || vehiclesConfig.vehicle_status || '',
          violations: vehiclesConfig.entities?.violations || vehiclesConfig.violations || ''
        }
      }];
    }

    return [{
      plate_entity: '',
      entities: {
        inspection_date: '',
        vehicle_status: '',
        violations: ''
      }
    }];
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
          border-bottom: 2px solid var(--divider-color, #e0e0e0);
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
          text-align: right;
          font-size: 12px;
          color: var(--secondary-text-color, #666);
          padding: 12px 16px;
          background: white;
          border-top: 1px solid var(--divider-color, #e0e0e0);
        }
        
        .divider {
          height: 1px;
          background: var(--divider-color, #e0e0e0);
          margin: 0;
          border: none;
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

// 修复编辑器类 - 添加关键字搜索功能
class DrivingLicenseEditor extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._hasRendered = false;
    this._searchKeyword = '';
  }

  setConfig(config) {
    this._config = config || this.getDefaultConfig();
    if (!this._hasRendered) {
      this.render();
      this._hasRendered = true;
    }
  }

  set hass(hass) {
    this._hass = hass;
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
            <div class="entity-input-container">
              <input 
                type="text" 
                value="${config.last_update_entity || ''}" 
                data-path="last_update_entity"
                class="config-input"
                placeholder="sensor.last_update_time"
              >
              <button class="search-btn" type="button" data-path="last_update_entity">搜索</button>
            </div>
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
          
          .config-input:focus {
            outline: none;
            border-color: var(--primary-color);
          }
          
          .entity-input-container {
            position: relative;
          }
          
          .search-btn {
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            padding: 6px 12px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          }
          
          .search-btn:hover {
            background: var(--dark-primary-color);
          }
          
          .entity-dropdown {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: var(--card-background-color);
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .search-header {
            padding: 8px 12px;
            border-bottom: 1px solid var(--divider-color);
            background: var(--secondary-background-color);
          }
          
          .search-input {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid var(--divider-color);
            border-radius: 4px;
            font-size: 12px;
            box-sizing: border-box;
          }
          
          .entity-option {
            padding: 8px 12px;
            cursor: pointer;
            border-bottom: 1px solid var(--divider-color);
            font-size: 14px;
          }
          
          .entity-option:hover {
            background: var(--primary-color);
            color: white;
          }
          
          .entity-option:last-child {
            border-bottom: none;
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
          
          .checkbox-group input[type="checkbox"] {
            width: 16px;
            height: 16px;
            margin: 0;
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
            margin-top: 8px;
          }
          
          .add-btn:hover {
            background: var(--dark-primary-color);
          }
          
          .entity-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          
          @media (max-width: 768px) {
            .entity-grid {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </div>
    `;

    this.setupEventListeners();
  }

  renderUsers() {
    const users = this._config.users || [{
      name: '示例用户',
      entities: { license_expiry: '', license_status: '', penalty_points: '' }
    }];
    
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
            <div class="entity-input-container">
              <input 
                type="text" 
                value="${user.entities?.license_expiry || ''}" 
                data-type="user" 
                data-index="${index}"
                data-path="license_expiry"
                class="config-input"
                placeholder="sensor.license_expiry"
              >
              <button class="search-btn" type="button" data-type="user" data-index="${index}" data-path="license_expiry">搜索</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>驾驶证状态实体</label>
            <div class="entity-input-container">
              <input 
                type="text" 
                value="${user.entities?.license_status || ''}" 
                data-type="user" 
                data-index="${index}"
                data-path="license_status"
                class="config-input"
                placeholder="sensor.license_status"
              >
              <button class="search-btn" type="button" data-type="user" data-index="${index}" data-path="license_status">搜索</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>扣分情况实体</label>
            <div class="entity-input-container">
              <input 
                type="text" 
                value="${user.entities?.penalty_points || ''}" 
                data-type="user" 
                data-index="${index}"
                data-path="penalty_points"
                class="config-input"
                placeholder="sensor.penalty_points"
              >
              <button class="search-btn" type="button" data-type="user" data-index="${index}" data-path="penalty_points">搜索</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  renderVehicles() {
    const vehicles = this._config.vehicles || [{
      plate_entity: '',
      entities: { inspection_date: '', vehicle_status: '', violations: '' }
    }];
    
    return vehicles.map((vehicle, index) => `
      <div class="vehicle-config" data-index="${index}">
        <button class="remove-btn" data-type="vehicle" data-index="${index}"
                ${vehicles.length <= 1 ? 'disabled' : ''} type="button">
          删除
        </button>
        
        <div class="form-group">
          <label>车牌号码实体</label>
          <div class="entity-input-container">
            <input 
              type="text" 
              value="${vehicle.plate_entity || ''}" 
              data-type="vehicle" 
              data-index="${index}"
              data-path="plate_entity"
              class="config-input"
              placeholder="sensor.car_plate"
            >
            <button class="search-btn" type="button" data-type="vehicle" data-index="${index}" data-path="plate_entity">搜索</button>
          </div>
        </div>
        
        <div class="entity-grid">
          <div class="form-group">
            <label>年审日期实体</label>
            <div class="entity-input-container">
              <input 
                type="text" 
                value="${vehicle.entities?.inspection_date || ''}" 
                data-type="vehicle" 
                data-index="${index}"
                data-path="inspection_date"
                class="config-input"
                placeholder="sensor.inspection_date"
              >
              <button class="search-btn" type="button" data-type="vehicle" data-index="${index}" data-path="inspection_date">搜索</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>车辆状态实体</label>
            <div class="entity-input-container">
              <input 
                type="text" 
                value="${vehicle.entities?.vehicle_status || ''}" 
                data-type="vehicle" 
                data-index="${index}"
                data-path="vehicle_status"
                class="config-input"
                placeholder="sensor.vehicle_status"
              >
              <button class="search-btn" type="button" data-type="vehicle" data-index="${index}" data-path="vehicle_status">搜索</button>
            </div>
          </div>
          
          <div class="form-group">
            <label>违章信息实体</label>
            <div class="entity-input-container">
              <input 
                type="text" 
                value="${vehicle.entities?.violations || ''}" 
                data-type="vehicle" 
                data-index="${index}"
                data-path="violations"
                class="config-input"
                placeholder="sensor.violations"
              >
              <button class="search-btn" type="button" data-type="vehicle" data-index="${index}" data-path="violations">搜索</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  setupEventListeners() {
    // 输入框事件 - 只在失去焦点时更新
    this.querySelectorAll('input[type="text"]').forEach(input => {
      input.addEventListener('blur', (e) => {
        this.handleInputChange(e.target);
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.target.blur();
        }
      });
    });

    // 复选框事件 - 立即触发
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.handleInputChange(e.target);
      });
    });

    // 搜索按钮事件
    this.querySelectorAll('.search-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showEntitySearch(e.target);
      });
    });

    // 删除按钮事件
    this.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const type = e.target.dataset.type;
        const index = parseInt(e.target.dataset.index);
        this.removeItem(type, index);
      });
    });

    // 添加按钮事件
    this.querySelector('#add-user').addEventListener('click', (e) => {
      e.preventDefault();
      this.addUser();
    });

    this.querySelector('#add-vehicle').addEventListener('click', (e) => {
      e.preventDefault();
      this.addVehicle();
    });

    // 点击其他地方关闭下拉框
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });
  }

  showEntitySearch(button) {
    this.closeAllDropdowns();

    const type = button.dataset.type;
    const index = button.dataset.index;
    const path = button.dataset.path;

    const input = button.previousElementSibling;
    const container = button.parentElement;

    if (!this._hass) {
      alert('请等待Home Assistant连接完成');
      return;
    }

    const entities = this.getAllEntities();
    
    const dropdown = document.createElement('div');
    dropdown.className = 'entity-dropdown';
    
    // 添加搜索框
    const searchHeader = document.createElement('div');
    searchHeader.className = 'search-header';
    searchHeader.innerHTML = `
      <input 
        type="text" 
        class="search-input" 
        placeholder="输入关键字搜索实体..." 
        value="${this._searchKeyword}"
      >
      <div style="font-size: 11px; color: var(--secondary-text-color); margin-top: 4px;">
        支持按实体ID、名称或状态搜索
      </div>
    `;
    dropdown.appendChild(searchHeader);

    const resultsContainer = document.createElement('div');
    dropdown.appendChild(resultsContainer);

    // 初始显示过滤后的实体
    this.updateSearchResults(resultsContainer, entities, path, this._searchKeyword);

    // 搜索框输入事件
    const searchInput = searchHeader.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
      this._searchKeyword = e.target.value;
      this.updateSearchResults(resultsContainer, entities, path, this._searchKeyword);
    });

    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    searchInput.focus();

    container.appendChild(dropdown);
  }

  updateSearchResults(container, entities, entityType, keyword = '') {
    let filteredEntities = this.filterEntitiesByType(entities, entityType);
    
    // 关键字搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredEntities = filteredEntities.filter(entity => 
        entity.entity_id.toLowerCase().includes(lowerKeyword) ||
        (entity.state && entity.state.toLowerCase().includes(lowerKeyword)) ||
        (entity.attributes && entity.attributes.friendly_name && 
         entity.attributes.friendly_name.toLowerCase().includes(lowerKeyword))
      );
    }

    container.innerHTML = '';

    if (filteredEntities.length === 0) {
      container.innerHTML = '<div class="entity-option">未找到匹配的实体</div>';
    } else {
      filteredEntities.slice(0, 50).forEach(entity => {
        const option = document.createElement('div');
        option.className = 'entity-option';
        const friendlyName = entity.attributes?.friendly_name || '';
        option.innerHTML = `
          <div>
            <div style="font-weight: 600;">${entity.entity_id}</div>
            ${friendlyName ? `<div style="font-size: 12px; color: var(--secondary-text-color);">${friendlyName}</div>` : ''}
          </div>
          <div style="font-size: 12px; color: var(--secondary-text-color);">${entity.state}</div>
        `;
        option.addEventListener('click', () => {
          const input = option.closest('.entity-input-container').querySelector('.config-input');
          input.value = entity.entity_id;
          this.handleInputChange(input);
          this.closeAllDropdowns();
        });
        container.appendChild(option);
      });
    }
  }

  getAllEntities() {
    if (!this._hass) return [];
    
    return Object.entries(this._hass.states).map(([entity_id, state]) => ({
      entity_id,
      state: state.state,
      attributes: state.attributes
    }));
  }

  filterEntitiesByType(entities, entityType) {
    let filteredEntities = entities;
    
    // 根据实体类型过滤
    switch (entityType) {
      case 'license_expiry':
      case 'inspection_date':
        filteredEntities = entities.filter(entity => 
          entity.entity_id.includes('date') || 
          entity.entity_id.includes('expiry') ||
          entity.entity_id.includes('inspection') ||
          entity.entity_id.includes('renew') ||
          entity.entity_id.includes('valid')
        );
        break;
        
      case 'license_status':
      case 'vehicle_status':
        filteredEntities = entities.filter(entity => 
          entity.entity_id.includes('status') ||
          entity.entity_id.includes('state')
        );
        break;
        
      case 'penalty_points':
      case 'violations':
        filteredEntities = entities.filter(entity => 
          entity.entity_id.includes('point') || 
          entity.entity_id.includes('violation') ||
          entity.entity_id.includes('penalty')
        );
        break;
        
      case 'plate_entity':
        filteredEntities = entities.filter(entity => 
          entity.entity_id.includes('plate') || 
          entity.entity_id.includes('car') ||
          entity.entity_id.includes('vehicle')
        );
        break;
        
      case 'last_update_entity':
        filteredEntities = entities.filter(entity => 
          entity.entity_id.includes('update') || 
          entity.entity_id.includes('time') ||
          entity.entity_id.includes('last')
        );
        break;
    }

    return filteredEntities;
  }

  closeAllDropdowns() {
    this.querySelectorAll('.entity-dropdown').forEach(dropdown => {
      dropdown.remove();
    });
    this._searchKeyword = '';
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

console.log('Driving License Card with enhanced search and styling fixed loaded successfully');