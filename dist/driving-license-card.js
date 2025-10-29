// 主卡片类 - 修复信息显示问题
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

    this._config = {
      title: '驾驶证和车辆状态',
      show_last_updated: true,
      last_update_entity: '',
      users: [],
      vehicles: [],
      ...config
    };

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
        plate_entity: '',
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
    let size = 2;
    size += this._config.users.length * 2;
    size += this._config.vehicles.length * 3;
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
      return this._config.users.map((user, index) => {
        const expiryEntity = this.getEntityState(user.entities?.license_expiry);
        const statusEntity = this.getEntityState(user.entities?.license_status);
        const pointsEntity = this.getEntityState(user.entities?.penalty_points);
        
        const expiryDate = expiryEntity?.state || '未配置';
        const expiryDays = this.calculateDaysDifference(expiryDate);
        const statusInfo = this.getStatusInfo(statusEntity?.state);
        const pointsInfo = this.getPointsInfo(pointsEntity?.state);
        const countdownInfo = this.getCountdownInfo(expiryDays);
        
        // 修复1：修改标题格式为"驾驶证信息-张三"
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
      return this._config.vehicles.map((vehicle, index) => {
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
          color: #000000 !important; /* 强制黑色 */
        }
        
        .info-value {
          font-size: 14px;
          font-weight: 600;
        }
        
        /* 颜色样式 */
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
        
        @media (max-width: 768px) {
          .main-header {
            padding: 14px 16px;
          }
          
          .main-title {
            font-size: 16px;
          }
          
          .section-header {
            padding: 10px 14px;
          }
          
          .section-title {
            font-size: 15px;
          }
          
          .section-content {
            padding: 14px;
          }
          
          .info-item {
            padding: 6px 0;
          }
          
          .info-label, .info-value {
            font-size: 13px;
          }
        }
        
        @media (max-width: 480px) {
          .main-header {
            padding: 12px 14px;
          }
          
          .main-title {
            font-size: 15px;
          }
          
          .section-header {
            padding: 8px 12px;
          }
          
          .section-title {
            font-size: 14px;
          }
          
          .section-content {
            padding: 12px;
          }
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

// 编辑器类保持不变（与之前相同）
// ... 编辑器代码保持不变 ...

// 注册卡片和编辑器
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
  preview: true,
  documentationURL: 'https://github.com/B361273068/ha-driving-license-card'
});

console.log('Driving License Card with black labels loaded successfully');