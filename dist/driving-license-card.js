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

customElements.define('driving-license-card', DrivingLicenseCard);

// 注册卡片
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'driving-license-card',
  name: 'Driving License Card',
  description: 'A card to display driving license and vehicle status information',
  preview: false
});
