// 主卡片类保持不变
class DrivingLicenseCard extends HTMLElement {
  // ... 保持不变 ...
}

// 修改编辑器类 - 修复实体搜索问题
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
                placeholder="输入实体ID，如: sensor.last_update_time"
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
                placeholder="输入实体ID，如: sensor.license_expiry_date"
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
                placeholder="输入实体ID，如: sensor.license_status"
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
                placeholder="输入实体ID，如: sensor.penalty_points"
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
              placeholder="输入实体ID，如: sensor.car_plate"
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
                placeholder="输入实体ID，如: sensor.inspection_date"
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
                placeholder="输入实体ID，如: sensor.vehicle_status"
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
                placeholder="输入实体ID，如: sensor.violations_count"
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
        支持按实体ID、名称或状态搜索 - 显示所有可用实体
      </div>
    `;
    dropdown.appendChild(searchHeader);

    const resultsContainer = document.createElement('div');
    dropdown.appendChild(resultsContainer);

    // 初始显示所有实体
    this.updateSearchResults(resultsContainer, entities, this._searchKeyword);

    // 搜索框输入事件
    const searchInput = searchHeader.querySelector('.search-input');
    searchInput.addEventListener('input', (e) => {
      this._searchKeyword = e.target.value;
      this.updateSearchResults(resultsContainer, entities, this._searchKeyword);
    });

    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    searchInput.focus();

    container.appendChild(dropdown);
  }

  updateSearchResults(container, entities, keyword = '') {
    let filteredEntities = entities;
    
    // 改进的关键字搜索 - 支持中文和特殊字符
    if (keyword && keyword.trim() !== '') {
      const lowerKeyword = keyword.toLowerCase().trim();
      
      filteredEntities = entities.filter(entity => {
        // 检查实体ID
        if (entity.entity_id.toLowerCase().includes(lowerKeyword)) {
          return true;
        }
        
        // 检查实体状态
        if (entity.state && entity.state.toLowerCase().includes(lowerKeyword)) {
          return true;
        }
        
        // 检查友好名称
        if (entity.attributes && entity.attributes.friendly_name) {
          const friendlyName = entity.attributes.friendly_name.toLowerCase();
          if (friendlyName.includes(lowerKeyword)) {
            return true;
          }
        }
        
        return false;
      });
    }

    container.innerHTML = '';

    if (filteredEntities.length === 0) {
      if (keyword && keyword.trim() !== '') {
        container.innerHTML = `
          <div class="entity-option" style="text-align: center; color: var(--secondary-text-color);">
            未找到匹配的实体<br>
            <small>尝试使用不同的关键字或查看所有实体</small>
          </div>
        `;
        
        // 如果没有搜索结果，显示前10个实体作为参考
        const suggestionHeader = document.createElement('div');
        suggestionHeader.className = 'search-header';
        suggestionHeader.innerHTML = '<small>所有实体（前10个）：</small>';
        container.appendChild(suggestionHeader);
        
        entities.slice(0, 10).forEach(entity => {
          const option = this.createEntityOption(entity);
          container.appendChild(option);
        });
      } else {
        container.innerHTML = '<div class="entity-option">暂无可用实体</div>';
      }
    } else {
      // 显示搜索结果
      filteredEntities.slice(0, 50).forEach(entity => {
        const option = this.createEntityOption(entity);
        container.appendChild(option);
      });
      
      // 如果结果很多，显示提示
      if (filteredEntities.length > 50) {
        const info = document.createElement('div');
        info.className = 'entity-option';
        info.style.textAlign = 'center';
        info.style.color = 'var(--secondary-text-color)';
        info.style.fontStyle = 'italic';
        info.textContent = `显示前50个结果，共${filteredEntities.length}个匹配实体`;
        container.appendChild(info);
      }
    }
  }

  createEntityOption(entity) {
    const option = document.createElement('div');
    option.className = 'entity-option';
    
    const friendlyName = entity.attributes?.friendly_name || '';
    const domain = entity.entity_id.split('.')[0];
    
    option.innerHTML = `
      <div style="flex: 1;">
        <div style="font-weight: 600; font-size: 13px;">${entity.entity_id}</div>
        ${friendlyName ? `<div style="font-size: 12px; color: var(--secondary-text-color); margin-top: 2px;">${friendlyName}</div>` : ''}
        <div style="font-size: 11px; color: var(--secondary-text-color); margin-top: 2px;">
          类型: ${domain} | 状态: ${entity.state}
        </div>
      </div>
    `;
    
    option.addEventListener('click', () => {
      const input = option.closest('.entity-input-container').querySelector('.config-input');
      input.value = entity.entity_id;
      this.handleInputChange(input);
      this.closeAllDropdowns();
    });
    
    return option;
  }

  getAllEntities() {
    if (!this._hass) return [];
    
    try {
      return Object.entries(this._hass.states).map(([entity_id, state]) => ({
        entity_id,
        state: state.state,
        attributes: state.attributes || {}
      }));
    } catch (error) {
      console.error('获取实体列表失败:', error);
      return [];
    }
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

console.log('Driving License Card with improved entity search loaded successfully');